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
  MultiComboBox,
  ComboBoxItem,
  Select,
  Option
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';

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
  const [searchUnificado, setSearchUnificado] = useState('');
  
  // Usar ref para rastrear preselectedProducts anterior y evitar loops infinitos
  const prevPreselectedRef = useRef(null);
  
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

  // Abrir automáticamente el MultiComboBox de marcas cuando hay búsqueda
  useEffect(() => {
    if (searchUnificado.trim().length > 0) {
      // Solo actualizar el contenido sin abrir automáticamente
      // El dropdown se abrirá solo cuando el usuario haga clic en él
      const marcasCombo = document.querySelector('[data-test-id="marcas-combo-box"]');
      if (marcasCombo) {
        // No abrir automáticamente, dejar que el usuario lo haga
        // marcasCombo.open = true;
      }
    }
  }, [searchUnificado]);

  // Abrir automáticamente el MultiComboBox de categorías cuando hay búsqueda
  useEffect(() => {
    if (searchUnificado.trim().length > 0) {
      // Solo actualizar el contenido sin abrir automáticamente
      // El dropdown se abrirá solo cuando el usuario haga clic en él
      const categoriasCombo = document.querySelector('[data-test-id="categorias-combo-box"]');
      if (categoriasCombo) {
        // No abrir automáticamente, dejar que el usuario lo haga
        // categoriasCombo.open = true;
      }
    }
  }, [searchUnificado]);

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
    setSelectedProducts(new Set());
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
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      // Filtro de búsqueda por texto
      if (searchTerm) {
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
        
        if (!matchesSearch) return false;
      }
      
      // Filtro por marca - Compara con los nombres exactos de las marcas seleccionadas
      if (filters.marcas && filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA?.trim())) return false;
      }
      
      // Filtro por categoría - Compara DIRECTAMENTE con CATID
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
      
      // Filtro por precio
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      
      return true;
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
    const filtered = getFilteredProducts();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredProducts().length / ITEMS_PER_PAGE);
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
          overflow: window.innerWidth < 768 ? 'visible' : 'hidden'
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
            
            {/* BUSCADOR UNIFICADO PARA MARCAS Y CATEGORÍAS */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px solid #ddd' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Buscar Marcas o Categorías:</Label>
              <Input
                data-test-id="search-unificado-input"
                icon="search"
                placeholder="Buscar por marcas o categorías..."
                value={searchUnificado}
                onInput={(e) => setSearchUnificado(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* FILTROS POR MARCA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Marcas de Productos:</Label>
                {marcas.length > 0 ? (
                  <>
                    <MultiComboBox
                      data-test-id="marcas-combo-box"
                      key={`marcas-combo-${searchUnificado}`}
                      placeholder="Selecciona marcas..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      onSelectionChange={(e) => handleMultiSelectChange('marcas', e.detail.items)}
                    >
                      {marcas
                        .filter(marca => 
                          marca.name.toLowerCase().includes(searchUnificado.toLowerCase())
                        )
                        .map(marca => (
                        <ComboBoxItem 
                          key={`${marca.id}-${searchUnificado}`}
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

            {/* FILTROS POR CATEGORÍA */}
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Categorías de Productos:</Label>
                {categorias.length > 0 ? (
                  <>
                    <div style={{ 
                      maxHeight: '300px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingRight: '0.25rem',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#999 #f0f0f0'
                    }}>
                      <style>{`
                        div[style*="maxHeight: 300px"]::-webkit-scrollbar {
                          width: 6px;
                        }
                        div[style*="maxHeight: 300px"]::-webkit-scrollbar-track {
                          background: #f0f0f0;
                          borderRadius: 3px;
                        }
                        div[style*="maxHeight: 300px"]::-webkit-scrollbar-thumb {
                          background: #999;
                          borderRadius: 3px;
                        }
                        div[style*="maxHeight: 300px"]::-webkit-scrollbar-thumb:hover {
                          background: #666;
                        }
                      `}</style>
                      <MultiComboBox
                        data-test-id="categorias-combo-box"
                        key={`categorias-combo-${searchUnificado}`}
                        placeholder="Selecciona categorías..."
                        style={{ width: '100%', marginTop: '0.25rem' }}
                        onSelectionChange={(e) => handleMultiSelectChange('categorias', e.detail.items)}
                      >
                        {categorias
                          .filter(categoria =>
                            categoria.Nombre.toLowerCase().includes(searchUnificado.toLowerCase())
                          )
                          .map(categoria => (
                          <ComboBoxItem 
                            key={`${categoria.CATID}-${searchUnificado}`}
                            text={`${categoria.Nombre}`}
                            data-value={categoria.CATID}
                            selected={filters.categorias.includes(categoria.CATID)}
                          />
                        ))}
                      </MultiComboBox>
                    </div>
                    
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
          overflow: window.innerWidth < 768 ? 'visible' : 'hidden'
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
                    onInput={(e) => setSearchTerm(e.target.value)}
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
                  {getPaginatedProducts().map(producto => (
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
                                  .filter(p => p.ACTIVED)
                                  .map(presentacion => (
                                  <div key={presentacion.IdPresentaOK} style={{ 
                                    padding: '0.5rem',
                                    backgroundColor: selectedPresentaciones.has(presentacion.IdPresentaOK) ? '#e8f5e9' : '#ffffff',
                                    border: selectedPresentaciones.has(presentacion.IdPresentaOK) ? '1px solid #4CAF50' : '1px solid #dee2e6',
                                    borderRadius: '4px'
                                  }}>
                                    <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                      <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: 1 }}>
                                        <CheckBox 
                                          checked={selectedPresentaciones.has(presentacion.IdPresentaOK)}
                                          onChange={() => togglePresentacionSelection(presentacion.IdPresentaOK, producto.SKUID)}
                                        />
                                        <FlexBox direction="Column" style={{ flex: 1 }}>
                                          <Text style={{ fontWeight: '600', fontSize: '0.875rem', color: '#2c3e50' }}>
                                            {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                          </Text>
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
                                ))}
                              </FlexBox>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
