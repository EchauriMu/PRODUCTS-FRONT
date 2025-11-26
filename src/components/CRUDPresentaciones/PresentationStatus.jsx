import React, { useState } from 'react';
import {
  FlexBox,
  Switch,
  Text,
  MessageStrip,
  Icon
} from '@ui5/webcomponents-react';
import productPresentacionesService from '../../api/productPresentacionesService';

const PresentationStatus = ({ presentation, onStatusChange }) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const id = presentation?.IdPresentaOK;
  const isActive = !!presentation?.ACTIVED;

  const handleToggle = async (e) => {
    e?.stopPropagation?.();
    if (!id) return;

    const targetActive = !isActive;
    setSaving(true);
    setErr('');

    try {
      const updated = await productPresentacionesService.togglePresentacionStatus(
        id,
        targetActive
      );

      const merged = {
        ...presentation,
        ...updated,
        ACTIVED: targetActive,
        DELETED: false
      };
      onStatusChange?.(merged);
    } catch (error) {
      setErr(
        error?.response?.data?.messageUSR ||
          error?.message ||
          'No se pudo cambiar el estado.'
      );
    } finally {
      setSaving(false);
    }
  };

  const chipStyle = isActive
    ? {
        backgroundColor: '#e8f8f0',
        color: '#107e3e',
        border: '1px solid #b7e1cd'
      }
    : {
        backgroundColor: '#fdecea',
        color: '#b00020',
        border: '1px solid #f5c2c7'
      };

  return (
    <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
      <span
        style={{
          ...chipStyle,
          borderRadius: 9999,
          padding: '2px 10px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          lineHeight: 1
        }}
        title={isActive ? 'Activo' : 'Inactivo'}
      >
        <Icon name={isActive ? 'accept' : 'decline'} />
        {isActive ? 'Activo' : 'Inactivo'}
      </span>

      <FlexBox alignItems="Center" style={{ gap: 6 }}>
        <Text>{isActive ? 'Desactivar' : 'Activar'}</Text>
        <Switch checked={isActive} disabled={saving} onChange={handleToggle} />
      </FlexBox>

      {err && <MessageStrip design="Negative">{err}</MessageStrip>}
    </FlexBox>
  );
};

export default PresentationStatus;
