import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ObjectStatus,
  BusyIndicator,
  Icon,
  RadioButton,
  Select,
  Option,
  MultiComboBox,
  MultiComboBoxItem,
  ComboBoxItem
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';

// Componente personalizado para filtro con checkboxes y búsqueda
const FilterCheckboxList = ({ 
  items, 
  selectedItems, 
  onToggleItem,
  onRemoveItem,
  searchValue, 
  onSearchChange, 
  placeholder,
  getLabel,
  getKey,
  isOpen,
  setIsOpen 
}) => {
  const filteredItems = items.filter(item =>
    getLabel(item).toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleItemClick = (itemKey, e) => {
    e.stopPropagation();
    onToggleItem(itemKey);
    // Cerrar el dropdown después de seleccionar
    setIsOpen(false);
  };

  const handleRemoveTag = (itemKey, e) => {
    e.stopPropagation();
    onRemoveItem(itemKey);
  };

  const selectedItemsObjects = selectedItems.map(key => 
    items.find(item => getKey(item) === key)
  ).filter(Boolean);

  // Detectar clics fuera del dropdown para cerrarlo
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.closest('[data-filter-list]') === null) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div style={{ position: 'relative', width: '100%' }} data-filter-list>
      {/* Input con tags */}
      <div
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          minHeight: '40px',
          transition: 'border-color 0.2s',
          borderColor: isOpen ? '#0066cc' : '#ccc'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Tags de selecciones */}
        {selectedItemsObjects.map(item => {
          const itemKey = getKey(item);
          return (
            <div
              key={itemKey}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.6rem',
                backgroundColor: '#e8f4f8',
                border: '1px solid #b3d9e8',
                borderRadius: '18px',
                fontSize: '0.85rem',
                color: '#0066cc',
                whiteSpace: 'nowrap'
              }}
            >
              <Text style={{ margin: 0, fontSize: '0.875rem' }}>
                {getLabel(item)}
              </Text>
              <Icon
                name="decline"
                style={{
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#0066cc'
                }}
                onClick={(e) => handleRemoveTag(itemKey, e)}
              />
            </div>
          );
        })}

        {/* Input placeholder y flecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexShrink: 0 }}>
          {selectedItems.length === 0 && (
            <Text style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
              {placeholder}
            </Text>
          )}
          <Icon 
            name={isOpen ? 'slim-arrow-up' : 'slim-arrow-down'}
            style={{ fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '280px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1001 }}>
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              icon="search"
              style={{ width: '100%' }}
            />
          </div>

          {/* Checkbox List */}
          {filteredItems.length > 0 ? (
            <div>
              {filteredItems.map((item, idx) => {
                const itemKey = getKey(item);
                const isSelected = selectedItems.includes(itemKey);
                return (
                  <div
                    key={itemKey}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: idx < filteredItems.length - 1 ? '1px solid #f5f5f5' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                      transition: 'background-color 0.15s'
                    }}
                    onClick={(e) => handleItemClick(itemKey, e)}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <CheckBox
                      checked={isSelected}
                      style={{ marginRight: '0.25rem' }}
                    />
                    <Text style={{ fontSize: '0.875rem', flex: 1 }}>
                      {getLabel(item)}
                    </Text>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <Text style={{ fontSize: '0.875rem', color: '#999' }}>
                No hay coincidencias
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de Filtros Avanzados para Precios Listas
const AdvancedFiltersPreciosListas = ({ onFiltersChange, initialFilters = {}, preselectedProducts = new Set(), lockedProducts = new Set() }) => {
  const [filters, setFilters] = useState({
    categorias: [],
    marcas: [],
    precioMin: '',
    precioMax: '',
    tipoGeneral: '',
    tipoFormula: '',
    ...initialFilters
  });

  // Estados para datos reales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(preselectedProducts);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para buscadores de marcas y categorías
  const [searchMarcas, setSearchMarcas] = useState('');
  const [searchCategorias, setSearchCategorias] = useState('');
  
  // Estados para controlar apertura/cierre de dropdowns
  const [openMarcasDropdown, setOpenMarcasDropdown] = useState(false);
  const [openCategoriasDropdown, setOpenCategoriasDropdown] = useState(false);
  
  
  // Estados para presentaciones
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [productPresentaciones, setProductPresentaciones] = useState({});
  const [loadingPresentaciones, setLoadingPresentaciones] = useState({});
  const [selectedPresentaciones, setSelectedPresentaciones] = useState(new Set());
  const [presentacionesPrecios, setPresentacionesPrecios] = useState({});

  // Estados para paginación
  const ITEMS_PER_PAGE = 5; // Productos por página
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedProducts, setPaginatedProducts] = useState([]);
  
  // Ref para rastrear la última notificación al padre
  const lastNotifiedSkusRef = useRef(null);
  const prevPreselectedRef = useRef(null);

  // TIPOS DISPONIBLES (datos estáticos del backend)
  const TIPOS_GENERALES = [
    { id: 'ESPECIFICA', name: 'Específica' },
    { id: 'GENERAL', name: 'General' }
  ];

  const TIPOS_FORMULA = [
    { id: 'FIJO', name: 'Fijo' },
    { id: 'PORCENTAJE', name: 'Porcentaje' },
    { id: 'DESCUENTO', name: 'Descuento' },
    { id: 'MARGEN', name: 'Margen' },
    { id: 'ESCALA', name: 'Escala' }
  ];

  // RANGOS DE PRECIOS ESTÁTICOS
  const RANGOS_PRECIOS = [
    { id: 'BAJO', name: 'Bajo ($0 - $500)', min: 0, max: 500 },
    { id: 'MEDIO', name: 'Medio ($500 - $2,000)', min: 500, max: 2000 },
    { id: 'ALTO', name: 'Alto ($2,000 - $10,000)', min: 2000, max: 10000 },
    { id: 'VERY_HIGH', name: 'Muy Alto ($10,000+)', min: 10000, max: null }
  ];

  // CARGAR DATOS REALES AL MONTAR COMPONENTE
  useEffect(() => {
    loadData();
  }, []);

  // Actualizar productos seleccionados cuando cambien los preseleccionados (solo una vez)
  useEffect(() => {
    if (!preselectedProducts || preselectedProducts.size === 0) {
      return;
    }
    
    // Convertir Set a array ordenado para comparar
    const preselectedArray = Array.from(preselectedProducts).sort();
    const prevArray = prevPreselectedRef.current;
    
    // Comparar con el anterior - solo actualizar si realmente cambió
    const isSame = prevArray && 
      prevArray.length === preselectedArray.length && 
      prevArray.every((v, i) => v === preselectedArray[i]);
    
    if (!isSame) {
      prevPreselectedRef.current = preselectedArray;
      setSelectedProducts(new Set(preselectedArray));
    }
  }, [preselectedProducts]);



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
      
      if (productosResponse?.data?.[0]?.dataRes) {
        productosData = productosResponse.data[0].dataRes;
      }
      else if (productosResponse?.value?.[0]?.data?.[0]?.dataRes) {
        productosData = productosResponse.value[0].data[0].dataRes;
      }
      else if (Array.isArray(productosResponse?.data)) {
        productosData = productosResponse.data;
      }
      else if (Array.isArray(productosResponse)) {
        productosData = productosResponse;
      }
      else if (Array.isArray(productosResponse?.dataRes)) {
        productosData = productosResponse.dataRes;
      }

      // Extraer categorías
      let categoriasData = [];
      
      if (categoriasResponse?.data?.[0]?.dataRes) {
        categoriasData = categoriasResponse.data[0].dataRes;
      }
      else if (categoriasResponse?.value?.[0]?.data?.[0]?.dataRes) {
        categoriasData = categoriasResponse.value[0].data[0].dataRes;
      }
      else if (Array.isArray(categoriasResponse?.data)) {
        categoriasData = categoriasResponse.data;
      }
      else if (Array.isArray(categoriasResponse)) {
        categoriasData = categoriasResponse;
      }
      else if (Array.isArray(categoriasResponse?.dataRes)) {
        categoriasData = categoriasResponse.dataRes;
      }

      setProductos(productosData);
      
      // Usar TODAS las categorías, sin filtrar por ACTIVED o DELETED
      setCategorias(categoriasData);

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

      setMarcas(marcasConConteo);
      console.log(`✅ Datos cargados: ${productosData.length} productos, ${categoriasData.length} categorías, ${marcasConConteo.length} marcas`);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos de productos y categorías: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // OBTENER MARCAS DISPONIBLES BASADAS EN LA BÚSQUEDA Y FILTROS ACTUALES
  const getAvailableMarcas = () => {
    // Primero, obtener los productos que pasan el filtro de búsqueda y otras restricciones
    // PERO ignorando el filtro de marcas (para poder mostrar qué marcas hay disponibles)
    const productosFiltrados = productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // Aplicar filtro de búsqueda
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = producto.PRODUCTNAME?.toLowerCase().includes(searchLower);
        const matchesSKU = producto.SKUID?.toLowerCase().includes(searchLower);
        const matchesMarca = producto.MARCA?.toLowerCase().includes(searchLower);
        const matchesCategoria = producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS) && 
          producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') return cat.toLowerCase().includes(searchLower);
            if (typeof cat === 'object' && cat.Nombre) return cat.Nombre.toLowerCase().includes(searchLower);
            return false;
          });
        
        if (!(matchesName || matchesSKU || matchesMarca || matchesCategoria)) return false;
      }
      
      // Aplicar filtro de categorías (si está seleccionado)
      if (filters.categorias && filters.categorias.length > 0) {
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          const hasCategory = producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') return filters.categorias.includes(cat);
            if (typeof cat === 'object' && cat.CATID) return filters.categorias.includes(cat.CATID);
            return false;
          });
          if (!hasCategory) return false;
        } else {
          return false;
        }
      }
      
      // Aplicar filtro de precio
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      return true;
    });
    
    // Extraer marcas únicas de estos productos filtrados
    const marcasUnicas = [...new Set(
      productosFiltrados
        .filter(p => p.MARCA && p.MARCA.trim() !== '')
        .map(p => p.MARCA.trim())
    )];
    
    return marcasUnicas.map(marca => ({ 
      id: marca.toUpperCase().replace(/\s+/g, '_'), 
      name: marca,
      productos: productosFiltrados.filter(p => p.MARCA === marca).length
    }));
  };

  // OBTENER CATEGORÍAS DISPONIBLES BASADAS EN LA BÚSQUEDA Y FILTROS ACTUALES
  const getAvailableCategorias = () => {
    // Obtener los productos que pasan el filtro de búsqueda y otras restricciones
    // PERO ignorando el filtro de categorías
    const productosFiltrados = productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // Aplicar filtro de búsqueda
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = producto.PRODUCTNAME?.toLowerCase().includes(searchLower);
        const matchesSKU = producto.SKUID?.toLowerCase().includes(searchLower);
        const matchesMarca = producto.MARCA?.toLowerCase().includes(searchLower);
        const matchesCategoria = producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS) && 
          producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') return cat.toLowerCase().includes(searchLower);
            if (typeof cat === 'object' && cat.Nombre) return cat.Nombre.toLowerCase().includes(searchLower);
            return false;
          });
        
        if (!(matchesName || matchesSKU || matchesMarca || matchesCategoria)) return false;
      }
      
      // Aplicar filtro de marcas (si está seleccionado)
      if (filters.marcas && filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA?.trim())) return false;
      }
      
      // Aplicar filtro de precio
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      return true;
    });
    
    // Extraer categorías únicas de estos productos filtrados
    const categoriasMap = new Map();
    
    productosFiltrados.forEach(producto => {
      if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
        producto.CATEGORIAS.forEach(cat => {
          if (typeof cat === 'string') {
            // Si es string, buscar la categoría en el listado original
            const catObj = categorias.find(c => c.CATID === cat);
            if (catObj && !categoriasMap.has(cat)) {
              categoriasMap.set(cat, { ...catObj, count: 0 });
            }
            if (categoriasMap.has(cat)) {
              categoriasMap.get(cat).count += 1;
            }
          } else if (typeof cat === 'object' && cat.CATID) {
            if (!categoriasMap.has(cat.CATID)) {
              categoriasMap.set(cat.CATID, { ...cat, count: 0 });
            }
            categoriasMap.get(cat.CATID).count += 1;
          }
        });
      }
    });
    
    return Array.from(categoriasMap.values());
  };

  const handleMultiSelectChange = (filterKey, selectedItems) => {
    const values = selectedItems.map(item => item.getAttribute('data-value'));
    setFilters(prev => ({
      ...prev,
      [filterKey]: values
    }));
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const toggleMarcaFilter = (marca) => {
    // Este método se mantiene solo para compatibilidad
    setFilters(prev => {
      const marcasActuales = prev.marcas || [];
      if (marcasActuales.includes(marca)) {
        return {
          ...prev,
          marcas: marcasActuales.filter(m => m !== marca)
        };
      } else {
        return {
          ...prev,
          marcas: [...marcasActuales, marca]
        };
      }
    });
  };

  const toggleCategoriaFilter = (categoria) => {
    // Este método se mantiene solo para compatibilidad
    setFilters(prev => {
      const categoriasActuales = prev.categorias || [];
      if (categoriasActuales.includes(categoria)) {
        return {
          ...prev,
          categorias: categoriasActuales.filter(c => c !== categoria)
        };
      } else {
        return {
          ...prev,
          categorias: [...categoriasActuales, categoria]
        };
      }
    });
  };

  const clearAllFilters = () => {
    setFilters({
      categorias: [],
      marcas: [],
      precioMin: '',
      precioMax: '',
    });
    setSearchTerm('');
    // NO borramos selectedProducts aquí - deben mantenerse los productos seleccionados
    // solo se limpian los filtros del lado izquierdo
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categorias.length > 0) count++;
    if (filters.marcas.length > 0) count++;
    if (filters.precioMin || filters.precioMax) count++;
    if (searchTerm) count++;
    return count;
  };

  // OBTENER PRODUCTOS FILTRADOS COMPLETOS
  const getFilteredProducts = () => {
    if (productos.length === 0) return [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return productos.filter(producto => {
      // FILTRO 1: Estado del producto
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // FILTRO 2: Búsqueda por texto
      // Si hay término de búsqueda, DEBE cumplir este filtro
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar en nombre del producto
        const matchesName = producto.PRODUCTNAME?.toLowerCase().includes(searchLower);
        
        // Buscar en SKU
        const matchesSKU = producto.SKUID?.toLowerCase().includes(searchLower);
        
        // Buscar en marca
        const matchesMarca = producto.MARCA?.toLowerCase().includes(searchLower);
        
        // Buscar en categorías
        const matchesCategoria = producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS) && 
          producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') {
              return cat.toLowerCase().includes(searchLower);
            }
            if (typeof cat === 'object' && cat.Nombre) {
              return cat.Nombre.toLowerCase().includes(searchLower);
            }
            return false;
          });
        
        const matchesSearch = matchesName || matchesSKU || matchesMarca || matchesCategoria;
        
        // Si la búsqueda NO coincide, descartar el producto
        if (!matchesSearch) return false;
      }
      
      // FILTRO 3: Por marca - SOLO si hay marcas seleccionadas
      // Si hay marcas seleccionadas, el producto DEBE tener una de esas marcas
      if (filters.marcas && filters.marcas.length > 0) {
        const productMarca = producto.MARCA?.trim();
        const marcaMatches = filters.marcas.includes(productMarca);
        if (!marcaMatches) return false;
      }
      
      // FILTRO 4: Por categoría - SOLO si hay categorías seleccionadas
      // Si hay categorías seleccionadas, el producto DEBE tener una de esas categorías
      if (filters.categorias && filters.categorias.length > 0) {
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          // Comparar directamente los CATID de categoría
          const hasCategory = producto.CATEGORIAS.some(cat => {
            // Si cat es string (CATID), comparar directamente
            if (typeof cat === 'string') {
              return filters.categorias.includes(cat);
            }
            // Si cat es objeto, obtener el CATID
            if (typeof cat === 'object' && cat.CATID) {
              return filters.categorias.includes(cat.CATID);
            }
            return false;
          });
          if (!hasCategory) return false;
        } else {
          return false;
        }
      }
      
      // FILTRO 5: Por precio
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      // Todos los filtros activos se cumplieron
      return true;
    });
  };

  // Nueva función: Obtener productos para el buscador
  // Si hay búsqueda: busca en TODOS los productos (sin restricciones de marca/categoría)
  // Si NO hay búsqueda: aplica filtros de marca/categoría
  const getProductosParaBuscador = () => {
    if (productos.length === 0) return [];
    
    // Primero filtrar por estado
    let resultado = productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) return false;
      return true;
    });

    // Si hay búsqueda, buscar en TODOS sin restricciones de marca/categoría
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      resultado = resultado.filter(producto => {
        const matchesName = producto.PRODUCTNAME?.toLowerCase().includes(searchLower);
        const matchesSKU = producto.SKUID?.toLowerCase().includes(searchLower);
        const matchesMarca = producto.MARCA?.toLowerCase().includes(searchLower);
        
        const matchesCategoria = producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS) && 
          producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') {
              return cat.toLowerCase().includes(searchLower);
            }
            if (typeof cat === 'object' && cat.Nombre) {
              return cat.Nombre.toLowerCase().includes(searchLower);
            }
            return false;
          });
        
        return matchesName || matchesSKU || matchesMarca || matchesCategoria;
      });
    } else {
      // Si NO hay búsqueda, aplicar filtros de marca y categoría
      if (filters.marcas && filters.marcas.length > 0) {
        resultado = resultado.filter(producto => {
          const productMarca = producto.MARCA?.trim();
          return filters.marcas.includes(productMarca);
        });
      }
      
      if (filters.categorias && filters.categorias.length > 0) {
        resultado = resultado.filter(producto => {
          if (!producto.CATEGORIAS || !Array.isArray(producto.CATEGORIAS)) return false;
          
          return producto.CATEGORIAS.some(cat => {
            if (typeof cat === 'string') {
              return filters.categorias.includes(cat);
            }
            if (typeof cat === 'object' && cat.CATID) {
              return filters.categorias.includes(cat.CATID);
            }
            return false;
          });
        });
      }
    }
    
    // Ordenar: seleccionados primero, luego no seleccionados
    return resultado.sort((a, b) => {
      const aSelected = selectedProducts.has(a.SKUID) ? 0 : 1;
      const bSelected = selectedProducts.has(b.SKUID) ? 0 : 1;
      return aSelected - bSelected;
    });
  };

  // FUNCIONES DE SELECCIÓN DE PRODUCTOS
  const toggleProductSelection = async (productId) => {
    if (lockedProducts.has(productId)) {
      return;
    }
    
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      const isSelecting = !newSelection.has(productId);
      
      if (isSelecting) {
        newSelection.add(productId);
        loadAndSelectPresentaciones(productId);
      } else {
        newSelection.delete(productId);
        deselectAllPresentacionesForProduct(productId);
      }
      
      return newSelection;
    });
  };

  const loadAndSelectPresentaciones = async (skuid) => {
    if (!productPresentaciones[skuid]) {
      await loadPresentaciones(skuid);
    }
    
    const presentaciones = productPresentaciones[skuid] || [];
    const activePresentaciones = presentaciones.filter(p => p.ACTIVED);
    
    setSelectedPresentaciones(prev => {
      const newSelection = new Set(prev);
      activePresentaciones.forEach(p => newSelection.add(p.IdPresentaOK));
      return newSelection;
    });
  };

  const selectAllProducts = async () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    setSelectedProducts(new Set(allProductIds));
    
    for (const skuid of allProductIds) {
      await loadAndSelectPresentaciones(skuid);
    }
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set(lockedProducts));
    setSelectedPresentaciones(new Set());
  };

  const getSelectedProductsCount = () => selectedProducts.size;

  // FUNCIONES PARA MANEJAR PRESENTACIONES
  const toggleProductExpansion = async (productId) => {
    const newExpanded = new Set(expandedProducts);
    
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
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
      setProductPresentaciones(prev => ({
        ...prev,
        [skuid]: presentaciones || []
      }));
      
      if (presentaciones && presentaciones.length > 0) {
        const preciosPromises = presentaciones.map(async (presentacion) => {
          try {
            const precios = await preciosItemsService.getPricesByIdPresentaOK(presentacion.IdPresentaOK);
            return { idPresentaOK: presentacion.IdPresentaOK, precios };
          } catch (error) {
            console.error(`Error loading prices for ${presentacion.IdPresentaOK}:`, error);
            return { idPresentaOK: presentacion.IdPresentaOK, precios: [] };
          }
        });
        
        const preciosResults = await Promise.all(preciosPromises);
        
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
        
        const presentaciones = productPresentaciones[skuid] || [];
        const remainingSelected = presentaciones.some(p => 
          p.IdPresentaOK !== presentacionId && newSelection.has(p.IdPresentaOK)
        );
        
        if (!remainingSelected) {
          setSelectedProducts(prevProducts => {
            const newProducts = new Set(prevProducts);
            newProducts.delete(skuid);
            return newProducts;
          });
        }
      } else {
        newSelection.add(presentacionId);
        
        setSelectedProducts(prevProducts => {
          const newProducts = new Set(prevProducts);
          newProducts.add(skuid);
          return newProducts;
        });
      }
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

  const getPrecioPresentacion = (idPresentaOK) => {
    const precios = presentacionesPrecios[idPresentaOK] || [];
    
    if (precios.length === 0) {
      return null;
    }
    
    const precioActivo = precios.find(p => p.ACTIVO === true) || precios[0];
    
    return precioActivo?.Precio || null;
  };

  // Función para obtener productos paginados
  const getPaginatedProducts = () => {
    // Usar getProductosParaBuscador para mostrar TODOS los productos sin restricciones de marcas/categorías
    const filtered = getProductosParaBuscador();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    // Usar getProductosParaBuscador para contar TODOS los productos
    return Math.ceil(getProductosParaBuscador().length / ITEMS_PER_PAGE);
  };

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Notificar al padre cuando cambien los productos seleccionados
  useEffect(() => {
    if (onFiltersChange && typeof onFiltersChange === 'function') {
      const selectedSKUs = Array.from(selectedProducts).sort();
      const skusString = JSON.stringify(selectedSKUs);
      
      // Solo notificar si hay cambios reales y si hay SKUs seleccionados
      if (selectedSKUs.length > 0 && lastNotifiedSkusRef.current !== skusString) {
        lastNotifiedSkusRef.current = skusString;
        onFiltersChange({
          selectedPresentaciones: [],
          selectedSKUs: selectedSKUs,
          filteredProducts: getFilteredProducts()
        });
      }
    }
  }, [selectedProducts]);

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: 0
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
        overflow: window.innerWidth < 768 ? 'auto' : 'hidden',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row'
      }}>
        
        {/* COLUMNA IZQUIERDA - FILTROS */}
        <Card style={{ 
          flex: window.innerWidth < 768 ? '0 0 100%' : '0 0 35%',
          minWidth: '320px',
          height: window.innerWidth < 768 ? 'auto' : '100%',
          maxHeight: window.innerWidth < 768 ? 'auto' : '100%',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: window.innerWidth < 768 ? 'visible' : 'hidden',
          minHeight: 0
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
          maxHeight: 'calc(100vh - 80px)'
        }}>
          <FlexBox direction="Column" style={{ gap: '1rem' }}>
            
            {/* FILTROS POR MARCA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Marcas de Productos:</Label>
              {marcas.length > 0 ? (
                <MultiComboBox
                  style={{ width: '100%' }}
                  placeholder="Selecciona marcas..."
                  showSecondaryValues
                  onSelectionChange={(e) => {
                    const selectedItems = e.detail.items;
                    const selectedMarcas = selectedItems.map(item => item.getAttribute('data-value'));
                    setFilters(prev => ({
                      ...prev,
                      marcas: selectedMarcas
                    }));
                  }}
                >
                  {getAvailableMarcas().map((marca) => (
                    <MultiComboBoxItem
                      key={marca.name}
                      text={`${marca.name} (${marca.productos})`}
                      data-value={marca.name}
                      selected={filters.marcas.includes(marca.name)}
                    />
                  ))}
                </MultiComboBox>
              ) : (
                <Text style={{ marginTop: '0.25rem', color: '#666' }}>
                  {loading ? 'Cargando marcas...' : 'No hay marcas disponibles'}
                </Text>
              )}
            </div>

            {/* FILTROS POR CATEGORÍA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Categorías de Productos:</Label>
              {categorias.length > 0 ? (
                <MultiComboBox
                  style={{ width: '100%' }}
                  placeholder="Selecciona categorías..."
                  showSecondaryValues
                  onSelectionChange={(e) => {
                    const selectedItems = e.detail.items;
                    const selectedCategorias = selectedItems.map(item => item.getAttribute('data-value'));
                    setFilters(prev => ({
                      ...prev,
                      categorias: selectedCategorias
                    }));
                  }}
                >
                  {getAvailableCategorias().map((categoria) => (
                    <MultiComboBoxItem
                      key={categoria.CATID}
                      text={`${categoria.Nombre}${categoria.count ? ` (${categoria.count})` : ''}`}
                      data-value={categoria.CATID}
                      selected={filters.categorias.includes(categoria.CATID)}
                    />
                  ))}
                </MultiComboBox>
              ) : (
                <Text style={{ marginTop: '0.25rem', color: '#666' }}>
                  {loading ? 'Cargando categorías...' : 'No hay categorías disponibles'}
                </Text>
              )}
            </div>

            {/* FILTROS POR RANGO DE PRECIOS */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block', color: '#333' }}>
                Rango de Precios:
              </Label>
              <MultiComboBox
                placeholder="Selecciona rangos de precio..."
                style={{ width: '100%' }}
                onSelectionChange={(e) => {
                  const selectedItems = e.detail.items;
                  const selected = [];
                  
                  selectedItems.forEach(item => {
                    const rango = RANGOS_PRECIOS.find(r => r.id === item.getAttribute('data-value'));
                    if (rango) selected.push(rango);
                  });

                  if (selected.length > 0) {
                    const precioMin = Math.min(...selected.map(r => r.min));
                    const precioMax = Math.max(...selected.map(r => r.max || 999999));
                    handleFilterChange('precioMin', precioMin.toString());
                    handleFilterChange('precioMax', precioMax.toString());
                  } else {
                    handleFilterChange('precioMin', '');
                    handleFilterChange('precioMax', '');
                  }
                }}
              >
                {RANGOS_PRECIOS.map(rango => (
                  <ComboBoxItem
                    key={rango.id}
                    text={rango.name}
                    data-value={rango.id}
                  />
                ))}
              </MultiComboBox>
              
              {(filters.precioMin || filters.precioMax) && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  border: '1px solid #90caf9'
                }}>
                  <Text style={{ fontSize: '0.875rem', color: '#1976d2', fontWeight: '500' }}>
                    Filtro activo: ${filters.precioMin || '0'} - ${filters.precioMax || '∞'}
                  </Text>
                </div>
              )}
            </div>

            {/* SEPARADOR */}
            <div style={{ borderTop: '2px solid #e0e6ed', marginTop: '0.75rem' }}></div>

            {/* FILTROS POR TIPO FÓRMULA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block', color: '#333' }}>
                Tipo de Fórmula:
              </Label>
              <Select
                value={filters.tipoFormula || ''}
                onChange={(e) => handleFilterChange('tipoFormula', e.target.value)}
                style={{ width: '100%', fontSize: '0.875rem' }}
              >
                <Option value="">Todos</Option>
                {TIPOS_FORMULA.map(tipo => (
                  <Option key={tipo.id} value={tipo.id}>{tipo.name}</Option>
                ))}
              </Select>
            </div>



          </FlexBox>
          </div>
        )}
        </Card>

        {/* COLUMNA DERECHA - PRODUCTOS ENCONTRADOS */}
        <Card style={{ 
          flex: window.innerWidth < 768 ? '0 0 100%' : '1',
          minWidth: window.innerWidth < 768 ? 'auto' : '400px',
          height: window.innerWidth < 768 ? 'auto' : '100%',
          maxHeight: window.innerWidth < 768 ? 'auto' : '100%',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: window.innerWidth < 768 ? 'visible' : 'hidden',
          minHeight: 0
        }}>

          <div style={{ 
            padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
            paddingBottom: window.innerWidth < 768 ? '1rem' : '1.5rem',
            flex: '1 1 auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            maxHeight: window.innerHeight < 600 ? 'auto' : 'calc(100vh - 150px)'
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
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Buscar por nombre, SKU, marca o categoría..."
                    icon="search"
                    style={{ width: '100%' }}
                  />
                  {searchTerm && (
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginTop: '0.5rem' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        {getProductosParaBuscador().length} resultado{getProductosParaBuscador().length !== 1 ? 's' : ''} encontrado{getProductosParaBuscador().length !== 1 ? 's' : ''}
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
                      checked={getSelectedProductsCount() === getProductosParaBuscador().length && getProductosParaBuscador().length > 0}
                      indeterminate={getSelectedProductsCount() > 0 && getSelectedProductsCount() < getProductosParaBuscador().length}
                      onChange={(e) => e.target.checked ? selectAllProducts() : deselectAllProducts()}
                      text={`Seleccionar todos (${getProductosParaBuscador().length})`}
                    />
                  </FlexBox>
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                      {selectedProducts.size} producto(s) seleccionado(s)
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
                  {getPaginatedProducts().length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem 1rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Icon 
                        name="search" 
                        style={{ 
                          fontSize: '2rem', 
                          color: '#ccc', 
                          marginBottom: '0.5rem',
                          display: 'block'
                        }} 
                      />
                      <Text style={{ color: '#999', fontSize: '0.95rem' }}>
                        {searchTerm ? `No se encontraron productos para "${searchTerm}"` : 'No hay productos disponibles'}
                      </Text>
                    </div>
                  ) : (
                    getPaginatedProducts().map(producto => (
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
                        marginBottom: '0.5rem'
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
                              <FlexBox direction="Column" style={{ gap: '0.35rem', width: '200px' }}>
                                {productPresentaciones[producto.SKUID]
                                  .filter(p => p.ACTIVED)
                                  .map(presentacion => (
                                  <div key={presentacion.IdPresentaOK} style={{ 
                                    padding: '0.5rem',
                                    backgroundColor: selectedPresentaciones.has(presentacion.IdPresentaOK) ? '#e8f5e9' : '#ffffff',
                                    border: selectedPresentaciones.has(presentacion.IdPresentaOK) ? '1px solid #4CAF50' : '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}>
                                    <FlexBox alignItems="Center" style={{ gap: '0.5rem', width: '100%' }}>
                                      <CheckBox 
                                        checked={selectedPresentaciones.has(presentacion.IdPresentaOK)}
                                        onChange={() => togglePresentacionSelection(presentacion.IdPresentaOK, producto.SKUID)}
                                      />
                                      <Text style={{ fontWeight: '600', fontSize: '0.875rem', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                      </Text>
                                    </FlexBox>
                                  </div>
                                ))}
                              </FlexBox>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
                  )}
                </FlexBox>

                {/* PAGINACIÓN - BOTONES ANTERIOR/SIGUIENTE */}
                {getTotalPages() > 1 && (
                  <FlexBox justifyContent="Center" alignItems="Center" style={{ 
                    gap: '1rem', 
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    <Button
                      icon="slim-arrow-left"
                      design="Default"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <Text style={{ 
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      color: '#2c3e50',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}>
                      Página {currentPage} de {getTotalPages()}
                    </Text>

                    <Button
                      icon="slim-arrow-right"
                      design="Default"
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                    >
                      Siguiente
                    </Button>
                  </FlexBox>
                )}
              </>
            )}
          </div>
        </Card>

      </FlexBox>
    </div>
  );
};

export default AdvancedFiltersPreciosListas;
