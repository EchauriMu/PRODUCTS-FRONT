import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Input,
  DatePicker,
  CheckBox,
  Button,
  Text,
  Title,
  MessageStrip,
  MultiComboBox,
  MultiComboBoxItem,
  ComboBox,
  ComboBoxItem,
  ObjectStatus,
  BusyIndicator,
  Icon,
  Tag,
  Switch
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';

// ===== CONSTANTES PARA ATAJOS =====
const PRICE_SHORTCUTS = [
  { id: 'low', label: '$0 - $999', min: 0, max: 999 },
  { id: 'mid', label: '$1,000 - $4,999', min: 1000, max: 4999 },
  { id: 'high', label: '$5,000+', min: 5000, max: null }
];

const DATE_SHORTCUTS = [
  { id: 'today', label: 'Hoy' },
  { id: 'last7', label: 'Últimos 7 días' },
  { id: 'last30', label: 'Últimos 30 días' },
  { id: 'thisYear', label: 'Este año' }
];

// ===== OPCIONES DE ORDENAMIENTO =====
const SORT_OPTIONS = [
  { id: 'default', label: 'Orden predeterminado' },
  { id: 'addedFirst', label: 'Primero ya agregados' },
  { id: 'notAddedFirst', label: 'Primero sin agregar' },
  { id: 'nameAsc', label: 'Nombre A-Z' },
  { id: 'nameDesc', label: 'Nombre Z-A' }
];


const AdvancedFilters = ({ 
  onFiltersChange, 
  initialFilters = {}, 
  preselectedProducts = new Set(), 
  lockedProducts = new Set(),
  preselectedPresentaciones = [] // Array de presentaciones pre-seleccionadas
}) => {
  const { dialogState, showAlert, showSuccess, showError, closeDialog } = useDialog();
  
  // ===== ESTADOS DE FILTROS =====
  const [filters, setFilters] = useState({
    categorias: [],
    marcas: [],
    precioMin: '',
    precioMax: '',
    fechaIngresoDesde: '',
    fechaIngresoHasta: '',
    ...initialFilters
  });

  // Estados para datos reales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ===== ESTADOS DE BÚSQUEDA Y PAGINACIÓN =====
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // ===== ESTADOS DE FILTRO DE VISUALIZACIÓN =====
  const [showOnlyAdded, setShowOnlyAdded] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [isManagingSelection, setIsManagingSelection] = useState(false);
  const [productsToRemove, setProductsToRemove] = useState(new Set());
  const [presentacionesToRemove, setPresentacionesToRemove] = useState(new Set());
  
  // ===== ESTADOS DE SELECCIÓN =====
  // Selección de la vista actual (temporal, antes de confirmar)
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedPresentaciones, setSelectedPresentaciones] = useState(new Set());
  
  // Selección global acumulada (productos/presentaciones ya agregados a la promoción)
  const [globalSelectedProducts, setGlobalSelectedProducts] = useState(new Set(preselectedProducts));
  const [globalSelectedPresentaciones, setGlobalSelectedPresentaciones] = useState(new Set());
  
  // Estados para presentaciones
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [productPresentaciones, setProductPresentaciones] = useState({});
  const [presentacionesPrecios, setPresentacionesPrecios] = useState({});
  const [lockedPresentaciones, setLockedPresentaciones] = useState(new Set());
  
  // ===== ESTADOS DE VALIDACIÓN =====
  const [priceError, setPriceError] = useState('');

  //  CARGAR DATOS REALES AL MONTAR COMPONENTE
  useEffect(() => {
    loadData();
  }, []);
  
  // ===== RESETEAR PÁGINA AL CAMBIAR FILTROS O BÚSQUEDA =====
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, showOnlyAdded, sortBy]);

  // ===== INICIALIZAR SELECCIÓN GLOBAL CON PRESELECCIONADOS =====
  useEffect(() => {
    if (preselectedProducts && preselectedProducts.size > 0) {
      setGlobalSelectedProducts(new Set(preselectedProducts));
    }
  }, []); // Ejecutar solo una vez al montar

  // ===== CARGAR Y SELECCIONAR PRESENTACIONES PRE-SELECCIONADAS (GLOBAL) =====
  useEffect(() => {
    const loadPreselectedPresentaciones = async () => {
      if (!preselectedPresentaciones || preselectedPresentaciones.length === 0) {
        setLockedPresentaciones(new Set());
        setGlobalSelectedPresentaciones(new Set());
        return;
      }
      
      try {
        // Agrupar presentaciones por SKUID
        const presentacionesPorSKU = {};
        const skuidsUnicos = new Set();
        const idsPresent = new Set();
        
        preselectedPresentaciones.forEach(pres => {
          if (pres && pres.SKUID && pres.IdPresentaOK) {
            skuidsUnicos.add(pres.SKUID);
            idsPresent.add(pres.IdPresentaOK);
            
            if (!presentacionesPorSKU[pres.SKUID]) {
              presentacionesPorSKU[pres.SKUID] = [];
            }
            // Asegurar que la presentación tenga todos los campos necesarios
            const presentacionCompleta = {
              ...pres,
              ACTIVED: true, // Marcar como activa para que se muestre
              NOMBREPRESENTACION: pres.NOMBREPRESENTACION || pres.NombrePresentacion || 'Sin nombre'
            };
            presentacionesPorSKU[pres.SKUID].push(presentacionCompleta);
          }
        });

        // Marcar productos como expandidos
        setExpandedProducts(skuidsUnicos);
        
        // Marcar las presentaciones como bloqueadas PRIMERO
        setLockedPresentaciones(idsPresent);
        
        // Actualizar selección global de presentaciones
        setGlobalSelectedPresentaciones(idsPresent);
        
        // Cargar TODAS las presentaciones del servidor para cada SKUID
        const presentacionesPromises = Array.from(skuidsUnicos).map(async (skuid) => {
          try {
            const presentaciones = await productPresentacionesService.getPresentacionesBySKUID(skuid);
            return { skuid, presentaciones: presentaciones || [] };
          } catch (error) {
            console.error(`Error loading presentaciones for ${skuid}:`, error);
            return { skuid, presentaciones: [] };
          }
        });
        
        const presentacionesResults = await Promise.all(presentacionesPromises);
        
        // Combinar presentaciones del servidor con las bloqueadas
        const presentacionesCombinadas = {};
        presentacionesResults.forEach(({ skuid, presentaciones }) => {
          const presentacionesMap = new Map();
          
          // Primero agregar las presentaciones bloqueadas
          if (presentacionesPorSKU[skuid]) {
            presentacionesPorSKU[skuid].forEach(p => {
              presentacionesMap.set(p.IdPresentaOK, p);
            });
          }
          
          // Luego agregar las del servidor (sin sobrescribir las bloqueadas)
          presentaciones.forEach(p => {
            if (!presentacionesMap.has(p.IdPresentaOK)) {
              presentacionesMap.set(p.IdPresentaOK, p);
            }
          });
          
          presentacionesCombinadas[skuid] = Array.from(presentacionesMap.values());
        });
        
        // Guardar las presentaciones combinadas
        setProductPresentaciones(prev => ({ ...prev, ...presentacionesCombinadas }));
        
        // Cargar precios para TODAS las presentaciones
        const todasLasPresentaciones = Object.values(presentacionesCombinadas).flat();
        const preciosPromises = todasLasPresentaciones.map(async (presentacion) => {
          try {
            const precios = await preciosItemsService.getPricesByIdPresentaOK(presentacion.IdPresentaOK);
            return { idPresentaOK: presentacion.IdPresentaOK, precios };
          } catch (error) {
            console.error(`Error loading prices for ${presentacion.IdPresentaOK}:`, error);
            return { idPresentaOK: presentacion.IdPresentaOK, precios: [] };
          }
        });
        
        const preciosResults = await Promise.all(preciosPromises);
        
        // Actualizar estado de precios
        setPresentacionesPrecios(prev => {
          const newPrecios = { ...prev };
          preciosResults.forEach(({ idPresentaOK, precios }) => {
            newPrecios[idPresentaOK] = precios;
          });
          return newPrecios;
        });
        
      } catch (error) {
        console.error('Error cargando presentaciones pre-seleccionadas:', error);
      }
    };

    loadPreselectedPresentaciones();
  }, []); // Ejecutar solo una vez al montar

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Cargar productos y categorías en paralelo
      const [productosResponse, categoriasResponse] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);

      // Extraer datos reales de la estructura conocida de la API
      const productosData = productosResponse?.value?.[0]?.data?.[0]?.dataRes ?? [];
      const categoriasData = categoriasResponse?.data?.[0]?.dataRes ?? [];

      // Filtrar solo categorías activas
      const categoriasActivas = categoriasData.filter(cat => 
        cat.ACTIVED === true && cat.DELETED === false
      );

      // Extraer marcas únicas de los productos ACTIVOS
      const productosActivos = productosData.filter(p => p.ACTIVED && !p.DELETED);
      const marcasUnicas = [...new Set(
        productosActivos
          .filter(p => p.MARCA && p.MARCA.trim() !== '')
          .map(p => p.MARCA.trim())
      )];
      
      const marcasConConteo = marcasUnicas.map(marca => ({ 
        id: marca.toUpperCase().replace(/\s+/g, '_'), 
        name: marca,
        productos: productosActivos.filter(p => p.MARCA === marca).length
      }));

      setProductos(productosData);
      setCategorias(categoriasActivas);
      setMarcas(marcasConConteo);

    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    
    // Validar rango de precios
    if (filterKey === 'precioMin' || filterKey === 'precioMax') {
      validatePriceRange(
        filterKey === 'precioMin' ? value : filters.precioMin,
        filterKey === 'precioMax' ? value : filters.precioMax
      );
    }
  };
  
  // ===== VALIDACIÓN DE RANGO DE PRECIOS =====
  const validatePriceRange = (min, max) => {
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    
    if (min && max && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      setPriceError('El precio mínimo no puede ser mayor que el máximo');
      return false;
    }
    
    setPriceError('');
    return true;
  };
  
  // ===== ATAJOS DE PRECIO =====
  const applyPriceShortcut = (shortcut) => {
    setFilters(prev => ({
      ...prev,
      precioMin: shortcut.min.toString(),
      precioMax: shortcut.max ? shortcut.max.toString() : ''
    }));
    setPriceError('');
  };
  
  // ===== ATAJOS DE FECHA =====
  const applyDateShortcut = (shortcutId) => {
    const today = new Date();
    let desde, hasta;
    
    switch (shortcutId) {
      case 'today':
        desde = hasta = today.toISOString().split('T')[0];
        break;
      case 'last7':
        desde = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        hasta = new Date().toISOString().split('T')[0];
        break;
      case 'last30':
        desde = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        hasta = new Date().toISOString().split('T')[0];
        break;
      case 'thisYear':
        desde = `${new Date().getFullYear()}-01-01`;
        hasta = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      fechaIngresoDesde: desde,
      fechaIngresoHasta: hasta
    }));
  };

  const handleMultiSelectChange = (filterKey, selectedItems) => {
    const values = selectedItems.map(item => item.getAttribute('data-value'));
    handleFilterChange(filterKey, values);
  };

  const clearAllFilters = () => {
    setFilters({
      categorias: [],
      marcas: [],
      precioMin: '',
      precioMax: '',
      fechaIngresoDesde: '',
      fechaIngresoHasta: '',
    });
    setSearchTerm('');
    setPriceError('');
    setSelectedProducts(new Set()); // Limpiar selección temporal
    setSelectedPresentaciones(new Set());
  };
  
  // ===== REMOVER UN FILTRO ESPECÍFICO (para chips) =====
  const removeFilter = (filterKey, value) => {
    if (filterKey === 'categorias' || filterKey === 'marcas') {
      setFilters(prev => ({
        ...prev,
        [filterKey]: prev[filterKey].filter(v => v !== value)
      }));
    } else if (filterKey === 'precio') {
      setFilters(prev => ({
        ...prev,
        precioMin: '',
        precioMax: ''
      }));
      setPriceError('');
    } else if (filterKey === 'fecha') {
      setFilters(prev => ({
        ...prev,
        fechaIngresoDesde: '',
        fechaIngresoHasta: ''
      }));
    } else if (filterKey === 'busqueda') {
      clearSearch();
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categorias.length > 0) count++;
    if (filters.marcas.length > 0) count++;
    if (filters.temporada) count++;
    if (filters.precioMin || filters.precioMax) count++;
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) count++;
    if (searchTerm) count++;
    return count;
  };
  
  // ===== OBTENER ARRAY DE FILTROS ACTIVOS PARA CHIPS =====
  const getActiveFiltersChips = () => {
    const chips = [];
    
    // Categorías
    filters.categorias.forEach(catId => {
      const categoria = categorias.find(c => c.CATID === catId);
      if (categoria) {
        chips.push({
          key: `cat-${catId}`,
          label: `Categoría: ${categoria.Nombre}`,
          filterKey: 'categorias',
          value: catId
        });
      }
    });
    
    // Marcas
    filters.marcas.forEach(marcaNombre => {
      chips.push({
        key: `marca-${marcaNombre}`,
        label: `Marca: ${marcaNombre}`,
        filterKey: 'marcas',
        value: marcaNombre
      });
    });
    
    // Precio
    if (filters.precioMin || filters.precioMax) {
      const minLabel = filters.precioMin || '0';
      const maxLabel = filters.precioMax || '∞';
      chips.push({
        key: 'precio',
        label: `Precio: $${minLabel} - $${maxLabel}`,
        filterKey: 'precio'
      });
    }
    
    // Fecha
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) {
      const desde = filters.fechaIngresoDesde ? new Date(filters.fechaIngresoDesde).toLocaleDateString() : '...';
      const hasta = filters.fechaIngresoHasta ? new Date(filters.fechaIngresoHasta).toLocaleDateString() : '...';
      chips.push({
        key: 'fecha',
        label: `Fecha: ${desde} - ${hasta}`,
        filterKey: 'fecha'
      });
    }
    
    // Búsqueda
    if (searchTerm) {
      chips.push({
        key: 'busqueda',
        label: `Búsqueda: "${searchTerm}"`,
        filterKey: 'busqueda'
      });
    }
    
    return chips;
  };

  // ===== OBTENER PRODUCTOS FILTRADOS (con todos los filtros aplicados) =====
  const getFilteredProducts = () => {
    if (productos.length === 0) return [];
    
    let filtered = productos.filter(producto => {
      // Solo mostrar productos activos y no eliminados
      if (!producto.ACTIVED || producto.DELETED) {
        return false;
      }
      
      // Filtro de "solo productos agregados"
      if (showOnlyAdded) {
        if (!globalSelectedProducts.has(producto.SKUID) && !lockedProducts.has(producto.SKUID)) {
          return false;
        }
      }
      
      // Filtro de búsqueda por texto (inmediato)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          producto.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
          producto.SKUID?.toLowerCase().includes(searchLower) ||
          producto.MARCA?.toLowerCase().includes(searchLower) ||
          producto.CATEGORIAS?.some(cat => cat.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      if (filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA)) return false;
      }
      
      if (filters.categorias.length > 0) {
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          const hasCategory = producto.CATEGORIAS.some(cat => filters.categorias.includes(cat));
          if (!hasCategory) return false;
        }
      }
      
      // Filtro por precio
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      // Filtro por fecha de ingreso
      if (filters.fechaIngresoDesde) {
        const fechaDesde = new Date(filters.fechaIngresoDesde);
        const fechaProducto = new Date(producto.REGDATE);
        if (fechaProducto < fechaDesde) return false;
      }
      
      if (filters.fechaIngresoHasta) {
        const fechaHasta = new Date(filters.fechaIngresoHasta);
        const fechaProducto = new Date(producto.REGDATE);
        if (fechaProducto > fechaHasta) return false;
      }
      
      return true;
    });
    
    // ===== APLICAR ORDENAMIENTO =====
    switch (sortBy) {
      case 'addedFirst':
        // Primero los agregados (global o locked), luego los demás
        filtered.sort((a, b) => {
          const aIsAdded = globalSelectedProducts.has(a.SKUID) || lockedProducts.has(a.SKUID);
          const bIsAdded = globalSelectedProducts.has(b.SKUID) || lockedProducts.has(b.SKUID);
          if (aIsAdded && !bIsAdded) return -1;
          if (!aIsAdded && bIsAdded) return 1;
          return 0;
        });
        break;
      case 'notAddedFirst':
        // Primero los NO agregados, luego los agregados
        filtered.sort((a, b) => {
          const aIsAdded = globalSelectedProducts.has(a.SKUID) || lockedProducts.has(a.SKUID);
          const bIsAdded = globalSelectedProducts.has(b.SKUID) || lockedProducts.has(b.SKUID);
          if (!aIsAdded && bIsAdded) return -1;
          if (aIsAdded && !bIsAdded) return 1;
          return 0;
        });
        break;
      case 'nameAsc':
        filtered.sort((a, b) => (a.PRODUCTNAME || '').localeCompare(b.PRODUCTNAME || ''));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => (b.PRODUCTNAME || '').localeCompare(a.PRODUCTNAME || ''));
        break;
      case 'default':
      default:
        // Sin ordenamiento adicional
        break;
    }
    
    // Si estamos en modo de gestión, solo mostrar productos agregados
    if (isManagingSelection) {
      filtered = filtered.filter(producto => 
        globalSelectedProducts.has(producto.SKUID)
      );
    }
    
    return filtered;
  };
  
  // ===== OBTENER PRODUCTOS PAGINADOS =====
  const getPaginatedProducts = () => {
    const allFiltered = getFilteredProducts();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFiltered.slice(startIndex, endIndex);
  };
  
  // ===== CALCULAR INFO DE PAGINACIÓN =====
  const getPaginationInfo = () => {
    const total = getFilteredProducts().length;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, total);
    
    return {
      total,
      totalPages,
      startItem,
      endItem,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  };
  
  // ===== HELPER PARA RESALTAR COINCIDENCIAS EN BÚSQUEDA =====
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <strong key={index} style={{ backgroundColor: '#fff3cd', fontWeight: '700' }}>{part}</strong> : 
        part
    );
  };

  // ===== FUNCIONES DE SELECCIÓN TEMPORAL (vista actual) =====
  const toggleProductSelection = async (productId) => {
    // No permitir deseleccionar productos bloqueados o ya en selección global
    if (lockedProducts.has(productId) || globalSelectedProducts.has(productId)) {
      return;
    }
    
    const isCurrentlySelected = selectedProducts.has(productId);
    
    if (!isCurrentlySelected) {
      // SELECCIONAR producto
      setSelectedProducts(prev => {
        const newSelection = new Set(prev);
        newSelection.add(productId);
        return newSelection;
      });
      
      // Cargar presentaciones si no están cargadas Y luego seleccionarlas
      let presentaciones = productPresentaciones[productId] || [];
      
      if (!productPresentaciones[productId] || presentaciones.length === 0) {
        // Cargar y obtener las presentaciones
        presentaciones = await loadPresentaciones(productId);
      }
      
      // Seleccionar todas las presentaciones activas del producto (excepto las globales/bloqueadas)
      const presentacionesActivas = presentaciones.filter(p => 
        p.ACTIVED && 
        !lockedPresentaciones.has(p.IdPresentaOK) &&
        !globalSelectedPresentaciones.has(p.IdPresentaOK)
      );
      
      setSelectedPresentaciones(prev => {
        const newSel = new Set(prev);
        presentacionesActivas.forEach(p => newSel.add(p.IdPresentaOK));
        return newSel;
      });
    } else {
      // DESELECCIONAR producto
      setSelectedProducts(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(productId);
        return newSelection;
      });
      
      // Deseleccionar todas las presentaciones del producto (excepto las bloqueadas/globales)
      const presentaciones = productPresentaciones[productId] || [];
      setSelectedPresentaciones(prev => {
        const newSel = new Set(prev);
        presentaciones.forEach(p => {
          if (!lockedPresentaciones.has(p.IdPresentaOK) && 
              !globalSelectedPresentaciones.has(p.IdPresentaOK)) {
            newSel.delete(p.IdPresentaOK);
          }
        });
        return newSel;
      });
    }
  };

  const selectAllProducts = async () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    const newSelection = new Set([...selectedProducts]);
    
    // Solo agregar los que no están en global ni bloqueados
    allProductIds.forEach(skuid => {
      if (!globalSelectedProducts.has(skuid) && !lockedProducts.has(skuid)) {
        newSelection.add(skuid);
      }
    });
    
    setSelectedProducts(newSelection);
    
    // Cargar y seleccionar presentaciones para cada producto
    for (const skuid of allProductIds) {
      if (globalSelectedProducts.has(skuid) || lockedProducts.has(skuid)) continue;
      
      let presentaciones = productPresentaciones[skuid] || [];
      
      if (!productPresentaciones[skuid] || presentaciones.length === 0) {
        presentaciones = await loadPresentaciones(skuid);
      }
      
      const activePresentaciones = presentaciones.filter(p => 
        p.ACTIVED && 
        !globalSelectedPresentaciones.has(p.IdPresentaOK) &&
        !lockedPresentaciones.has(p.IdPresentaOK)
      );
      
      setSelectedPresentaciones(prev => {
        const newSelection = new Set(prev);
        activePresentaciones.forEach(p => newSelection.add(p.IdPresentaOK));
        return newSelection;
      });
    }
  };

  const deselectAllProducts = () => {
    // Limpiar solo la selección temporal (no tocar global ni bloqueados)
    setSelectedProducts(new Set());
    setSelectedPresentaciones(new Set());
  };
  
  // ===== AGREGAR SELECCIÓN ACTUAL A LA SELECCIÓN GLOBAL =====
  const addToGlobalSelection = () => {
    if (selectedPresentaciones.size === 0) {
      showAlert('Selección vacía', 'No hay presentaciones seleccionadas para agregar');
      return;
    }
    
    // Agregar productos a la selección global (evitar duplicados)
    setGlobalSelectedProducts(prev => {
      const newGlobal = new Set(prev);
      selectedProducts.forEach(skuid => newGlobal.add(skuid));
      return newGlobal;
    });
    
    // Agregar presentaciones a la selección global (evitar duplicados)
    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      selectedPresentaciones.forEach(idPres => newGlobal.add(idPres));
      return newGlobal;
    });
    
    // Limpiar selección temporal
    setSelectedProducts(new Set());
    setSelectedPresentaciones(new Set());
    
    showSuccess(
      'Productos agregados',
      `Se agregaron ${selectedPresentaciones.size} presentación(es) a la promoción`
    );
  };

  // ===== REMOVER PRODUCTO DE LA SELECCIÓN GLOBAL =====
  const removeFromGlobalSelection = (productId) => {
    // No permitir remover productos bloqueados
    if (lockedProducts.has(productId)) {
      showAlert('No se puede remover', 'Este producto ya está en la promoción y no se puede eliminar');
      return;
    }

    // Remover el producto de la selección global
    setGlobalSelectedProducts(prev => {
      const newGlobal = new Set(prev);
      newGlobal.delete(productId);
      return newGlobal;
    });

    // Remover todas las presentaciones de ese producto (excepto las bloqueadas)
    const presentaciones = productPresentaciones[productId] || [];
    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      presentaciones.forEach(p => {
        if (!lockedPresentaciones.has(p.IdPresentaOK)) {
          newGlobal.delete(p.IdPresentaOK);
        }
      });
      return newGlobal;
    });

    showSuccess('Producto removido', 'El producto fue removido de la selección');
  };

  // ===== REMOVER PRESENTACIÓN DE LA SELECCIÓN GLOBAL =====
  const removePresFromGlobalSelection = (presentacionId, productId) => {
    // No permitir remover presentaciones bloqueadas
    if (lockedPresentaciones.has(presentacionId)) {
      showAlert('No se puede remover', 'Esta presentación ya está en la promoción y no se puede eliminar');
      return;
    }

    // Remover la presentación
    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      newGlobal.delete(presentacionId);
      return newGlobal;
    });

    // Si el producto ya no tiene presentaciones seleccionadas, removerlo también
    const presentaciones = productPresentaciones[productId] || [];
    const remainingSelected = presentaciones.filter(p => 
      globalSelectedPresentaciones.has(p.IdPresentaOK) && 
      p.IdPresentaOK !== presentacionId &&
      !lockedPresentaciones.has(p.IdPresentaOK)
    );

    if (remainingSelected.length === 0 && !lockedProducts.has(productId)) {
      setGlobalSelectedProducts(prev => {
        const newGlobal = new Set(prev);
        newGlobal.delete(productId);
        return newGlobal;
      });
    }

    showSuccess('Presentación removida', 'La presentación fue removida de la selección');
  };

  // ===== FUNCIONES PARA GESTIÓN DE ELIMINACIÓN EN LOTE =====
  const toggleProductToRemove = (productId) => {
    setProductsToRemove(prev => {
      const newSet = new Set(prev);
      const presentaciones = productPresentaciones[productId] || [];
      
      if (newSet.has(productId)) {
        // DESELECCIONAR producto
        newSet.delete(productId);
        // También remover las presentaciones de este producto
        setPresentacionesToRemove(prevPres => {
          const newPreSet = new Set(prevPres);
          presentaciones.forEach(p => {
            if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
              newPreSet.delete(p.IdPresentaOK);
            }
          });
          return newPreSet;
        });
      } else {
        // SELECCIONAR producto
        newSet.add(productId);
        // También seleccionar todas sus presentaciones que estén en global y no bloqueadas
        setPresentacionesToRemove(prevPres => {
          const newPreSet = new Set(prevPres);
          presentaciones.forEach(p => {
            if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
              newPreSet.add(p.IdPresentaOK);
            }
          });
          return newPreSet;
        });
      }
      return newSet;
    });
  };

  const togglePresentacionToRemove = (presentacionId, productId) => {
    setPresentacionesToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presentacionId)) {
        newSet.delete(presentacionId);
        // Si deseleccionamos una presentación, también deseleccionar el producto
        setProductsToRemove(prevProds => {
          const newProds = new Set(prevProds);
          newProds.delete(productId);
          return newProds;
        });
      } else {
        newSet.add(presentacionId);
        
        // Verificar si todas las presentaciones del producto están seleccionadas
        const presentaciones = productPresentaciones[productId] || [];
        const presentacionesElegibles = presentaciones.filter(p => 
          globalSelectedPresentaciones.has(p.IdPresentaOK) && 
          !lockedPresentaciones.has(p.IdPresentaOK)
        );
        
        // Contar cuántas presentaciones elegibles estarán seleccionadas después de este cambio
        const todasSeleccionadas = presentacionesElegibles.every(p => 
          p.IdPresentaOK === presentacionId || newSet.has(p.IdPresentaOK)
        );
        
        // Si todas las presentaciones están seleccionadas, seleccionar el producto
        if (todasSeleccionadas && presentacionesElegibles.length > 0) {
          setProductsToRemove(prevProds => {
            const newProds = new Set(prevProds);
            newProds.add(productId);
            return newProds;
          });
        }
      }
      return newSet;
    });
  };

  const selectAllToRemove = () => {
    const productsToSelect = new Set();
    const presentacionesToSelect = new Set();
    
    getFilteredProducts().forEach(producto => {
      if (globalSelectedProducts.has(producto.SKUID) && !lockedProducts.has(producto.SKUID)) {
        productsToSelect.add(producto.SKUID);
        
        // Seleccionar también sus presentaciones
        const presentaciones = productPresentaciones[producto.SKUID] || [];
        presentaciones.forEach(p => {
          if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
            presentacionesToSelect.add(p.IdPresentaOK);
          }
        });
      }
    });
    
    setProductsToRemove(productsToSelect);
    setPresentacionesToRemove(presentacionesToSelect);
  };

  const clearRemoveSelection = () => {
    setProductsToRemove(new Set());
    setPresentacionesToRemove(new Set());
  };

  const removeSelectedProducts = () => {
    if (productsToRemove.size === 0 && presentacionesToRemove.size === 0) return;
    
    let removedCount = 0;
    
    // Remover productos completos
    productsToRemove.forEach(skuid => {
      if (!lockedProducts.has(skuid)) {
        removeFromGlobalSelection(skuid);
        removedCount++;
      }
    });
    
    // Remover presentaciones individuales
    presentacionesToRemove.forEach(presentacionId => {
      if (!lockedPresentaciones.has(presentacionId)) {
        // Buscar el producto que contiene esta presentación
        let productId = null;
        for (const [skuid, presentaciones] of Object.entries(productPresentaciones)) {
          if (presentaciones.some(p => p.IdPresentaOK === presentacionId)) {
            productId = skuid;
            break;
          }
        }
        
        if (productId && !productsToRemove.has(productId)) {
          removePresFromGlobalSelection(presentacionId, productId);
          removedCount++;
        }
      }
    });
    
    // Limpiar selección
    clearRemoveSelection();
    setIsManagingSelection(false);
    
    const message = productsToRemove.size > 0 
      ? `Se eliminaron ${productsToRemove.size} producto(s)`
      : `Se eliminaron ${presentacionesToRemove.size} presentación(es)`;
    
    showSuccess('Eliminación exitosa', message);
  };

  // FUNCIONES PARA MANEJAR PRESENTACIONES
  const toggleProductExpansion = async (productId) => {
    const newExpanded = new Set(expandedProducts);
    
    if (newExpanded.has(productId)) {
      // Contraer
      newExpanded.delete(productId);
    } else {
      // Expandir y cargar presentaciones si no están cargadas
      newExpanded.add(productId);
      
      if (!productPresentaciones[productId]) {
        await loadPresentaciones(productId);
      }
    }
    
    setExpandedProducts(newExpanded);
  };

  const loadPresentaciones = async (skuid) => {
    try {
      const presentaciones = await productPresentacionesService.getPresentacionesBySKUID(skuid);
      
      // Usar Map para evitar duplicados y mantener las bloqueadas
      const presentacionesMap = new Map();
      
      // Primero agregar las presentaciones que ya teníamos (incluidas las bloqueadas)
      if (productPresentaciones[skuid]) {
        productPresentaciones[skuid].forEach(p => {
          presentacionesMap.set(p.IdPresentaOK, p);
        });
      }
      
      // Luego agregar/actualizar con las del servidor
      if (presentaciones && presentaciones.length > 0) {
        presentaciones.forEach(p => {
          // Si ya existe (bloqueada), mantener la versión bloqueada pero actualizar otros campos
          if (presentacionesMap.has(p.IdPresentaOK)) {
            const existing = presentacionesMap.get(p.IdPresentaOK);
            presentacionesMap.set(p.IdPresentaOK, {
              ...p,
              ...existing, // Mantener campos de la bloqueada (como ACTIVED: true)
            });
          } else {
            presentacionesMap.set(p.IdPresentaOK, p);
          }
        });
      }
      
      const presentacionesCombinadas = Array.from(presentacionesMap.values());
      
      setProductPresentaciones(prev => ({
        ...prev,
        [skuid]: presentacionesCombinadas
      }));
      
      // Cargar precios para cada presentación
      if (presentacionesCombinadas && presentacionesCombinadas.length > 0) {
        const preciosPromises = presentacionesCombinadas.map(async (presentacion) => {
          try {
            const precios = await preciosItemsService.getPricesByIdPresentaOK(presentacion.IdPresentaOK);
            return { idPresentaOK: presentacion.IdPresentaOK, precios };
          } catch (error) {
            console.error(`Error loading prices for ${presentacion.IdPresentaOK}:`, error);
            return { idPresentaOK: presentacion.IdPresentaOK, precios: [] };
          }
        });
        
        const preciosResults = await Promise.all(preciosPromises);
        
        // Actualizar estado de precios
        setPresentacionesPrecios(prev => {
          const newPrecios = { ...prev };
          preciosResults.forEach(({ idPresentaOK, precios }) => {
            newPrecios[idPresentaOK] = precios;
          });
          return newPrecios;
        });
      }
      
      // RETORNAR las presentaciones cargadas
      return presentacionesCombinadas;
    } catch (error) {
      console.error(`Error loading presentaciones for ${skuid}:`, error);
      setProductPresentaciones(prev => ({
        ...prev,
        [skuid]: []
      }));
      return []; // Retornar array vacío en caso de error
    }
  };

  const togglePresentacionSelection = (presentacionId, skuid) => {
    // No permitir toggle si está bloqueada o en selección global
    if (lockedPresentaciones.has(presentacionId) || globalSelectedPresentaciones.has(presentacionId)) {
      return;
    }
    
    setSelectedPresentaciones(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(presentacionId)) {
        newSelection.delete(presentacionId);
        
        // Verificar si quedan presentaciones seleccionadas de este producto
        const presentaciones = productPresentaciones[skuid] || [];
        const remainingSelected = presentaciones.some(p => 
          p.IdPresentaOK !== presentacionId && newSelection.has(p.IdPresentaOK)
        );
        
        // Si no quedan presentaciones seleccionadas, deseleccionar el producto
        if (!remainingSelected) {
          setSelectedProducts(prevProducts => {
            const newProducts = new Set(prevProducts);
            newProducts.delete(skuid);
            return newProducts;
          });
        }
      } else {
        newSelection.add(presentacionId);
        
        // Si se selecciona una presentación, asegurar que el producto esté seleccionado
        setSelectedProducts(prevProducts => {
          const newProducts = new Set(prevProducts);
          newProducts.add(skuid);
          return newProducts;
        });
      }
      return newSelection;
    });
  };

  // Función helper para obtener el precio de una presentación
  const getPrecioPresentacion = (idPresentaOK) => {
    const precios = presentacionesPrecios[idPresentaOK] || [];
    
    if (precios.length === 0) {
      return null;
    }
    
    // Buscar el precio de la lista principal o el primer precio disponible
    // Puedes ajustar esta lógica según tus necesidades
    const precioActivo = precios.find(p => p.ACTIVO === true) || precios[0];
    
    return precioActivo?.Precio || null;
  };

  // ===== NOTIFICAR AL PADRE LA SELECCIÓN GLOBAL =====
  useEffect(() => {
    if (onFiltersChange && typeof onFiltersChange === 'function') {
      // Recopilar SOLO las presentaciones de la selección GLOBAL (no las temporales)
      const selectedPresentacionesList = [];
      
      Object.entries(productPresentaciones).forEach(([skuid, presentaciones]) => {
        if (!Array.isArray(presentaciones)) return;
        
        presentaciones.forEach(presentacion => {
          // Solo incluir las que están en selección GLOBAL y NO están bloqueadas
          if (presentacion && 
              presentacion.IdPresentaOK && 
              globalSelectedPresentaciones.has(presentacion.IdPresentaOK) &&
              !lockedPresentaciones.has(presentacion.IdPresentaOK)) {
            
            const producto = productos.find(p => p.SKUID === skuid);
            const precio = getPrecioPresentacion(presentacion.IdPresentaOK);
            
            selectedPresentacionesList.push({
              ...presentacion,
              Precio: precio,
              producto: producto ? {
                SKUID: producto.SKUID,
                PRODUCTNAME: producto.PRODUCTNAME,
                MARCA: producto.MARCA,
                PRECIO: producto.PRECIO
              } : null
            });
          }
        });
      });
      
      onFiltersChange(selectedPresentacionesList);
    }
  }, [globalSelectedPresentaciones, productPresentaciones, productos, presentacionesPrecios, lockedPresentaciones]);

  // ===== CARGAR AUTOMÁTICAMENTE PRESENTACIONES DE PRODUCTOS VISIBLES =====
  useEffect(() => {
    const loadVisiblePresentaciones = async () => {
      const allFilteredProducts = getFilteredProducts();
      
      // Cargar presentaciones para TODOS los productos filtrados (no solo los de la página actual)
      for (const producto of allFilteredProducts) {
        if (!productPresentaciones[producto.SKUID]) {
          await loadPresentaciones(producto.SKUID);
        }
      }
    };

    if (!loading && productos.length > 0) {
      loadVisiblePresentaciones();
    }
  }, [productos, filters, searchTerm, sortBy, showOnlyAdded, loading]);

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <FlexBox style={{ 
        gap: '1rem', 
        margin: '0',
        padding: '0.5rem',
        width: '100%',
        flex: 1, 
        minHeight: 0,
        alignItems: 'stretch',
        // overflow: 'hidden'
      }}>
        
        {/* COLUMNA IZQUIERDA - FILTROS */}
        <Card style={{ 
          flex: '0 0 35%',
          minWidth: '320px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        <CardHeader
          titleText="Filtros Avanzados"
          subtitleText={loading ? 'Cargando datos...' : `${getActiveFiltersCount()} filtros activos`}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            flexShrink: 0
          }}
          action={
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Icon name="filter" style={{ fontSize: '1.2rem', color: 'white' }} />
              {getActiveFiltersCount() > 0 && (
                <ObjectStatus state="Success" style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {getActiveFiltersCount()} activos
                </ObjectStatus>
              )}
              <Button 
                design="Emphasized"
                icon="reset"
                onClick={clearAllFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                Limpiar Filtros
              </Button>
            </FlexBox>
          }
        />

        <div style={{ 
          padding: '0.5rem',
          flex: '1',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}>
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            
            {/* FILTROS POR CATEGORÍA */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Categorías de Productos:</Label>
                {categorias.length > 0 ? (
                  <>
                    <MultiComboBox
                      placeholder="Selecciona categorías..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onSelectionChange={(e) => handleMultiSelectChange('categorias', e.detail.items)}
                    >
                      {categorias.map(categoria => (
                        <MultiComboBoxItem 
                          key={categoria.CATID} 
                          text={`${categoria.Nombre}`}
                          data-value={categoria.CATID}
                          selected={filters.categorias.includes(categoria.CATID)}
                        />
                      ))}
                    </MultiComboBox>
                    
                    {filters.categorias.length > 0 && (
                      <FlexBox style={{ marginTop: '0.5rem', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {filters.categorias.map(catId => {
                          const categoria = categorias.find(c => c.CATID === catId);
                          return categoria ? (
                            <ObjectStatus key={catId} state="Information">
                              {categoria.Nombre}
                            </ObjectStatus>
                          ) : null;
                        })}
                      </FlexBox>
                    )}
                  </>
                ) : (
                  <Text style={{ marginTop: '0.25rem', color: '#666' }}>
                    {loading ? 'Cargando categorías...' : `No hay categorías disponibles (Total encontradas: ${categorias.length})`}
                  </Text>
                )}
            </div>

            {/* FILTROS POR MARCA */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Marcas de Productos:</Label>
                {marcas.length > 0 ? (
                  <>
                    <MultiComboBox
                      placeholder="Selecciona marcas..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onSelectionChange={(e) => handleMultiSelectChange('marcas', e.detail.items)}
                    >
                      {marcas.map(marca => (
                        <MultiComboBoxItem 
                          key={marca.id} 
                          text={`${marca.name} (${marca.productos} productos)`}
                          data-value={marca.name}
                          selected={filters.marcas.includes(marca.name)}
                        />
                      ))}
                    </MultiComboBox>
                    
                    {filters.marcas.length > 0 && (
                      <FlexBox style={{ marginTop: '0.5rem', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {filters.marcas.map(marcaNombre => {
                          const marca = marcas.find(m => m.name === marcaNombre);
                          return marca ? (
                            <ObjectStatus key={marcaNombre} state="Warning">
                              {marca.name} ({marca.productos})
                            </ObjectStatus>
                          ) : null;
                        })}
                      </FlexBox>
                    )}
                  </>
                ) : (
                  <Text style={{ marginTop: '0.25rem', color: '#666' }}>
                    {loading ? 'Cargando marcas...' : 'No hay marcas disponibles'}
                  </Text>
                )}
            </div>

            {/* FILTROS POR PRECIO */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Rango de Precios:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Mínimo"
                    value={filters.precioMin}
                    onInput={(e) => handleFilterChange('precioMin', e.target.value)}
                    style={{ width: '100%' }}
                    valueState={priceError ? 'Error' : 'None'}
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Máximo"
                    value={filters.precioMax}
                    onInput={(e) => handleFilterChange('precioMax', e.target.value)}
                    style={{ width: '100%' }}
                    valueState={priceError ? 'Error' : 'None'}
                  />
                </div>
              </div>
              
              {/* Mensaje de error de validación */}
              {priceError && (
                <Text style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {priceError}
                </Text>
              )}
              
              {/* Atajos de precio */}
              <FlexBox style={{ marginTop: '0.5rem', gap: '0.25rem', flexWrap: 'wrap' }}>
                {PRICE_SHORTCUTS.map(shortcut => (
                  <Button
                    key={shortcut.id}
                    design="Transparent"
                    onClick={() => applyPriceShortcut(shortcut)}
                    style={{ 
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.4rem',
                      border: '1px solid #e0e6ed',
                      borderRadius: '4px'
                    }}
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </FlexBox>
            </div>

            {/*  FILTROS POR FECHA */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Fecha de Ingreso:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                <div>
                  <DatePicker
                    placeholder="Fecha Desde"
                    value={filters.fechaIngresoDesde}
                    onChange={(e) => handleFilterChange('fechaIngresoDesde', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <DatePicker
                    placeholder="Fecha Hasta"
                    value={filters.fechaIngresoHasta}
                    onChange={(e) => handleFilterChange('fechaIngresoHasta', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              {/* Atajos de fecha */}
              <FlexBox style={{ marginTop: '0.5rem', gap: '0.25rem', flexWrap: 'wrap' }}>
                {DATE_SHORTCUTS.map(shortcut => (
                  <Button
                    key={shortcut.id}
                    design="Transparent"
                    onClick={() => applyDateShortcut(shortcut.id)}
                    style={{ 
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.4rem',
                      border: '1px solid #e0e6ed',
                      borderRadius: '4px'
                    }}
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </FlexBox>
            </div>
            
            {/* ===== CHIPS DE FILTROS ACTIVOS ===== */}
            {getActiveFiltersChips().length > 0 && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem',
                backgroundColor: '#f0f4ff',
                borderRadius: '6px',
                border: '1px solid #d0e0ff'
              }}>
                <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', color: '#333', fontSize: '0.8rem' }}>
                  Filtros aplicados:
                </Label>
                <FlexBox style={{ gap: '0.25rem', flexWrap: 'wrap' }}>
                  {getActiveFiltersChips().map(chip => (
                    <Tag
                      key={chip.key}
                      design="Set2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeFilter(chip.filterKey, chip.value)}
                    >
                      {chip.label} ✕
                    </Tag>
                  ))}
                </FlexBox>
              </div>
            )}

          </FlexBox>
        </div>
        </Card>

        {/* COLUMNA DERECHA - PRODUCTOS ENCONTRADOS */}
        <Card style={{ 
          flex: '1',
          minWidth: '400px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>

          <div style={{ 
            padding: '0.5rem',
            flex: '1',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
          }}>
            {loading ? (
              <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                <BusyIndicator active size="Large" />
              </FlexBox>
            ) : (
              <>
                {/* Buscador de productos */}
                <FlexBox direction="Column" style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  border: '1px solid #e9ecef'
                }}>
                  <Label style={{ marginBottom: '0.35rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                    Buscar productos
                  </Label>
                  <Input
                    value={searchTerm}
                    onInput={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, SKU, marca o categoría..."
                    icon="search"
                    style={{ width: '100%' }}
                  />
                  {searchTerm && (
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginTop: '0.35rem' }}>
                      <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                        {getFilteredProducts().length} resultado{getFilteredProducts().length !== 1 ? 's' : ''}
                      </Text>
                      <Button 
                        design="Transparent"
                        icon="decline"
                        onClick={clearSearch}
                        style={{ color: '#666', padding: '0.25rem' }}
                      >
                        Limpiar
                      </Button>
                    </FlexBox>
                  )}
                </FlexBox>
                
                {/* ===== CONTROLES DE VISUALIZACIÓN Y ORDENAMIENTO ===== */}
                <FlexBox 
                  justifyContent="SpaceBetween" 
                  alignItems="Center"
                  style={{ 
                    padding: '0.4rem 0.6rem', 
                    backgroundColor: showOnlyAdded ? '#e8f5e9' : '#f8f9fa', 
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    border: showOnlyAdded ? '1px solid #4CAF50' : '1px solid #e9ecef',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Switch: Solo productos agregados */}
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Switch
                      checked={showOnlyAdded}
                      onChange={(e) => setShowOnlyAdded(e.target.checked)}
                      tooltip="Mostrar solo productos ya agregados"
                    />
                    <Text style={{ fontSize: '0.8rem', color: showOnlyAdded ? '#2e7d32' : '#666', fontWeight: '500' }}>
                      Solo agregados {showOnlyAdded && globalSelectedProducts.size > 0 && `(${getFilteredProducts().length})`}
                    </Text>
                  </FlexBox>
                  
                  {/* ComboBox: Ordenar por */}
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>
                      Ordenar:
                    </Label>
                    <ComboBox
                      value={SORT_OPTIONS.find(opt => opt.id === sortBy)?.label || 'Orden predeterminado'}
                      onChange={(e) => {
                        const selected = SORT_OPTIONS.find(opt => opt.label === e.target.value);
                        if (selected) setSortBy(selected.id);
                      }}
                      style={{ minWidth: '180px', maxWidth: '200px' }}
                    >
                      {SORT_OPTIONS.map(option => (
                        <ComboBoxItem key={option.id} text={option.label} />
                      ))}
                    </ComboBox>
                  </FlexBox>
                  
                  {/* Botón: Gestionar selección */}
                  {globalSelectedProducts.size > 0 && (
                    <Button
                      icon={isManagingSelection ? "accept" : "edit"}
                      design={isManagingSelection ? "Emphasized" : "Transparent"}
                      onClick={() => {
                        setIsManagingSelection(!isManagingSelection);
                        clearRemoveSelection();
                      }}
                      tooltip={isManagingSelection ? "Terminar gestión" : "Gestionar productos agregados"}
                      style={{ 
                        fontSize: '0.8rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: isManagingSelection ? '#f44336' : 'transparent',
                        color: isManagingSelection ? '#fff' : '#666'
                      }}
                    >
                      {isManagingSelection ? "Terminar" : "Gestionar"}
                    </Button>
                  )}
                </FlexBox>
                
                {/* ===== BARRA DE ACCIONES PARA ELIMINAR ===== */}
                {isManagingSelection && (productsToRemove.size > 0 || presentacionesToRemove.size > 0) && (
                  <FlexBox 
                    justifyContent="SpaceBetween"
                    alignItems="Center"
                    style={{ 
                      padding: '0.75rem 1rem',
                      backgroundColor: '#ffebee',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      border: '2px solid #f44336',
                      animation: 'slideDown 0.3s ease'
                    }}
                  >
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Icon name="delete" style={{ color: '#f44336', fontSize: '1.2rem' }} />
                      <Text style={{ fontWeight: '600', color: '#c62828', fontSize: '0.9rem' }}>
                        {presentacionesToRemove.size} presentación(es) seleccionada(s) para eliminar
                      </Text>
                    </FlexBox>
                    <FlexBox style={{ gap: '0.5rem' }}>
                      <Button 
                        icon="decline" 
                        design="Transparent"
                        onClick={clearRemoveSelection}
                        style={{ color: '#666' }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        icon="delete"
                        design="Negative"
                        onClick={removeSelectedProducts}
                      >
                        Eliminar seleccionados
                      </Button>
                    </FlexBox>
                  </FlexBox>
                )}

                {getFilteredProducts().length === 0 ? (
                  /* ===== ESTADO VACÍO ELEGANTE ===== */
                  <FlexBox 
                    direction="Column" 
                    justifyContent="Center" 
                    alignItems="Center"
                    style={{ 
                      padding: '3rem 2rem',
                      textAlign: 'center'
                    }}
                  >
                    <Icon 
                      name="search" 
                      style={{ 
                        fontSize: '4rem', 
                        color: '#ccc',
                        marginBottom: '1rem'
                      }} 
                    />
                    <Title level="H5" style={{ marginBottom: '0.5rem', color: '#666' }}>
                      No se encontraron productos
                    </Title>
                    <Text style={{ color: '#888', marginBottom: '1.5rem', maxWidth: '400px' }}>
                      {showOnlyAdded 
                        ? 'No hay productos agregados aún. Desactiva el filtro "Solo agregados" para ver todos los productos disponibles.' 
                        : getActiveFiltersCount() === 0 
                          ? 'Aplica filtros en el panel izquierdo para ver productos específicos' 
                          : 'Prueba con otros filtros o limpia la búsqueda para ver más resultados'
                      }
                    </Text>
                    <FlexBox style={{ gap: '0.5rem' }}>
                      {showOnlyAdded && (
                        <Button 
                          design="Emphasized"
                          icon="hide"
                          onClick={() => setShowOnlyAdded(false)}
                        >
                          Ver todos los productos
                        </Button>
                      )}
                      {searchTerm && (
                        <Button 
                          design="Emphasized"
                          icon="search"
                          onClick={clearSearch}
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                      {getActiveFiltersCount() > 0 && !showOnlyAdded && (
                        <Button 
                          design="Transparent"
                          icon="filter"
                          onClick={clearAllFilters}
                        >
                          Limpiar todos los filtros
                        </Button>
                      )}
                    </FlexBox>
                  </FlexBox>
                ) : (
                  <>
                    {/* Controles de selección */}
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ 
                      padding: '0.5rem 0.6rem', 
                      backgroundColor: isManagingSelection ? '#ffebee' : '#f8f9fa', 
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      border: isManagingSelection ? '1px solid #f44336' : '1px solid #e9ecef',
                    }}>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem'}}>
                        <CheckBox 
                          checked={
                            isManagingSelection
                              ? getFilteredProducts().filter(p => globalSelectedProducts.has(p.SKUID) && !lockedProducts.has(p.SKUID)).length > 0 &&
                                getFilteredProducts().filter(p => globalSelectedProducts.has(p.SKUID) && !lockedProducts.has(p.SKUID)).every(p => productsToRemove.has(p.SKUID))
                              : getFilteredProducts().length > 0 &&
                                getFilteredProducts().every(p => 
                                  selectedProducts.has(p.SKUID) || 
                                  globalSelectedProducts.has(p.SKUID) ||
                                  lockedProducts.has(p.SKUID)
                                )
                          }
                          indeterminate={
                            isManagingSelection
                              ? productsToRemove.size > 0 &&
                                !getFilteredProducts().filter(p => globalSelectedProducts.has(p.SKUID) && !lockedProducts.has(p.SKUID)).every(p => productsToRemove.has(p.SKUID))
                              : getFilteredProducts().some(p => selectedProducts.has(p.SKUID)) &&
                                !getFilteredProducts().every(p => 
                                  selectedProducts.has(p.SKUID) || 
                                  globalSelectedProducts.has(p.SKUID) ||
                                  lockedProducts.has(p.SKUID)
                                )
                          }
                          onChange={(e) => isManagingSelection 
                            ? (e.target.checked ? selectAllToRemove() : clearRemoveSelection())
                            : (e.target.checked ? selectAllProducts() : deselectAllProducts())
                          }
                          text={isManagingSelection 
                            ? (() => {
                                // Contar presentaciones elegibles para eliminar
                                let totalPresentaciones = 0;
                                getFilteredProducts().forEach(p => {
                                  if (globalSelectedProducts.has(p.SKUID) && !lockedProducts.has(p.SKUID)) {
                                    const presentaciones = productPresentaciones[p.SKUID] || [];
                                    totalPresentaciones += presentaciones.filter(pres => 
                                      globalSelectedPresentaciones.has(pres.IdPresentaOK) && 
                                      !lockedPresentaciones.has(pres.IdPresentaOK)
                                    ).length;
                                  }
                                });
                                return `Seleccionar para eliminar (${totalPresentaciones})`;
                              })()
                            : (() => {
                                // Contar presentaciones totales filtrables
                                let totalPresentaciones = 0;
                                getFilteredProducts().forEach(p => {
                                  const presentaciones = productPresentaciones[p.SKUID] || [];
                                  totalPresentaciones += presentaciones.filter(pres => pres.ACTIVED).length;
                                });
                                return `Seleccionar todos (${totalPresentaciones})`;
                              })()
                          }
                          style={{ fontSize: '0.8rem', color: isManagingSelection ? '#c62828' : 'inherit' }}
                        />
                      </FlexBox>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem'}}>
                        <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                          {selectedPresentaciones.size} seleccionada(s)
                        </Text>
                        {selectedProducts.size > 0 && (
                          <>
                            <Button 
                              design="Transparent"
                              icon="reset"
                              onClick={deselectAllProducts}
                              style={{ color: '#666', padding: '0.25rem 0.5rem' }}
                            >
                              Limpiar
                            </Button>
                            <Button 
                              design="Emphasized"
                              icon="add"
                              onClick={addToGlobalSelection}
                              disabled={selectedPresentaciones.size === 0 || priceError}
                              style={{ padding: '0.25rem 0.75rem' }}
                            >
                              Agregar
                            </Button>
                          </>
                        )}
                      </FlexBox>
                    </FlexBox>

                <FlexBox direction="Column" style={{ 
                  gap: '0.5rem',
                }}>
                  {getPaginatedProducts().map(producto => {
                    const isInGlobal = globalSelectedProducts.has(producto.SKUID);
                    const isLocked = lockedProducts.has(producto.SKUID);
                    const isSelected = selectedProducts.has(producto.SKUID);
                    const isMarkedForRemoval = productsToRemove.has(producto.SKUID);
                    const isDisabled = isManagingSelection ? isLocked : (isLocked || isInGlobal);
                    
                    return (
                  <div key={producto.SKUID}>
                    <Card 
                      style={{ 
                        padding: '0.75rem',
                        border: isMarkedForRemoval ? '2px solid #f44336' : isSelected ? '2px solid #4CAF50' : isInGlobal ? '2px solid #2196F3' : isLocked ? '2px solid #9e9e9e' : '1px solid #e8ecef',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        background: isMarkedForRemoval ? '#ffebee' : isSelected ? '#f0f9f1' : isInGlobal ? '#e3f2fd' : isLocked ? '#f5f5f5' : '#ffffff',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        opacity: isDisabled ? 0.75 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'default'
                      }}
                    >
                      <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                        <FlexBox alignItems="Center" style={{ gap: '0.75rem', flex: 1 }}>
                          <CheckBox 
                            checked={isManagingSelection ? isMarkedForRemoval : (isSelected || isInGlobal || isLocked)}
                            disabled={isDisabled}
                            onChange={() => {
                              if (isManagingSelection && isInGlobal && !isLocked) {
                                toggleProductToRemove(producto.SKUID);
                              } else if (!isManagingSelection && !isDisabled) {
                                toggleProductSelection(producto.SKUID);
                              }
                            }}
                            tooltip={
                              isManagingSelection 
                                ? (isLocked ? "Este producto está bloqueado" : "Seleccionar para eliminar")
                                : (isDisabled ? "Este producto ya está agregado y no se puede quitar" : isSelected ? "Click para deseleccionar" : "Click para seleccionar")
                            }
                          />
                          <FlexBox direction="Column" style={{ flex: 1, minWidth: 0 }}>
                            <FlexBox alignItems="Center" style={{ gap: '0.5rem', marginBottom: '0.15rem' }}>
                              <Title level="H6" style={{ 
                                margin: 0, 
                                fontSize: '0.95rem', 
                                fontWeight: '600',
                                color: '#2c3e50',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}>
                                {highlightMatch(producto.PRODUCTNAME || `Producto ${producto.SKUID}` || 'Producto sin nombre', searchTerm)}
                              </Title>
                              {(isInGlobal || isLocked) && (
                                <ObjectStatus state="Information" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                  Ya agregado
                                </ObjectStatus>
                              )}
                          </FlexBox>
                          <Text style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.15rem' }}>
                            SKU: {highlightMatch(producto.SKUID, searchTerm)} • Marca: {highlightMatch(producto.MARCA || 'Sin marca', searchTerm)}
                          </Text>
                          {producto.CATEGORIAS && producto.CATEGORIAS.length > 0 && (
                            <Text style={{ fontSize: '0.75rem', color: '#888' }}>
                              {producto.CATEGORIAS.slice(0, 2).join(', ')}
                            </Text>
                          )}
                        </FlexBox>
                        <FlexBox direction="Column" alignItems="End" style={{ gap: '0.15rem', marginLeft: '0.5rem' }}>
                          <Text style={{ fontSize: '0.7rem', color: '#666' }}>
                            {new Date(producto.REGDATE).toLocaleDateString()}
                          </Text>
                        </FlexBox>
                        <Button 
                          icon={expandedProducts.has(producto.SKUID) ? "navigation-up-arrow" : "navigation-down-arrow"}
                          design="Transparent"
                          onClick={() => toggleProductExpansion(producto.SKUID)}
                          style={{ marginLeft: '0.5rem' }}
                          tooltip={expandedProducts.has(producto.SKUID) ? "Ocultar presentaciones" : "Ver presentaciones"}
                        />
                        </FlexBox>
                      </FlexBox>
                    </Card>

                    {/* Sección de Presentaciones Expandible */}
                    {expandedProducts.has(producto.SKUID) && (
                      <div style={{ 
                        marginLeft: '2rem', 
                        marginTop: '0.5rem',
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e0e6ed'
                      }}>
                        {(!productPresentaciones[producto.SKUID] || productPresentaciones[producto.SKUID].length === 0) ? (
                          <MessageStrip type="Information">
                            No hay presentaciones disponibles
                          </MessageStrip>
                        ) : (
                              <FlexBox direction="Column" style={{ gap: '0.35rem' }}>
                                {productPresentaciones[producto.SKUID]
                                  .filter(p => p.ACTIVED || lockedPresentaciones.has(p.IdPresentaOK) || globalSelectedPresentaciones.has(p.IdPresentaOK))
                                  .map(presentacion => {
                                    const isLocked = lockedPresentaciones.has(presentacion.IdPresentaOK);
                                    const isInGlobal = globalSelectedPresentaciones.has(presentacion.IdPresentaOK);
                                    const isSelectedTemp = selectedPresentaciones.has(presentacion.IdPresentaOK);
                                    const isMarkedForRemoval = presentacionesToRemove.has(presentacion.IdPresentaOK);
                                    const isDisabled = isManagingSelection ? isLocked : (isLocked || isInGlobal);
                                    
                                    return (
                                      <div key={presentacion.IdPresentaOK} style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: isMarkedForRemoval ? '#ffebee' : isLocked ? '#f5f5f5' : isInGlobal ? '#e3f2fd' : isSelectedTemp ? '#e8f5e9' : '#ffffff',
                                        border: isMarkedForRemoval ? '2px solid #f44336' : isLocked ? '2px solid #9e9e9e' : isInGlobal ? '2px solid #2196F3' : isSelectedTemp ? '2px solid #4CAF50' : '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        opacity: isDisabled ? 0.75 : 1,
                                        cursor: isDisabled ? 'not-allowed' : 'default'
                                      }}>
                                        <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                          <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: 1 }}>
                                            <CheckBox 
                                              checked={isManagingSelection ? isMarkedForRemoval : (isLocked || isInGlobal || isSelectedTemp)}
                                              disabled={isDisabled}
                                              onChange={() => {
                                                if (isManagingSelection && isInGlobal && !isLocked) {
                                                  togglePresentacionToRemove(presentacion.IdPresentaOK, producto.SKUID);
                                                } else if (!isManagingSelection && !isDisabled) {
                                                  togglePresentacionSelection(presentacion.IdPresentaOK, producto.SKUID);
                                                }
                                              }}
                                              tooltip={
                                                isManagingSelection
                                                  ? (isLocked ? "Esta presentación está bloqueada" : "Seleccionar para eliminar")
                                                  : (isDisabled ? "Esta presentación ya está agregada y no se puede quitar" : isSelectedTemp ? "Click para deseleccionar" : "Click para seleccionar")
                                              }
                                            />
                                            <FlexBox direction="Column" style={{ flex: 1 }}>
                                              <FlexBox alignItems="Center" style={{ gap: '0.3rem' }}>
                                                <Text style={{ fontWeight: '600', fontSize: '0.875rem', color: isDisabled ? '#757575' : '#2c3e50' }}>
                                                  {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                                </Text>
                                                {isLocked && (
                                                  <ObjectStatus state="Warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                                    En promoción
                                                  </ObjectStatus>
                                                )}
                                                {isInGlobal && !isLocked && (
                                                  <ObjectStatus state="Information" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                                    Agregado
                                                  </ObjectStatus>
                                                )}
                                              </FlexBox>
                                              {presentacion.Descripcion && (
                                                <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                                                  {presentacion.Descripcion}
                                                </Text>
                                              )}
                                            </FlexBox>
                                          </FlexBox>
                                          <FlexBox direction="Column" alignItems="End" style={{ gap: '0.25rem' }}>
                                            {(() => {
                                              const precio = getPrecioPresentacion(presentacion.IdPresentaOK);
                                              return precio ? (
                                                <ObjectStatus state="Success" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                                                  ${precio?.toLocaleString()}
                                                </ObjectStatus>
                                              ) : (
                                                <ObjectStatus state="Warning" style={{ fontSize: '0.75rem' }}>
                                                  Sin precio
                                                </ObjectStatus>
                                              );
                                            })()}
                                            {presentacion.CostoIni && (
                                              <Text style={{ fontSize: '0.7rem', color: '#888', textDecoration: 'line-through' }}>
                                                Costo: ${presentacion.CostoIni?.toLocaleString()}
                                              </Text>
                                            )}
                                          </FlexBox>
                                        </FlexBox>
                                      </div>
                                    );
                                  })}
                              </FlexBox>
                            )}
                      </div>
                    )}
                  </div>
                    );
                  })}
                </FlexBox>
                
                {/* ===== CONTROLES DE PAGINACIÓN ===== */}
                {getPaginationInfo().totalPages > 1 && (
                  <FlexBox 
                    justifyContent="SpaceBetween" 
                    alignItems="Center"
                    style={{ 
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <Button
                      icon="navigation-left-arrow"
                      design="Transparent"
                      disabled={!getPaginationInfo().hasPrev}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Anterior
                    </Button>
                    
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        Mostrando {getPaginationInfo().startItem}–{getPaginationInfo().endItem} de {getPaginationInfo().total} productos
                      </Text>
                      <Text style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                        • Página {currentPage} de {getPaginationInfo().totalPages}
                      </Text>
                    </FlexBox>
                    
                    <Button
                      icon="navigation-right-arrow"
                      iconEnd
                      design="Transparent"
                      disabled={!getPaginationInfo().hasNext}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Siguiente
                    </Button>
                  </FlexBox>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </Card>

      </FlexBox>

      {/* Diálogo personalizado */}
      <CustomDialog
        open={dialogState.open}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmDesign={dialogState.confirmDesign}
      />
    </div>
  );
};

export default AdvancedFilters;