import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Input,
  DatePicker,
  Switch,
  Label,
  Title,
  Text,
  FlexBox,
  Card,
  ObjectStatus
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';

// 🔹 Formatea la fecha para DatePicker (YYYY-MM-DD)
const formatDateForPicker = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PreciosListasModal = ({ open, onClose, onSave, lista }) => {
  const initialState = {
    IDLISTAOK: '',
    SKUID: '',
    IDINSTITUTOOK: '',
    IDLISTABK: '',
    DESLISTA: '',
    FECHAEXPIRAINI: formatDateForPicker(new Date()),
    FECHAEXPIRAFIN: formatDateForPicker(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    ),
    IDTIPOLISTAOK: '',
    IDTIPOGENERALISTAOK: 'ESPECIFICA',
    IDTIPOFORMULAOK: 'FIJO',
    REGUSER: 'HANNIAALIDELUNA',
    ACTIVED: true,
    DELETED: false,
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (open) {
      if (lista) {
        // Modo edición
        setFormData({
          ...initialState,
          ...lista,
          FECHAEXPIRAINI: formatDateForPicker(lista.FECHAEXPIRAINI),
          FECHAEXPIRAFIN: formatDateForPicker(lista.FECHAEXPIRAFIN),
        });
      } else {
        // Modo creación
        setFormData(initialState);
      }
    }
  }, [lista, open]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { checked } = e.target;
    setFormData((prev) => ({ ...prev, ACTIVED: checked }));
  };

  const handleSaveClick = () => {
    // ✅ Estructura alineada con el modelo de backend (sin REGDATE)
    const dataToSave = {
      IDLISTAOK: formData.IDLISTAOK || `LIS-${Date.now()}`,
      SKUID: formData.SKUID,
      IDINSTITUTOOK: formData.IDINSTITUTOOK,
      IDLISTABK: formData.IDLISTABK,
      DESLISTA: formData.DESLISTA,
      FECHAEXPIRAINI: formData.FECHAEXPIRAINI || null,
      FECHAEXPIRAFIN: formData.FECHAEXPIRAFIN || null,
      IDTIPOLISTAOK: formData.IDTIPOLISTAOK,
      IDTIPOGENERALISTAOK: formData.IDTIPOGENERALISTAOK,
      IDTIPOFORMULAOK: formData.IDTIPOFORMULAOK,
      REGUSER: formData.REGUSER,
      ACTIVED: Boolean(formData.ACTIVED),
      DELETED: Boolean(formData.DELETED),
    };

    onSave(dataToSave);
  };

  const isEditMode = !!lista;

  const getStatus = () => {
    if (formData.DELETED) return { state: ValueState.Error, text: 'Eliminado' };
    if (formData.ACTIVED) return { state: ValueState.Success, text: 'Activo' };
    return { state: ValueState.Warning, text: 'Inactivo' };
  };

  const status = getStatus();

  return (
    <Dialog
      open={open}
      onAfterClose={onClose}
      header={<Bar><Title level="H4">{isEditMode ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}</Title></Bar>}
      footer={
        <Bar
          endContent={
            <>
              <Button design="Emphasized" onClick={handleSaveClick}>
                Guardar
              </Button>
              <Button design="Transparent" onClick={onClose}>
                Cancelar
              </Button>
            </>
          }
        />
      }
      style={{ width: '700px', maxWidth: '98vw', borderRadius: '12px' }}
    >
      <FlexBox direction="Column" style={{ padding: '1.5rem', gap: '1.25rem', background: '#f5f7fa' }}>
        {/* === Información General === */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '0.75rem' }}>
            <FlexBox alignItems="Center" justifyContent="SpaceBetween">
              <Title level="H5">Información General</Title>
              <ObjectStatus state={status.state}>{status.text}</ObjectStatus>
            </FlexBox>

            <Label>Descripción de la lista</Label>
            <Input
              value={formData.DESLISTA || ''}
              onInput={(e) => handleInputChange('DESLISTA', e.target.value)}
              placeholder="Ej: Lista de precios Verano 2024"
            />

            <Label>SKU ID</Label>
            <Input
              value={formData.SKUID || ''}
              onInput={(e) => handleInputChange('SKUID', e.target.value)}
              placeholder="Ej: PROD-001"
            />

            <Label>ID de Instituto</Label>
            <Input
              value={formData.IDINSTITUTOOK || ''}
              onInput={(e) => handleInputChange('IDINSTITUTOOK', e.target.value)}
              placeholder="Ej: INSTITUTO-XYZ"
            />
          </FlexBox>
        </Card>

        {/* === Parámetros de Configuración === */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '0.75rem' }}>
            <Title level="H6">Configuración de Lista</Title>

            <Label>Tipo de lista</Label>
            <Input
              value={formData.IDTIPOLISTAOK || ''}
              onInput={(e) => handleInputChange('IDTIPOLISTAOK', e.target.value)}
              placeholder="Ej: TIPO-01"
            />

            <Label>Tipo de fórmula aplicada</Label>
            <Input
              value={formData.IDTIPOFORMULAOK || ''}
              onInput={(e) => handleInputChange('IDTIPOFORMULAOK', e.target.value)}
              placeholder="Ej: FORMULA-01"
            />

            <Label>Inicio de vigencia</Label>
            <DatePicker
              value={formData.FECHAEXPIRAINI || ''}
              formatPattern="yyyy-MM-dd"
              onChange={(e) => handleInputChange('FECHAEXPIRAINI', e.target.value)}
            />

            <Label>Fin de vigencia</Label>
            <DatePicker
              value={formData.FECHAEXPIRAFIN || ''}
              formatPattern="yyyy-MM-dd"
              onChange={(e) => handleInputChange('FECHAEXPIRAFIN', e.target.value)}
            />

            <Label>Activo</Label>
            <Switch
              checked={formData.ACTIVED || false}
              onChange={handleSwitchChange}
            />
          </FlexBox>
        </Card>

        {/* === Auditoría === */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '0.5rem' }}>
            <Title level="H6">Auditoría</Title>
            <FlexBox style={{ gap: '2rem', flexWrap: 'wrap' }}>
              <FlexBox direction="Column">
                <Label>Creado por</Label>
                <Text>{formData.REGUSER || 'N/A'}</Text>
              </FlexBox>
              <FlexBox direction="Column">
                <Label>Modificado por</Label>
                <Text>{lista?.MODUSER || 'N/A'}</Text>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </Card>
      </FlexBox>
    </Dialog>
  );
};

export default PreciosListasModal;
