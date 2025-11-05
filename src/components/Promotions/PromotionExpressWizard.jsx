import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  FlexBox,
  Text,
  Title,
  Card,
  CardHeader,
  Input,
  TextArea,
  DatePicker,
  Label,
  MessageStrip,
  ObjectStatus,
  CheckBox,
  Select,
  Option,
  Avatar,
  BusyIndicator,
  Icon
} from '@ui5/webcomponents-react';
import promoService from '../../api/promoService';

const PromotionExpressWizard = ({ open, onClose, activeFilters = {}, productsFromFilters = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Estado del wizard
  const [promotionData, setPromotionData] = useState({
    // Paso 1: Información Básica
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    plantilla: '',
    
    // Paso 2: Productos
    metodoSeleccion: 'filtros-actuales',
    productosSeleccionados: [],
    
    // Paso 3: Descuentos
    tipoDescuento: 'porcentaje',
    valorDescuento: '',
    descuentoEspecial: false
  });

  // PLANTILLAS PREDEFINIDAS
  const PLANTILLAS = [
    {
      id: 'black-friday',
      nombre: 'Black Friday',
      titulo: 'Black Friday 2025 - Ofertas Especiales',
      descripcion: 'Descuentos increíbles por tiempo limitado. ¡No te lo pierdas!',
      fechaInicio: '2025-11-25',
      fechaFin: '2025-11-30',
      descuentoSugerido: 25,
      icono: 'cart'
    },
    {
      id: 'navidad',
      nombre: 'Navidad',
      titulo: 'Promoción Navideña 2025',
      descripcion: 'Regalos perfectos con precios especiales para esta Navidad.',
      fechaInicio: '2025-12-10',
      fechaFin: '2025-12-25',
      descuentoSugerido: 20,
      icono: 'calendar'
    },
    {
      id: 'flash-sale',
      nombre: 'Flash Sale',
      titulo: 'Flash Sale - 24 Horas',
      descripcion: 'Ofertas relámpago por tiempo muy limitado.',
      fechaInicio: getTodayDate(),
      fechaFin: getTomorrowDate(),
      descuentoSugerido: 30,
      icono: 'time-overtime'
    },
    {
      id: 'liquidacion',
      nombre: 'Liquidación',
      titulo: 'Liquidación de Inventario',
      descripcion: 'Últimas piezas con descuentos máximos.',
      fechaInicio: getTodayDate(),
      fechaFin: getDateInDays(30),
      descuentoSugerido: 40,
      icono: 'sales-quote'
    },
    {
      id: 'lanzamiento',
      nombre: 'Lanzamiento',
      titulo: 'Promoción de Lanzamiento',
      descripcion: 'Celebra el lanzamiento de nuevos productos con ofertas especiales.',
      fechaInicio: getTodayDate(),
      fechaFin: getDateInDays(14),
      descuentoSugerido: 15,
      icono: 'journey-arrive'
    },
    {
      id: 'personalizado',
      nombre: 'Personalizado',
      titulo: '',
      descripcion: '',
      fechaInicio: getTodayDate(),
      fechaFin: getDateInDays(7),
      descuentoSugerido: 10,
      icono: 'edit'
    }
  ];

  // Funciones helper para fechas
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function getDateInDays(days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }

  // Manejar selección de plantilla
  const handlePlantillaSelect = (plantilla) => {
    setPromotionData(prev => ({
      ...prev,
      plantilla: plantilla.id,
      titulo: plantilla.titulo,
      descripcion: plantilla.descripcion,
      fechaInicio: plantilla.fechaInicio,
      fechaFin: plantilla.fechaFin,
      valorDescuento: plantilla.descuentoSugerido.toString()
    }));
  };

  // Validaciones por paso
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return promotionData.titulo.trim() !== '' && 
               promotionData.fechaInicio !== '' && 
               promotionData.fechaFin !== '';
      case 2:
        return promotionData.metodoSeleccion !== '' && 
               (promotionData.metodoSeleccion === 'filtros-actuales' ? productsFromFilters.length > 0 : true);
      case 3:
        return promotionData.tipoDescuento !== '' && 
               promotionData.valorDescuento !== '' && 
               parseFloat(promotionData.valorDescuento) > 0;
      default:
        return false;
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Crear promoción final
  const handleCreatePromotion = async () => {
    setLoading(true);
    
    try {
      // Preparar datos de la promoción para la API
      const promoPayload = {
        titulo: promotionData.titulo,
        descripcion: promotionData.descripcion,
        fechaInicio: promotionData.fechaInicio,
        fechaFin: promotionData.fechaFin,
        tipoDescuento: promotionData.tipoDescuento === 'porcentaje' ? 'PORCENTAJE' : 'MONTO_FIJO',
        descuentoPorcentaje: promotionData.tipoDescuento === 'porcentaje' ? parseInt(promotionData.valorDescuento) : 0,
        descuentoMonto: promotionData.tipoDescuento === 'monto' ? parseFloat(promotionData.valorDescuento) : 0,
        permiteAcumulacion: false,
        limiteUsos: null
      };
      
      console.log('Enviando promoción a la API:', promoPayload);
      
      // Enviar a la API usando el servicio
      const result = await promoService.createPromotionWithProducts(
        promoPayload,
        productsFromFilters,
        activeFilters
        // LoggedUser se maneja automáticamente por el interceptor de axios
      );
      
      console.log('Promoción creada exitosamente en la API:', result);
      
      // Mostrar éxito y cerrar
      alert(`¡Promoción "${promotionData.titulo}" creada exitosamente en el servidor!\n\nProductos: ${productsFromFilters.length}\nDescuento: ${promotionData.valorDescuento}${promotionData.tipoDescuento === 'porcentaje' ? '%' : '$'}`);
      
      onClose();
      
    } catch (error) {
      console.error('Error creando promoción en la API:', error);
      alert(`Error al crear la promoción: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular impacto estimado
  const calcularImpacto = () => {
    if (!productsFromFilters.length) return { total: 0, descuento: 0 };
    
    const valorTotal = productsFromFilters.reduce((sum, product) => {
      return sum + (product.PRECIO || 0);
    }, 0);
    
    const descuentoTotal = promotionData.tipoDescuento === 'porcentaje' 
      ? valorTotal * (parseFloat(promotionData.valorDescuento) / 100)
      : parseFloat(promotionData.valorDescuento) * productsFromFilters.length;
    
    return {
      valorTotal,
      descuentoTotal,
      margenRestante: valorTotal > 0 ? ((valorTotal - descuentoTotal) / valorTotal * 100).toFixed(1) : 0,
      productosAfectados: productsFromFilters.length
    };
  };

  // Reset al cerrar
  const handleClose = () => {
    setCurrentStep(1);
    setPromotionData({
      titulo: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      plantilla: '',
      metodoSeleccion: 'filtros-actuales',
      productosSeleccionados: [],
      tipoDescuento: 'porcentaje',
      valorDescuento: '',
      descuentoEspecial: false
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      headerText="Promoción Express - Crear en 3 Pasos"
      style={{ width: '90vw', maxWidth: '800px', height: '80vh' }}
      footer={
        <Bar
          startContent={
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Paso {currentStep} de 3
              </Text>
              <FlexBox style={{ gap: '0.25rem' }}>
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: step <= currentStep ? '#0f828f' : '#e0e0e0'
                    }}
                  />
                ))}
              </FlexBox>
            </FlexBox>
          }
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button 
                design="Transparent"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              {currentStep > 1 && (
                <Button 
                  design="Transparent"
                  onClick={prevStep}
                  disabled={loading}
                >
                  Anterior
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button 
                  design="Emphasized"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Siguiente
                </Button>
              ) : (
                <Button 
                  design="Emphasized"
                  onClick={handleCreatePromotion}
                  disabled={!validateStep(currentStep) || loading}
                >
                  {loading ? (
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <BusyIndicator active size="Small" />
                      Creando...
                    </FlexBox>
                  ) : (
                    'Crear Promoción'
                  )}
                </Button>
              )}
            </FlexBox>
          }
        />
      }
    >
      <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
        
        {/* PASO 1: INFORMACIÓN BÁSICA */}
        {currentStep === 1 && (
          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Avatar size="S" initials="1" colorScheme="Accent1" />
              <Title level="H3">Información Básica</Title>
            </FlexBox>

            {/* Plantillas Rápidas */}
            <Card>
              <CardHeader titleText="Plantillas Rápidas" />
              <div style={{ padding: '1rem' }}>
                <FlexBox style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                  {PLANTILLAS.map(plantilla => (
                    <Button
                      key={plantilla.id}
                      design={promotionData.plantilla === plantilla.id ? "Emphasized" : "Transparent"}
                      onClick={() => handlePlantillaSelect(plantilla)}
                      style={{ 
                        minWidth: '140px',
                        height: '60px',
                        border: promotionData.plantilla === plantilla.id ? '2px solid #0f828f' : '1px solid #e0e0e0'
                      }}
                    >
                      <FlexBox direction="Column" alignItems="Center" style={{ gap: '0.25rem' }}>
                        <Icon name={plantilla.icono} style={{ fontSize: '1.2rem' }} />
                        <Text style={{ fontSize: '0.875rem' }}>{plantilla.nombre}</Text>
                      </FlexBox>
                    </Button>
                  ))}
                </FlexBox>
              </div>
            </Card>

            {/* Formulario de datos */}
            <Card>
              <CardHeader titleText="Detalles de la Promoción" />
              <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
                
                <div>
                  <Label required>Título de la Promoción:</Label>
                  <Input
                    value={promotionData.titulo}
                    onChange={(e) => setPromotionData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Black Friday 2025 - Electronics"
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <Label>Descripción:</Label>
                  <TextArea
                    value={promotionData.descripcion}
                    onChange={(e) => setPromotionData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe los beneficios y términos de la promoción..."
                    rows={3}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>

                <FlexBox style={{ gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <Label required>Fecha de Inicio:</Label>
                    <DatePicker
                      value={promotionData.fechaInicio}
                      onChange={(e) => setPromotionData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                      style={{ width: '100%', marginTop: '0.25rem' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label required>Fecha de Fin:</Label>
                    <DatePicker
                      value={promotionData.fechaFin}
                      onChange={(e) => setPromotionData(prev => ({ ...prev, fechaFin: e.target.value }))}
                      style={{ width: '100%', marginTop: '0.25rem' }}
                    />
                  </div>
                </FlexBox>

              </div>
            </Card>

          </FlexBox>
        )}

        {/* PASO 2: SELECCIÓN DE PRODUCTOS */}
        {currentStep === 2 && (
          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Avatar size="S" initials="2" colorScheme="Accent2" />
              <Title level="H3">🛒 Selección de Productos</Title>
            </FlexBox>

            {/* Método de Selección */}
            <Card>
              <CardHeader titleText="Método de Selección" />
              <div style={{ padding: '1rem' }}>
                <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                  
                  <CheckBox
                    checked={promotionData.metodoSeleccion === 'filtros-actuales'}
                    onChange={() => setPromotionData(prev => ({ ...prev, metodoSeleccion: 'filtros-actuales' }))}
                    text={`Usar Filtros Actuales (${productsFromFilters.length} productos)`}
                  />
                  
                  <CheckBox
                    checked={promotionData.metodoSeleccion === 'categorias'}
                    onChange={() => setPromotionData(prev => ({ ...prev, metodoSeleccion: 'categorias' }))}
                    text="Categorías Específicas"
                    disabled
                  />
                  
                  <CheckBox
                    checked={promotionData.metodoSeleccion === 'productos-individuales'}
                    onChange={() => setPromotionData(prev => ({ ...prev, metodoSeleccion: 'productos-individuales' }))}
                    text="Productos Individuales"
                    disabled
                  />
                  
                  <CheckBox
                    checked={promotionData.metodoSeleccion === 'filtros-rapidos'}
                    onChange={() => setPromotionData(prev => ({ ...prev, metodoSeleccion: 'filtros-rapidos' }))}
                    text="Filtros Rápidos"
                    disabled
                  />
                  
                </FlexBox>
              </div>
            </Card>

            {/* Vista Previa de Productos */}
            <Card>
              <CardHeader titleText={`Vista Previa (${productsFromFilters.length} productos)`} />
              <div style={{ padding: '1rem' }}>
                {productsFromFilters.length > 0 ? (
                  <>
                    <FlexBox direction="Column" style={{ gap: '0.5rem', maxHeight: '400px', overflow: 'auto' }}>
                      {productsFromFilters.map((product, index) => (
                        <FlexBox key={index} justifyContent="SpaceBetween" alignItems="Center" style={{ padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                          <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                            <Avatar size="XS" initials={product.PRODUCTNAME?.charAt(0) || 'P'} />
                            <FlexBox direction="Column">
                              <Text style={{ fontWeight: 'bold' }}>{product.PRODUCTNAME || 'Sin nombre'}</Text>
                              <Text style={{ fontSize: '0.875rem', color: '#666' }}>SKU: {product.SKUID}</Text>
                            </FlexBox>
                          </FlexBox>
                          <ObjectStatus state="Information">
                            ${product.PRECIO?.toLocaleString() || 'N/A'}
                          </ObjectStatus>
                        </FlexBox>
                      ))}
                    </FlexBox>
                  </>
                ) : (
                  <MessageStrip type="Warning">
                    No hay productos seleccionados. Aplica filtros en la página anterior para seleccionar productos.
                  </MessageStrip>
                )}
              </div>
            </Card>

          </FlexBox>
        )}

        {/* PASO 3: CONFIGURACIÓN DE DESCUENTOS */}
        {currentStep === 3 && (
          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Avatar size="S" initials="3" colorScheme="Accent3" />
              <Title level="H3">Configuración de Descuentos</Title>
            </FlexBox>

            {/* Tipo de Descuento */}
            <Card>
              <CardHeader titleText="Tipo de Descuento" />
              <div style={{ padding: '1rem' }}>
                <FlexBox direction="Column" style={{ gap: '1rem' }}>
                  
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <CheckBox
                      checked={promotionData.tipoDescuento === 'porcentaje'}
                      onChange={() => setPromotionData(prev => ({ ...prev, tipoDescuento: 'porcentaje' }))}
                    />
                    <Label>Porcentaje:</Label>
                    <Input
                      value={promotionData.valorDescuento}
                      onChange={(e) => setPromotionData(prev => ({ ...prev, valorDescuento: e.target.value }))}
                      placeholder="25"
                      style={{ width: '80px' }}
                      disabled={promotionData.tipoDescuento !== 'porcentaje'}
                    />
                    <Text>% OFF</Text>
                  </FlexBox>

                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <CheckBox
                      checked={promotionData.tipoDescuento === 'monto-fijo'}
                      onChange={() => setPromotionData(prev => ({ ...prev, tipoDescuento: 'monto-fijo' }))}
                    />
                    <Label>Monto Fijo:</Label>
                    <Input
                      value={promotionData.tipoDescuento === 'monto-fijo' ? promotionData.valorDescuento : ''}
                      onChange={(e) => setPromotionData(prev => ({ ...prev, valorDescuento: e.target.value }))}
                      placeholder="500"
                      style={{ width: '100px' }}
                      disabled={promotionData.tipoDescuento !== 'monto-fijo'}
                    />
                    <Text>pesos OFF</Text>
                  </FlexBox>

                </FlexBox>
              </div>
            </Card>

            {/* Impacto Estimado */}
            <Card>
              <CardHeader titleText="Impacto Estimado" />
              <div style={{ padding: '1rem' }}>
                {promotionData.valorDescuento && (
                  <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                    
                    {(() => {
                      const impacto = calcularImpacto();
                      return (
                        <>
                          <FlexBox justifyContent="SpaceBetween">
                            <Text>Descuento Total:</Text>
                            <Text style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                              ${impacto.descuentoTotal.toLocaleString()}
                            </Text>
                          </FlexBox>

                          <FlexBox justifyContent="SpaceBetween">
                            <Text>Margen Restante:</Text>
                            <ObjectStatus state={impacto.margenRestante > 30 ? "Success" : impacto.margenRestante > 15 ? "Warning" : "Error"}>
                              {impacto.margenRestante}%
                            </ObjectStatus>
                          </FlexBox>

                          <FlexBox justifyContent="SpaceBetween">
                            <Text>Productos Afectados:</Text>
                            <Text style={{ fontWeight: 'bold' }}>{impacto.productosAfectados}</Text>
                          </FlexBox>

                          <FlexBox justifyContent="SpaceBetween" style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <Text style={{ fontWeight: 'bold' }}>Valor Final:</Text>
                            <Text style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2e7d32' }}>
                              ${(impacto.valorTotal - impacto.descuentoTotal).toLocaleString()}
                            </Text>
                          </FlexBox>

                          <MessageStrip 
                            type={impacto.margenRestante > 30 ? "Success" : impacto.margenRestante > 15 ? "Warning" : "Error"}
                            style={{ marginTop: '0.5rem' }}
                          >
                            {impacto.margenRestante > 30 
                              ? "Límites de Seguridad: Aprobado - Margen saludable"
                              : impacto.margenRestante > 15 
                                ? "Límites de Seguridad: Precaución - Margen bajo"
                                : "Límites de Seguridad: Rechazado - Margen crítico"
                            }
                          </MessageStrip>
                        </>
                      );
                    })()}

                  </FlexBox>
                )}
              </div>
            </Card>

          </FlexBox>
        )}

      </div>
    </Dialog>
  );
};

export default PromotionExpressWizard;