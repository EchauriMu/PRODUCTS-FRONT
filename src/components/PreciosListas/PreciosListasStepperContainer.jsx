import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Label,
  Title,
  Text,
  FlexBox,
  Card,
  CardHeader,
  MessageBox,
  MessageBoxAction,
  Select,
  Option,
  BusyIndicator
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

const PreciosListasStepperContainer = ({ onClose, lista }) => {
  // === ESTADO INICIAL ===
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

  // === ESTADOS LOCALES ===
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialState);
  const [filteredSKUs, setFilteredSKUs] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterDates, setFilterDates] = useState({
    fechaIngresoDesde: '',
    fechaIngresoHasta: ''
  });
  const nextIdRef = useRef(0);

  // === CARGAR DATOS AL MONTAR ===
  useEffect(() => {
    if (lista) {
      // MODO EDICIÓN
      setFormData({
        ...initialState,
        ...lista,
        FECHAEXPIRAINI: formatDateForPicker(lista.FECHAEXPIRAINI),
        FECHAEXPIRAFIN: formatDateForPicker(lista.FECHAEXPIRAFIN),
        SKUSIDS: Array.isArray(lista.SKUSIDS) ? lista.SKUSIDS : (lista.SKUSIDS ? JSON.parse(lista.SKUSIDS) : []),
      });
      setFilteredSKUs(new Set(Array.isArray(lista.SKUSIDS) ? lista.SKUSIDS : []));
      setCurrentStep(1); // Empezar en paso 1
    } else {
      // MODO CREACIÓN
      const newId = nextIdRef.current;
      nextIdRef.current += 1;
      const newFormData = {
        ...initialState,
        IDLISTAOK: `ID-${newId.toString().padStart(3, '0')}`,
      };
      setFormData(newFormData);
      setFilteredSKUs(new Set());
      setCurrentStep(1);
    }
    setValidationErrors(null);
  }, [lista]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiltersChange = (filterData) => {
    if (filterData.selectedSKUs) {
      setFormData((prev) => ({ ...prev, SKUSIDS: filterData.selectedSKUs }));
      setFilteredSKUs(new Set(filterData.selectedSKUs));
    }
    if (filterData.filterDates) {
      setFilterDates(filterData.filterDates);
    }
  };

  const handleNextStep = async () => {
    try {
      // Validar que los campos del paso 1 estén completos
      await yup.object().shape({
        DESLISTA: yup.string().required('La descripción es obligatoria.').min(3, 'Mínimo 3 caracteres.'),
        IDINSTITUTOOK: yup.string().required('El instituto es obligatorio.'),
        IDTIPOLISTAOK: yup.string().required('El tipo de lista es obligatorio.'),
        IDTIPOFORMULAOK: yup.string().required('El tipo de fórmula es obligatorio.'),
        FECHAEXPIRAINI: yup.string().required('La fecha de inicio es obligatoria.'),
        FECHAEXPIRAFIN: yup.string().required('La fecha de fin es obligatoria.'),
      }).validate(formData, { abortEarly: false });

      setValidationErrors(null);
      setCurrentStep(2);
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
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setValidationErrors(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setValidationErrors(null);

    try {
      // Validar datos completos
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
        IDTIPOFORMULAOK: formData.IDTIPOFORMULAOK || null,
        ACTIVED: Boolean(formData.ACTIVED),
      };

      const isEditMode = lista && lista.IDLISTAOK;
      if (isEditMode) {
        await preciosListasService.update(lista.IDLISTAOK, dataToSave);
      } else {
        await preciosListasService.create(dataToSave);
      }

      setValidationErrors(null);
      setTimeout(() => {
        onClose();
      }, 500);
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
      } else {
        setValidationErrors(
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem', color: '#c00' }}>
              {error.response?.data?.messageUSR || error.message || 'Error al guardar la lista'}
            </li>
          </ul>
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isEditMode = lista && lista.IDLISTAOK;

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
              {currentStep === 1
                ? 'Paso 1 de 2: Completa los datos generales'
                : 'Paso 2 de 2: Selecciona los productos'}
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

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {currentStep === 1 ? (
          // === PASO 1: NUEVA LISTA ===
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%'
          }}>
            <FlexBox direction="Column" style={{ gap: '2rem' }}>
              {/* INFORMACIÓN GENERAL */}
              <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                <CardHeader titleText="Información General" />
                <div style={{ padding: '1.5rem' }}>
                  <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
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
                </div>
              </Card>

              {/* CONFIGURACIÓN */}
              <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                <CardHeader titleText="Configuración" />
                <div style={{ padding: '1.5rem' }}>
                  <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
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
                      <Label style={{ fontSize: '0.85rem' }}>Tipo general de lista</Label>
                      <Select
                        value={formData.IDTIPOGENERALISTAOK || ''}
                        onChange={(e) => handleInputChange('IDTIPOGENERALISTAOK', e.target.value)}
                        style={{ width: '100%', fontSize: '0.9rem' }}
                      >
                        <Option value="ESPECIFICA">Específica</Option>
                        <Option value="GENERAL">General</Option>
                      </Select>
                    </FlexBox>
                  </FlexBox>
                </div>
              </Card>

              {/* VIGENCIA */}
              <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                <CardHeader titleText="Vigencia" />
                <div style={{ padding: '1.5rem' }}>
                  <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
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
                </div>
              </Card>
            </FlexBox>
          </div>
        ) : (
          // === PASO 2: SELECCIÓN DE PRODUCTOS ===
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
              <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
                <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                  <Title level="H3" style={{ margin: 0, fontSize: '1.2rem' }}>
                    Selección de Productos y Fórmula
                  </Title>
                  <Text style={{ color: '#666', fontSize: '0.875rem' }}>
                    Aplica filtros para definir los productos • {formData.SKUSIDS?.length || 0} seleccionados
                  </Text>
                </FlexBox>
              </FlexBox>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 2rem' }}>
              <AdvancedFiltersPreciosListas
                onFiltersChange={handleFiltersChange}
                initialFilters={{}}
                preselectedProducts={filteredSKUs}
              />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER FIJO */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: '#fff',
        borderTop: '1px solid #e0e0e0',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        <FlexBox justifyContent="SpaceBetween" style={{ gap: '1rem' }}>
          <FlexBox style={{ gap: '1rem' }}>
            {currentStep === 2 && (
              <Button
                design="Default"
                icon="navigation-left-arrow"
                onClick={handlePreviousStep}
                disabled={isSaving}
              >
                Anterior
              </Button>
            )}
          </FlexBox>

          <FlexBox justifyContent="End" style={{ gap: '1rem' }}>
            <Button
              design="Transparent"
              icon="decline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            {currentStep === 1 ? (
              <Button
                design="Emphasized"
                icon="navigation-right-arrow"
                onClick={handleNextStep}
                disabled={isSaving}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                design="Emphasized"
                icon="save"
                onClick={handleSave}
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
            )}
          </FlexBox>
        </FlexBox>
      </div>
    </div>
  );
};

export default PreciosListasStepperContainer;
