import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, Bar, Title, Button, FlexBox, Label, Input, TextArea, Switch, BusyIndicator
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productPresentacionesService from '../../api/productPresentacionesService';

/**
 * Editor de Presentación.
 * - Muestra datos actuales.
 * - IdPresentaOK está bloqueado.
 * - Envía sólo campos cambiados (UpdateOne).
 */
const PresentaEditDialog = ({ open, onClose, presenta, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cargar valores cuando cambie la presentación seleccionada
  useEffect(() => {
    if (!open) return;
    setForm(presenta ? {
      IdPresentaOK: presenta.IdPresentaOK || '',
      SKUID: presenta.SKUID || '',
      NOMBREPRESENTACION: presenta.NOMBREPRESENTACION || '',
      Descripcion: presenta.Descripcion || '',
      CostoIni: presenta.CostoIni ?? 0,
      CostoFin: presenta.CostoFin ?? 0,
      ACTIVED: !!presenta.ACTIVED,
      // puedes agregar PropiedadesExtras si usas
    } : null);
  }, [open, presenta]);

  const valid = useMemo(() => !!(form && form.NOMBREPRESENTACION && form.Descripcion), [form]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!presenta || !form) return;
    setSaving(true);
    try {
      // Detectar cambios
      const changes = {};
      const fields = ['NOMBREPRESENTACION', 'Descripcion', 'CostoIni', 'CostoFin', 'ACTIVED'];
      fields.forEach((k) => {
        const oldVal = presenta[k];
        const newVal = form[k];
        const normOld = (oldVal === undefined || oldVal === null) ? '' : oldVal;
        const normNew = (newVal === undefined || newVal === null) ? '' : newVal;
        if (String(normOld) !== String(normNew)) changes[k] = (k === 'ACTIVED') ? !!newVal :
          (k === 'CostoIni' || k === 'CostoFin') ? Number(newVal) || 0 : newVal;
      });

      const updated = await productPresentacionesService.updatePresentacion(
        presenta.IdPresentaOK,
        changes,
        'EECHAURIM'
      );
      onUpdated?.(updated || { ...presenta, ...changes });
      onClose?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar startContent={<Title level="H5">Editar presentación</Title>} />}
      footer={
        <Bar endContent={
          <>
            <Button design="Transparent" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button design="Emphasized" onClick={handleSave} disabled={!valid || saving} icon="save">Guardar</Button>
          </>
        } />
      }
      style={{ width: 720, maxWidth: '96vw' }}
    >
      <div style={{ padding: '1rem' }}>
        <FlexBox direction="Column" style={{ gap: '0.9rem' }}>
          <div>
            <Label>IdPresentaOK</Label>
            <Input value={form.IdPresentaOK} readOnly />
          </div>

          <div>
            <Label>Producto (SKUID)</Label>
            <Input value={form.SKUID} readOnly />
          </div>

          <div>
            <Label required>Nombre de la Presentación</Label>
            <Input
              name="NOMBREPRESENTACION"
              value={form.NOMBREPRESENTACION}
              onInput={handleInput}
              valueState={form.NOMBREPRESENTACION ? ValueState.None : ValueState.Negative}
            />
          </div>

          <div>
            <Label required>Descripción</Label>
            <TextArea
              name="Descripcion"
              value={form.Descripcion}
              onInput={handleInput}
              valueState={form.Descripcion ? ValueState.None : ValueState.Negative}
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label>Costo Inicial</Label>
              <Input name="CostoIni" type="Number" value={form.CostoIni} onInput={handleInput} />
            </div>
            <div>
              <Label>Costo Final</Label>
              <Input name="CostoFin" type="Number" value={form.CostoFin} onInput={handleInput} />
            </div>
          </div>

          <div>
            <Label>Activa</Label>
            <Switch checked={!!form.ACTIVED} onChange={(e) => setForm(f => ({ ...f, ACTIVED: e.target.checked }))} />
          </div>
        </FlexBox>

        {saving && <BusyIndicator active delay={0} style={{ marginTop: 8 }} />}
      </div>
    </Dialog>
  );
};

export default PresentaEditDialog;
