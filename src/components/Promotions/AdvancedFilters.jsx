import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Select,
  Option,
  Input,
  DatePicker,
  CheckBox,
  Button,
  Text,
  Title,
  MessageStrip,
  MultiComboBox,
  ComboBoxItem,
  ObjectStatus,
  BusyIndicator,
  Dialog,
  Bar,
  Icon,
  Avatar,
  TextArea,
  RadioButton
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import promoService from '../../api/promoService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';

// DATOS ESTÁTICOS/MOCK PARA FILTROS
const AdvancedFilters = ({ 
  onFiltersChange, 
  initialFilters = {}, 
  preselectedProducts = new Set(), 
  lockedProducts = new Set(),
  preselectedPresentaciones = [] // Array de presentaciones pre-seleccionadas
}) => {
  const { dialogState, showAlert, showSuccess, showError, closeDialog } = useDialog();
  const [filters, setFilters] = useState({
    categorias: [],
    marcas: [],
    temporada: '',
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
  const [error, setError] = useState('');

  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [temporadaActiva, setTemporadaActiva] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(preselectedProducts); // Inicializar con preseleccionados
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  
  // Estados para presentaciones
  const [expandedProducts, setExpandedProducts] = useState(new Set()); // Productos con presentaciones expandidas
  const [productPresentaciones, setProductPresentaciones] = useState({}); // { SKUID: [presentaciones] }
  const [loadingPresentaciones, setLoadingPresentaciones] = useState({}); // { SKUID: boolean }
  const [selectedPresentaciones, setSelectedPresentaciones] = useState(new Set()); // IDs de presentaciones seleccionadas
  const [presentacionesPrecios, setPresentacionesPrecios] = useState({}); // { IdPresentaOK: [precios] }
  const [lockedPresentaciones, setLockedPresentaciones] = useState(new Set()); // IDs de presentaciones bloqueadas (ya en la promoción)

  // Estados para creación de promociones
  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipoDescuento: 'PORCENTAJE',
    descuentoPorcentaje: 10,
    descuentoMonto: 0,
    permiteAcumulacion: false,
    limiteUsos: null
  });

  // TEMPORADAS ESTÁTICAS (basadas en fechas)
  const TEMPORADAS = [
    { 
      id: 'HALLOWEEN_2025', 
      name: 'Halloween 2025', 
      fechaInicio: '2025-10-25', 
      fechaFin: '2025-11-02',
      categoriasSugeridas: ['DECORATIONS', 'TOYS'],
      activa: true,
      icono: 'calendar'
    },
    { 
      id: 'BLACK_FRIDAY_2025', 
      name: 'Black Friday 2025', 
      fechaInicio: '2025-11-29', 
      fechaFin: '2025-12-02',
      categoriasSugeridas: ['ELECTRONICS', 'CLOTHING'],
      activa: false,
      icono: 'product'
    },
    { 
      id: 'NAVIDAD_2025', 
      name: 'Navidad 2025', 
      fechaInicio: '2025-12-01', 
      fechaFin: '2025-12-31',
      categoriasSugeridas: ['TOYS', 'HOME'],
      activa: false,
      icono: 'calendar'
    },
    { 
      id: 'SAN_VALENTIN_2026', 
      name: 'San Valentín 2026', 
      fechaInicio: '2026-02-10', 
      fechaFin: '2026-02-16',
      categoriasSugeridas: ['CLOTHING', 'JEWELRY'],
      activa: false,
      icono: '💖'
    }
  ];

  // RANGOS DE PRECIOS ESTÁTICOS
  const RANGOS_PRECIOS = [
    { id: 'BAJO', name: 'Bajo ($0 - $500)', min: 0, max: 500 },
    { id: 'MEDIO', name: 'Medio ($500 - $2,000)', min: 500, max: 2000 },
    { id: 'ALTO', name: 'Alto ($2,000 - $10,000)', min: 2000, max: 10000 },
    { id: 'PREMIUM', name: 'Premium ($10,000+)', min: 10000, max: null }
  ];

  //  CARGAR DATOS REALES AL MONTAR COMPONENTE
  useEffect(() => {
    loadData();
  }, []);

  // Actualizar productos seleccionados cuando cambien los preseleccionados
  useEffect(() => {
    if (preselectedProducts && preselectedProducts.size > 0) {
      setSelectedProducts(new Set(preselectedProducts));
    }
  }, [preselectedProducts]);

  // Cargar y seleccionar presentaciones pre-seleccionadas
  useEffect(() => {
    const loadPreselectedPresentaciones = async () => {
      if (!preselectedPresentaciones || preselectedPresentaciones.length === 0) {
        setLockedPresentaciones(new Set());
        return;
      }
      
      console.log('🔄 Cargando presentaciones pre-seleccionadas:', preselectedPresentaciones);
      
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
        
        console.log('✅ Presentaciones cargadas:', {
          productos: skuidsUnicos.size,
          presentacionesBloqueadas: idsPresent.size,
          presentacionesTotales: todasLasPresentaciones.length
        });
        
      } catch (error) {
        console.error('❌ Error cargando presentaciones pre-seleccionadas:', error);
      }
    };

    loadPreselectedPresentaciones();
  }, [preselectedPresentaciones]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar productos y categorías en paralelo
      const [productosResponse, categoriasResponse] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);

      // Extraer productos - Estructura específica de tu API
      let productosData = [];
      
      // Estructura específica: response.data[0].dataRes
      if (productosResponse?.data?.[0]?.dataRes) {
        productosData = productosResponse.data[0].dataRes;
      }
      // Estructura opción 1: response.value[0].data[0].dataRes
      else if (productosResponse?.value?.[0]?.data?.[0]?.dataRes) {
        productosData = productosResponse.value[0].data[0].dataRes;
      }
      // Estructura opción 2: response.data (directo)
      else if (Array.isArray(productosResponse?.data)) {
        productosData = productosResponse.data;
      }
      // Estructura opción 3: response (directo)
      else if (Array.isArray(productosResponse)) {
        productosData = productosResponse;
      }
      // Estructura opción 4: response.dataRes (directo)
      else if (Array.isArray(productosResponse?.dataRes)) {
        productosData = productosResponse.dataRes;
      }

      // Extraer categorías - Estructura específica de tu API
      let categoriasData = [];
      
      // Estructura específica: response.data[0].dataRes
      if (categoriasResponse?.data?.[0]?.dataRes) {
        categoriasData = categoriasResponse.data[0].dataRes;
      }
      // Estructura opción 1: response.value[0].data[0].dataRes
      else if (categoriasResponse?.value?.[0]?.data?.[0]?.dataRes) {
        categoriasData = categoriasResponse.value[0].data[0].dataRes;
      }
      // Estructura opción 2: response.data (directo)
      else if (Array.isArray(categoriasResponse?.data)) {
        categoriasData = categoriasResponse.data;
      }
      // Estructura opción 3: response (directo)
      else if (Array.isArray(categoriasResponse)) {
        categoriasData = categoriasResponse;
      }
      // Estructura opción 4: response.dataRes (directo)
      else if (Array.isArray(categoriasResponse?.dataRes)) {
        categoriasData = categoriasResponse.dataRes;
      }

      console.log('Productos finales:', productosData.length, productosData.slice(0, 2));
      console.log('Categorías finales:', categoriasData.length, categoriasData.slice(0, 2));

      setProductos(productosData);
      
      // Filtrar solo categorías activas
      const categoriasActivas = categoriasData.filter(cat => 
        cat.ACTIVED === true && cat.DELETED === false
      );
      setCategorias(categoriasActivas);

      // Extraer marcas únicas de los productos
      const marcasUnicas = [...new Set(
        productosData
          .filter(p => p.MARCA && p.MARCA.trim() !== '')
          .map(p => p.MARCA.trim())
      )];
      
      const marcasConConteo = marcasUnicas.map(marca => ({ 
        id: marca.toUpperCase().replace(/\s+/g, '_'), 
        name: marca,
        productos: productosData.filter(p => p.MARCA === marca).length
      }));

      setProductos(productosData);
      setCategorias(categoriasData);
      setMarcas(marcasConConteo);

      // Log de resumen una sola vez
      console.log(`✅ Datos cargados: ${productosData.length} productos, ${categoriasData.length} categorías, ${marcasConConteo.length} marcas`);

    } catch (err) {
      console.error('Error cargando datos:', err);
      console.error('Stack trace:', err.stack);
      setError('Error al cargar datos de productos y categorías: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Detectar temporada activa al cargar
  useEffect(() => {
    const hoy = new Date();
    
    // Buscar temporada activa (estamos dentro del rango)
    let temporadaActivaEncontrada = TEMPORADAS.find(temp => {
      const inicio = new Date(temp.fechaInicio);
      const fin = new Date(temp.fechaFin);
      return hoy >= inicio && hoy <= fin;
    });
    
    // Si no hay temporada activa, buscar la próxima más cercana (dentro de 30 días)
    if (!temporadaActivaEncontrada) {
      const proximasTemporadas = TEMPORADAS
        .filter(temp => {
          const inicio = new Date(temp.fechaInicio);
          const diffTime = inicio - hoy;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 30; // Próximas 30 días
        })
        .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
      
      if (proximasTemporadas.length > 0) {
        temporadaActivaEncontrada = {
          ...proximasTemporadas[0],
          esProxima: true,
          diasRestantes: Math.ceil((new Date(proximasTemporadas[0].fechaInicio) - hoy) / (1000 * 60 * 60 * 24))
        };
      }
    }
    
    if (temporadaActivaEncontrada) {
      setTemporadaActiva(temporadaActivaEncontrada);
      // Solo auto-seleccionar si es temporada activa (no próxima)
      if (!temporadaActivaEncontrada.esProxima) {
        handleFilterChange('temporada', temporadaActivaEncontrada.id);
      }
    }
  }, []);

  // Notificar cambios de filtros al componente padre
  useEffect(() => {
    if (onFiltersChange) {
      const filteredProducts = getFilteredProducts();
      onFiltersChange({
        ...filters,
        _filteredProducts: filteredProducts
      });
    }
  }, [filters, productos]);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
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
      temporada: '',
      precioMin: '',
      precioMax: '',
      fechaIngresoDesde: '',
      fechaIngresoHasta: '',
    });
    setSearchTerm(''); // Limpiar también la búsqueda
    setSelectedProducts(new Set()); // Limpiar productos seleccionados
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categorias.length > 0) count++;
    if (filters.marcas.length > 0) count++;
    if (filters.temporada) count++;
    if (filters.precioMin || filters.precioMax) count++;
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) count++;
    if (searchTerm) count++; // Incluir búsqueda como filtro activo
    return count;
  };

  // CALCULAR PRODUCTOS FILTRADOS CON DATOS REALES
  const getEstimatedProductCount = () => {
    if (productos.length === 0) return 0;
    
    let filteredProducts = productos.filter(producto => {
      // Solo productos activos
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // Filtro por marca
      if (filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA)) return false;
      }
      
      // Filtro por categoría (si tienes categorías en tus productos)
      if (filters.categorias.length > 0) {
        // Nota: Tus productos tienen CATEGORIAS como array vacío
        // Puedes adaptarlo según tu estructura
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          const hasCategory = producto.CATEGORIAS.some(cat => filters.categorias.includes(cat));
          if (!hasCategory) return false;
        }
      }
      
      // Filtro por productos nuevos (últimos 30 días)
      
      return true;
    });
    
    return filteredProducts.length;
  };

  // OBTENER PRODUCTOS FILTRADOS COMPLETOS (con todos los filtros aplicados)
  const getFilteredProducts = () => {
    if (productos.length === 0) return [];
    
    return productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // Filtro de búsqueda por texto
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
  };

  // MANEJAR CREACIÓN DE PROMOCIÓN
  const handleCreatePromotion = async () => {
    // Obtener lista de presentaciones seleccionadas
    const selectedPresentacionesList = [];
    
    Object.entries(productPresentaciones).forEach(([skuid, presentaciones]) => {
      presentaciones.forEach(presentacion => {
        if (selectedPresentaciones.has(presentacion.IdPresentaOK)) {
          const producto = productos.find(p => p.SKUID === skuid);
          selectedPresentacionesList.push({
            ...presentacion,
            producto: producto
          });
        }
      });
    });
    
    if (selectedPresentacionesList.length === 0) {
      await showAlert('Por favor selecciona al menos una presentación para crear la promoción.', 'Selección requerida');
      return;
    }
    
    // Generar título automático
    const autoTitle = generatePromotionTitle(selectedPresentacionesList);
    
    // Configurar fechas por defecto
    const today = new Date();
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    setPromoFormData({
      titulo: autoTitle,
      descripcion: `Promoción aplicable a ${selectedPresentacionesList.length} presentación(es) seleccionada(s)`,
      fechaInicio: today.toISOString().split('T')[0],
      fechaFin: oneMonthLater.toISOString().split('T')[0],
      tipoDescuento: 'PORCENTAJE',
      descuentoPorcentaje: 10,
      descuentoMonto: 0,
      permiteAcumulacion: false,
      limiteUsos: null
    });
    
    setShowCreatePromoModal(true);
  };

  // MANEJAR ENVÍO DEL FORMULARIO DE PROMOCIÓN
  const handleSubmitPromotion = async () => {
    try {
      setCreatingPromo(true);
      
      // Obtener lista de presentaciones seleccionadas
      const selectedPresentacionesList = [];
      
      Object.entries(productPresentaciones).forEach(([skuid, presentaciones]) => {
        presentaciones.forEach(presentacion => {
          if (selectedPresentaciones.has(presentacion.IdPresentaOK)) {
            const producto = productos.find(p => p.SKUID === skuid);
            selectedPresentacionesList.push({
              ...presentacion,
              producto: producto
            });
          }
        });
      });
      
      // Validaciones básicas
      if (!promoFormData.titulo.trim()) {
        await showAlert('El título es obligatorio', 'Campo requerido');
        return;
      }
      
      if (!promoFormData.fechaInicio || !promoFormData.fechaFin) {
        await showAlert('Las fechas de inicio y fin son obligatorias', 'Campos requeridos');
        return;
      }
      
      if (new Date(promoFormData.fechaFin) <= new Date(promoFormData.fechaInicio)) {
        await showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'Fechas inválidas');
        return;
      }
      
      if (promoFormData.tipoDescuento === 'PORCENTAJE' && (promoFormData.descuentoPorcentaje <= 0 || promoFormData.descuentoPorcentaje > 100)) {
        await showAlert('El porcentaje de descuento debe estar entre 1 y 100', 'Descuento inválido');
        return;
      }
      
      if (promoFormData.tipoDescuento === 'MONTO_FIJO' && promoFormData.descuentoMonto <= 0) {
        await showAlert('El monto de descuento debe ser mayor a 0', 'Monto inválido');
        return;
      }
      
      // Crear promoción con presentaciones
      const result = await promoService.createPromotionWithProducts(
        promoFormData,
        selectedPresentacionesList,
        filters
        // LoggedUser se maneja automáticamente por el interceptor de axios
      );
      
      console.log('Promoción creada exitosamente:', result);
      
      // Mostrar mensaje de éxito
      await showSuccess(`Promoción "${promoFormData.titulo}" creada exitosamente con ${selectedPresentacionesList.length} presentación(es)!`, 'Éxito');
      
      // Limpiar formulario y cerrar modal
      setShowCreatePromoModal(false);
      setSelectedProducts(new Set());
      setSelectedPresentaciones(new Set());
      
      // Notificar al componente padre si hay callback
      if (onFiltersChange) {
        onFiltersChange({ 
          ...filters, 
          message: `Promoción creada: ${promoFormData.titulo}` 
        });
      }
      
    } catch (error) {
      console.error('Error al crear promoción:', error);
      await showError('Error al crear la promoción: ' + (error.message || 'Error desconocido'), 'Error');
    } finally {
      setCreatingPromo(false);
    }
  };

  // GENERAR TÍTULO AUTOMÁTICO PARA LA PROMOCIÓN
  const generatePromotionTitle = (selectedPresentacionesList = []) => {
    const parts = [];
    
    if (temporadaActiva) {
      parts.push(temporadaActiva.name);
    }
    
    if (filters.marcas.length === 1) {
      parts.push(filters.marcas[0]);
    } else if (filters.marcas.length > 1) {
      parts.push(`${filters.marcas.length} marcas`);
    }
    
    if (filters.categorias.length === 1) {
      const categoria = categorias.find(c => c.CATID === filters.categorias[0]);
      if (categoria) parts.push(categoria.Nombre);
    } else if (filters.categorias.length > 1) {
      parts.push(`${filters.categorias.length} categorías`);
    }
    
    // Si hay presentaciones específicas seleccionadas
    if (selectedPresentacionesList.length === 1) {
      const presentacion = selectedPresentacionesList[0];
      parts.push(presentacion.NOMBREPRESENTACION || presentacion.producto?.PRODUCTNAME || 'Presentación');
    } else if (selectedPresentacionesList.length > 1) {
      // Contar productos únicos
      const productosUnicos = new Set(selectedPresentacionesList.map(p => p.producto?.SKUID).filter(Boolean));
      parts.push(`${selectedPresentacionesList.length} presentaciones de ${productosUnicos.size} producto(s)`);
    }
    
    if (parts.length === 0) {
      parts.push('Nueva Promoción');
    }
    
    return parts.join(' - ');
  };

  // CONFIRMAR CREACIÓN DE PROMOCIÓN (función legacy para compatibilidad)
  const handleConfirmPromotion = async () => {
    // Aquí integrarías con tu sistema de creación de promociones
    const promotionData = {
      title: generatePromotionTitle(),
      products: filteredProducts.map(p => ({
        SKUID: p.SKUID,
        PRODUCTNAME: p.PRODUCTNAME,
        MARCA: p.MARCA,
        PRECIO: p.PRECIO
      })),
      filters: filters,
      temporada: temporadaActiva,
      createdAt: new Date().toISOString()
    };
    
    console.log('Datos de la nueva promoción:', promotionData);
    
    // Notificar al componente padre que se ha creado una promoción
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        _promotionCreated: promotionData
      });
    }
    
    setShowPreviewModal(false);
    
    // Aquí podrías mostrar un mensaje de éxito o redirigir
    await showSuccess(`Promoción creada con ${filteredProducts.length} productos!`, 'Éxito');
  };

  // FUNCIONES DE SELECCIÓN DE PRODUCTOS
  const toggleProductSelection = async (productId) => {
    // No permitir deseleccionar productos bloqueados
    if (lockedProducts.has(productId)) {
      return;
    }
    
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      const isSelecting = !newSelection.has(productId);
      
      if (isSelecting) {
        newSelection.add(productId);
        // Cargar y seleccionar todas las presentaciones
        loadAndSelectPresentaciones(productId);
      } else {
        newSelection.delete(productId);
        // Deseleccionar todas las presentaciones del producto
        deselectAllPresentacionesForProduct(productId);
      }
      
      return newSelection;
    });
  };

  // Función auxiliar para cargar y seleccionar presentaciones automáticamente
  const loadAndSelectPresentaciones = async (skuid) => {
    // Si no están cargadas, cargarlas primero
    if (!productPresentaciones[skuid]) {
      setLoadingPresentaciones(prev => ({ ...prev, [skuid]: true }));
      
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
            if (presentacionesMap.has(p.IdPresentaOK)) {
              const existing = presentacionesMap.get(p.IdPresentaOK);
              presentacionesMap.set(p.IdPresentaOK, {
                ...p,
                ...existing,
              });
            } else {
              presentacionesMap.set(p.IdPresentaOK, p);
            }
          });
        }
        
        const presentacionesCombinadas = Array.from(presentacionesMap.values());
        
        // Actualizar el estado de presentaciones
        setProductPresentaciones(prev => ({
          ...prev,
          [skuid]: presentacionesCombinadas
        }));
        
        // Seleccionar automáticamente todas las presentaciones activas
        const activePresentaciones = presentacionesCombinadas.filter(p => p.ACTIVED);
        setSelectedPresentaciones(prev => {
          const newSelection = new Set(prev);
          activePresentaciones.forEach(p => newSelection.add(p.IdPresentaOK));
          return newSelection;
        });
        
        // Cargar precios para cada presentación en segundo plano (no bloqueante)
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
          
          Promise.all(preciosPromises).then(preciosResults => {
            setPresentacionesPrecios(prev => {
              const newPrecios = { ...prev };
              preciosResults.forEach(({ idPresentaOK, precios }) => {
                newPrecios[idPresentaOK] = precios;
              });
              return newPrecios;
            });
          });
        }
      } catch (error) {
        console.error(`Error loading presentaciones for ${skuid}:`, error);
        setProductPresentaciones(prev => ({
          ...prev,
          [skuid]: []
        }));
      } finally {
        setLoadingPresentaciones(prev => ({ ...prev, [skuid]: false }));
      }
    } else {
      // Si ya están cargadas, solo seleccionar las activas
      const presentaciones = productPresentaciones[skuid] || [];
      const activePresentaciones = presentaciones.filter(p => p.ACTIVED);
      
      setSelectedPresentaciones(prev => {
        const newSelection = new Set(prev);
        activePresentaciones.forEach(p => newSelection.add(p.IdPresentaOK));
        return newSelection;
      });
    }
  };

  const selectAllProducts = async () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    setSelectedProducts(new Set(allProductIds));
    
    // Cargar y seleccionar todas las presentaciones de todos los productos
    for (const skuid of allProductIds) {
      await loadAndSelectPresentaciones(skuid);
    }
  };

  const deselectAllProducts = () => {
    // Mantener los productos bloqueados incluso al limpiar
    setSelectedProducts(new Set(lockedProducts));
    
    // Limpiar todas las presentaciones seleccionadas
    setSelectedPresentaciones(new Set());
  };

  const getSelectedProductsCount = () => selectedProducts.size;

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
    setLoadingPresentaciones(prev => ({ ...prev, [skuid]: true }));
    
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
    } catch (error) {
      console.error(`Error loading presentaciones for ${skuid}:`, error);
      setProductPresentaciones(prev => ({
        ...prev,
        [skuid]: []
      }));
    } finally {
      setLoadingPresentaciones(prev => ({ ...prev, [skuid]: false }));
    }
  };

  const togglePresentacionSelection = (presentacionId, skuid) => {
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

  const selectAllPresentacionesForProduct = (skuid) => {
    const presentaciones = productPresentaciones[skuid] || [];
    const activePresentaciones = presentaciones.filter(p => p.ACTIVED);
    
    setSelectedPresentaciones(prev => {
      const newSelection = new Set(prev);
      activePresentaciones.forEach(p => newSelection.add(p.IdPresentaOK));
      return newSelection;
    });
  };

  const deselectAllPresentacionesForProduct = (skuid) => {
    const presentaciones = productPresentaciones[skuid] || [];
    
    setSelectedPresentaciones(prev => {
      const newSelection = new Set(prev);
      presentaciones.forEach(p => newSelection.delete(p.IdPresentaOK));
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

  // Notificar al padre cuando cambien las presentaciones seleccionadas
  useEffect(() => {
    if (onFiltersChange && typeof onFiltersChange === 'function') {
      // Recopilar todas las presentaciones seleccionadas con información del producto
      const selectedPresentacionesList = [];
      
      Object.entries(productPresentaciones).forEach(([skuid, presentaciones]) => {
        if (!Array.isArray(presentaciones)) return; // Validar que sea un array
        
        presentaciones.forEach(presentacion => {
          // Validar que la presentación tenga IdPresentaOK, esté seleccionada Y NO esté bloqueada
          if (presentacion && 
              presentacion.IdPresentaOK && 
              selectedPresentaciones.has(presentacion.IdPresentaOK) &&
              !lockedPresentaciones.has(presentacion.IdPresentaOK)) { // NO incluir bloqueadas
            // Encontrar el producto correspondiente
            const producto = productos.find(p => p.SKUID === skuid);
            const precio = getPrecioPresentacion(presentacion.IdPresentaOK);
            
            selectedPresentacionesList.push({
              ...presentacion,
              Precio: precio, // Precio desde precios_items
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
      
      // Solo enviar si hay presentaciones válidas
      onFiltersChange(selectedPresentacionesList);
    }
  }, [selectedPresentaciones, productPresentaciones, productos, presentacionesPrecios, lockedPresentaciones]);

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <FlexBox style={{ 
        gap: '1rem', 
        margin: '0',
        padding: '0.5rem',
        width: '100%',
        flex: 1,
        minHeight: 0,
        maxHeight: '100%',
        alignItems: 'stretch',
        overflow: 'hidden'
      }}>
        
        {/* COLUMNA IZQUIERDA - FILTROS */}
        <Card style={{ 
          flex: '0 0 35%',
          minWidth: '320px',
          height: '100%',
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

        {error && (
          <MessageStrip 
            type="Negative" 
            style={{ margin: '1rem' }}
          >
            {error}
          </MessageStrip>
        )}

      {filtersExpanded && (
        <div style={{ 
          padding: '0.75rem',
          paddingBottom: '1.5rem',
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          maxHeight: 'calc(100vh - 180px)'
        }}>
          <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
            
            {/* FILTROS POR CATEGORÍA */}
            <div style={{ marginBottom: '0.5rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Categorías de Productos:</Label>
                {categorias.length > 0 ? (
                  <>
                    <MultiComboBox
                      placeholder="Selecciona categorías..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onSelectionChange={(e) => handleMultiSelectChange('categorias', e.detail.items)}
                    >
                      {categorias.map(categoria => (
                        <ComboBoxItem 
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
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Marcas de Productos:</Label>
                {marcas.length > 0 ? (
                  <>
                    <MultiComboBox
                      placeholder="Selecciona marcas..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onSelectionChange={(e) => handleMultiSelectChange('marcas', e.detail.items)}
                    >
                      {marcas.map(marca => (
                        <ComboBoxItem 
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
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Rango de Precios:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <Select
                    onChange={(e) => {
                      const rango = RANGOS_PRECIOS.find(r => r.id === e.target.value);
                      if (rango) {
                        handleFilterChange('precioMin', rango.min.toString());
                        handleFilterChange('precioMax', rango.max ? rango.max.toString() : '');
                      } else {
                        handleFilterChange('precioMin', '');
                        handleFilterChange('precioMax', '');
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <Option value="">Seleccionar rango...</Option>
                    {RANGOS_PRECIOS.map(rango => (
                      <Option key={rango.id} value={rango.id}>
                        {rango.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Mínimo"
                    value={filters.precioMin}
                    onInput={(e) => handleFilterChange('precioMin', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Máximo"
                    value={filters.precioMax}
                    onInput={(e) => handleFilterChange('precioMax', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/*  FILTROS POR FECHA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Fecha de Ingreso:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
            </div>

          </FlexBox>
          </div>
        )}
        </Card>

        {/* COLUMNA DERECHA - PRODUCTOS ENCONTRADOS */}
        <Card style={{ 
          flex: '1',
          minWidth: '400px',
          height: '100%',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Encabezado eliminado a petición: sin título ni botón de crear promoción */}

          <div style={{ 
            padding: '0.75rem',
            paddingBottom: '1.5rem',
            flex: '1 1 auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            maxHeight: 'calc(100vh - 150px)'
          }}>
            {loading ? (
              <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                <BusyIndicator active size="Large" />
              </FlexBox>
            ) : getFilteredProducts().length === 0 ? (
              <MessageStrip type="Information" icon="search">
                {getActiveFiltersCount() === 0 ? 
                  'Aplica filtros para ver productos específicos' : 
                  'No hay productos que coincidan con los filtros seleccionados'
                }
              </MessageStrip>
            ) : (
              <>
                {/* Buscador de productos */}
                <FlexBox direction="Column" style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                  <Label style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                    Buscar productos
                  </Label>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, SKU, marca o categoría..."
                    icon="search"
                    style={{ width: '100%' }}
                  />
                  {searchTerm && (
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginTop: '0.5rem' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        {getFilteredProducts().length} resultado{getFilteredProducts().length !== 1 ? 's' : ''} encontrado{getFilteredProducts().length !== 1 ? 's' : ''}
                      </Text>
                      <Button 
                        design="Transparent"
                        icon="decline"
                        onClick={() => setSearchTerm('')}
                        style={{ color: '#666' }}
                      >
                        Limpiar búsqueda
                      </Button>
                    </FlexBox>
                  )}
                </FlexBox>

                {/* Controles de selección */}
                <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                  border: '1px solid #e9ecef'
                }}>
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <CheckBox 
                      checked={getSelectedProductsCount() === getFilteredProducts().length && getFilteredProducts().length > 0}
                      indeterminate={getSelectedProductsCount() > 0 && getSelectedProductsCount() < getFilteredProducts().length}
                      onChange={(e) => e.target.checked ? selectAllProducts() : deselectAllProducts()}
                      text={`Seleccionar todos (${getFilteredProducts().length})`}
                    />
                  </FlexBox>
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                      {selectedPresentaciones.size} presentación(es) seleccionada(s)
                    </Text>
                    {getSelectedProductsCount() > 0 && (
                      <Button 
                        design="Transparent"
                        icon="reset"
                        onClick={deselectAllProducts}
                        style={{ color: '#666' }}
                      >
                        Limpiar selección
                      </Button>
                    )}
                  </FlexBox>
                </FlexBox>

                <FlexBox direction="Column" style={{ 
                  gap: '0.5rem'
                }}>
                  {getFilteredProducts().map(producto => (
                  <div key={producto.SKUID}>
                    <Card 
                      style={{ 
                        padding: '0.75rem',
                        border: selectedProducts.has(producto.SKUID) ? '1px solid #4CAF50' : '1px solid #e8ecef',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        background: selectedProducts.has(producto.SKUID) ? '#f0f9f1' : '#ffffff',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                        <FlexBox alignItems="Center" style={{ gap: '0.75rem', flex: 1 }}>
                          <CheckBox 
                            checked={selectedProducts.has(producto.SKUID)}
                            disabled={lockedProducts.has(producto.SKUID)}
                            onChange={() => toggleProductSelection(producto.SKUID)}
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
                                flex: 1
                              }}>
                                {producto.PRODUCTNAME || `Producto ${producto.SKUID}` || 'Producto sin nombre'}
                              </Title>
                          </FlexBox>
                          <Text style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.15rem' }}>
                            SKU: {producto.SKUID} • Marca: {producto.MARCA || 'Sin marca'}
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
                        {loadingPresentaciones[producto.SKUID] ? (
                          <FlexBox justifyContent="Center" style={{ padding: '0.5rem' }}>
                            <BusyIndicator active size="Small" />
                            <Text style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.875rem' }}>Cargando...</Text>
                          </FlexBox>
                        ) : (
                          <>
                            {(!productPresentaciones[producto.SKUID] || productPresentaciones[producto.SKUID].length === 0) ? (
                              <MessageStrip type="Information">
                                No hay presentaciones disponibles
                              </MessageStrip>
                            ) : (
                              <FlexBox direction="Column" style={{ gap: '0.35rem' }}>
                                {productPresentaciones[producto.SKUID]
                                  .filter(p => p.ACTIVED || lockedPresentaciones.has(p.IdPresentaOK))
                                  .map(presentacion => {
                                    const isLocked = lockedPresentaciones.has(presentacion.IdPresentaOK);
                                    return (
                                      <div key={presentacion.IdPresentaOK} style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: isLocked ? '#f5f5f5' : selectedPresentaciones.has(presentacion.IdPresentaOK) ? '#e8f5e9' : '#ffffff',
                                        border: isLocked ? '1px solid #bdbdbd' : selectedPresentaciones.has(presentacion.IdPresentaOK) ? '1px solid #4CAF50' : '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        opacity: isLocked ? 0.7 : 1
                                      }}>
                                        <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                          <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: 1 }}>
                                            <CheckBox 
                                              checked={isLocked || selectedPresentaciones.has(presentacion.IdPresentaOK)}
                                              disabled={isLocked}
                                              onChange={() => togglePresentacionSelection(presentacion.IdPresentaOK, producto.SKUID)}
                                            />
                                            <FlexBox direction="Column" style={{ flex: 1 }}>
                                              <FlexBox alignItems="Center" style={{ gap: '0.3rem' }}>
                                                <Text style={{ fontWeight: '600', fontSize: '0.875rem', color: isLocked ? '#757575' : '#2c3e50' }}>
                                                  {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                                </Text>
                                                {isLocked && (
                                                  <ObjectStatus state="Information" style={{ fontSize: '0.65rem', padding: '0 0.3rem' }}>
                                                    Ya en promoción
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                </FlexBox>
              </>
            )}
          </div>
        </Card>

      </FlexBox>

      {/* MODAL DE PREVIEW */}
      <Dialog
        open={showPreviewModal}
        headerText="Crear Nueva Promoción"
        style={{ width: '80vw', height: '70vh' }}
        footer={
          <Bar
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button 
                  design="Transparent"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  design="Emphasized"
                  onClick={handleConfirmPromotion}
                  disabled={filteredProducts.length === 0}
                >
                  Crear Promoción
                </Button>
              </FlexBox>
            }
          />
        }
      >
        <div style={{ padding: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
          <FlexBox direction="Column" style={{ gap: '1rem' }}>
            
            {/* Título sugerido */}
            <Card>
              <div style={{ padding: '1rem' }}>
                <Title level="H4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon name="edit" style={{ fontSize: '1.2rem', color: '#667eea' }} />
                  Título Sugerido
                </Title>
                <Text style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f828f' }}>
                  {generatePromotionTitle()}
                </Text>
              </div>
            </Card>

            {/* Resumen de filtros aplicados */}
            <Card>
              <div style={{ padding: '1rem' }}>
                <Title level="H4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon name="filter" style={{ fontSize: '1.2rem', color: '#667eea' }} />
                  Filtros Aplicados
                </Title>
                <FlexBox style={{ gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  
                  {temporadaActiva && (
                    <ObjectStatus state="Information">
                      {temporadaActiva.icono} {temporadaActiva.name}
                    </ObjectStatus>
                  )}
                  
                  {filters.marcas.length > 0 && (
                    <ObjectStatus state="Warning">
                      {filters.marcas.length} marca{filters.marcas.length > 1 ? 's' : ''}
                    </ObjectStatus>
                  )}
                  
                  {filters.categorias.length > 0 && (
                    <ObjectStatus state="Success">
                      {filters.categorias.length} categoría{filters.categorias.length > 1 ? 's' : ''}
                    </ObjectStatus>
                  )}
                  
                  {(filters.precioMin || filters.precioMax) && (
                    <ObjectStatus state="Neutral">
                      ${filters.precioMin || '0'} - ${filters.precioMax || '∞'}
                    </ObjectStatus>
                  )}
                  
                </FlexBox>
              </div>
            </Card>

            {/* Vista previa de productos */}
            <Card>
              <CardHeader titleText={`Productos Incluidos (${filteredProducts.length})`} />
              <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredProducts.length > 0 ? (
                  <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                    {filteredProducts.slice(0, 10).map((producto, index) => (
                      <Card key={producto.SKUID || index} style={{ padding: '0.75rem' }}>
                        <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                          <FlexBox alignItems="Center" style={{ gap: '0.75rem', flex: 1 }}>
                            <Avatar 
                              size="XS" 
                              initials={producto.PRODUCTNAME?.charAt(0) || 'P'}
                              colorScheme="Accent1"
                            />
                            <FlexBox direction="Column" style={{ gap: '0.25rem', flex: 1 }}>
                              <Text style={{ fontWeight: 'bold' }}>
                                {producto.PRODUCTNAME || 'Sin nombre'}
                              </Text>
                              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                SKU: {producto.SKUID} | Marca: {producto.MARCA || 'Sin marca'}
                              </Text>
                            </FlexBox>
                          </FlexBox>
                          <ObjectStatus state="Information">
                            ${producto.PRECIO?.toLocaleString() || 'N/A'}
                          </ObjectStatus>
                        </FlexBox>
                      </Card>
                    ))}
                  </FlexBox>
                ) : (
                  <MessageStrip type="Warning">
                    No hay productos que coincidan con los filtros seleccionados.
                  </MessageStrip>
                )}
                
                {filteredProducts.length > 10 && (
                  <MessageStrip type="Information" style={{ marginTop: '1rem' }}>
                    Mostrando 10 de {filteredProducts.length} productos. 
                    La promoción incluirá todos los productos filtrados.
                  </MessageStrip>
                )}
              </div>
            </Card>
            
          </FlexBox>
        </div>
      </Dialog>

      {/* MODAL DE CREACIÓN DE PROMOCIONES */}
      <Dialog 
        open={showCreatePromoModal} 
        onAfterClose={() => setShowCreatePromoModal(false)}
        headerText="Crear Nueva Promoción"
        style={{ width: '600px', maxHeight: '90vh' }}
      >
        <div style={{ padding: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
          <FlexBox direction="Column" style={{ gap: '1rem' }}>
            
            {/* Título */}
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label required>Título de la Promoción</Label>
              <Input 
                value={promoFormData.titulo}
                onChange={(e) => setPromoFormData(prev => ({
                  ...prev,
                  titulo: e.target.value
                }))}
                placeholder="Ej: Promoción Halloween 2025"
              />
            </FlexBox>

            {/* Descripción */}
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label>Descripción</Label>
              <TextArea 
                value={promoFormData.descripcion}
                onChange={(e) => setPromoFormData(prev => ({
                  ...prev,
                  descripcion: e.target.value
                }))}
                placeholder="Descripción opcional de la promoción"
                rows={3}
              />
            </FlexBox>

            {/* Fechas */}
            <FlexBox style={{ gap: '1rem' }}>
              <FlexBox direction="Column" style={{ gap: '0.5rem', flex: 1 }}>
                <Label required>Fecha de Inicio</Label>
                <DatePicker 
                  value={promoFormData.fechaInicio}
                  onChange={(e) => setPromoFormData(prev => ({
                    ...prev,
                    fechaInicio: e.target.value
                  }))}
                />
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.5rem', flex: 1 }}>
                <Label required>Fecha de Fin</Label>
                <DatePicker 
                  value={promoFormData.fechaFin}
                  onChange={(e) => setPromoFormData(prev => ({
                    ...prev,
                    fechaFin: e.target.value
                  }))}
                />
              </FlexBox>
            </FlexBox>

            {/* Tipo de Descuento */}
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label>Tipo de Descuento</Label>
              <FlexBox style={{ gap: '1rem' }}>
                <RadioButton 
                  text="Porcentaje (%)"
                  checked={promoFormData.tipoDescuento === 'PORCENTAJE'}
                  onChange={() => setPromoFormData(prev => ({
                    ...prev,
                    tipoDescuento: 'PORCENTAJE'
                  }))}
                />
                <RadioButton 
                  text="Monto Fijo ($)"
                  checked={promoFormData.tipoDescuento === 'MONTO_FIJO'}
                  onChange={() => setPromoFormData(prev => ({
                    ...prev,
                    tipoDescuento: 'MONTO_FIJO'
                  }))}
                />
              </FlexBox>
            </FlexBox>

            {/* Valor del Descuento */}
            {promoFormData.tipoDescuento === 'PORCENTAJE' ? (
              <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                <Label required>Porcentaje de Descuento (%)</Label>
                <Input 
                  type="Number"
                  value={promoFormData.descuentoPorcentaje}
                  onChange={(e) => setPromoFormData(prev => ({
                    ...prev,
                    descuentoPorcentaje: parseInt(e.target.value) || 0
                  }))}
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </FlexBox>
            ) : (
              <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                <Label required>Monto de Descuento ($)</Label>
                <Input 
                  type="Number"
                  value={promoFormData.descuentoMonto}
                  onChange={(e) => setPromoFormData(prev => ({
                    ...prev,
                    descuentoMonto: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="100.00"
                  min="0.01"
                  step="0.01"
                />
              </FlexBox>
            )}

            {/* Configuraciones Adicionales */}
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <CheckBox 
                text="Permite acumulación con otras promociones"
                checked={promoFormData.permiteAcumulacion}
                onChange={(e) => setPromoFormData(prev => ({
                  ...prev,
                  permiteAcumulacion: e.target.checked
                }))}
              />
            </FlexBox>

            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label>Límite de Usos (opcional)</Label>
              <Input 
                type="Number"
                value={promoFormData.limiteUsos || ''}
                onChange={(e) => setPromoFormData(prev => ({
                  ...prev,
                  limiteUsos: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="Sin límite"
                min="1"
              />
            </FlexBox>

            {/* Resumen */}
            <MessageStrip type="Information">
              <strong>Resumen:</strong> Se aplicará a {selectedPresentaciones.size} presentación(es) seleccionada(s)
            </MessageStrip>

          </FlexBox>
        </div>

        <Bar 
          slot="footer"
          endContent={
            <>
              <Button 
                onClick={() => setShowCreatePromoModal(false)}
                design="Transparent"
                disabled={creatingPromo}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitPromotion}
                design="Emphasized"
                disabled={creatingPromo}
              >
                {creatingPromo ? (
                  <>
                    <BusyIndicator size="Small" style={{ marginRight: '0.5rem' }} />
                    Creando...
                  </>
                ) : (
                  'Crear Promoción'
                )}
              </Button>
            </>
          }
        />
      </Dialog>

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