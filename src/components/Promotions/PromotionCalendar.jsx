import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Button,
  Text,
  Title,
  Dialog,
  Bar,
  Select,
  Option,
  ObjectStatus,
  MessageStrip,
  Avatar,
  BusyIndicator,
  CheckBox,
  Input,
  TabContainer,
  Tab,
  Token
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import promoService from '../../api/promoService';

const PromotionCalendar = ({ promotions = [], onPromotionClick, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'year', 'timeline', 'agenda'
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showPromotionDetail, setShowPromotionDetail] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [apiPromotions, setApiPromotions] = useState([]);
  const [filters, setFilters] = useState({
    estado: 'all', // 'all', 'active', 'scheduled', 'finished'
    tipo: 'all',
    buscar: ''
  });

  // Cargar promociones desde la API
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const response = await promoService.getAllPromotions();
      
      // Estructura de tu API: data.value[0].data[0].dataRes
      let promotionsList = [];
      
      if (response && response.value && Array.isArray(response.value) && response.value.length > 0) {
        const mainResponse = response.value[0];
        if (mainResponse.data && Array.isArray(mainResponse.data) && mainResponse.data.length > 0) {
          const dataResponse = mainResponse.data[0];
          if (dataResponse.dataRes && Array.isArray(dataResponse.dataRes)) {
            promotionsList = dataResponse.dataRes;
          }
        }
      }
      
      console.log('Promociones cargadas:', promotionsList);
      setApiPromotions(promotionsList);
    } catch (error) {
      console.error('Error cargando promociones:', error);
      setApiPromotions([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  // Funciones helper para fechas
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  const getPromotionStatus = (promotion) => {
    if (!promotion) return 'finished';
    
    // Si está eliminada o no activa
    if (promotion.DELETED === true || promotion.ACTIVED === false) {
      return 'finished';
    }
    
    const today = new Date();
    const inicio = new Date(promotion.FechaIni);
    const fin = new Date(promotion.FechaFin);
    
    if (today < inicio) return 'scheduled';
    if (today >= inicio && today <= fin) return 'active';
    return 'finished';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'Success';
      case 'scheduled': return 'Information';
      case 'finished': return 'Neutral';
      default: return 'Information';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'scheduled': return 'Programada';
      case 'finished': return 'Finalizada';
      default: return 'Desconocida';
    }
  };

  // Filtrar promociones
  const getFilteredPromotions = () => {
    return apiPromotions.filter(promo => {
      const status = getPromotionStatus(promo);
      
      // Filtro por estado
      if (filters.estado !== 'all' && status !== filters.estado) return false;
      
      // Filtro por búsqueda
      if (filters.buscar && !promo.Titulo?.toLowerCase().includes(filters.buscar.toLowerCase())) return false;
      
      return true;
    });
  };

  // Obtener color basado en el tipo de promoción
  const getPromotionColor = (promotion) => {
    if (!promotion) return '#757575';
    const status = getPromotionStatus(promotion);
    
    if (status === 'active') return '#388e3c';
    if (status === 'scheduled') return '#1976d2';
    return '#757575';
  };

  // Obtener ícono basado en el tipo de promoción
  const getPromotionIcon = (promotion) => {
    if (!promotion) return '📋';
    
    const tipo = promotion.TipoPromocion || '';
    if (tipo.includes('PRODUCTO')) return '🛍️';
    if (tipo.includes('CATEGORIA')) return '📦';
    if (tipo.includes('MARCA')) return '🏷️';
    return '🎉';
  };

  // Obtener promociones por mes
  const getPromotionsForMonth = (year, month) => {
    return getFilteredPromotions().filter(promo => {
      if (!promo.FechaIni || !promo.FechaFin) return false;
      
      const inicio = new Date(promo.FechaIni);
      const fin = new Date(promo.FechaFin);
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      return (inicio <= lastDay && fin >= firstDay);
    });
  };

  // Generar días del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 semanas * 7 días
      const dayPromotions = getFilteredPromotions().filter(promo => {
        if (!promo.FechaIni || !promo.FechaFin) return false;
        
        const inicio = new Date(promo.FechaIni);
        const fin = new Date(promo.FechaFin);
        return currentDay >= inicio && currentDay <= fin;
      });

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        promotions: dayPromotions
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  // Manejar click en promoción
  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    // Cargar los productos aplicables de la promoción
    const productos = promotion.ProductosAplicables || [];
    setSelectedProducts(productos);
    setShowPromotionDetail(true);
    if (onPromotionClick) onPromotionClick(promotion);
  };

  // Cargar productos de la API
  const loadAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productService.getAllProducts();
      
      // Estructura de tu API
      let productsList = [];
      
      if (response && response.value && Array.isArray(response.value) && response.value.length > 0) {
        const mainResponse = response.value[0];
        if (mainResponse.data && Array.isArray(mainResponse.data) && mainResponse.data.length > 0) {
          const dataResponse = mainResponse.data[0];
          if (dataResponse.dataRes && Array.isArray(dataResponse.dataRes)) {
            productsList = dataResponse.dataRes;
          }
        }
      }
      
      console.log('Productos cargados:', productsList.length);
      setAllProducts(productsList || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (showPromotionDetail && allProducts.length === 0) {
      loadAllProducts();
    }
  }, [showPromotionDetail]);

  // Manejar selección de productos
  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.SKUID === product.SKUID);
      if (isSelected) {
        return prev.filter(p => p.SKUID !== product.SKUID);
      } else {
        // Agregar con el formato que espera la API
        return [...prev, {
          SKUID: product.SKUID,
          NombreProducto: product.PRODUCTNAME,
          PrecioOriginal: product.PRECIO || 0
        }];
      }
    });
  };

  // Filtrar productos disponibles
  const getFilteredAvailableProducts = () => {
    if (!allProducts.length) return [];
    
    return allProducts.filter(product => {
      const matchesSearch = !productSearchTerm || 
        product.PRODUCTNAME?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.MARCA?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.SKUID?.toLowerCase().includes(productSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Guardar cambios en productos seleccionados
  const handleSaveProductChanges = async () => {
    try {
      // Preparar los datos para actualizar
      const updateData = {
        ...selectedPromotion,
        ProductosAplicables: selectedProducts
      };
      
      // Llamar a la API para actualizar la promoción
      await promoService.updatePromotion(selectedPromotion.IdPromoOK, updateData);
      
      console.log('Productos de promoción actualizados:', {
        promocion: selectedPromotion.IdPromoOK,
        productos: selectedProducts.length
      });
      
      // Recargar promociones
      await loadPromotions();
      
      // Cerrar modal
      setShowPromotionDetail(false);
    } catch (error) {
      console.error('Error al actualizar productos:', error);
      alert('Error al guardar los cambios: ' + error.message);
    }
  };

  // Navegación de meses
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div>
      {/* Header con controles */}
      <Card style={{ marginBottom: '1rem' }}>
        <CardHeader
          titleText="Calendario Promocional"
          subtitleText={`${getFilteredPromotions().length} promociones encontradas`}
          action={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <Option value="month">Vista Mensual</Option>
                <Option value="agenda">Vista Agenda</Option>
                <Option value="timeline">Timeline</Option>
              </Select>
            </FlexBox>
          }
        />
        
        {/* Filtros */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0' }}>
          <FlexBox style={{ gap: '1rem', flexWrap: 'wrap' }}>
            
            <div>
              <Text style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Estado:</Text>
              <Select
                value={filters.estado}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                style={{ minWidth: '150px' }}
              >
                <Option value="all">Todas</Option>
                <Option value="active">🟢 Activas</Option>
                <Option value="scheduled">🔵 Programadas</Option>
                <Option value="finished">⚫ Finalizadas</Option>
              </Select>
            </div>

            <div>
              <Text style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Buscar:</Text>
              <Input
                value={filters.buscar}
                onChange={(e) => setFilters(prev => ({ ...prev, buscar: e.target.value }))}
                placeholder="Nombre de promoción..."
                style={{ minWidth: '200px' }}
              />
            </div>

            <FlexBox alignItems="End" style={{ gap: '0.5rem' }}>
              <Button design="Transparent" icon="filter">
                Más Filtros
              </Button>
              <Button design="Transparent" icon="download">
                Exportar
              </Button>
            </FlexBox>

          </FlexBox>
        </div>
      </Card>

      {/* Vista Mensual */}
      {viewMode === 'month' && (
        <Card>
          {/* Header del mes */}
          <CardHeader
            titleText={currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            action={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Transparent" icon="navigation-left-arrow" onClick={() => navigateMonth(-1)} />
                <Button design="Transparent" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                <Button design="Transparent" icon="navigation-right-arrow" onClick={() => navigateMonth(1)} />
              </FlexBox>
            }
          />

          {/* Calendario */}
          {loadingPromotions ? (
            <FlexBox justifyContent="Center" style={{ padding: '3rem' }}>
              <BusyIndicator size="Large" />
            </FlexBox>
          ) : (
            <div style={{ padding: '1rem' }}>
            {/* Días de la semana */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '1px',
              marginBottom: '1px'
            }}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} style={{ 
                  padding: '0.5rem', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  fontSize: '0.875rem'
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '1px',
              backgroundColor: '#e0e0e0'
            }}>
              {generateCalendarDays().map((day, index) => (
                <div
                  key={index}
                  style={{
                    minHeight: '100px',
                    padding: '0.25rem',
                    backgroundColor: day.isCurrentMonth ? '#ffffff' : '#fafafa',
                    border: day.isToday ? '2px solid #0f828f' : 'none',
                    position: 'relative'
                  }}
                >
                  {/* Número del día */}
                  <Text 
                    style={{ 
                      fontSize: '0.875rem',
                      fontWeight: day.isToday ? 'bold' : 'normal',
                      color: day.isCurrentMonth ? '#333' : '#999',
                      marginBottom: '0.25rem'
                    }}
                  >
                    {day.date.getDate()}
                  </Text>

                  {/* Promociones del día */}
                  <FlexBox direction="Column" style={{ gap: '0.125rem' }}>
                    {day.promotions.slice(0, 3).map(promo => {
                      const color = getPromotionColor(promo);
                      const icon = getPromotionIcon(promo);
                      return (
                        <div
                          key={promo.IdPromoOK}
                          onClick={() => handlePromotionClick(promo)}
                          style={{
                            padding: '0.125rem 0.25rem',
                            backgroundColor: color + '20',
                            border: `1px solid ${color}`,
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '0.625rem',
                            lineHeight: '1.2'
                          }}
                        >
                          <Text style={{ fontSize: '0.625rem' }}>
                            {icon} {(promo.Titulo || '').substring(0, 15)}...
                          </Text>
                        </div>
                      );
                    })}
                    {day.promotions.length > 3 && (
                      <Text style={{ fontSize: '0.5rem', color: '#666' }}>
                        +{day.promotions.length - 3} más
                      </Text>
                    )}
                  </FlexBox>
                </div>
              ))}
            </div>
            </div>
          )}
        </Card>
      )}

      {/* Vista Agenda */}
      {viewMode === 'agenda' && (
        <Card>
          <CardHeader titleText="Agenda de Promociones" />
          <div style={{ padding: '1rem' }}>
            {loadingPromotions ? (
              <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                <BusyIndicator size="Large" />
              </FlexBox>
            ) : (
              <FlexBox direction="Column" style={{ gap: '1rem' }}>
                {getFilteredPromotions()
                  .sort((a, b) => new Date(a.FechaIni) - new Date(b.FechaIni))
                  .map(promo => {
                    const status = getPromotionStatus(promo);
                    const color = getPromotionColor(promo);
                    const icon = getPromotionIcon(promo);
                    const descuento = promo.TipoDescuento === 'PORCENTAJE' ? promo.DescuentoPorcentaje : promo.DescuentoMonto;
                    const productosCount = promo.ProductosAplicables?.length || 0;
                    
                    return (
                      <Card 
                        key={promo.IdPromoOK}
                        style={{ 
                          cursor: 'pointer',
                          border: `2px solid ${color}20`,
                          borderLeft: `4px solid ${color}`
                        }}
                        onClick={() => handlePromotionClick(promo)}
                      >
                        <div style={{ padding: '1rem' }}>
                          <FlexBox justifyContent="SpaceBetween" alignItems="Start">
                            <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                              <Avatar 
                                size="M" 
                                style={{ backgroundColor: color }}
                              >
                                <Text style={{ fontSize: '1.2rem' }}>{icon}</Text>
                              </Avatar>
                              <FlexBox direction="Column">
                                <Title level="H5" style={{ margin: 0 }}>
                                  {promo.Titulo || 'Sin título'}
                                </Title>
                                <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                  {promo.Descripcion || 'Sin descripción'}
                                </Text>
                                <FlexBox style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                                  <Text style={{ fontSize: '0.75rem' }}>
                                    {formatDateFull(promo.FechaIni)} - {formatDateFull(promo.FechaFin)}
                                  </Text>
                                </FlexBox>
                              </FlexBox>
                            </FlexBox>
                            
                            <FlexBox direction="Column" alignItems="End" style={{ gap: '0.5rem' }}>
                              <ObjectStatus state={getStatusColor(status)}>
                                {getStatusText(status)}
                              </ObjectStatus>
                              <FlexBox style={{ gap: '1rem' }}>
                                <FlexBox direction="Column" alignItems="Center">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Descuento</Text>
                                  <Text style={{ fontWeight: 'bold' }}>
                                    {promo.TipoDescuento === 'PORCENTAJE' ? `${descuento}%` : `$${descuento}`}
                                  </Text>
                                </FlexBox>
                                <FlexBox direction="Column" alignItems="Center">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Productos</Text>
                                  <Text style={{ fontWeight: 'bold' }}>{productosCount}</Text>
                                </FlexBox>
                                <FlexBox direction="Column" alignItems="Center">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Tipo</Text>
                                  <Text style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    {promo.TipoPromocion || 'N/A'}
                                  </Text>
                                </FlexBox>
                              </FlexBox>
                            </FlexBox>
                          </FlexBox>
                        </div>
                      </Card>
                    );
                  })
                }
                {getFilteredPromotions().length === 0 && (
                  <MessageStrip type="Information">
                    No se encontraron promociones con los filtros aplicados.
                  </MessageStrip>
                )}
              </FlexBox>
            )}
          </div>
        </Card>
      )}

      {/* Vista Timeline */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader titleText="Timeline de Promociones" />
          <div style={{ padding: '1rem' }}>
            <MessageStrip type="Information">
              Vista Timeline será implementada en la próxima versión. Por ahora usa Vista Mensual o Agenda.
            </MessageStrip>
          </div>
        </Card>
      )}

      {/* Modal de Detalle de Promoción */}
      <Dialog
        open={showPromotionDetail}
        headerText={selectedPromotion ? `${getPromotionIcon(selectedPromotion)} ${selectedPromotion.Titulo}` : 'Detalle de Promoción'}
        style={{ width: '900px', maxWidth: '90vw' }}
        footer={
          <Bar
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Transparent" onClick={() => setShowPromotionDetail(false)}>
                  Cerrar
                </Button>
                <Button design="Emphasized" onClick={handleSaveProductChanges}>
                  💾 Guardar Cambios
                </Button>
              </FlexBox>
            }
          />
        }
      >
        {selectedPromotion && (
          <div style={{ padding: '1.5rem' }}>
            
            {/* Tabs para organizar la información */}
            <TabContainer>
              
              {/* Tab 1: Información General */}
              <Tab text="Información General">
                <div style={{ padding: '1rem 0' }}>
                  <FlexBox direction="Column" style={{ gap: '1rem' }}>
                    
                    <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                      <Avatar 
                        size="L" 
                        style={{ backgroundColor: getPromotionColor(selectedPromotion) }}
                      >
                        <Text style={{ fontSize: '1.5rem' }}>{getPromotionIcon(selectedPromotion)}</Text>
                      </Avatar>
                      <FlexBox direction="Column">
                        <Title level="H4">{selectedPromotion.Titulo || 'Sin título'}</Title>
                        <Text style={{ color: '#666' }}>{selectedPromotion.Descripcion || 'Sin descripción'}</Text>
                        <ObjectStatus state={getStatusColor(getPromotionStatus(selectedPromotion))}>
                          {getStatusText(getPromotionStatus(selectedPromotion))}
                        </ObjectStatus>
                      </FlexBox>
                    </FlexBox>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Fecha de Inicio</Text>
                          <Title level="H5">{formatDateFull(selectedPromotion.FechaIni)}</Title>
                        </div>
                      </Card>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Fecha de Fin</Text>
                          <Title level="H5">{formatDateFull(selectedPromotion.FechaFin)}</Title>
                        </div>
                      </Card>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Descuento</Text>
                          <Title level="H5">
                            {selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                              ? `${selectedPromotion.DescuentoPorcentaje}%` 
                              : `$${selectedPromotion.DescuentoMonto}`
                            }
                          </Title>
                        </div>
                      </Card>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Productos Seleccionados</Text>
                          <Title level="H5">{selectedProducts.length}</Title>
                        </div>
                      </Card>
                    </div>

                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>Tipo de Promoción</Text>
                        <Title level="H3" style={{ color: getPromotionColor(selectedPromotion) }}>
                          {selectedPromotion.TipoPromocion || 'General'}
                        </Title>
                      </div>
                    </Card>

                  </FlexBox>
                </div>
              </Tab>

              {/* Tab 2: Productos Seleccionados */}
              <Tab text={`Productos Seleccionados (${selectedProducts.length})`}>
                <div style={{ padding: '1rem 0' }}>
                  
                  {/* Header con estadísticas */}
                  <Card style={{ marginBottom: '1rem' }}>
                    <div style={{ padding: '1rem' }}>
                      <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                        <FlexBox direction="Column">
                          <Title level="H5">Productos en esta Promoción</Title>
                          <Text style={{ color: '#666' }}>
                            {selectedProducts.length} productos seleccionados
                          </Text>
                        </FlexBox>
                        <FlexBox style={{ gap: '1rem' }}>
                          <FlexBox direction="Column" alignItems="Center">
                            <Text style={{ fontSize: '0.75rem', color: '#666' }}>Valor Total</Text>
                            <Text style={{ fontWeight: 'bold' }}>
                              ${selectedProducts.reduce((sum, p) => sum + (p.PrecioOriginal || 0), 0).toLocaleString()}
                            </Text>
                          </FlexBox>
                          <FlexBox direction="Column" alignItems="Center">
                            <Text style={{ fontSize: '0.75rem', color: '#666' }}>Descuento</Text>
                            <Text style={{ fontWeight: 'bold', color: getPromotionColor(selectedPromotion) }}>
                              {selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                                ? `${selectedPromotion.DescuentoPorcentaje}%` 
                                : `$${selectedPromotion.DescuentoMonto}`
                              }
                            </Text>
                          </FlexBox>
                        </FlexBox>
                      </FlexBox>
                    </div>
                  </Card>

                  {/* Lista de productos seleccionados */}
                  <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                    {selectedProducts.length === 0 ? (
                      <MessageStrip type="Information">
                        No hay productos seleccionados para esta promoción. Ve al tab "Gestionar Productos" para añadir productos.
                      </MessageStrip>
                    ) : (
                      selectedProducts.map((product, index) => {
                        const descuentoValor = selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                          ? product.PrecioOriginal * (selectedPromotion.DescuentoPorcentaje / 100)
                          : selectedPromotion.DescuentoMonto;
                        const precioConDescuento = product.PrecioOriginal - descuentoValor;
                        
                        return (
                          <Card key={product.SKUID || index} style={{ borderLeft: `4px solid ${getPromotionColor(selectedPromotion)}` }}>
                            <div style={{ padding: '1rem' }}>
                              <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                <FlexBox direction="Column" style={{ flex: 1 }}>
                                  <Title level="H6">{product.NombreProducto || 'Sin nombre'}</Title>
                                  <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                    SKU: {product.SKUID}
                                  </Text>
                                </FlexBox>
                                <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                                  <FlexBox direction="Column" alignItems="End">
                                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>Precio Original</Text>
                                    <Text style={{ fontWeight: 'bold' }}>${product.PrecioOriginal?.toLocaleString()}</Text>
                                  </FlexBox>
                                  <FlexBox direction="Column" alignItems="End">
                                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>Precio con Descuento</Text>
                                    <Text style={{ fontWeight: 'bold', color: getPromotionColor(selectedPromotion) }}>
                                      ${Math.round(precioConDescuento).toLocaleString()}
                                    </Text>
                                  </FlexBox>
                                  <Button 
                                    design="Transparent" 
                                    icon="delete"
                                    onClick={() => handleProductToggle(product)}
                                  >
                                    Quitar
                                  </Button>
                                </FlexBox>
                              </FlexBox>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </FlexBox>
                  
                </div>
              </Tab>

              {/* Tab 3: Gestionar Productos */}
              <Tab text="Gestionar Productos">
                <div style={{ padding: '1rem 0' }}>
                  
                  {/* Buscador de productos */}
                  <Card style={{ marginBottom: '1rem' }}>
                    <CardHeader 
                      titleText="Buscar y Añadir Productos"
                      subtitleText={`${getFilteredAvailableProducts().length} productos disponibles`}
                    />
                    <div style={{ padding: '1rem' }}>
                      <FlexBox style={{ gap: '1rem' }}>
                        <Input
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          placeholder="Buscar por nombre o categoría..."
                          style={{ flex: 1 }}
                        />
                        <Button design="Transparent" icon="refresh" onClick={loadAllProducts}>
                          Recargar
                        </Button>
                      </FlexBox>
                    </div>
                  </Card>

                  {/* Lista de productos disponibles */}
                  {loadingProducts ? (
                    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                      <BusyIndicator active size="Large" />
                    </FlexBox>
                  ) : (
                    <Card>
                      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        {getFilteredAvailableProducts().length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <Text style={{ color: '#666' }}>
                              {productSearchTerm ? 
                                `No se encontraron productos que coincidan con "${productSearchTerm}"` :
                                'No hay productos disponibles'
                              }
                            </Text>
                          </div>
                        ) : (
                          <FlexBox direction="Column" style={{ gap: '0.5rem', padding: '1rem' }}>
                            {getFilteredAvailableProducts().slice(0, 50).map(product => {
                              const isSelected = selectedProducts.some(p => p.SKUID === product.SKUID);
                              const color = getPromotionColor(selectedPromotion);
                              const descuentoValor = selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                                ? (product.PRECIO || 0) * (selectedPromotion.DescuentoPorcentaje / 100)
                                : selectedPromotion.DescuentoMonto;
                              const precioConDescuento = (product.PRECIO || 0) - descuentoValor;
                              
                              return (
                                <Card 
                                  key={product.SKUID}
                                  style={{ 
                                    padding: '0.75rem',
                                    backgroundColor: isSelected ? color + '10' : 'transparent',
                                    borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleProductToggle(product)}
                                >
                                  <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                    <FlexBox alignItems="Center" style={{ gap: '1rem', flex: 1 }}>
                                      <CheckBox
                                        checked={isSelected}
                                        onChange={() => handleProductToggle(product)}
                                      />
                                      <FlexBox direction="Column" style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                          {product.PRODUCTNAME || 'Sin nombre'}
                                        </Text>
                                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                          SKU: {product.SKUID} • {product.MARCA || 'Sin marca'}
                                        </Text>
                                      </FlexBox>
                                    </FlexBox>
                                    <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                                      <FlexBox direction="Column" alignItems="End">
                                        <Text style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                                          ${(product.PRECIO || 0).toLocaleString()}
                                        </Text>
                                        {isSelected && (
                                          <Text style={{ 
                                            fontSize: '0.75rem', 
                                            color: color,
                                            fontWeight: 'bold'
                                          }}>
                                            ${Math.round(precioConDescuento).toLocaleString()} (
                                              {selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                                                ? `${selectedPromotion.DescuentoPorcentaje}% OFF` 
                                                : `$${selectedPromotion.DescuentoMonto} OFF`
                                              }
                                            )
                                          </Text>
                                        )}
                                      </FlexBox>
                                      {isSelected && (
                                        <Token style={{ backgroundColor: color, color: 'white' }}>
                                          ✓ Incluido
                                        </Token>
                                      )}
                                    </FlexBox>
                                  </FlexBox>
                                </Card>
                              );
                            })}
                          </FlexBox>
                        )}
                      </div>
                      
                      {getFilteredAvailableProducts().length > 50 && (
                        <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                            Mostrando primeros 50 productos. Usa el buscador para filtrar más específicamente.
                          </Text>
                        </div>
                      )}
                    </Card>
                  )}

                </div>
              </Tab>

            </TabContainer>

          </div>
        )}
      </Dialog>

    </div>
  );
};

export default PromotionCalendar;
