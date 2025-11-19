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

const formatDateForPicker = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  const [formData, setFormData] = useState(initialState);
  const [filteredSKUs, setFilteredSKUs] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('filtros');
  const [filterDates, setFilterDates] = useState({
    fechaIngresoDesde: '',
    fechaIngresoHasta: ''
  });
  const lastSelectedSkusRef = useRef(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    if (open && lista) {
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
      // Generate sequential ID for new lists
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
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSaveClick = async () => {
    setIsSaving(true);
    setValidationErrors(null);

    try {
      await preciosListasValidationSchema.validate(formData, { abortEarly: false });

      const dataToSave = {
        IDLISTAOK: formData.IDLISTAOK || `LIS-${Date.now()}`,
        SKUSIDS: JSON.stringify(formData.SKUSIDS),
        IDINSTITUTOOK: formData.IDINSTITUTOOK,
        DESLISTA: formData.DESLISTA,
        FECHAEXPIRAINI: formData.FECHAEXPIRAINI || null,
        FECHAEXPIRAFIN: formData.FECHAEXPIRAFIN || null,
        IDTIPOLISTAOK: formData.IDTIPOLISTAOK,
        IDTIPOGENERALISTAOK: formData.IDTIPOGENERALISTAOK,
        IDTIPOFORMULAOK: formData.IDTIPOFORMULAOK,
        ACTIVED: Boolean(formData.ACTIVED),
      };

      onSave(dataToSave);
    } catch (error) {
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

  const isEditMode = !!lista && !!lista.IDLISTAOK;

  const getStatus = () => {
    if (formData.ACTIVED) return { state: 'Success', text: 'Activo' };
    return { state: 'Warning', text: 'Inactivo' };
  };

  const status = getStatus();

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
