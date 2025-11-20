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
  ComboBoxItem,
  ObjectStatus,
  BusyIndicator,
  Icon
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';


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
  const [selectedProducts, setSelectedProducts] = useState(preselectedProducts);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para presentaciones
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [productPresentaciones, setProductPresentaciones] = useState({});
  const [selectedPresentaciones, setSelectedPresentaciones] = useState(new Set());
  const [presentacionesPrecios, setPresentacionesPrecios] = useState({});
  const [lockedPresentaciones, setLockedPresentaciones] = useState(new Set());

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
      
      console.log('¿Cargando presentaciones pre-seleccionadas:', preselectedPresentaciones);
      
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
        
        console.log('Presentaciones cargadas:', {
          productos: skuidsUnicos.size,
          presentacionesBloqueadas: idsPresent.size,
          presentacionesTotales: todasLasPresentaciones.length
        });
        
      } catch (error) {
        console.error('Error cargando presentaciones pre-seleccionadas:', error);
      }
    };

    loadPreselectedPresentaciones();
  }, [preselectedPresentaciones]);

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

      // Log de resumen una sola vez
      console.log(`✅ Datos cargados: ${productosData.length} productos, ${categoriasData.length} categorías, ${marcasConConteo.length} marcas`);

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

  // OBTENER PRODUCTOS FILTRADOS COMPLETOS (con todos los filtros aplicados)
  const getFilteredProducts = () => {
    if (productos.length === 0) return [];
    
    const filtered = productos.filter(producto => {
      // Solo mostrar productos activos y no eliminados
      if (!producto.ACTIVED || producto.DELETED) {
        return false;
      }
      
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
    
    return filtered;
  };

  // FUNCIONES DE SELECCIÓN DE PRODUCTOS
  const toggleProductSelection = async (productId) => {
    // No permitir deseleccionar productos bloqueados
    if (lockedProducts.has(productId)) {
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
      
      // Cargar presentaciones si no están cargadas
      if (!productPresentaciones[productId]) {
        await loadPresentaciones(productId);
      }
      
      // Seleccionar todas las presentaciones activas del producto
      const presentaciones = productPresentaciones[productId] || [];
      const presentacionesActivas = presentaciones.filter(p => 
        p.ACTIVED && !lockedPresentaciones.has(p.IdPresentaOK)
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
      
      // Deseleccionar todas las presentaciones del producto (excepto las bloqueadas)
      const presentaciones = productPresentaciones[productId] || [];
      setSelectedPresentaciones(prev => {
        const newSel = new Set(prev);
        presentaciones.forEach(p => {
          if (!lockedPresentaciones.has(p.IdPresentaOK)) {
            newSel.delete(p.IdPresentaOK);
          }
        });
        return newSel;
      });
    }
  };

  const selectAllProducts = async () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    setSelectedProducts(new Set(allProductIds));
    
    // Cargar y seleccionar todas las presentaciones de todos los productos
    for (const skuid of allProductIds) {
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
    }
  };

  const deselectAllProducts = () => {
    // Mantener los productos bloqueados incluso al limpiar
    setSelectedProducts(new Set(lockedProducts));
    
    // Limpiar todas las presentaciones seleccionadas
    setSelectedPresentaciones(new Set());
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
    } catch (error) {
      console.error(`Error loading presentaciones for ${skuid}:`, error);
      setProductPresentaciones(prev => ({
        ...prev,
        [skuid]: []
      }));
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
        alignItems: 'stretch',
        // overflow: 'hidden'
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

        <div style={{ 
          padding: '0.75rem',
          paddingBottom: '1.5rem',
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
        </Card>

        {/* COLUMNA DERECHA - PRODUCTOS ENCONTRADOS */}
        <Card style={{ 
          flex: '1',
          minWidth: '400px',
          maxHeight: 'calc(100vh - 180px)',
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
            maxHeight: '60vh'
          }}>
            {loading ? (
              <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                <BusyIndicator active size="Large" />
              </FlexBox>
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

                {getFilteredProducts().length === 0 ? (
                  <MessageStrip type="Information" icon="search" style={{ marginTop: '1rem' }}>
                    {getActiveFiltersCount() === 0 ? 
                      'Aplica filtros para ver productos específicos' : 
                      'No hay productos que coincidan con los filtros seleccionados'
                    }
                  </MessageStrip>
                ) : (
                  <>
                    {/* Controles de selección */}
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ 
                      padding: '0.0rem', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      border: '1px solid #e9ecef',
                    }}>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem'}}>
                        <CheckBox 
                          checked={selectedProducts.size === getFilteredProducts().length && getFilteredProducts().length > 0}
                          indeterminate={selectedProducts.size > 0 && selectedProducts.size < getFilteredProducts().length}
                          onChange={(e) => e.target.checked ? selectAllProducts() : deselectAllProducts()}
                          text={`Seleccionar todos (${getFilteredProducts().length})`}
                        />
                      </FlexBox>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem', paddingRight: '.5rem'}}>
                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                          {selectedPresentaciones.size} presentación(es) seleccionada(s)
                        </Text>
                        {selectedProducts.size > 0 && (
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
                  gap: '0.5rem',
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
                                flex: 1,
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
                      </div>
                    )}
                  </div>
                ))}
                </FlexBox>
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