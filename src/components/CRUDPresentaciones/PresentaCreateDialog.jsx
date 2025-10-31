// src/components/CRUDPresentaciones/PresentaCreateDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  Bar,
  Title,
  Button,
  FlexBox,
  Label,
  Input,
  TextArea,
  Switch,
  BusyIndicator
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productPresentacionesService from '../../api/productPresentacionesService';

const PresentaCreateDialog = ({ open, onClose, skuid, onCreated }) => {
  const [form, setForm] = useState({
    SKUID: skuid || '',
    IdPresentaOK: '',
    NOMBREPRESENTACION: '',
    Descripcion: '',
    CostoIni: 0,
    CostoFin: 0,
    ACTIVED: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Mantén sincronizado el SKUID al abrir/cambiar de producto
  useEffect(() => {
    if (open) setForm(prev => ({ ...prev, SKUID: skuid || '' }));
  }, [skuid, open]);

  // Utilidad para "slug" del nombre
  const slugify = (s) =>
    (s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase();

  // IdPresentaOK autogenerado (SKUID + slug del nombre)
  const generatedId = useMemo(() => {
    if (!form.NOMBREPRESENTACION || !form.SKUID) return '';
    return `${form.SKUID}-${slugify(form.NOMBREPRESENTACION)}`;
  }, [form.NOMBREPRESENTACION, form.SKUID]);

  // Refleja el autogenerado en el formulario
  useEffect(() => {
    setForm(prev => ({ ...prev, IdPresentaOK: generatedId }));
  }, [generatedId]);

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const canCreate = form.SKUID && form.NOMBREPRESENTACION && form.Descripcion;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    try {
      const payload = {
        IdPresentaOK: form.IdPresentaOK, // ← se manda el ID autogenerado
        SKUID: form.SKUID,
        NOMBREPRESENTACION: form.NOMBREPRESENTACION,
        Descripcion: form.Descripcion,
        CostoIni: Number(form.CostoIni) || 0,
        CostoFin: Number(form.CostoFin) || 0,
        ACTIVED: !!form.ACTIVED
      };
      const created = await productPresentacionesService.addPresentacion(payload, 'EECHAURIM');
      onCreated?.(created); // refrescar lista en el padre si lo pasas
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar><Title level="H5">Nueva presentación</Title></Bar>}
      footer={
        <Bar
          endContent={
            <>
              <Button design="Transparent" onClick={onClose} disabled={submitting}>Cancelar</Button>
              <Button
                design="Emphasized"
                icon="add"
                onClick={handleCreate}
                disabled={!canCreate || submitting}
              >
                Crear
              </Button>
            </>
          }
        />
      }
      style={{ width: 680, maxWidth: '96vw' }}
    >
      <div style={{ padding: '1.25rem' }}>
        <FlexBox direction="Column" style={{ gap: '0.9rem' }}>
          <div>
            <Label>Producto (SKUID)</Label>
            <Input value={form.SKUID} readOnly />
          </div>

          <div>
            <Label>IdPresentaOK (autogenerado)</Label>
            <Input
              value={form.IdPresentaOK}
              readOnly
              placeholder="Se genera a partir del nombre"
            />
          </div>

          <div>
            <Label required>Nombre de la Presentación</Label>
            <Input
              name="NOMBREPRESENTACION"
              value={form.NOMBREPRESENTACION}
              onInput={onChange}
              placeholder="p.ej. Lata 30 g"
              valueState={form.NOMBREPRESENTACION ? ValueState.None : ValueState.Error}
            />
          </div>

          <div>
            <Label required>Descripción</Label>
            <TextArea
              name="Descripcion"
              value={form.Descripcion}
              onInput={onChange}
              placeholder="Descripción detallada para el cliente"
              valueState={form.Descripcion ? ValueState.None : ValueState.Error}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label>Costo Inicial</Label>
              <Input name="CostoIni" type="Number" value={form.CostoIni} onInput={onChange} />
            </div>
            <div>
              <Label>Costo Final</Label>
              <Input name="CostoFin" type="Number" value={form.CostoFin} onInput={onChange} />
            </div>
          </div>

          <div>
            <Label>Activa</Label>
            <Switch
              checked={!!form.ACTIVED}
              onChange={(e) => setForm(prev => ({ ...prev, ACTIVED: e.target.checked }))}
            />
          </div>
        </FlexBox>

        {submitting && (
          <BusyIndicator active delay={0} size="Medium" style={{ marginTop: '0.75rem' }} />
        )}
      </div>
    </Dialog>
  );
};

export default PresentaCreateDialog;
