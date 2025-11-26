import React, { useEffect, useState } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  FlexBoxDirection,
  BusyIndicator,
  Card,
  CardHeader,
  Tag,
  Input,
  Carousel,
  Icon
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import preciosItemsService from '../../api/preciosItemsService';
import productPresentacionesService from '../../api/productPresentacionesService';
//import PrecioListaPresentacionPrice from '../CRUDprecios/PrecioListaPresentacionPrice';
import PrecioListaPresentacionActions from '../CRUDprecios/PrecioListaPresentacionActions';

const PrecioSkuModal = ({ skuId, skusList, idListaOK, open, onClose }) => {
  const [producto, setProducto] = useState(null);
  const [productosLista, setProductosLista] = useState([]);
  const [presentacionesPorSKU, setPresentacionesPorSKU] = useState({});
  const [archivosPorSKU, setArchivosPorSKU] = useState({});
  const [preciosEditados, setPreciosEditados] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [preciosIdMap, setPreciosIdMap] = useState({}); // Guardar IdPrecioOK de cada SKU
  const [expandedProducts, setExpandedProducts] = useState({}); // Rastrear productos expandidos
  const [expandedPresentaciones, setExpandedPresentaciones] = useState({}); // Rastrear presentaciones expandidas
  const [searchSKU, setSearchSKU] = useState(''); // Buscador de SKUs/productos
  const [expandedImages, setExpandedImages] = useState({}); // Rastrear imágenes expandidas por SKU

  // Cargar producto al abrir
  useEffect(() => {
    if (open && skusList && skusList.length > 0) {
      console.log('Modal abierta con skusList:', skusList);
      // Cargar PRIMERO los precios de esta lista específica
      loadPreciosParaEstaLista();
    } else if (open) {
      console.warn('Modal abierta pero skusList está vacío o no definido:', skusList);
    }
  }, [open, skusList, idListaOK]);

  const loadPreciosParaEstaLista = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Cargando precios SOLO para esta lista:', idListaOK);
      
      if (!idListaOK) {
        console.error('No se proporcionó idListaOK');
        setError('ID de lista no válido');
        setLoading(false);
        return;
      }
      
      // Cargar SOLO los precios de ESTA lista
      const preciosDelista = await preciosItemsService.getPricesByIdListaOK(idListaOK);
      console.log('Precios cargados para esta lista:', preciosDelista);
      
      // Ahora cargamos los productos
      await loadProductosLista(preciosDelista);
    } catch (err) {
      console.error('Error al cargar precios para esta lista:', err);
      // Continuar sin precios, pero cargar los productos de todas formas
      console.log('Continuando sin precios de la API, cargando productos...');
      setError('Error al cargar los precios');
      await loadProductosLista([]);
    }
  };

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setExpandedProducts({});
      setExpandedPresentaciones({});
      setExpandedImages({});
      setSearchSKU('');
    }
  }, [open]);

  const loadProductData = async () => {
    setLoading(true);
    setError('');
    try {
      const productoResponse = await productService.getProductById(skuId);
      if (Array.isArray(productoResponse) && productoResponse.length > 0) {
        setProducto(productoResponse[0]);
      } else if (productoResponse) {
        setProducto(productoResponse);
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('Error al cargar los datos del SKU');
    } finally {
      setLoading(false);
    }
  };

  const loadProductosLista = async (preciosDeLaLista) => {
    try {
      setLoading(true);
      setError('');
  
      // 1. Cargar todos los productos y todas las presentaciones en paralelo
      const [allProductsResponse, allPresentaciones] = await Promise.all([
        productService.getAllProducts(),
        productPresentacionesService.getAllPresentaciones()
      ]);
  
      // Extraer datos de la respuesta de productos
      const allProducts = allProductsResponse?.value?.[0]?.data?.[0]?.dataRes ?? allProductsResponse?.dataRes ?? allProductsResponse?.data ?? [];
  
      // 2. Crear mapas para búsqueda local eficiente
      const allProductsMap = new Map(allProducts.map(p => [p.SKUID, p]));
      const allPresentacionesMap = new Map();
      for (const pres of allPresentaciones) {
        if (!allPresentacionesMap.has(pres.SKUID)) {
          allPresentacionesMap.set(pres.SKUID, []);
        }
        allPresentacionesMap.get(pres.SKUID).push(pres);
      }
  
      // 3. Procesar los datos para este modal
      const productosFinales = [];
      const presentacionesPorSkuFinal = {};
      const archivosPorSkuFinal = {};
      const preciosMap = {};
      const preciosIds = {};
  
      // Mapear precios de la lista actual
      if (Array.isArray(preciosDeLaLista)) {
        preciosDeLaLista.forEach(item => {
          if (item.SKUID && item.Precio) {
            preciosMap[item.SKUID] = item.Precio;
            preciosIds[item.SKUID] = item.IdPrecioOK;
          }
        });
      }
  
      // 4. Filtrar y organizar los productos y presentaciones para los SKUs de esta lista
      for (const sku of skusList) {
        const producto = allProductsMap.get(sku);
        if (producto) {
          // Agregar el precio al producto
          producto.Precio = preciosMap[sku] || null;
          productosFinales.push(producto);
  
          // Obtener presentaciones para este SKU del mapa
          const presentaciones = allPresentacionesMap.get(sku) || [];
          presentacionesPorSkuFinal[sku] = presentaciones;
  
          // Extraer archivos de las presentaciones
          let archivosDelSKU = [];
          if (Array.isArray(presentaciones)) {
            presentaciones.forEach(presenta => {
              if (presenta.files && Array.isArray(presenta.files)) {
                archivosDelSKU = archivosDelSKU.concat(presenta.files);
              }
            });
          }
          archivosPorSkuFinal[sku] = archivosDelSKU;
        }
      }
  
      // 5. Actualizar el estado del componente
      setProductosLista(productosFinales);
      setPresentacionesPorSKU(presentacionesPorSkuFinal);
      setArchivosPorSKU(archivosPorSkuFinal);
      setPreciosIdMap(preciosIds);
  
      // Inicializar preciosEditados con los precios actuales
      const preciosIniciales = {};
      productosFinales.forEach(prod => {
        preciosIniciales[prod.SKUID] = prod.Precio || '';
      });
      setPreciosEditados(preciosIniciales);
    } catch (err) {
      console.error('Error al cargar lista de productos:', err);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handlePrecioChange = (skuId, valor) => {
    setPreciosEditados({
      ...preciosEditados,
      [skuId]: valor
    });
  };

  const handleGuardarPrecios = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const actualizaciones = [];
      
      // Recorrer cada SKU que fue editado
      for (const [skuId, nuevoPrecio] of Object.entries(preciosEditados)) {
        const idPrecioOK = preciosIdMap[skuId];
        
        // Solo actualizar si el precio cambió y existe un ID de precio
        if (idPrecioOK && nuevoPrecio && nuevoPrecio !== '') {
          actualizaciones.push(
            preciosItemsService.updatePrice(idPrecioOK, parseFloat(nuevoPrecio))
              .then(() => ({ skuId, ok: true }))
              .catch(err => ({ skuId, ok: false, error: err.message }))
          );
        }
      }

      if (actualizaciones.length === 0) {
        setSaveMessage('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      const resultados = await Promise.all(actualizaciones);
      const exitosos = resultados.filter(r => r.ok).length;
      const fallidos = resultados.filter(r => !r.ok).length;

      if (fallidos > 0) {
        setSaveMessage(`✓ ${exitosos} precios guardados. ✗ ${fallidos} errores.`);
        console.error('Errores al guardar:', resultados.filter(r => !r.ok));
      } else {
        setSaveMessage(`✓ ¡${exitosos} precios guardados exitosamente!`);
      }
    } catch (err) {
      console.error('Error al guardar precios:', err);
      setSaveMessage('Error al guardar los precios');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const toggleProductExpanded = (skuid) => {
    setExpandedProducts(prev => ({
      ...prev,
      [skuid]: !prev[skuid]
    }));
  };

  const togglePresentacionExpanded = (presentacionId) => {
    setExpandedPresentaciones(prev => ({
      ...prev,
      [presentacionId]: !prev[presentacionId]
    }));
  };

  const filterProductos = (productos) => {
    if (!searchSKU.trim()) return productos;
    
    const searchLower = searchSKU.toLowerCase();
    return productos.filter(prod => 
      (prod.SKUID && prod.SKUID.toLowerCase().includes(searchLower)) ||
      (prod.PRODUCTNAME && prod.PRODUCTNAME.toLowerCase().includes(searchLower)) ||
      (prod.MARCA && prod.MARCA.toLowerCase().includes(searchLower))
    );
  };

  const toggleImagesExpanded = (skuId) => {
    setExpandedImages(prev => ({
      ...prev,
      [skuId]: !prev[skuId]
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar startContent={<Title>Productos Registrados en esta Lista</Title>} />}
      footer={
        <Bar endContent={
          <FlexBox style={{ gap: '0.5rem' }}>
            <Button 
              design="Emphasized" 
              onClick={handleGuardarPrecios}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Precios'}
            </Button>
            <Button design="Transparent" onClick={onClose}>
              Cerrar
            </Button>
          </FlexBox>
        } />
      }
      style={{ 
        width: window.innerWidth < 768 ? '100vw' : window.innerWidth < 1024 ? '95vw' : '1200px', 
        maxHeight: '95vh',
        margin: window.innerWidth < 768 ? '0' : 'auto'
      }}
    >
      <FlexBox
        direction={FlexBoxDirection.Column}
        style={{
          width: '100%',
          padding: window.innerWidth < 768 ? '1rem' : '2rem',
          gap: '2rem',
          maxHeight: 'calc(95vh - 120px)',
          overflowY: 'auto'
        }}
      >
        {loading && (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '200px' }}>
            <BusyIndicator active />
          </FlexBox>
        )}

        {error && (
          <Text style={{ color: '#c00', fontWeight: 'bold' }}>{error}</Text>
        )}

        {saveMessage && (
          <Text style={{ 
            color: saveMessage.includes('Error') || saveMessage.includes('✗') ? '#c00' : '#2e7d32', 
            fontWeight: 'bold',
            backgroundColor: saveMessage.includes('Error') || saveMessage.includes('✗') ? '#ffebee' : '#e8f5e9',
            padding: '0.75rem',
            borderRadius: '0.25rem'
          }}>
            {saveMessage}
          </Text>
        )}

        {!loading && productosLista && productosLista.length > 0 && (
          <>
            <FlexBox direction="Row" style={{ gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <Title level="H5" style={{ margin: '0' }}>
                SKUs en esta Lista ({productosLista.length})
              </Title>
              <Input
                icon={<Icon name="search" />}
                placeholder="Buscar por producto o presentación..."
                value={searchSKU}
                onChange={(e) => setSearchSKU(e.target.value)}
                style={{ 
                  width: window.innerWidth < 768 ? '100%' : window.innerWidth < 1024 ? '200px' : '300px',
                  marginLeft: window.innerWidth < 768 ? '0' : 'auto',
                  minWidth: '150px'
                }}
              />
            </FlexBox>

            <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
              {filterProductos(productosLista).map((producto) => (
                <FlexBox key={producto.SKUID} direction="Column" style={{ gap: '0' }}>
                  {/* Producto Padre - Expandible */}
                  <div
                    onClick={() => toggleProductExpanded(producto.SKUID)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      marginBottom: expandedProducts[producto.SKUID] ? '0' : '0.75rem',
                      borderBottomLeftRadius: expandedProducts[producto.SKUID] ? '0' : '4px',
                      borderBottomRightRadius: expandedProducts[producto.SKUID] ? '0' : '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <Icon
                      name={expandedProducts[producto.SKUID] ? 'navigation-down-arrow' : 'navigation-right-arrow'}
                      style={{ color: '#0076d7', marginRight: '0.5rem', fontSize: '1.2rem' }}
                    />
                    <div style={{ flex: 1, paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0076d7', minWidth: '150px' }}>
                          {producto.SKUID}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#333', flex: 1 }}>
                          {producto.PRODUCTNAME || 'Sin nombre'}
                        </div>
                      </div>
                      {producto.MARCA && (
                        <div style={{ fontSize: '0.8rem', color: '#666', paddingLeft: '0' }}>
                          Marca: {producto.MARCA}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido Expandido */}
                  {expandedProducts[producto.SKUID] && (
                    <FlexBox
                      direction="Column"
                      style={{
                        backgroundColor: '#fafafa',
                        borderLeft: '1px solid #e0e0e0',
                        borderRight: '1px solid #e0e0e0',
                        borderBottom: '1px solid #e0e0e0',
                        borderBottomLeftRadius: '4px',
                        borderBottomRightRadius: '4px',
                        padding: '1rem',
                        gap: '1rem',
                        marginBottom: '0.75rem'
                      }}
                    >
                      {/* Imágenes */}
                      {archivosPorSKU[producto.SKUID] && archivosPorSKU[producto.SKUID].filter(f => f.FILETYPE === 'IMG').length > 0 && (
                        <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                          <div
                            onClick={() => toggleImagesExpanded(producto.SKUID)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              backgroundColor: '#f9f9f9',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                          >
                            <Icon
                              name={expandedImages[producto.SKUID] ? 'navigation-down-arrow' : 'navigation-right-arrow'}
                              style={{ color: '#0076d7', fontSize: '0.9rem' }}
                            />
                            <Icon name="image" style={{ marginRight: '0.25rem', color: '#0076d7' }} />
                            <Label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333', margin: '0' }}>
                              Imágenes ({archivosPorSKU[producto.SKUID].filter(f => f.FILETYPE === 'IMG').length})
                            </Label>
                          </div>

                          {expandedImages[producto.SKUID] && (
                            <Carousel
                              style={{
                                width: '100%',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0',
                                height: window.innerWidth < 768 ? '150px' : '200px'
                              }}
                            >
                              {archivosPorSKU[producto.SKUID].filter(f => f.FILETYPE === 'IMG').map((file, fidx) => (
                                <FlexBox
                                  key={file.FILEID || fidx}
                                  alignItems="Center"
                                  justifyContent="Center"
                                  style={{
                                    height: window.innerWidth < 768 ? '150px' : '200px',
                                    padding: '0.5rem',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <img
                                    src={file.FILE}
                                    alt={file.INFOAD || `Imagen ${fidx + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: window.innerWidth < 768 ? '100%' : '500px',
                                      maxHeight: window.innerWidth < 768 ? '150px' : '200px',
                                      objectFit: 'contain',
                                      borderRadius: '4px',
                                      display: 'block'
                                    }}
                                  />
                                </FlexBox>
                              ))}
                            </Carousel>
                          )}
                        </FlexBox>
                      )}

                      {/* Presentaciones */}
                      {presentacionesPorSKU[producto.SKUID] && presentacionesPorSKU[producto.SKUID].length > 0 && (
                        <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                          <Label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333' }}>
                            Presentaciones ({presentacionesPorSKU[producto.SKUID].length})
                          </Label>
                          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                            {presentacionesPorSKU[producto.SKUID].map((presenta) => {
                              const presentacionKey = `${producto.SKUID}-${presenta.IdPresentaOK}`;
                              return (
                                <FlexBox key={presentacionKey} direction="Column" style={{ gap: '0' }}>
                                  {/* Presentación - Rectángulo con despliegue vacío */}
                                  <div
                                    onClick={() => togglePresentacionExpanded(presentacionKey)}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 0.8rem',
                                      backgroundColor: '#fff',
                                      border: '1px solid #d0d0d0',
                                      borderRadius: '4px',
                                      marginBottom: expandedPresentaciones[presentacionKey] ? '0' : '0.5rem',
                                      borderBottomLeftRadius: expandedPresentaciones[presentacionKey] ? '0' : '4px',
                                      borderBottomRightRadius: expandedPresentaciones[presentacionKey] ? '0' : '4px',
                                      display: 'flex',
                                      gap: '0.5rem',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Icon
                                      name={expandedPresentaciones[presentacionKey] ? 'navigation-down-arrow' : 'navigation-right-arrow'}
                                      style={{ color: '#666', fontSize: '0.8rem', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                                        {presenta.IdPresentaOK}
                                      </div>
                                      {presenta.Presentacion && (
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                          {presenta.Presentacion}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* AÑADE AQUÍ EL NUEVO COMPONENTE DE ACCIONES */}
                                    <FlexBox style={{ flex: 1, paddingTop: '1rem'}}>
                                      <PrecioListaPresentacionActions
                                        idPresentaOK={presenta.IdPresentaOK}
                                        skuid={producto.SKUID} // Producto sí está definido en este scope (map de presentaciones anidado)
                                        idListaOK={idListaOK}
                                      />
                                    </FlexBox>
                                  </div>

                                  {/* Detalles de Presentación Expandidos */}
                                                                    {/* Detalles de Presentación Expandidos */}
                                  {expandedPresentaciones[presentacionKey] && (
                                    <FlexBox
                                      direction="Column"
                                      style={{
                                        backgroundColor: '#fff',
                                        borderLeft: '1px solid #d0d0d0',
                                        borderRight: '1px solid #d0d0d0',
                                        borderBottom: '1px solid #d0d0d0',
                                        borderBottomLeftRadius: '4px',
                                        borderBottomRightRadius: '4px',
                                        padding: '0.75rem',
                                        gap: '0.75rem'
                                      }}
                                    >
                                      {presenta.Descripcion && (
                                        <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                                          <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                            Descripción
                                          </Label>
                                          <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                                            {presenta.Descripcion}
                                          </Text>
                                        </FlexBox>
                                      )}

                                      {presenta.BARCODE && (
                                        <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                                          <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                            Código de Barras
                                          </Label>
                                          <Text
                                            style={{
                                              fontSize: '0.8rem',
                                              color: '#333',
                                              fontFamily: 'monospace'
                                            }}
                                          >
                                            {presenta.BARCODE}
                                          </Text>
                                        </FlexBox>
                                      )}

                                      <FlexBox style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
                                        {presenta.CostoIni && (
                                          <FlexBox
                                            direction="Column"
                                            style={{ gap: '0.25rem', flex: '1 1 45%', minWidth: '150px' }}
                                          >
                                            <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                              Costo Inicial
                                            </Label>
                                            <Text style={{ fontSize: '0.8rem', color: '#2e7d32' }}>
                                              $
                                              {presenta.CostoIni.toLocaleString('es-ES', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                              })}
                                            </Text>
                                          </FlexBox>
                                        )}

                                        {presenta.CostoFin && (
                                          <FlexBox
                                            direction="Column"
                                            style={{ gap: '0.25rem', flex: '1 1 45%', minWidth: '150px' }}
                                          >
                                            <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                              Costo Final
                                            </Label>
                                            <Text style={{ fontSize: '0.8rem', color: '#2e7d32' }}>
                                              $
                                              {presenta.CostoFin.toLocaleString('es-ES', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                              })}
                                            </Text>
                                          </FlexBox>
                                        )}

                                        {presenta.REGUSER && (
                                          <FlexBox
                                            direction="Column"
                                            style={{ gap: '0.25rem', flex: '1 1 45%', minWidth: '150px' }}
                                          >
                                            <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                              Registrado por
                                            </Label>
                                            <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                                              {presenta.REGUSER}
                                            </Text>
                                          </FlexBox>
                                        )}

                                        {presenta.REGDATE && (
                                          <FlexBox
                                            direction="Column"
                                            style={{ gap: '0.25rem', flex: '1 1 45%', minWidth: '150px' }}
                                          >
                                            <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                              Fecha Registro
                                            </Label>
                                            <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                                              {formatDate(presenta.REGDATE)}
                                            </Text>
                                          </FlexBox>
                                        )}

                                        {presenta.ACTIVED !== undefined && (
                                          <FlexBox
                                            direction="Column"
                                            style={{ gap: '0.25rem', flex: '1 1 45%', minWidth: '150px' }}
                                          >
                                            <Label style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}>
                                              Estado
                                            </Label>
                                            <Text
                                              style={{
                                                fontSize: '0.8rem',
                                                color: presenta.ACTIVED ? '#2e7d32' : '#c00',
                                                fontWeight: 500
                                              }}
                                            >
                                              {presenta.ACTIVED ? '✓ Activo' : '✗ Inactivo'}
                                            </Text>
                                          </FlexBox>
                                        )}
                                      </FlexBox>
                                    </FlexBox>
                                  )}   
                                </FlexBox>
                              );
                            })}
                            {filterProductos(productosLista).length === 0 && searchSKU.trim() && (
                              <Text style={{ color: '#888', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
                                No se encontraron productos que coincidan con la búsqueda
                              </Text>
                            )}
                          </FlexBox>
                          
                        </FlexBox>
                      )}
                      
                    </FlexBox>
                  )}
                </FlexBox>
              ))}
            </FlexBox>
          </>
        )}

        {!loading && (!productosLista || productosLista.length === 0) && (
          <Text style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
            No hay productos disponibles en esta lista
          </Text>
        )}
      </FlexBox>
    </Dialog>
  );
};

export default PrecioSkuModal;
