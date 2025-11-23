import React, { useState, useEffect } from 'react';
import { 
  FlexBox, Title, Text, Button, Card, CardHeader, Label, Input, TextArea, DatePicker, 
  BusyIndicator, MessageStrip, ObjectStatus, Icon, RadioButton, CheckBox, Select, Option
} from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router-dom';
import AdvancedFilters from '../components/Promotions/AdvancedFilters';
import promoService from '../api/promoService';
import CustomDialog from '../components/common/CustomDialog';
import { useDialog } from '../hooks/useDialog';

const CrearPromocion = () => {
  const navigate = useNavigate();
  const { dialogState, showSuccess, closeDialog } = useDialog();

  const [step, setStep] = useState(1); // 1: Detalles, 2: Filtros, 3: Descuento, 4: Vista previa
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [draftSaved, setDraftSaved] = useState(false);

  // Form data
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    plantilla: '',
    tipoDescuento: 'PORCENTAJE',
    descuentoPorcentaje: 10,
    descuentoMonto: 0,
    permiteAcumulacion: false,
    limiteUsos: null,
  });

  // Plantillas rápidas (mismas del wizard)
  const PLANTILLAS = [
    { id: 'black-friday', nombre: 'Black Friday', titulo: 'Black Friday 2025 - Ofertas Especiales', descripcion: 'Descuentos increíbles por tiempo limitado. ¡No te lo pierdas!', fechaInicio: getTodayDate(), fechaFin: getDateInDays(5), descuentoSugerido: 25, icono: 'cart' },
    { id: 'navidad', nombre: 'Navidad', titulo: 'Promoción Navideña 2025', descripcion: 'Regalos perfectos con precios especiales para esta Navidad.', fechaInicio: '2025-12-10', fechaFin: '2025-12-25', descuentoSugerido: 20, icono: 'calendar' },
    { id: 'flash-sale', nombre: 'Flash Sale', titulo: 'Flash Sale - 24 Horas', descripcion: 'Ofertas relámpago por tiempo muy limitado.', fechaInicio: getTodayDate(), fechaFin: getTomorrowDate(), descuentoSugerido: 30, icono: 'time-overtime' },
    { id: 'lanzamiento', nombre: 'Lanzamiento', titulo: 'Promoción de Lanzamiento', descripcion: 'Celebra el lanzamiento de nuevos productos con ofertas especiales.', fechaInicio: getTodayDate(), fechaFin: getDateInDays(14), descuentoSugerido: 15, icono: 'journey-arrive' },
    { id: 'personalizado', nombre: 'Personalizado', titulo: '', descripcion: '', fechaInicio: getTodayDate(), fechaFin: getDateInDays(7), descuentoSugerido: 10, icono: 'edit' }
  ];

  function getTodayDate() { return new Date().toISOString().split('T')[0]; }
  function getTomorrowDate() { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
  function getDateInDays(days) { const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; }

  // Template selection
  const handlePlantillaSelect = (plantilla) => {
    setForm(prev => ({
      ...prev,
      plantilla: plantilla.id,
      titulo: plantilla.titulo,
      descripcion: plantilla.descripcion,
      fechaInicio: plantilla.fechaInicio,
      fechaFin: plantilla.fechaFin,
      tipoDescuento: 'PORCENTAJE',
      descuentoPorcentaje: plantilla.descuentoSugerido
    }));
  };

  // Filters callback
  const handleFiltersChange = (selectedProducts) => {
    // AdvancedFilters ahora envía directamente el array de productos seleccionados
    if (Array.isArray(selectedProducts)) {
      setFilteredProducts(selectedProducts);
    } else {
      setFilteredProducts([]);
    }
  };
    // Info por paso para encabezados/etiquetas
    const STEP_INFO = {
      1: { title: 'Información General', subtitle: 'Completa los datos básicos de la promoción' },
      2: { title: 'Selección de Productos', subtitle: 'Aplica filtros para definir el alcance' },
      3: { title: 'Descuento y Reglas', subtitle: 'Configura el beneficio y condiciones' },
      4: { title: 'Vista previa', subtitle: 'Revisa y confirma antes de crear' }
    };

  // Guardar borrador local (fuera de validaciones)
  const handleSaveDraft = () => {
    try {
      const draft = {
        step,
        form,
        productIds: filteredProducts.map(p => p.SKUID),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('crearPromocionDraft', JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (e) {
      console.warn('No se pudo guardar el borrador', e);
    }
  };


  // Validar fechas de vigencia
  const validateDates = () => {
    if (!form.fechaInicio || !form.fechaFin) return { valid: true, message: '' };
    
    const inicio = new Date(form.fechaInicio);
    const fin = new Date(form.fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Validar que la fecha de inicio no sea anterior a hoy
    if (inicio < hoy) {
      return { valid: false, message: '⚠️ La fecha de inicio no puede ser anterior a hoy' };
    }
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (fin <= inicio) {
      return { valid: false, message: '⚠️ La fecha de fin debe ser posterior a la fecha de inicio' };
    }
    
    // Advertir si la duración es muy corta (menos de 1 día)
    const diferenciaDias = (fin - inicio) / (1000 * 60 * 60 * 24);
    if (diferenciaDias < 1) {
      return { valid: true, warning: '⚠️ La promoción tiene una duración muy corta (menos de 1 día)' };
    }
    
    // Advertir si la duración es muy larga (más de 90 días)
    if (diferenciaDias > 90) {
      return { valid: true, warning: '⚠️ La promoción tiene una duración muy larga (más de 90 días)' };
    }
    
    return { valid: true, message: '' };
  };

  // Validation per step
  const canNext = () => {
    if (step === 1) {
      const datesValidation = validateDates();
      if (!datesValidation.valid) return false;
      return form.titulo.trim() !== '' && form.fechaInicio && form.fechaFin;
    }
    if (step === 2) {
      return filteredProducts.length > 0; // Require at least one product
    }
    if (step === 3) {
      if (form.tipoDescuento === 'PORCENTAJE') {
        return form.descuentoPorcentaje > 0 && form.descuentoPorcentaje <= 100;
      }
      return form.descuentoMonto > 0;
    }
    return true;
  };

  // Submit
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await promoService.createPromotionWithProducts(
        form,
        filteredProducts,
        {} // filters summary is optional here
      );

      await showSuccess(`Promoción "${form.titulo}" creada exitosamente`, 'Promoción Creada');
      navigate('/promociones');
    } catch (err) {
      setError(err.message || 'Error creando la promoción');
    } finally {
      setLoading(false);
    }
  };

  // Header with steps indicator
  const StepDots = () => (
    <FlexBox alignItems="Center" style={{ gap: '0.35rem' }}>
      {[1,2,3,4].map(n => (
        <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n<=step ? '#0f828f' : '#e0e0e0' }} />
      ))}
    </FlexBox>
  );

  return (
    <div style={{ padding: '1rem' }}>
      {/* Encabezado estilo asistente con barra de progreso */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ padding: '1rem' }}>
          <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: '0.5rem' }}>
            <Title level="H3">Añadir Promoción</Title>
            <Text> Paso {step}: {STEP_INFO[step].title} </Text>
          </FlexBox>
          <div style={{ width: '100%', height: 6, background: '#eaecee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(step/4)*100}%`, height: '100%', background: '#0f828f' }} />
          </div>
        </div>
      </Card>

      {error && <MessageStrip type="Negative" style={{ marginBottom: '1rem' }}>{error}</MessageStrip>}
      {draftSaved && <MessageStrip type="Positive" style={{ marginBottom: '0.5rem' }}>Borrador guardado localmente</MessageStrip>}
      {step === 1 && validateDates().warning && (
        <MessageStrip type="Warning" style={{ marginBottom: '0.5rem' }}>
          {validateDates().warning}
        </MessageStrip>
      )}
      {step === 1 && !validateDates().valid && (
        <MessageStrip type="Error" style={{ marginBottom: '0.5rem' }}>
          {validateDates().message}
        </MessageStrip>
      )}

      {/* Paso 1: Detalles */}
      {step === 1 && (
        <FlexBox direction="Column" style={{ gap: '1rem' }}>
          <Card>
            <CardHeader titleText={`Paso 1: ${STEP_INFO[1].title}`} subtitleText={STEP_INFO[1].subtitle} />
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              <Label>Plantillas Rápidas</Label>
            </div>
            <div style={{ padding: '1rem' }}>
              <FlexBox style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                {PLANTILLAS.map(p => (
                  <Button key={p.id} design={form.plantilla === p.id ? 'Emphasized' : 'Transparent'} onClick={() => handlePlantillaSelect(p)} style={{ minWidth: 140, height: 60, border: form.plantilla === p.id ? '2px solid #0f828f' : '1px solid #e0e0e0' }}>
                    <FlexBox direction="Column" alignItems="Center" style={{ gap: '0.25rem' }}>
                      <Icon name={p.icono} style={{ fontSize: '1.2rem' }} />
                      <Text style={{ fontSize: '0.875rem' }}>{p.nombre}</Text>
                    </FlexBox>
                  </Button>
                ))}
              </FlexBox>
            </div>
          </Card>

          <Card>
            <CardHeader titleText="Detalles de la Promoción" />
            <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
              <div>
                <Label required tooltip="Nombre corto y descriptivo de la promoción">Título</Label>
                <Input 
                  value={form.titulo} 
                  onChange={(e)=>setForm(prev=>({...prev,titulo:e.target.value}))} 
                  placeholder="Ej: Black Friday" 
                  style={{ width:'100%', marginTop: '0.25rem' }}
                  maxlength="100"
                />
              </div>
              <div>
                <Label tooltip="Descripción detallada de la promoción (opcional)">Descripción</Label>
                <TextArea 
                  value={form.descripcion} 
                  onChange={(e)=>setForm(prev=>({...prev,descripcion:e.target.value}))} 
                  rows={3} 
                  placeholder="Detalle opcional" 
                  style={{ width:'100%', marginTop: '0.25rem' }}
                  maxlength="500"
                />
              </div>
              <FlexBox style={{ gap: '1rem' }}>
                <div style={{ flex:1 }}>
                  <Label required tooltip="Fecha en que la promoción comenzará a estar activa">Fecha de Inicio</Label>
                  <DatePicker 
                    value={form.fechaInicio} 
                    onChange={(e)=>setForm(prev=>({...prev,fechaInicio:e.target.value}))} 
                    style={{ width:'100%', marginTop: '0.25rem' }}
                    minDate={getTodayDate()}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <Label required tooltip="Fecha en que la promoción dejará de estar activa">Fecha de Fin</Label>
                  <DatePicker 
                    value={form.fechaFin} 
                    onChange={(e)=>setForm(prev=>({...prev,fechaFin:e.target.value}))} 
                    style={{ width:'100%', marginTop: '0.25rem' }}
                    minDate={form.fechaInicio || getTodayDate()}
                  />
                </div>
              </FlexBox>
            </div>
          </Card>
        </FlexBox>
      )}

      {/* Paso 2: Filtros y productos */}
      {step === 2 && (
        <Card>
          <CardHeader 
            titleText={`Paso 2: ${STEP_INFO[2].title}`} 
            subtitleText={`${STEP_INFO[2].subtitle} • ${filteredProducts.length} encontrados`}
            action={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Transparent" onClick={() => setStep(1)}>
                  ← Anterior
                </Button>
                <Button design="Emphasized" onClick={() => setStep(3)} disabled={filteredProducts.length === 0}>
                  Siguiente →
                </Button>
              </FlexBox>
            }
          />
          <div style={{ padding: '0.5rem' }}>
            <AdvancedFilters onFiltersChange={handleFiltersChange} />
          </div>
        </Card>
      )}

      {/* Paso 3: Descuento y reglas */}
      {step === 3 && (
          <Card>
            <CardHeader titleText={`Paso 3: ${STEP_INFO[3].title}`} subtitleText={STEP_INFO[3].subtitle} />
          <div style={{ padding: '1rem' }}>
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <div>
                <Label tooltip="Selecciona si el descuento será por porcentaje o monto fijo">Tipo de Descuento</Label>
                <Select value={form.tipoDescuento} onChange={(e)=>setForm(prev=>({...prev,tipoDescuento:e.target.value}))} style={{ width: '240px', marginTop: '0.25rem' }}>
                  <Option value="PORCENTAJE">Porcentaje (%)</Option>
                  <Option value="MONTO_FIJO">Monto Fijo ($)</Option>
                </Select>
              </div>

              {form.tipoDescuento === 'PORCENTAJE' ? (
                <div>
                  <Label tooltip="Porcentaje de descuento a aplicar (1-100%)">Porcentaje (%)</Label>
                  <Input 
                    type="Number" 
                    value={form.descuentoPorcentaje} 
                    onChange={(e)=>{
                      const val = parseFloat(e.target.value)||0;
                      if (val > 100) return;
                      setForm(prev=>({...prev,descuentoPorcentaje:val}));
                    }} 
                    min="1" 
                    max="100" 
                    style={{ width: '120px', marginTop: '0.25rem' }} 
                  />
                  {form.descuentoPorcentaje > 50 && (
                    <MessageStrip type="Warning" style={{ marginTop: '0.5rem' }}>
                      ⚠️ El descuento es mayor al 50%. Verifica que sea correcto.
                    </MessageStrip>
                  )}
                </div>
              ) : (
                <div>
                  <Label tooltip="Monto fijo de descuento en pesos">Monto ($)</Label>
                  <Input type="Number" value={form.descuentoMonto} onChange={(e)=>setForm(prev=>({...prev,descuentoMonto:parseFloat(e.target.value)||0}))} min="0.01" step="0.01" style={{ width: '160px', marginTop: '0.25rem' }} />
                </div>
              )}

              <div>
                <CheckBox checked={form.permiteAcumulacion} onChange={(e)=>setForm(prev=>({...prev,permiteAcumulacion:e.target.checked}))} text="Permite acumulación con otras promociones" />
              </div>

              <div>
                <Label>Límite de usos (opcional)</Label>
                <Input type="Number" value={form.limiteUsos ?? ''} onChange={(e)=>setForm(prev=>({...prev,limiteUsos:e.target.value?parseInt(e.target.value):null}))} placeholder="Sin límite" style={{ width: '200px', marginTop: '0.25rem' }} />
              </div>
            </FlexBox>
          </div>
        </Card>
      )}

      {/* Paso 4: Vista previa */}
      {step === 4 && (
        <Card>
          <CardHeader titleText={`Paso 4: ${STEP_INFO[4].title}`} subtitleText={STEP_INFO[4].subtitle} />
          <div style={{ padding: '1rem' }}>
            <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
              <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                <Text><b>Título:</b> {form.titulo || '—'}</Text>
                <ObjectStatus state="Information">{filteredProducts.length} productos</ObjectStatus>
              </FlexBox>
              <Text><b>Descripción:</b> {form.descripcion || '—'}</Text>
              <Text><b>Vigencia:</b> {form.fechaInicio || '—'} a {form.fechaFin || '—'}</Text>
              <Text>
                <b>Descuento:</b> {form.tipoDescuento === 'PORCENTAJE' ? `${form.descuentoPorcentaje}%` : `$${form.descuentoMonto}`}
              </Text>
              <Text>
                <b>Acumulación:</b> {form.permiteAcumulacion ? 'Sí' : 'No'}
                {form.limiteUsos ? ` • Límite: ${form.limiteUsos}` : ''}
              </Text>

              {/* Lista de presentaciones incluidas */}
              <Card>
                <CardHeader titleText={`Presentaciones a afectar (${filteredProducts.length})`} subtitleText="Vista previa de las presentaciones a las que se aplicará la promoción" />
                <div style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
                  {filteredProducts.length === 0 ? (
                    <MessageStrip type="Warning">No hay presentaciones seleccionadas desde los filtros.</MessageStrip>
                  ) : (
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                      {/* Encabezados */}
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 120px', background: '#f7f9fb', padding: '0.5rem 0.75rem', fontWeight: 600, color: '#2c3e50' }}>
                        <div>SKU</div>
                        <div>Producto / Presentación</div>
                        <div>Marca</div>
                        <div style={{ textAlign: 'right' }}>Precio</div>
                      </div>
                      <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                        {filteredProducts
                          .filter(p => p && p.IdPresentaOK) // Filtrar presentaciones válidas
                          .slice(0, 50)
                          .map((presentacion, idx) => (
                          <div key={presentacion.IdPresentaOK || idx} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 120px', padding: '0.5rem 0.75rem', borderTop: '1px solid #eef2f5', alignItems: 'center' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{presentacion.producto?.SKUID || presentacion.SKUID || '—'}</div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.15rem' }}>
                                {presentacion.producto?.PRODUCTNAME || '—'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                {presentacion.NOMBREPRESENTACION || '—'}
                              </div>
                            </div>
                            <div>{presentacion.producto?.MARCA || '—'}</div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                                ${(presentacion.Precio ?? 0).toLocaleString()}
                              </div>
                              <div style={{ fontWeight: '600', color: '#2e7d32', fontSize: '0.95rem' }}>
                                ${(
                                  form.tipoDescuento === 'PORCENTAJE'
                                    ? (presentacion.Precio ?? 0) * (1 - form.descuentoPorcentaje / 100)
                                    : (presentacion.Precio ?? 0) - form.descuentoMonto
                                ).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#2e7d32' }}>
                                Ahorro: ${(
                                  form.tipoDescuento === 'PORCENTAJE'
                                    ? (presentacion.Precio ?? 0) * (form.descuentoPorcentaje / 100)
                                    : form.descuentoMonto
                                ).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {filteredProducts.length > 50 && (
                        <div style={{ padding: '0.5rem 0.75rem', background: '#fbfcfe', borderTop: '1px solid #eef2f5' }}>
                          Mostrando 50 de {filteredProducts.length}. La promoción se aplicará a todas las presentaciones seleccionadas.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <MessageStrip type="Information">La promoción aplicará a todas las presentaciones seleccionadas del paso 2.</MessageStrip>
            </FlexBox>
          </div>
        </Card>
      )}

      {/* Pie de navegación al estilo del asistente */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0, 
        marginTop: '1rem',
        zIndex: 100,
        backgroundColor: '#f5f5f5',
        paddingTop: '0.5rem'
      }}>
        <Card style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '0.75rem 1rem' }}>
            <FlexBox justifyContent="SpaceBetween" alignItems="Center">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button design="Negative" onClick={() => navigate('/promociones')}>Cancelar</Button>
                {step > 1 && (
                  <Button design="Transparent" onClick={() => setStep(s => Math.max(1, s-1))}>
                    ← Anterior
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Text style={{ marginRight: '1rem', color: '#666', fontSize: '0.9rem' }}>
                  Paso {step} de 4
                </Text>
                <Button design="Transparent" onClick={handleSaveDraft}>
                  💾 Guardar Borrador
                </Button>
                {step < 4 && (
                  <Button design="Emphasized" disabled={!canNext()} onClick={() => setStep(s => Math.min(4, s+1))}>
                    Siguiente →
                  </Button>
                )}
                {step === 4 && (
                  <Button design="Emphasized" onClick={handleCreate} disabled={loading || filteredProducts.length===0}>
                    {loading ? <BusyIndicator size="Small" active /> : '✓ Crear Promoción'}
                  </Button>
                )}
              </div>
            </FlexBox>
          </div>
        </Card>
      </div>

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

export default CrearPromocion;
