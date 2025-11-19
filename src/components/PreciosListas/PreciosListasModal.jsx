import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Input,
  DatePicker,
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
  BusyIndicator,
  Icon
} from '@ui5/webcomponents-react';
import AdvancedFiltersPreciosListas from './AdvancedFiltersPreciosListas';
import preciosListasService from '../../api/preciosListasService';
import * as yup from 'yup';

/**
 * ================================================================================
 * MODAL PARA CREAR/EDITAR LISTAS DE PRECIOS - PreciosListasModal.jsx
 * ================================================================================
 * 
 * Este componente es un DIALOG modal que permite:
 * - CREAR una nueva lista de precios
 * - EDITAR una lista existente
 * 
 * CARACTERÍSTICAS:
 * - Validación de formulario con Yup
 * - Dos pestañas (tabs):
 *   1. "Paso 2: Selección de Productos" - para seleccionar SKUs
 *   2. "Configuración" - para datos de la lista
 * - Soporte para filtros avanzados de productos
 * - Validaciones en tiempo real
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
      onSave(dataToSave); //aqui se le da guardar
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

  /**
   * RENDER DEL MODAL
   * 
   * Estructura:
   * - Dialog principal con footer (botones Cancelar/Guardar)
   * - MessageBox para mostrar errores de validación
   * - TabContainer con 2 pestañas:
   *   1. "Paso 2: Selección de Productos" - para filtrar y seleccionar SKUs
   *   2. "Configuración" - para datos de la lista (descripción, tipo, fechas, etc)
   * 
   * BOTONES:\n   * - Cancelar (design="Transparent"): Cierra el modal sin guardar
   * - Guardar (design="Emphasized"): Ejecuta handleSaveClick() que valida y guarda
   */
  return (
    <Dialog
      open={open}
      onAfterClose={onClose}
      headerText={isEditMode ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
      footer={
        <Bar
          endContent={
            <>
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
                {isSaving ? <BusyIndicator active size="Small" /> : 'Guardar'}
              </Button>
            </>
          }
        />
      }
      style={{ width: '98vw', maxWidth: '2000px', height: '97vh', borderRadius: '12px' }}
    >
      <MessageBox
        open={!!validationErrors}
        type="Error"
        titleText="Errores de Validación"
        actions={[MessageBoxAction.OK]}
        onClose={() => setValidationErrors(null)}
      >
        {validationErrors}
      </MessageBox>

      <TabContainer 
        collapsed={false} 
        onTabSelect={(e) => setActiveTab(e.detail.tab.dataset.key)}
        style={{ height: 'calc(97vh - 100px)', display: 'flex', flexDirection: 'column' }}
      >
        <Tab text="Paso 2: Selección de Productos" icon="filter" data-key="filtros">
          <div style={{ height: 'calc(97vh - 150px)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '2rem', background: '#f5f7fa' }}>
            <FlexBox direction="Column" style={{ marginBottom: '1rem', gap: '0.25rem' }}>
              <Title level="H3" style={{ margin: 0, color: '#2c3e50' }}>Paso 2: Selección de Productos</Title>
              <Text style={{ color: '#666', fontSize: '0.875rem' }}>Aplica filtros para definir el alcance • {formData.SKUSIDS?.length || 0} encontrados</Text>
            </FlexBox>
            <AdvancedFiltersPreciosListas 
              onFiltersChange={handleFiltersChange}
              initialFilters={{}}
              preselectedProducts={filteredSKUs}
            />
            <div style={{ padding: '1rem', marginTop: 'auto', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <Text style={{ marginRight: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {formData.SKUSIDS?.length || 0} producto(s) seleccionado(s)
              </Text>
            </div>
          </div>
        </Tab>

        <Tab text="Configuración (Paso 2)" icon="settings" data-key="config">
          <div style={{ padding: '2rem', maxHeight: 'calc(97vh - 200px)', overflowY: 'auto', background: '#f5f7fa' }}>
            <FlexBox direction="Column" style={{ gap: '1.25rem' }}>
              <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                <CardHeader titleText="Información General" />
                <div style={{ padding: '1rem' }}>
                  <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                    
                    <div>
                      <Label required>ID de la Lista</Label>
                      <Input
                        value={formData.IDLISTAOK || ''}
                        readOnly
                        placeholder="Auto-generado"
                        style={{ width: '100%', marginTop: '0.5rem', backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      <Text style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                        Identificador único (generado automáticamente)
                      </Text>
                    </div>

                    <div>
                      <Label required>Descripción de la Lista</Label>
                      <Input
                        value={formData.DESLISTA || ''}
                        onInput={(e) => handleInputChange('DESLISTA', e.target.value)}
                        placeholder="Ej: Lista de Precios Verano 2024"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      />
                    </div>

                    <div>
                      <Label>Productos Seleccionados</Label>
                      <div style={{ padding: '0.75rem', backgroundColor: '#f9f9f9', borderRadius: '6px', marginTop: '0.5rem', minHeight: '50px', display: 'flex', alignItems: 'center' }}>
                        <Text style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {(formData.SKUSIDS && formData.SKUSIDS.length > 0) || (filteredSKUs && filteredSKUs.size > 0)
                            ? `${formData.SKUSIDS?.length || filteredSKUs.size} producto(s) seleccionado(s)` 
                            : 'Sin productos seleccionados - ir a Filtros para agregar'}
                        </Text>
                      </div>
                    </div>
                  </FlexBox>
                </div>
              </Card>

              <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                <CardHeader titleText="Configuración de la Lista" />
                <div style={{ padding: '1rem' }}>
                  <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                    
                    <div>
                      <Label required>Instituto</Label>
                      <Input
                        value={formData.IDINSTITUTOOK || ''}
                        onInput={(e) => handleInputChange('IDINSTITUTOOK', e.target.value)}
                        placeholder="ID del Instituto"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      />
                    </div>

                    <FlexBox style={{ gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <Label required>Tipo de Lista</Label>
                        <Select
                          value={formData.IDTIPOLISTAOK || ''}
                          onChange={(e) => handleInputChange('IDTIPOLISTAOK', e.target.value)}
                          style={{ width: '100%', marginTop: '0.5rem' }}
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
                      </div>

                      <div style={{ flex: 1 }}>
                        <Label>Tipo General</Label>
                        <Select
                          value={formData.IDTIPOGENERALISTAOK || ''}
                          onChange={(e) => handleInputChange('IDTIPOGENERALISTAOK', e.target.value)}
                          style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                          <Option value="ESPECIFICA">Específica</Option>
                          <Option value="GENERAL">General</Option>
                        </Select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <Label required>Tipo Fórmula</Label>
                        <Select
                          value={formData.IDTIPOFORMULAOK || ''}
                          onChange={(e) => handleInputChange('IDTIPOFORMULAOK', e.target.value)}
                          style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                          <Option value="">Seleccionar fórmula...</Option>
                          <Option value="FIJO">Fijo</Option>
                          <Option value="PORCENTAJE">Porcentaje</Option>
                          <Option value="ESCALA">Escala</Option>
                        </Select>
                      </div>
                    </FlexBox>
                  </FlexBox>
                </div>
              </Card>

              {(filterDates.fechaIngresoDesde || filterDates.fechaIngresoHasta) && (
                <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px', backgroundColor: '#f0f7ff', borderLeft: '4px solid #0066cc' }}>
                  <CardHeader titleText="Fechas de Filtro Aplicadas" />
                  <div style={{ padding: '1rem' }}>
                    <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                      {filterDates.fechaIngresoDesde && (
                        <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                          <Text style={{ fontWeight: '600', color: '#0066cc', minWidth: '120px' }}>Desde:</Text>
                          <Text style={{ color: '#333' }}>{filterDates.fechaIngresoDesde}</Text>
                        </FlexBox>
                      )}
                      {filterDates.fechaIngresoHasta && (
                        <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
                          <Text style={{ fontWeight: '600', color: '#0066cc', minWidth: '120px' }}>Hasta:</Text>
                          <Text style={{ color: '#333' }}>{filterDates.fechaIngresoHasta}</Text>
                        </FlexBox>
                      )}
                    </FlexBox>
                  </div>
                </Card>
              )}

            </FlexBox>
          </div>
        </Tab>

      </TabContainer>
    </Dialog>
  );
};

export default PreciosListasModal;
