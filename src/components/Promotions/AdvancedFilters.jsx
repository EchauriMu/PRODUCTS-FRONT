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

// DATOS ESTÁTICOS/MOCK PARA FILTROS
const AdvancedFilters = ({ onFiltersChange, initialFilters = {} }) => {
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
  const [selectedProducts, setSelectedProducts] = useState(new Set()); // Productos seleccionados
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda

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
  const handleCreatePromotion = () => {
    const selectedProductsList = getFilteredProducts().filter(p => selectedProducts.has(p.SKUID));
    
    if (selectedProductsList.length === 0) {
      alert('Por favor selecciona al menos un producto para crear la promoción.');
      return;
    }
    
    // Generar título automático
    const autoTitle = generatePromotionTitle(selectedProductsList);
    
    // Configurar fechas por defecto
    const today = new Date();
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    setPromoFormData({
      titulo: autoTitle,
      descripcion: `Promoción aplicable a ${selectedProductsList.length} producto(s) seleccionado(s)`,
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
      
      const selectedProductsList = getFilteredProducts().filter(p => selectedProducts.has(p.SKUID));
      
      // Validaciones básicas
      if (!promoFormData.titulo.trim()) {
        alert('El título es obligatorio');
        return;
      }
      
      if (!promoFormData.fechaInicio || !promoFormData.fechaFin) {
        alert('Las fechas de inicio y fin son obligatorias');
        return;
      }
      
      if (new Date(promoFormData.fechaFin) <= new Date(promoFormData.fechaInicio)) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
      
      if (promoFormData.tipoDescuento === 'PORCENTAJE' && (promoFormData.descuentoPorcentaje <= 0 || promoFormData.descuentoPorcentaje > 100)) {
        alert('El porcentaje de descuento debe estar entre 1 y 100');
        return;
      }
      
      if (promoFormData.tipoDescuento === 'MONTO_FIJO' && promoFormData.descuentoMonto <= 0) {
        alert('El monto de descuento debe ser mayor a 0');
        return;
      }
      
      // Crear promoción
      const result = await promoService.createPromotionWithProducts(
        promoFormData,
        selectedProductsList,
        filters
        // LoggedUser se maneja automáticamente por el interceptor de axios
      );
      
      console.log('Promoción creada exitosamente:', result);
      
      // Mostrar mensaje de éxito
      alert(`Promoción "${promoFormData.titulo}" creada exitosamente!`);
      
      // Limpiar formulario y cerrar modal
      setShowCreatePromoModal(false);
      setSelectedProducts(new Set());
      
      // Notificar al componente padre si hay callback
      if (onFiltersChange) {
        onFiltersChange({ 
          ...filters, 
          message: `Promoción creada: ${promoFormData.titulo}` 
        });
      }
      
    } catch (error) {
      console.error('Error al crear promoción:', error);
      alert('Error al crear la promoción: ' + (error.message || 'Error desconocido'));
    } finally {
      setCreatingPromo(false);
    }
  };

  // GENERAR TÍTULO AUTOMÁTICO PARA LA PROMOCIÓN
  const generatePromotionTitle = (selectedProductsList = []) => {
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
    
    // Si hay productos específicos seleccionados
    if (selectedProductsList.length === 1) {
      const producto = selectedProductsList[0];
      parts.push(producto.PRODUCTNAME || `Producto ${producto.SKUID}`);
    } else if (selectedProductsList.length > 1) {
      parts.push(`${selectedProductsList.length} productos`);
    }
    
    if (parts.length === 0) {
      parts.push('Nueva Promoción');
    }
    
    return parts.join(' - ');
  };

  // CONFIRMAR CREACIÓN DE PROMOCIÓN (función legacy para compatibilidad)
  const handleConfirmPromotion = () => {
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
    alert(`Promoción creada con ${filteredProducts.length} productos!`);
  };

  // FUNCIONES DE SELECCIÓN DE PRODUCTOS
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
      } else {
        newSelection.add(productId);
      }
      return newSelection;
    });
  };

  const selectAllProducts = () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    setSelectedProducts(new Set(allProductIds));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const getSelectedProductsCount = () => selectedProducts.size;

  return (
    <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa' }}>
      <FlexBox style={{ 
        gap: '2rem', 
        margin: '0', 
        maxWidth: '1400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        height: '60vh',
        alignItems: 'stretch'
      }}>
        
        {/* COLUMNA IZQUIERDA - FILTROS */}
        <Card style={{ 
          flex: '1', 
          minWidth: '420px',
          maxWidth: '50%',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e0e6ed',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '60vh',
          overflow: 'hidden'
        }}>
        <CardHeader
          titleText="Filtros Avanzados"
          subtitleText={loading ? 'Cargando datos...' : `${getActiveFiltersCount()} filtros activos`}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0'
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
          padding: '1rem',
          flex: '1',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'calc(60vh - 120px)',
          minHeight: '0'
        }}>
          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            
            {/* FILTROS POR CATEGORÍA */}
            <Card 
              header={
                <CardHeader 
                  titleText="Filtros por Categoría" 
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                  }}
                  action={
                    <Icon name="folder" style={{ color: 'white', fontSize: '1.2rem' }} />
                  }
                />
              }
              style={{
                marginBottom: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e6ed',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ padding: '1rem' }}>
                <Label>Categorías de Productos:</Label>
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
            </Card>

            {/* FILTROS POR MARCA */}
            <Card 
              header={
                <CardHeader 
                  titleText="Filtros por Marca" 
                  style={{
                    background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                  }}
                  action={
                    <Icon name="tag" style={{ color: 'white', fontSize: '1.2rem' }} />
                  }
                />
              }
              style={{
                marginBottom: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e6ed',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ padding: '1rem' }}>
                <Label>Marcas de Productos:</Label>
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
            </Card>

            {/* FILTROS POR PRECIO */}
            <Card 
              header={
                <CardHeader 
                  titleText="Filtros por Precio" 
                  style={{
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                  }}
                  action={
                    <Icon name="money-bills" style={{ color: 'white', fontSize: '1.2rem' }} />
                  }
                />
              }
              style={{
                marginBottom: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e6ed',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <Label>Rango de Precios:</Label>
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
                    style={{ width: '100%', marginTop: '0.25rem' }}
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
                  <Label>Precio Mínimo:</Label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={filters.precioMin}
                    onInput={(e) => handleFilterChange('precioMin', e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>
                
                <div>
                  <Label>Precio Máximo:</Label>
                  <Input
                    type="number"
                    placeholder="Sin límite"
                    value={filters.precioMax}
                    onInput={(e) => handleFilterChange('precioMax', e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </Card>

            {/*  FILTROS POR FECHA */}
            <Card 
              header={
                <CardHeader 
                  titleText="Filtros por Fecha de Ingreso" 
                  style={{
                    background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                  }}
                  action={
                    <Icon name="calendar" style={{ color: 'white', fontSize: '1.2rem' }} />
                  }
                />
              }
              style={{
                marginBottom: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e6ed',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <Label>Fecha Desde:</Label>
                  <DatePicker
                    value={filters.fechaIngresoDesde}
                    onChange={(e) => handleFilterChange('fechaIngresoDesde', e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>
                
                <div>
                  <Label>Fecha Hasta:</Label>
                  <DatePicker
                    value={filters.fechaIngresoHasta}
                    onChange={(e) => handleFilterChange('fechaIngresoHasta', e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </Card>

          </FlexBox>
          </div>
        )}
        </Card>

        {/* COLUMNA DERECHA - PRODUCTOS ENCONTRADOS */}
        <Card style={{ 
          flex: '1', 
          minWidth: '420px',
          maxWidth: '50%',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e0e6ed',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fff8 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '60vh',
          overflow: 'hidden'
        }}>
          {/* Encabezado eliminado a petición: sin título ni botón de crear promoción */}

          <div style={{ 
            padding: '1rem',
            flex: '1',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: 'calc(60vh - 120px)',
            minHeight: '0'
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
                      {getSelectedProductsCount()} de {getFilteredProducts().length} seleccionados
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
                  gap: '0.75rem'
                }}>
                  {getFilteredProducts().slice(0, 20).map(producto => (
                  <Card 
                    key={producto.SKUID} 
                    style={{ 
                      padding: '1.25rem',
                      border: '1px solid #e8ecef',
                      borderRadius: '8px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4CAF50';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8ecef';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                      <FlexBox alignItems="Center" style={{ gap: '1rem', flex: 1 }}>
                        <CheckBox 
                          checked={selectedProducts.has(producto.SKUID)}
                          onChange={() => toggleProductSelection(producto.SKUID)}
                        />
                        <FlexBox direction="Column" style={{ flex: 1 }}>
                          <FlexBox alignItems="Center" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <Title level="H6" style={{ 
                              margin: 0, 
                              fontSize: '1rem', 
                              fontWeight: '600',
                              color: '#2c3e50',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '300px'
                            }}>
                              {producto.PRODUCTNAME || `Producto ${producto.SKUID}` || 'Producto sin nombre'}
                            </Title>
                        </FlexBox>
                        <Text style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                          SKU: {producto.SKUID} • Marca: {producto.MARCA || 'Sin marca'}
                        </Text>
                        <Text style={{ fontSize: '0.75rem', color: '#888' }}>
                          Categorías: {producto.CATEGORIAS?.join(', ') || 'Sin categoría'}
                        </Text>
                      </FlexBox>
                      <FlexBox direction="Column" alignItems="End" style={{ gap: '0.25rem' }}>
                        <ObjectStatus state="Success" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                          ${producto.PRECIO?.toLocaleString() || 'N/A'}
                        </ObjectStatus>
                        <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                          Agregado: {new Date(producto.REGDATE).toLocaleDateString()}
                        </Text>
                      </FlexBox>
                      </FlexBox>
                    </FlexBox>
                  </Card>
                ))}
                
                {getFilteredProducts().length > 20 && (
                  <MessageStrip type="Information" icon="hint" style={{ marginTop: '1rem' }}>
                    Mostrando primeros 20 de {getFilteredProducts().length} productos. 
                    La promoción incluirá todos los productos filtrados.
                  </MessageStrip>
                )}
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
        <div style={{ padding: '1rem' }}>
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
              <div style={{ padding: '1rem' }}>
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
        style={{ width: '600px' }}
      >
        <div style={{ padding: '1rem' }}>
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
              <strong>Resumen:</strong> Se aplicará a {selectedProducts.size} producto(s) seleccionado(s)
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
    </div>
  );
};

export default AdvancedFilters;