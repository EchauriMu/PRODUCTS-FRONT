import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  Bar,
  Title,
  Button,
  FlexBox,
  Card,
  Text,
  Label,
  Icon,
  ObjectStatus,
  CheckBox,
  Switch
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productPresentacionesService from '../../api/productPresentacionesService';

const ItemCard = ({ item, selectable, checked, onToggle, onOpen }) => {
  const click = () => (selectable ? onToggle(item.IdPresentaOK) : onOpen(item));

  return (
    <Card style={{ width: '100%', borderRadius: '12px', cursor: 'pointer' }} onClick={click}>
      <FlexBox alignItems="Center" style={{ gap: '0.75rem', padding: '0.75rem' }}>
        <div onClick={(e) => e.stopPropagation()}>
          {selectable ? (
            <CheckBox checked={checked} onChange={() => onToggle(item.IdPresentaOK)} />
          ) : (
            <div style={{ width: 20 }} />
          )}
        </div>
        <FlexBox direction="Column" style={{ gap: '0.25rem', flex: 1 }}>
          <Text style={{ fontWeight: 700 }}>
            {item.NOMBREPRESENTACION || item.Descripcion}
          </Text>
          <Text style={{ color: '#555' }}>{item.Descripcion}</Text>
          <ObjectStatus state={item.ACTIVED ? ValueState.Success : ValueState.Warning}>
            {item.ACTIVED ? 'Activa' : 'Inactiva'} · {item.SKUID}
          </ObjectStatus>
        </FlexBox>
      </FlexBox>
    </Card>
  );
};

const PresentaPickerDialog = ({
  open,
  onClose,
  skuid,
  presentaciones = [],
  onPick,
  onBulkDeleted
}) => {
  const [list, setList] = useState([]);
  const [multi, setMulti] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  // Sincroniza lista inicial cuando abre
  useEffect(() => {
    if (open) {
      setList(presentaciones || []);
      setSelected(new Set());
    }
  }, [open, presentaciones]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const canBulkDelete = multi && selectedIds.length > 0 && !busy;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenOne = (item) => {
    if (typeof onPick === 'function') onPick(item);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await productPresentacionesService.deletePresentacionesBulk(selectedIds, 'EECHAURIM');
      setList((prev) => prev.filter((x) => !selectedIds.includes(x.IdPresentaOK)));
      setSelected(new Set());
      if (typeof onBulkDeleted === 'function') onBulkDeleted(list.filter(x => selectedIds.includes(x.IdPresentaOK)));
      // mejor enviar solo ids:
      if (typeof onBulkDeleted === 'function') onBulkDeleted(selectedIds.map(id => ({ IdPresentaOK: id })));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={
        <Bar
          startContent={<Title level="H5">Selecciona presentación</Title>}
          endContent={
            <>
              <Label style={{ marginRight: 8 }}>Selección múltiple</Label>
              <Switch checked={multi} onChange={(e) => setMulti(e.target.checked)} />
              <Button
                design="Negative"
                icon="delete"
                disabled={!canBulkDelete}
                onClick={handleBulkDelete}
              >
                Eliminar seleccionadas
              </Button>
              <Button design="Transparent" onClick={onClose}>Cerrar</Button>
            </>
          }
        />
      }
      style={{ width: '900px', maxWidth: '98vw' }}
    >
      <FlexBox style={{ padding: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        {list.map((item) => (
          <div key={item.IdPresentaOK} style={{ width: 'calc(50% - 0.5rem)' }}>
            <ItemCard
              item={item}
              selectable={multi}
              checked={selected.has(item.IdPresentaOK)}
              onToggle={toggle}
              onOpen={handleOpenOne}
            />
          </div>
        ))}
        {list.length === 0 && (
          <Text style={{ color: '#666' }}>No hay presentaciones para este producto.</Text>
        )}
      </FlexBox>
    </Dialog>
  );
};

export default PresentaPickerDialog;
