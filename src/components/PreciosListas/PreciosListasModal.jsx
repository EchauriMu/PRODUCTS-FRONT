import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Input,
  Label,
  Title,
  Text,
  FlexBox,
  Card,
  CardHeader,
  TabContainer,
  Tab,
  MessageBox,
  MessageBoxAction,
  Select,
  Option,
  BusyIndicator
} from '@ui5/webcomponents-react';
import AdvancedFiltersPreciosListas from './AdvancedFiltersPreciosListas';
import preciosListasService from '../../api/preciosListasService';
import * as yup from 'yup';

/**
 * ================================================================================
 * MODAL FULLSCREEN PARA CREAR/EDITAR LISTAS DE PRECIOS - PreciosListasModal.jsx
 * ================================================================================
 * 
 * Este componente es un modal FULLSCREEN que permite:
 * - CREAR una nueva lista de precios
 * - EDITAR una lista existente
 * 
 * CARACTERÍSTICAS:
 * - Ocupa toda la pantalla como el Stepper de Productos
 * - Validación de formulario con Yup
 * - Dos pestañas (tabs):
 *   1. "Paso 1: Selección de Productos" - para seleccionar SKUs
 *   2. "Paso 2: Configuración" - para datos de la lista
 * - Soporte para filtros avanzados de productos
 * - Validaciones en tiempo real
 * - Header, contenido central y footer fijo
 * 
 * ================================================================================
 */

const formatDateForPicker = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * ✅ ESQUEMA DE VALIDACIÓN CON YUP
 * 
 * Define qué campos son obligatorios y sus validaciones:
 * - DESLISTA: Obligatorio, mínimo 3 caracteres
 * - SKUSIDS: Mínimo 1 producto seleccionado
 * - IDINSTITUTOOK: Obligatorio
 * - IDTIPOLISTAOK: Obligatorio
 * - IDTIPOFORMULAOK: Obligatorio
 * - FECHAEXPIRAINI: Obligatorio
 * - FECHAEXPIRAFIN: Obligatorio y mayor a fecha inicio
 */
const preciosListasValidationSchema = yup.object().shape({
  IDLISTAOK: yup.string(),
  DESLISTA: yup.string()
    .required('La descripción de la lista es obligatoria.')
    .min(3, 'La descripción debe tener al menos 3 caracteres.'),
  SKUSIDS: yup.array()
    .min(1, 'Debe seleccionar al menos un producto.')
    .required('Debe seleccionar al menos un producto.'),
  IDINSTITUTOOK: yup.string()
    .required('El instituto es obligatorio.'),
  IDTIPOLISTAOK: yup.string()
    .required('El tipo de lista es obligatorio.'),
  IDTIPOFORMULAOK: yup.string()
    .required('El tipo de fórmula es obligatorio.'),
  FECHAEXPIRAINI: yup.string()
    .required('La fecha de inicio es obligatoria.'),
  FECHAEXPIRAFIN: yup.string()
    .required('La fecha de fin es obligatoria.')
    .test('is-greater', 'La fecha de fin debe ser mayor a la de inicio', function(value) {
      const { FECHAEXPIRAINI } = this.parent;
      return !FECHAEXPIRAINI || !value || new Date(value) > new Date(FECHAEXPIRAINI);
    }),
});

const PreciosListasModal = ({ open, onClose, onSave, lista }) => {
  // === ESTADO INICIAL ===
  // Cuando se abre el modal vacío (para crear), estos son los valores por defecto
  const initialState = {
    IDLISTAOK: '',
    SKUSIDS: [],
    IDINSTITUTOOK: '',
    DESLISTA: '',
    FECHAEXPIRAINI: formatDateForPicker(new Date()),
    FECHAEXPIRAFIN: formatDateForPicker(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
    IDTIPOLISTAOK: '',
    IDTIPOGENERALISTAOK: 'ESPECIFICA',
    IDTIPOFORMULAOK: 'FIJO',
    ACTIVED: true,
  };

  // === ESTADOS LOCALES DEL MODAL ===
  const [formData, setFormData] = useState(initialState); // Datos del formulario
  const [filteredSKUs, setFilteredSKUs] = useState(new Set()); // SKUs seleccionados en filtros
  const [validationErrors, setValidationErrors] = useState(null); // Errores de validación
  const [isSaving, setIsSaving] = useState(false); // Indicador de guardado en progreso
  const [activeTab, setActiveTab] = useState('filtros'); // Pestaña activa
  const [filterDates, setFilterDates] = useState({ // Fechas del filtro
    fechaIngresoDesde: '',
    fechaIngresoHasta: ''
  });
  const lastSelectedSkusRef = useRef(null); // Cache para detectar cambios
  const nextIdRef = useRef(0); // Contador para generar IDs secuenciales

  /**
   * 🔹 CARGAR DATOS AL ABRIR MODAL
   * 
   * ¿QUÉ SUCEDE?
   * - Si se abre con una lista existente (EDITAR):
   *   Carga todos los datos de esa lista en el formulario
   * - Si se abre sin lista (CREAR):
   *   Establece valores por defecto (initialState)
   * 
   * FLUJO CREAR:\n   * 1. Usuario hace clic en "Crear Lista"
   * 2. PreciosListasTable llama handleAdd() (línea 24-26 en Actions)
   * 3. handleAdd() establece editingLista=null
   * 4. Modal abre con open=true, lista=null
   * 5. Este useEffect se ejecuta
   * 6. Detecta que open=true pero lista=null (línea 112)
   * 7. Carga initialState con generador de ID (línea 119-123)
   * 8. Setea activeTab='filtros' para que el usuario comience selectando productos\n   * FLUJO EDITAR:\n   * 1. Usuario selecciona una lista y hace clic "Editar"
   * 2. PreciosListasTable llama handleEditSelected() 
   * 3. setEditingLista(lista) + setIsModalOpen(true)
   * 4. Modal abre con open=true, lista={...datos...}
   * 5. Este useEffect se ejecuta
   * 6. Detecta que open=true Y lista existe (línea 111)
   * 7. Spread los datos de la lista en el formulario (línea 112-116)
   * 8. Convierte SKUSIDS si está en JSON (línea 117-119)
   * 9. Setea activeTab='config' para que el usuario edite la configuración\n   */
  useEffect(() => {
    if (open && lista) {
      // MODO EDICIÓN: cargar datos de la lista existente
      setFormData({
        ...initialState,
        ...lista,
        FECHAEXPIRAINI: formatDateForPicker(lista.FECHAEXPIRAINI),
        FECHAEXPIRAFIN: formatDateForPicker(lista.FECHAEXPIRAFIN),
        SKUSIDS: Array.isArray(lista.SKUSIDS) ? lista.SKUSIDS : (lista.SKUSIDS ? JSON.parse(lista.SKUSIDS) : []),
      });
      setFilteredSKUs(new Set(Array.isArray(lista.SKUSIDS) ? lista.SKUSIDS : []));
      setActiveTab('config');
    } else if (open) {
      // MODO CREACIÓN: generar ID nuevo y cargar defaults
      const newId = nextIdRef.current;
      nextIdRef.current += 1;
      const newFormData = {
        ...initialState,
        IDLISTAOK: `ID-${newId.toString().padStart(3, '0')}`,
      };
      setFormData(newFormData);
      setFilteredSKUs(new Set());
      setActiveTab('filtros');
    }
    setValidationErrors(null);
  }, [open, lista]);
  
  /**
   * 🔹 MANEJAR CAMBIO EN CAMPO DE INPUT
   * 
   * ¿QUÉ SUCEDE?
   * - Actualiza el estado formData cuando el usuario digita en un campo
   * - Campos de texto, selects, checkboxes, etc.
   * 
   * PARÁMETROS:
   * - name: Nombre del campo (DESLISTA, IDINSTITUTOOK, etc)
   * - value: Nuevo valor del campo
   */
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 🔹 MANEJAR CAMBIO EN FILTROS DE PRODUCTOS
   * 
   * ¿QUÉ SUCEDE?
   * - El usuario aplica filtros en la pestaña "Paso 2: Selección de Productos"
   * - Se actualizan los SKUs seleccionados
   * - Se guardan las fechas del filtro (si se usaron)
   * 
   * PARÁMETROS:
   * - filterData: Objeto con datos del filtro
   *   {
   *     selectedSKUs: [] (array de SKUs seleccionados),
   *     filterDates: { fechaIngresoDesde, fechaIngresoHasta }
   *   }
   */
  const handleFiltersChange = useCallback((filterData) => {
    if (filterData?.selectedSKUs && filterData.selectedSKUs.length > 0) {
      const skusArray = Array.from(filterData.selectedSKUs);
      
      // Verificar si realmente ha habido cambios en los SKUs seleccionados
      const skusString = JSON.stringify(skusArray.sort());
      if (lastSelectedSkusRef.current === skusString) {
        return; // No hacer nada si son los mismos SKUs
      }
      
      lastSelectedSkusRef.current = skusString;
      setFilteredSKUs(new Set(skusArray));
      setFormData(prev => ({
        ...prev,
        SKUSIDS: skusArray
      }));
      console.log('✅ Productos actualizados en modal:', skusArray);
    }
    
    // Guardar fechas de filtro
    if (filterData?.filterDates) {
      setFilterDates(filterData.filterDates);
    }
  }, []);

  /**
   * 🔹💾 MANEJAR CLICK EN BOTÓN GUARDAR
   * 
   * ¿QUÉ SUCEDE?
   * 1. Activa indicador de guardado (isSaving=true)
   * 2. Valida todos los datos con el schema Yup
   * 3. Si hay errores, muestra MessageBox con los errores ❌
   * 4. Si no hay errores, prepara los datos para enviar:
   *    - Convierte SKUSIDS a JSON string
   *    - Asegura que ACTIVED sea booleano
   *    - Genera ID si es nueva lista
   * 5. Llama onSave(dataToSave) que es handleSave() en Actions
   * 6. handleSave() envía a preciosListasService.create() o .update()
   * 7. Backend recibe y guarda en BD
   * 
   * FLUJO COMPLETO:\n   * CREAR:\n   * 1. Usuario en modal vacío completa formulario
   * 2. Hace clic en "Guardar"
   * 3. handleSaveClick() ejecuta (línea 170-210)
   * 4. Valida con Yup (línea 173)
   * 5. Prepara dataToSave (línea 175-187)
   * 6. Llama onSave(dataToSave) → handleSave() en Actions (línea 188)
   * 7. handleSave() detecta que NO hay editingLista.IDLISTAOK
   * 8. Llama preciosListasService.create(dataToSave) → ⭐ LÍNEA 70-71 EN ACTIONS\n   * ACTUALIZAR:\n   * 1. Usuario en modal con datos cargados edita valores
   * 2. Hace clic en "Guardar"
   * 3. handleSaveClick() ejecuta (línea 170-210)
   * 4. Valida con Yup (línea 173)
   * 5. Prepara dataToSave (línea 175-187)
   * 6. Llama onSave(dataToSave) → handleSave() en Actions (línea 188)
   * 7. handleSave() detecta que SÍ hay editingLista.IDLISTAOK
   * 8. Si NO cambió ACTIVED, llama preciosListasService.update() → ⭐ LÍNEA 68 EN ACTIONS\n   */
  const handleSaveClick = async () => {
    setIsSaving(true);
    setValidationErrors(null);

    try {
      // PASO 1: Validar con Yup schema
      await preciosListasValidationSchema.validate(formData, { abortEarly: false });

      // PASO 2: Preparar datos para enviar al servidor
      const dataToSave = {
        IDLISTAOK: formData.IDLISTAOK || `LIS-${Date.now()}`,
        SKUSIDS: JSON.stringify(formData.SKUSIDS), // Convertir array a JSON string
        IDINSTITUTOOK: formData.IDINSTITUTOOK,
        DESLISTA: formData.DESLISTA,
        FECHAEXPIRAINI: formData.FECHAEXPIRAINI || null,
        FECHAEXPIRAFIN: formData.FECHAEXPIRAFIN || null,
        IDTIPOLISTAOK: formData.IDTIPOLISTAOK,
        IDTIPOGENERALISTAOK: formData.IDTIPOGENERALISTAOK,
        IDTIPOFORMULAOK: formData.IDTIPOFORMULAOK,
        ACTIVED: Boolean(formData.ACTIVED),
      };

      // PASO 3: Llamar onSave que es handleSave() en PreciosListasActions
      // handleSave() determinará si es CREATE o UPDATE
      if (typeof onSave === 'function') {
        // Modo modal en tabla: onSave es handleSave() de PreciosListasActions
        onSave(dataToSave);
      } else {
        // Modo página: guardar directamente y mostrar feedback
        try {
          const isEditMode = lista && lista.IDLISTAOK;
          if (isEditMode) {
            // UPDATE
            await preciosListasService.update(lista.IDLISTAOK, dataToSave);
          } else {
            // CREATE
            await preciosListasService.create(dataToSave);
          }
          
          // Mostrar feedback y cerrar
          setValidationErrors(null);
          // Mostrar mensaje de éxito brevemente antes de cerrar
          setTimeout(() => {
            onClose();
          }, 500);
        } catch (error) {
          setValidationErrors(
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem', color: '#c00' }}>
                {error.response?.data?.messageUSR || error.message || 'Error al guardar la lista'}
              </li>
            </ul>
          );
        }
      }
    } catch (error) {
      // Si hay errores de validación
      if (error instanceof yup.ValidationError) {
        const errorMessages = (
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            {error.inner.map((err, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: '#c00' }}>
                {err.message}
              </li>
            ))}
          </ul>
        );
        setValidationErrors(errorMessages);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Determinar si es modo edición
  const isEditMode = !!lista && !!lista.IDLISTAOK;

  // Obtener estado actual de la lista para mostrar
  const getStatus = () => {
    if (formData.ACTIVED) return { state: 'Success', text: 'Activo' };
    return { state: 'Warning', text: 'Inactivo' };
  };

  const status = getStatus();

  if (!open) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: '#f5f7fa',
      overflow: 'hidden'
    }}>
      {/* HEADER FIJO */}
      <div style={{
        padding: '1.5rem 2rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        <FlexBox justifyContent="SpaceBetween" alignItems="Center">
          <FlexBox direction="Column">
            <Title level="H2" style={{ margin: 0 }}>
              {isEditMode ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
            </Title>
            <Text style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {isEditMode ? 'Modifica los detalles de la lista' : 'Crea una nueva lista de precios'}
            </Text>
          </FlexBox>
          <Button
            icon="decline"
            design="Transparent"
            onClick={onClose}
            disabled={isSaving}
          >
            Cerrar
          </Button>
        </FlexBox>
      </div>

      {/* ERRORES DE VALIDACIÓN */}
      <MessageBox
        open={!!validationErrors}
        type="Error"
        titleText="Errores de Validación"
        actions={[MessageBoxAction.OK]}
        onClose={() => setValidationErrors(null)}
      >
        {validationErrors}
      </MessageBox>

      {/* CONTENIDO PRINCIPAL: Dos columnas */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        width: '100%'
      }}>
        {/* COLUMNA IZQUIERDA: Configuración General (380px fijo) */}
        <div style={{
          width: '380px',
          backgroundColor: '#f7f8fa',
          padding: '1.5rem',
          overflowY: 'auto',
          borderRight: '1px solid #e5e5e5',
          flexShrink: 0
        }}>
          <FlexBox direction="Column" style={{ gap: '2rem' }}>
            {/* Encabezado */}
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Title level="H4" style={{ margin: 0, fontSize: '1.1rem' }}>
                {isEditMode ? 'Editar Configuración' : 'Nueva Lista'}
              </Title>
              <Text style={{ color: '#666', fontSize: '0.875rem' }}>
                {isEditMode ? 'Modifica los datos de la lista' : 'Completa los datos generales'}
              </Text>
            </FlexBox>

            {/* INFORMACIÓN GENERAL */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginBottom: 0, fontSize: '0.95rem' }}>
                Información General
              </Title>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>ID de la Lista</Label>
                <Input
                  value={formData.IDLISTAOK || ''}
                  readOnly
                  placeholder="Auto-generado"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', fontSize: '0.9rem' }}
                />
              </FlexBox>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Descripción</Label>
                <Input
                  value={formData.DESLISTA || ''}
                  onInput={(e) => handleInputChange('DESLISTA', e.target.value)}
                  placeholder="Ej: Lista de Precios Verano 2024"
                  style={{ fontSize: '0.9rem' }}
                />
              </FlexBox>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Instituto</Label>
                <Input
                  value={formData.IDINSTITUTOOK || ''}
                  onInput={(e) => handleInputChange('IDINSTITUTOOK', e.target.value)}
                  placeholder="ID del Instituto"
                  style={{ fontSize: '0.9rem' }}
                />
              </FlexBox>
            </FlexBox>

            {/* CONFIGURACIÓN */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginBottom: 0, fontSize: '0.95rem' }}>
                Configuración
              </Title>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Tipo de Lista</Label>
                <Select
                  value={formData.IDTIPOLISTAOK || ''}
                  onChange={(e) => handleInputChange('IDTIPOLISTAOK', e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                >
                  <Option value="">Seleccionar tipo...</Option>
                  <Option value="BASE">Lista Base</Option>
                  <Option value="MAYORISTA">Lista Mayorista</Option>
                  <Option value="MINORISTA">Lista Minorista</Option>
                  <Option value="PROMOCIONAL">Lista Promocional</Option>
                  <Option value="VIP">Lista VIP</Option>
                  <Option value="ESTACIONAL">Lista Estacional</Option>
                  <Option value="REGIONAL">Lista por Región</Option>
                  <Option value="CANAL">Lista por Canal</Option>
                  <Option value="COSTO">Lista de Costo</Option>
                  <Option value="ESPECIAL">Lista Especial</Option>
                </Select>
              </FlexBox>

              <FlexBox direction="Column">
                <Label style={{ fontSize: '0.85rem' }}>Tipo General</Label>
                <Select
                  value={formData.IDTIPOGENERALISTAOK || ''}
                  onChange={(e) => handleInputChange('IDTIPOGENERALISTAOK', e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                >
                  <Option value="ESPECIFICA">Específica</Option>
                  <Option value="GENERAL">General</Option>
                </Select>
              </FlexBox>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Tipo Fórmula</Label>
                <Select
                  value={formData.IDTIPOFORMULAOK || ''}
                  onChange={(e) => handleInputChange('IDTIPOFORMULAOK', e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                >
                  <Option value="">Seleccionar fórmula...</Option>
                  <Option value="FIJO">Fijo - Precio fijo directo</Option>
                  <Option value="PORCENTAJE">Porcentaje - Incremento/Descuento %</Option>
                  <Option value="DESCUENTO">Descuento - Monto fijo</Option>
                  <Option value="MARGEN">Margen - Margen sobre costo</Option>
                  <Option value="ESCALA">Escala - Según cantidad</Option>
                </Select>
              </FlexBox>
            </FlexBox>

            {/* FECHAS */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginBottom: 0, fontSize: '0.95rem' }}>
                Vigencia
              </Title>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={formData.FECHAEXPIRAINI || ''}
                  onInput={(e) => handleInputChange('FECHAEXPIRAINI', e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                />
              </FlexBox>

              <FlexBox direction="Column">
                <Label required style={{ fontSize: '0.85rem' }}>Fecha de Fin</Label>
                <Input
                  type="date"
                  value={formData.FECHAEXPIRAFIN || ''}
                  onInput={(e) => handleInputChange('FECHAEXPIRAFIN', e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                />
              </FlexBox>
            </FlexBox>

            {/* PRODUCTOS SELECCIONADOS */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginBottom: 0, fontSize: '0.95rem' }}>
                Productos
              </Title>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e0e0e0'
              }}>
                <Text style={{ fontSize: '0.85rem', fontWeight: '500', color: '#2c3e50' }}>
                  {(formData.SKUSIDS && formData.SKUSIDS.length > 0)
                    ? `✓ ${formData.SKUSIDS.length} producto(s)`
                    : '⚠ Sin productos seleccionados'}
                </Text>
              </div>
            </FlexBox>

            {/* FILTROS APLICADOS */}
            {(filterDates.fechaIngresoDesde || filterDates.fechaIngresoHasta) && (
              <FlexBox direction="Column" style={{ gap: '1rem' }}>
                <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginBottom: 0, fontSize: '0.95rem' }}>
                  Filtros
                </Title>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0f7ff',
                  borderRadius: '4px',
                  borderLeft: '3px solid #0066cc'
                }}>
                  <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                    {filterDates.fechaIngresoDesde && (
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                        <Text style={{ fontWeight: '600', color: '#0066cc', fontSize: '0.8rem', minWidth: '60px' }}>Desde:</Text>
                        <Text style={{ color: '#333', fontSize: '0.8rem' }}>{filterDates.fechaIngresoDesde}</Text>
                      </FlexBox>
                    )}
                    {filterDates.fechaIngresoHasta && (
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                        <Text style={{ fontWeight: '600', color: '#0066cc', fontSize: '0.8rem', minWidth: '60px' }}>Hasta:</Text>
                        <Text style={{ color: '#333', fontSize: '0.8rem' }}>{filterDates.fechaIngresoHasta}</Text>
                      </FlexBox>
                    )}
                  </FlexBox>
                </div>
              </FlexBox>
            )}
          </FlexBox>
        </div>

        {/* COLUMNA DERECHA: Selección de Productos (flex: 1) */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#f5f7fa'
        }}>
          <TabContainer
            collapsed={false}
            onTabSelect={(e) => setActiveTab(e.detail.tab.dataset.key)}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* TAB: FILTROS Y SELECCIÓN */}
            <Tab text="Paso 1: Selección de Productos" icon="filter" data-key="filtros">
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                padding: '0',
                background: '#f5f7fa',
                gap: 0
              }}>
                <div style={{ padding: '1.5rem', paddingBottom: '0.5rem', flexShrink: 0 }}>
                  <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                    <Title level="H4" style={{ margin: 0, fontSize: '1.2rem' }}>
                      Selección de Productos
                    </Title>
                    <Text style={{ color: '#666', fontSize: '0.875rem' }}>
                      Aplica filtros para definir los productos • {formData.SKUSIDS?.length || 0} seleccionados
                    </Text>
                  </FlexBox>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <AdvancedFiltersPreciosListas
                    onFiltersChange={handleFiltersChange}
                    initialFilters={{}}
                    preselectedProducts={filteredSKUs}
                  />
                </div>
                <div style={{ padding: '1rem 1.5rem', paddingTop: '0.5rem', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0', textAlign: 'right', flexShrink: 0 }}>
                  <Text style={{ fontSize: '0.875rem', fontWeight: '500', color: '#2c3e50' }}>
                    ✓ {formData.SKUSIDS?.length || 0} producto(s) seleccionado(s)
                  </Text>
                </div>
              </div>
            </Tab>

            {/* TAB: RESUMEN */}
            <Tab text="Resumen" icon="overview" data-key="resumen">
              <div style={{
                padding: '1.5rem',
                maxHeight: '100%',
                overflowY: 'auto',
                background: '#f5f7fa',
                width: '100%'
              }}>
                <FlexBox direction="Column" style={{ gap: '1.5rem', maxWidth: '900px' }}>
                  <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    <CardHeader titleText="Resumen de la Lista" />
                    <div style={{ padding: '1.5rem' }}>
                      <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
                        <FlexBox style={{ gap: '1.5rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '1.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>ID</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.IDLISTAOK || 'Auto-generado'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Descripción</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.DESLISTA || '-'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Instituto</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.IDINSTITUTOOK || '-'}</Text>
                          </div>
                        </FlexBox>

                        <FlexBox style={{ gap: '1.5rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '1.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Tipo de Lista</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.IDTIPOLISTAOK || '-'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Tipo General</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.IDTIPOGENERALISTAOK || '-'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Fórmula</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.IDTIPOFORMULAOK || '-'}</Text>
                          </div>
                        </FlexBox>

                        <FlexBox style={{ gap: '1.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Vigencia Desde</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.FECHAEXPIRAINI ? new Date(formData.FECHAEXPIRAINI).toLocaleDateString('es-ES') : '-'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Vigencia Hasta</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formData.FECHAEXPIRAFIN ? new Date(formData.FECHAEXPIRAFIN).toLocaleDateString('es-ES') : '-'}</Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Productos</Label>
                            <Text style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '0.25rem', color: '#0066cc' }}>{formData.SKUSIDS?.length || 0}</Text>
                          </div>
                        </FlexBox>
                      </FlexBox>
                    </div>
                  </Card>
                </FlexBox>
              </div>
            </Tab>
          </TabContainer>
        </div>
      </div>

      {/* FOOTER FIJO */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: '#fff',
        borderTop: '1px solid #e0e0e0',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        <FlexBox justifyContent="End" style={{ gap: '1rem' }}>
          <Button
            design="Transparent"
            icon="decline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            design="Emphasized"
            icon="save"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? (
              <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                <BusyIndicator active size="Small" />
                <span>Guardando...</span>
              </FlexBox>
            ) : (
              'Guardar'
            )}
          </Button>
        </FlexBox>
      </div>
    </div>
  );
};

export default PreciosListasModal;
