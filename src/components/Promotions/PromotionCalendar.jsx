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

const PromotionCalendar = ({ promotions = [], onPromotionClick, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'year', 'timeline', 'agenda'
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showPromotionDetail, setShowPromotionDetail] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: 'all', // 'all', 'active', 'scheduled', 'finished'
    tipo: 'all',
    buscar: ''
  });

  // DATOS MOCK DE PROMOCIONES (simulando API)
  const [mockPromotions] = useState([
    {
      id: 'PROMO001',
      titulo: 'Black Friday 2025',
      descripcion: 'Descuentos increíbles en electrónicos',
      fechaInicio: '2025-11-25',
      fechaFin: '2025-11-30',
      descuento: 25,
      tipoDescuento: 'porcentaje',
      productosCount: 156,
      valorEstimado: 2450000,
      estado: 'scheduled',
      categoria: 'Electronics',
      icono: 'product',
      color: '#1976d2',
      productosSeleccionados: [
        { id: 'PROD001', nombre: 'iPhone 15 Pro', precio: 1200, categoria: 'Electronics' },
        { id: 'PROD002', nombre: 'Samsung Galaxy S24', precio: 1000, categoria: 'Electronics' },
        { id: 'PROD003', nombre: 'MacBook Pro M3', precio: 2500, categoria: 'Electronics' }
      ]
    },
    {
      id: 'PROMO002',
      titulo: 'Cyber Monday',
      descripcion: 'Ofertas digitales exclusivas',
      fechaInicio: '2025-12-01',
      fechaFin: '2025-12-02',
      descuento: 30,
      tipoDescuento: 'porcentaje',
      productosCount: 89,
      valorEstimado: 1200000,
      estado: 'scheduled',
      categoria: 'Technology',
      icono: '💻',
      color: '#7b1fa2',
      productosSeleccionados: [
        { id: 'PROD004', nombre: 'Gaming Laptop RTX 4070', precio: 1800, categoria: 'Gaming' },
        { id: 'PROD005', nombre: 'Mechanical Keyboard RGB', precio: 150, categoria: 'Accessories' }
      ]
    },
    {
      id: 'PROMO003',
      titulo: 'Promoción Navideña',
      descripcion: 'Regalos perfectos para esta temporada',
      fechaInicio: '2025-12-10',
      fechaFin: '2025-12-25',
      descuento: 20,
      tipoDescuento: 'porcentaje',
      productosCount: 234,
      valorEstimado: 3400000,
      estado: 'scheduled',
      categoria: 'Home & Gifts',
      icono: 'calendar',
      color: '#388e3c',
      productosSeleccionados: [
        { id: 'PROD006', nombre: 'Perfume Navideño Edición Limitada', precio: 80, categoria: 'Beauty' },
        { id: 'PROD007', nombre: 'Set de Copas Cristal', precio: 120, categoria: 'Home' },
        { id: 'PROD008', nombre: 'Caja de Chocolates Premium', precio: 35, categoria: 'Food' }
      ]
    },
    {
      id: 'PROMO004',
      titulo: 'Halloween Liquidación',
      descripcion: 'Últimas piezas de Halloween',
      fechaInicio: '2025-11-01',
      fechaFin: '2025-11-05',
      descuento: 50,
      tipoDescuento: 'porcentaje',
      productosCount: 45,
      valorEstimado: 180000,
      estado: 'active',
      categoria: 'Decorations',
      icono: 'calendar',
      color: '#ff9800',
      productosSeleccionados: [
        { id: 'PROD009', nombre: 'Calabaza Decorativa LED', precio: 25, categoria: 'Halloween' },
        { id: 'PROD010', nombre: 'Disfraz Vampiro Deluxe', precio: 60, categoria: 'Costumes' }
      ]
    },
    {
      id: 'PROMO005',
      titulo: 'Año Nuevo 2026',
      descripcion: 'Empieza el año con ofertas',
      fechaInicio: '2025-12-28',
      fechaFin: '2026-01-05',
      descuento: 15,
      tipoDescuento: 'porcentaje',
      productosCount: 178,
      valorEstimado: 2100000,
      estado: 'scheduled',
      categoria: 'Fashion',
      icono: 'celebrate',
      color: '#e91e63',
      productosSeleccionados: [
        { id: 'PROD011', nombre: 'Vestido de Fiesta Dorado', precio: 180, categoria: 'Fashion' },
        { id: 'PROD012', nombre: 'Zapatos de Cuero Italian', precio: 220, categoria: 'Shoes' }
      ]
    },
    {
      id: 'PROMO006',
      titulo: 'San Valentín 2026',
      descripción: 'Regalos especiales para el amor',
      fechaInicio: '2026-02-10',
      fechaFin: '2026-02-16',
      descuento: 18,
      tipoDescuento: 'porcentaje',
      productosCount: 92,
      valorEstimado: 950000,
      estado: 'scheduled',
      categoria: 'Jewelry & Beauty',
      icono: '💖',
      color: '#e91e63',
      productosSeleccionados: [
        { id: 'PROD013', nombre: 'Anillo de Diamante Solitario', precio: 800, categoria: 'Jewelry' },
        { id: 'PROD014', nombre: 'Collar de Perlas Naturales', precio: 350, categoria: 'Jewelry' }
      ]
    }
  ]);

  // Funciones helper para fechas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatDateFull = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  const getPromotionStatus = (promotion) => {
    const today = new Date();
    const inicio = new Date(promotion.fechaInicio);
    const fin = new Date(promotion.fechaFin);
    
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
    return mockPromotions.filter(promo => {
      const status = getPromotionStatus(promo);
      
      // Filtro por estado
      if (filters.estado !== 'all' && status !== filters.estado) return false;
      
      // Filtro por búsqueda
      if (filters.buscar && !promo.titulo.toLowerCase().includes(filters.buscar.toLowerCase())) return false;
      
      return true;
    });
  };

  // Obtener promociones por mes
  const getPromotionsForMonth = (year, month) => {
    return getFilteredPromotions().filter(promo => {
      const inicio = new Date(promo.fechaInicio);
      const fin = new Date(promo.fechaFin);
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
        const inicio = new Date(promo.fechaInicio);
        const fin = new Date(promo.fechaFin);
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
    setSelectedProducts(promotion.productosSeleccionados || []);
    setShowPromotionDetail(true);
    if (onPromotionClick) onPromotionClick(promotion);
  };

  // Cargar productos de la API
  const loadAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const products = await productService.getAllProducts();
      setAllProducts(products || []);
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
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Filtrar productos disponibles
  const getFilteredAvailableProducts = () => {
    if (!allProducts.length) return [];
    
    return allProducts.filter(product => {
      const matchesSearch = !productSearchTerm || 
        product.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(productSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Guardar cambios en productos seleccionados
  const handleSaveProductChanges = () => {
    // Aquí se haría la llamada a la API para actualizar la promoción
    console.log('Actualizando productos de promoción:', {
      promocion: selectedPromotion.id,
      productos: selectedProducts
    });
    
    // Actualizar el mock local
    setSelectedPromotion(prev => ({
      ...prev,
      productosSeleccionados: selectedProducts,
      productosCount: selectedProducts.length
    }));
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
                    {day.promotions.slice(0, 3).map(promo => (
                      <div
                        key={promo.id}
                        onClick={() => handlePromotionClick(promo)}
                        style={{
                          padding: '0.125rem 0.25rem',
                          backgroundColor: promo.color + '20',
                          border: `1px solid ${promo.color}`,
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontSize: '0.625rem',
                          lineHeight: '1.2'
                        }}
                      >
                        <Text style={{ fontSize: '0.625rem' }}>
                          {promo.icono} {promo.titulo.substring(0, 15)}...
                        </Text>
                      </div>
                    ))}
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
        </Card>
      )}

      {/* Vista Agenda */}
      {viewMode === 'agenda' && (
        <Card>
          <CardHeader titleText="Agenda de Promociones" />
          <div style={{ padding: '1rem' }}>
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              {getFilteredPromotions()
                .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
                .map(promo => {
                  const status = getPromotionStatus(promo);
                  return (
                    <Card 
                      key={promo.id}
                      style={{ 
                        cursor: 'pointer',
                        border: `2px solid ${promo.color}20`,
                        borderLeft: `4px solid ${promo.color}`
                      }}
                      onClick={() => handlePromotionClick(promo)}
                    >
                      <div style={{ padding: '1rem' }}>
                        <FlexBox justifyContent="SpaceBetween" alignItems="Start">
                          <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                            <Avatar 
                              size="M" 
                              style={{ backgroundColor: promo.color }}
                            >
                              <Text style={{ fontSize: '1.2rem' }}>{promo.icono}</Text>
                            </Avatar>
                            <FlexBox direction="Column">
                              <Title level="H5" style={{ margin: 0 }}>
                                {promo.titulo}
                              </Title>
                              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                {promo.descripcion}
                              </Text>
                              <FlexBox style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                                <Text style={{ fontSize: '0.75rem' }}>
                                  {formatDateFull(promo.fechaInicio)} - {formatDateFull(promo.fechaFin)}
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
                                <Text style={{ fontWeight: 'bold' }}>{promo.descuento}%</Text>
                              </FlexBox>
                              <FlexBox direction="Column" alignItems="Center">
                                <Text style={{ fontSize: '0.75rem', color: '#666' }}>Productos</Text>
                                <Text style={{ fontWeight: 'bold' }}>{promo.productosCount}</Text>
                              </FlexBox>
                              <FlexBox direction="Column" alignItems="Center">
                                <Text style={{ fontSize: '0.75rem', color: '#666' }}>Valor</Text>
                                <Text style={{ fontWeight: 'bold' }}>${(promo.valorEstimado / 1000).toFixed(0)}K</Text>
                              </FlexBox>
                            </FlexBox>
                          </FlexBox>
                        </FlexBox>
                      </div>
                    </Card>
                  );
                })
              }
            </FlexBox>
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
        headerText={`${selectedPromotion?.icono} ${selectedPromotion?.titulo}`}
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
                        style={{ backgroundColor: selectedPromotion.color }}
                      >
                        <Text style={{ fontSize: '1.5rem' }}>{selectedPromotion.icono}</Text>
                      </Avatar>
                      <FlexBox direction="Column">
                        <Title level="H4">{selectedPromotion.titulo}</Title>
                        <Text style={{ color: '#666' }}>{selectedPromotion.descripcion}</Text>
                        <ObjectStatus state={getStatusColor(getPromotionStatus(selectedPromotion))}>
                          {getStatusText(getPromotionStatus(selectedPromotion))}
                        </ObjectStatus>
                      </FlexBox>
                    </FlexBox>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Fecha de Inicio</Text>
                          <Title level="H5">{formatDateFull(selectedPromotion.fechaInicio)}</Title>
                        </div>
                      </Card>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Fecha de Fin</Text>
                          <Title level="H5">{formatDateFull(selectedPromotion.fechaFin)}</Title>
                        </div>
                      </Card>
                      <Card>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <Text style={{ fontSize: '0.875rem', color: '#666' }}>Descuento</Text>
                          <Title level="H5">{selectedPromotion.descuento}%</Title>
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
                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>Valor Estimado de la Promoción</Text>
                        <Title level="H3" style={{ color: selectedPromotion.color }}>
                          ${selectedPromotion.valorEstimado.toLocaleString()}
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
                              ${selectedProducts.reduce((sum, p) => sum + (p.precio || 0), 0).toLocaleString()}
                            </Text>
                          </FlexBox>
                          <FlexBox direction="Column" alignItems="Center">
                            <Text style={{ fontSize: '0.75rem', color: '#666' }}>Descuento</Text>
                            <Text style={{ fontWeight: 'bold', color: selectedPromotion.color }}>
                              {selectedPromotion.descuento}%
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
                      selectedProducts.map(product => (
                        <Card key={product.id} style={{ borderLeft: `4px solid ${selectedPromotion.color}` }}>
                          <div style={{ padding: '1rem' }}>
                            <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                              <FlexBox direction="Column" style={{ flex: 1 }}>
                                <Title level="H6">{product.nombre}</Title>
                                <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                  {product.categoria}
                                </Text>
                              </FlexBox>
                              <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                                <FlexBox direction="Column" alignItems="End">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Precio Original</Text>
                                  <Text style={{ fontWeight: 'bold' }}>${product.precio?.toLocaleString()}</Text>
                                </FlexBox>
                                <FlexBox direction="Column" alignItems="End">
                                  <Text style={{ fontSize: '0.75rem', color: '#666' }}>Precio con Descuento</Text>
                                  <Text style={{ fontWeight: 'bold', color: selectedPromotion.color }}>
                                    ${Math.round(product.precio * (1 - selectedPromotion.descuento / 100)).toLocaleString()}
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
                      ))
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
                              const isSelected = selectedProducts.some(p => p.id === product.id);
                              return (
                                <Card 
                                  key={product.id}
                                  style={{ 
                                    padding: '0.75rem',
                                    backgroundColor: isSelected ? selectedPromotion.color + '10' : 'transparent',
                                    borderLeft: isSelected ? `3px solid ${selectedPromotion.color}` : '3px solid transparent',
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
                                          {product.nombre}
                                        </Text>
                                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                          {product.categoria}
                                        </Text>
                                      </FlexBox>
                                    </FlexBox>
                                    <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                                      <FlexBox direction="Column" alignItems="End">
                                        <Text style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                                          ${product.precio?.toLocaleString()}
                                        </Text>
                                        {isSelected && (
                                          <Text style={{ 
                                            fontSize: '0.75rem', 
                                            color: selectedPromotion.color,
                                            fontWeight: 'bold'
                                          }}>
                                            ${Math.round(product.precio * (1 - selectedPromotion.descuento / 100)).toLocaleString()} ({selectedPromotion.descuento}% OFF)
                                          </Text>
                                        )}
                                      </FlexBox>
                                      {isSelected && (
                                        <Token style={{ backgroundColor: selectedPromotion.color, color: 'white' }}>
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
