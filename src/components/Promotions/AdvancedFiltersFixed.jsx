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
  BusyIndicator
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';

const AdvancedFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    categorias: [],
    marcas: [],
    temporada: '',
    precioMin: '',
    precioMax: '',
    stockNivel: '',
    fechaIngresoDesde: '',
    fechaIngresoHasta: '',
    productosNuevos: false,
    conDescuento: false,
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

  // 🎯 TEMPORADAS ESTÁTICAS (basadas en fechas)
  const TEMPORADAS = [
    { 
      id: 'HALLOWEEN_2025', 
      name: 'Halloween 2025', 
      fechaInicio: '2025-10-25', 
      fechaFin: '2025-11-02',
      categoriasSugeridas: ['CAT_DECORATIONS', 'CAT_TOYS'],
      activa: true,
      icono: '🎃'
    },
    { 
      id: 'BLACK_FRIDAY_2025', 
      name: 'Black Friday 2025', 
      fechaInicio: '2025-11-29', 
      fechaFin: '2025-12-02',
      categoriasSugeridas: ['CAT_ELECTRONICS', 'CAT_CLOTHING'],
      activa: false,
      icono: '🛍️'
    },
    { 
      id: 'NAVIDAD_2025', 
      name: 'Navidad 2025', 
      fechaInicio: '2025-12-01', 
      fechaFin: '2025-12-31',
      categoriasSugeridas: ['CAT_TOYS', 'CAT_HOME'],
      activa: false,
      icono: '🎄'
    },
    { 
      id: 'SAN_VALENTIN_2026', 
      name: 'San Valentín 2026', 
      fechaInicio: '2026-02-10', 
      fechaFin: '2026-02-16',
      categoriasSugeridas: ['CAT_CLOTHING', 'CAT_JEWELRY'],
      activa: false,
      icono: '💖'
    }
  ];

  // 📊 RANGOS DE PRECIOS ESTÁTICOS
  const RANGOS_PRECIOS = [
    { id: 'BAJO', name: 'Bajo ($0 - $500)', min: 0, max: 500 },
    { id: 'MEDIO', name: 'Medio ($500 - $2,000)', min: 500, max: 2000 },
    { id: 'ALTO', name: 'Alto ($2,000 - $10,000)', min: 2000, max: 10000 },
    { id: 'PREMIUM', name: 'Premium ($10,000+)', min: 10000, max: null }
  ];

  // 📦 NIVELES DE STOCK ESTÁTICOS  
  const NIVELES_STOCK = [
    { id: 'ALTO', name: 'Stock Alto (50+ unidades)', min: 50 },
    { id: 'MEDIO', name: 'Stock Medio (10-49 unidades)', min: 10, max: 49 },
    { id: 'BAJO', name: 'Stock Bajo (1-9 unidades)', min: 1, max: 9 },
    { id: 'AGOTADO', name: 'Sin Stock (0 unidades)', min: 0, max: 0 }
  ];

  // 🔄 CARGAR DATOS REALES AL MONTAR COMPONENTE
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Iniciando carga de datos...');
      
      // Cargar productos
      let productosData = [];
      try {
        console.log('📦 Cargando productos...');
        const productosResponse = await productService.getAllProducts();
        console.log('📦 Respuesta productos:', productosResponse);
        
        // Extraer productos usando tu estructura específica
        if (productosResponse?.data?.[0]?.dataRes && Array.isArray(productosResponse.data[0].dataRes)) {
          productosData = productosResponse.data[0].dataRes;
          console.log('✅ Productos extraídos:', productosData.length);
        } else {
          console.log('❌ Estructura de productos no reconocida');
        }
        
      } catch (prodError) {
        console.error('❌ Error cargando productos:', prodError);
      }

      // Cargar categorías
      let categoriasData = [];
      try {
        console.log('📁 Cargando categorías...');
        const categoriasResponse = await categoryService.getAllCategories();
        console.log('📁 Respuesta categorías:', categoriasResponse);
        
        // Extraer categorías usando tu estructura específica
        if (categoriasResponse?.data?.[0]?.dataRes && Array.isArray(categoriasResponse.data[0].dataRes)) {
          categoriasData = categoriasResponse.data[0].dataRes;
          console.log('✅ Categorías extraídas:', categoriasData.length);
        } else {
          console.log('❌ Estructura de categorías no reconocida');
        }
        
      } catch (catError) {
        console.error('❌ Error cargando categorías:', catError);
      }

      // Procesar y establecer datos
      setProductos(productosData);
      
      // Filtrar categorías activas
      const categoriasActivas = categoriasData.filter(cat => 
        cat && cat.ACTIVED === true && cat.DELETED === false
      );
      setCategorias(categoriasActivas);
      console.log('📁 Categorías activas:', categoriasActivas.length);

      // Extraer marcas de productos
      if (productosData.length > 0) {
        const productosConMarca = productosData.filter(p => 
          p && p.MARCA && typeof p.MARCA === 'string' && p.MARCA.trim() !== ''
        );
        
        const marcasUnicas = [...new Set(
          productosConMarca.map(p => p.MARCA.trim())
        )];
        
        const marcasConConteo = marcasUnicas.map(marca => ({ 
          id: marca.toUpperCase().replace(/\s+/g, '_'), 
          name: marca,
          productos: productosData.filter(p => p.MARCA === marca).length
        }));

        setMarcas(marcasConConteo);
        console.log('🏷️ Marcas extraídas:', marcasConConteo.length);
      }

      console.log('✅ Carga completada:', {
        productos: productosData.length,
        categorias: categoriasActivas.length,
        marcas: marcas.length
      });

    } catch (err) {
      console.error('❌ Error general:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Detectar temporada activa
  useEffect(() => {
    const hoy = new Date();
    const temporadaActivaEncontrada = TEMPORADAS.find(temp => {
      const inicio = new Date(temp.fechaInicio);
      const fin = new Date(temp.fechaFin);
      return hoy >= inicio && hoy <= fin;
    });
    
    if (temporadaActivaEncontrada) {
      setTemporadaActiva(temporadaActivaEncontrada);
      handleFilterChange('temporada', temporadaActivaEncontrada.id);
    }
  }, []);

  // Notificar cambios de filtros
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

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
      stockNivel: '',
      fechaIngresoDesde: '',
      fechaIngresoHasta: '',
      productosNuevos: false,
      conDescuento: false
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categorias.length > 0) count++;
    if (filters.marcas.length > 0) count++;
    if (filters.temporada) count++;
    if (filters.precioMin || filters.precioMax) count++;
    if (filters.stockNivel) count++;
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) count++;
    if (filters.productosNuevos) count++;
    if (filters.conDescuento) count++;
    return count;
  };

  const getEstimatedProductCount = () => {
    if (productos.length === 0) return 0;
    
    let filteredProducts = productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) return false;
      
      if (filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA)) return false;
      }
      
      if (filters.categorias.length > 0) {
        // Adaptar según tu estructura de categorías en productos
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          const hasCategory = producto.CATEGORIAS.some(cat => filters.categorias.includes(cat));
          if (!hasCategory) return false;
        }
      }
      
      if (filters.productosNuevos) {
        const fechaCreacion = new Date(producto.REGDATE);
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        if (fechaCreacion < hace30Dias) return false;
      }
      
      return true;
    });
    
    return filteredProducts.length;
  };

  return (
    <Card style={{ margin: '1rem 0' }}>
      <CardHeader
        titleText="🔍 Filtros Avanzados para Promociones"
        subtitleText={loading ? 'Cargando datos...' : `${getActiveFiltersCount()} filtros activos • ~${getEstimatedProductCount()} productos encontrados`}
        action={
          <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
            {loading && <BusyIndicator active size="Small" />}
            {getActiveFiltersCount() > 0 && (
              <ObjectStatus state="Success">
                {getActiveFiltersCount()} activos
              </ObjectStatus>
            )}
            <Button 
              design="Transparent" 
              icon="collapse-group"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              {filtersExpanded ? 'Colapsar' : 'Expandir'}
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

      {/* DEBUG INFO */}
      <MessageStrip 
        type="Information" 
        style={{ margin: '1rem' }}
      >
        🔍 DEBUG: Productos={productos.length}, Categorías={categorias.length}, Marcas={marcas.length}
        <Button 
          design="Transparent" 
          onClick={loadData} 
          style={{ marginLeft: '1rem' }}
        >
          🔄 Recargar
        </Button>
      </MessageStrip>

      {filtersExpanded && (
        <div style={{ padding: '1rem' }}>
          {/* Alerta de Temporada Activa */}
          {temporadaActiva && (
            <MessageStrip 
              type="Information" 
              style={{ marginBottom: '1rem' }}
              hideIcon={false}
            >
              <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                <Text style={{ fontSize: '1.2rem' }}>{temporadaActiva.icono}</Text>
                <Text>
                  <strong>¡{temporadaActiva.name} está activa!</strong> 
                  Temporada especial detectada automáticamente.
                </Text>
              </FlexBox>
            </MessageStrip>
          )}

          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            
            {/* 🎯 FILTROS POR TEMPORADA */}
            <Card header={<CardHeader titleText="🎃 Filtros por Temporada" />}>
              <div style={{ padding: '1rem' }}>
                <Label>Temporada Especial:</Label>
                <Select
                  value={filters.temporada}
                  onChange={(e) => handleFilterChange('temporada', e.target.value)}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <Option value="">Ninguna temporada</Option>
                  {TEMPORADAS.map(temp => (
                    <Option key={temp.id} value={temp.id}>
                      {temp.icono} {temp.name} {temp.activa ? '(ACTIVA)' : ''}
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* 📁 FILTROS POR CATEGORÍA */}
            <Card header={<CardHeader titleText="📁 Filtros por Categoría" />}>
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
                    {loading ? 'Cargando categorías...' : `No hay categorías disponibles (encontradas: ${categorias.length})`}
                  </Text>
                )}
              </div>
            </Card>

            {/* 🏷️ FILTROS POR MARCA */}
            <Card header={<CardHeader titleText="🏷️ Filtros por Marca" />}>
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
                    {loading ? 'Cargando marcas...' : `No hay marcas disponibles (encontradas: ${marcas.length})`}
                  </Text>
                )}
              </div>
            </Card>

            {/* 💰 FILTROS POR PRECIO */}
            <Card header={<CardHeader titleText="💰 Filtros por Precio" />}>
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

            {/* 📦 FILTROS POR STOCK */}
            <Card header={<CardHeader titleText="📦 Filtros por Stock" />}>
              <div style={{ padding: '1rem' }}>
                <Label>Nivel de Inventario:</Label>
                <Select
                  value={filters.stockNivel}
                  onChange={(e) => handleFilterChange('stockNivel', e.target.value)}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <Option value="">Cualquier nivel de stock</Option>
                  {NIVELES_STOCK.map(nivel => (
                    <Option key={nivel.id} value={nivel.id}>
                      {nivel.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* 📅 FILTROS POR FECHA */}
            <Card header={<CardHeader titleText="📅 Filtros por Fecha de Ingreso" />}>
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

            {/* ⚡ FILTROS RÁPIDOS */}
            <Card header={<CardHeader titleText="⚡ Filtros Rápidos" />}>
              <div style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <CheckBox
                  checked={filters.productosNuevos}
                  onChange={(e) => handleFilterChange('productosNuevos', e.target.checked)}
                  text="🆕 Solo productos nuevos (últimos 30 días)"
                />
                
                <CheckBox
                  checked={filters.conDescuento}
                  onChange={(e) => handleFilterChange('conDescuento', e.target.checked)}
                  text="💸 Solo productos con descuento actual"
                />
              </div>
            </Card>

            {/* 🎯 RESULTADOS Y ACCIONES */}
            <FlexBox 
              justifyContent="SpaceBetween" 
              alignItems="Center"
              style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '0.5rem',
                border: '1px solid #e9ecef'
              }}
            >
              <FlexBox direction="Column">
                <Title level="H5" style={{ margin: 0 }}>
                  📊 Productos Encontrados: {getEstimatedProductCount()}
                </Title>
                <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                  {getActiveFiltersCount() > 0 
                    ? `Aplicando ${getActiveFiltersCount()} filtros activos`
                    : 'Sin filtros aplicados - mostrando todos los productos'
                  }
                </Text>
              </FlexBox>
              
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button 
                  design="Transparent"
                  icon="reset"
                  onClick={clearAllFilters}
                  disabled={getActiveFiltersCount() === 0}
                >
                  Limpiar Filtros
                </Button>
                
                <Button 
                  design="Emphasized"
                  icon="filter"
                  disabled={getEstimatedProductCount() === 0}
                >
                  Aplicar a Promoción
                </Button>
              </FlexBox>
            </FlexBox>

          </FlexBox>
        </div>
      )}
    </Card>
  );
};

export default AdvancedFilters;