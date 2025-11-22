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
  Input
} from '@ui5/webcomponents-react';
import promoService from '../../api/promoService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';
import PromotionEditModal from './PromotionEditModal';

const PromotionCalendar = ({ promotions = [], onPromotionClick, onDateChange }) => {
  const { dialogState, showAlert, showError, closeDialog } = useDialog();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'agenda'
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showPromotionDetail, setShowPromotionDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
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

  // Función para exportar promociones a CSV
  const handleExport = async () => {
    const filtered = getFilteredPromotions();
    
    if (filtered.length === 0) {
      await showAlert('No hay promociones para exportar', 'Información');
      return;
    }

    // Preparar datos CSV
    const headers = ['ID', 'Título', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Descuento %', 'Estado', 'Creado Por'];
    const rows = filtered.map(promo => [
      promo.IdPromoOK || '',
      promo.Titulo || '',
      promo.Descripcion || '',
      formatDateFull(promo.FechaIni),
      formatDateFull(promo.FechaFin),
      promo['Descuento%'] || promo.DescuentoPorcentaje || '0',
      getStatusText(getPromotionStatus(promo)),
      promo.REGUSER || ''
    ]);

    // Crear CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `promociones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!promotion) return 'P';
    
    const status = getPromotionStatus(promotion);
    if (status === 'active') return '●';
    if (status === 'scheduled') return '○';
    return '◌';
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

  // Manejar click en promoción - Abre modal informativo
  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    setShowPromotionDetail(true);
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
                <Option value="active">Activas</Option>
                <Option value="scheduled">Programadas</Option>
                <Option value="finished">Finalizadas</Option>
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
              <Button design="Emphasized" icon="download" onClick={handleExport}>
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
                          border: `2px solid ${color}20`,
                          borderLeft: `4px solid ${color}`,
                          cursor: 'pointer'
                        }}
                        onClick={() => handlePromotionClick(promo)}
                      >
                        <div style={{ padding: '1rem' }}>
                          <FlexBox justifyContent="SpaceBetween" alignItems="Start">
                            <FlexBox alignItems="Center" style={{ gap: '0.75rem', flex: 1 }}>
                              <Avatar 
                                size="M" 
                                style={{ 
                                  backgroundColor: color,
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                                initials={promo.Titulo?.charAt(0).toUpperCase() || 'P'}
                              />
                              <FlexBox direction="Column" style={{ flex: 1 }}>
                                <Title level="H5" style={{ margin: 0 }}>
                                  {promo.Titulo || 'Sin título'}
                                </Title>
                                {promo.Descripcion && (
                                  <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {promo.Descripcion}
                                  </Text>
                                )}
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
                                {descuento && (
                                  <FlexBox direction="Column" alignItems="Center">
                                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>Descuento</Text>
                                    <Text style={{ fontWeight: 'bold' }}>
                                      {promo.TipoDescuento === 'PORCENTAJE' ? `${descuento}%` : `$${descuento}`}
                                    </Text>
                                  </FlexBox>
                                )}
                                <FlexBox direction="Column" alignItems="Center">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Presentaciones</Text>
                                  <Text style={{ fontWeight: 'bold' }}>{productosCount}</Text>
                                </FlexBox>
                                {promo.TipoPromocion && (
                                  <FlexBox direction="Column" alignItems="Center">
                                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>Tipo</Text>
                                    <Text style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                                      {promo.TipoPromocion}
                                    </Text>
                                  </FlexBox>
                                )}
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

      {/* Modal de Detalle de Promoción - Solo Informativo */}
      <Dialog
        open={showPromotionDetail}
        headerText={selectedPromotion ? selectedPromotion.Titulo : 'Detalle de Promoción'}
        style={{ width: '800px', maxWidth: '90vw' }}
        footer={
          <Bar
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Transparent" onClick={() => setShowPromotionDetail(false)}>
                  Cerrar
                </Button>
                <Button 
                  design="Emphasized" 
                  icon="edit"
                  onClick={() => {
                    setShowPromotionDetail(false);
                    setShowEditModal(true);
                  }}
                >
                  Gestionar Promoción
                </Button>
              </FlexBox>
            }
          />
        }
      >
        {selectedPromotion && (
          <div style={{ padding: '1.5rem' }}>
            
            {/* Información General - Vista Informativa */}
            <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
              
              {/* Header con Avatar y Título */}
              <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                <Avatar 
                  size="L" 
                  style={{ 
                    backgroundColor: getPromotionColor(selectedPromotion),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                  initials={selectedPromotion.Titulo?.charAt(0).toUpperCase() || 'P'}
                />
                <FlexBox direction="Column" style={{ flex: 1 }}>
                  <Title level="H4">{selectedPromotion.Titulo || 'Sin título'}</Title>
                  {selectedPromotion.Descripcion && (
                    <Text style={{ color: '#666', marginTop: '0.25rem' }}>
                      {selectedPromotion.Descripcion}
                    </Text>
                  )}
                  <FlexBox style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                    <ObjectStatus state={getStatusColor(getPromotionStatus(selectedPromotion))}>
                      {getStatusText(getPromotionStatus(selectedPromotion))}
                    </ObjectStatus>
                    {selectedPromotion.REGUSER && (
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        Creado por: {selectedPromotion.REGUSER}
                      </Text>
                    )}
                  </FlexBox>
                </FlexBox>
              </FlexBox>

              {/* Tarjetas con información clave */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {selectedPromotion.FechaIni && (
                  <Card>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                        Fecha de Inicio
                      </Text>
                      <Title level="H5">{formatDateFull(selectedPromotion.FechaIni)}</Title>
                    </div>
                  </Card>
                )}
                {selectedPromotion.FechaFin && (
                  <Card>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                        Fecha de Fin
                      </Text>
                      <Title level="H5">{formatDateFull(selectedPromotion.FechaFin)}</Title>
                    </div>
                  </Card>
                )}
                {(selectedPromotion.DescuentoPorcentaje || selectedPromotion.DescuentoMonto) && (
                  <Card>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                        Descuento
                      </Text>
                      <Title level="H5" style={{ color: getPromotionColor(selectedPromotion) }}>
                        {selectedPromotion.TipoDescuento === 'PORCENTAJE' 
                          ? `${selectedPromotion.DescuentoPorcentaje}%` 
                          : `$${selectedPromotion.DescuentoMonto}`
                        }
                      </Title>
                      <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                        {selectedPromotion.TipoDescuento === 'PORCENTAJE' ? 'Porcentaje' : 'Monto Fijo'}
                      </Text>
                    </div>
                  </Card>
                )}
                <Card>
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <Text style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                      Presentaciones
                    </Text>
                    <Title level="H5">{selectedPromotion.ProductosAplicables?.length || 0}</Title>
                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                      en esta promoción
                    </Text>
                  </div>
                </Card>
              </div>

              {/* Lista de Productos Agrupados */}
              {selectedPromotion.ProductosAplicables && selectedPromotion.ProductosAplicables.length > 0 && (
                <Card>
                  <CardHeader titleText="Productos Incluidos" />
                  <div style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                      {(() => {
                        // Agrupar presentaciones por SKUID
                        const productosMap = new Map();
                        selectedPromotion.ProductosAplicables.forEach((presentacion) => {
                          const skuid = presentacion.SKUID;
                          if (!productosMap.has(skuid)) {
                            productosMap.set(skuid, {
                              SKUID: skuid,
                              NombreProducto: presentacion.NombreProducto || 'Producto sin nombre',
                              presentaciones: []
                            });
                          }
                          productosMap.get(skuid).presentaciones.push(presentacion);
                        });

                        // Convertir a array y renderizar
                        return Array.from(productosMap.values()).map((producto, index) => (
                          <div 
                            key={producto.SKUID || index}
                            style={{ 
                              padding: '0.75rem', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px',
                              backgroundColor: '#fafafa'
                            }}
                          >
                            <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                              <FlexBox direction="Column" style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                  {producto.NombreProducto}
                                </Text>
                                <Text style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                  SKU: {producto.SKUID}
                                </Text>
                              </FlexBox>
                              <FlexBox direction="Column" alignItems="End">
                                <Text style={{ fontSize: '0.875rem', color: '#0854a0', fontWeight: '600' }}>
                                  {producto.presentaciones.length} presentación{producto.presentaciones.length !== 1 ? 'es' : ''}
                                </Text>
                              </FlexBox>
                            </FlexBox>
                          </div>
                        ));
                      })()}
                    </FlexBox>
                  </div>
                </Card>
              )}

              {/* Información Adicional */}
              {selectedPromotion.REGDATE && (
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                      <FlexBox direction="Column">
                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>Fecha de Creación</Text>
                        <Text style={{ fontWeight: '600' }}>{formatDateFull(selectedPromotion.REGDATE)}</Text>
                      </FlexBox>
                      {selectedPromotion.MODDATE && (
                        <FlexBox direction="Column" alignItems="End">
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Última Modificación</Text>
                          <Text style={{ fontWeight: '600' }}>{formatDateFull(selectedPromotion.MODDATE)}</Text>
                        </FlexBox>
                      )}
                    </FlexBox>
                  </div>
                </Card>
              )}

            </FlexBox>
            
          </div>
        )}
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

      {/* Modal de edición de promoción */}
      <PromotionEditModal
        open={showEditModal}
        promotion={selectedPromotion}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPromotion(null);
        }}
        onSave={async (updatedPromotion) => {
          setShowEditModal(false);
          setSelectedPromotion(null);
          await loadPromotions();
        }}
        onDelete={async () => {
          setShowEditModal(false);
          setSelectedPromotion(null);
          await loadPromotions();
        }}
      />

    </div>
  );
};

export default PromotionCalendar;
