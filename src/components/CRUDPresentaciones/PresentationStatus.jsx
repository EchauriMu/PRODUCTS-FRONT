import React, { useState, useEffect } from 'react';
import { FlexBox, Label, Switch, Tag, Text } from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';

// Mock del servicio de presentaciones, para simular llamadas a la API.
const presentationService = {
  async togglePresentacionStatus(idpresentaok, newStatus) {
    console.log(`Simulando cambio de estado para presentación ${idpresentaok}: ${newStatus}`);
    // Simula una llamada a la API que puede fallar o tener éxito
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90% de probabilidad de éxito
        if (Math.random() > 0.1) {
          resolve({ IdPresentaOK: idpresentaok, ACTIVED: newStatus });
        } else {
          reject(new Error('Error de red simulado.'));
        }
      }, 500);
    });
  }
};

const PresentationStatus = ({ presentation, onStatusChange }) => {
  const [isActive, setIsActive] = useState(!!presentation.ACTIVED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sincroniza el estado si la prop de presentación cambia desde fuera
  useEffect(() => {
    setIsActive(presentation.ACTIVED);
  }, [presentation.ACTIVED]);

  const getStatusInfo = (pres) => {
    if (pres.DELETED) {
      return { design: 'Negative', text: 'Eliminado', state: ValueState.Error };
    }
    if (pres.ACTIVED) {
      return { design: 'Positive', text: 'Activo', state: ValueState.Success };
    }
    return { design: 'Critical', text: 'Inactivo', state: ValueState.Warning };
  };

  const handleSwitchChange = async (e) => {
    const newStatus = e.target.checked;
    setIsSubmitting(true);
    setError('');

    try {
      await presentationService.togglePresentacionStatus(presentation.IdPresentaOK, newStatus);
      setIsActive(newStatus);
      // Notifica al componente padre sobre el cambio exitoso
      if (onStatusChange) {
        onStatusChange({ ...presentation, ACTIVED: newStatus });
      }
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado.');
      // Revertir el switch si la API falla
      setTimeout(() => setError(''), 3000); // Limpiar error después de 3s
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusInfo = getStatusInfo({ ...presentation, ACTIVED: isActive });

  return (
    <FlexBox direction="Column" style={{ minWidth: '120px' }}>
      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
        <Tag design={statusInfo.design} style={{ flexShrink: 0 }}>
          {statusInfo.text}
        </Tag>

        <Switch
          checked={isActive}
          disabled={isSubmitting || presentation.DELETED}
          onChange={handleSwitchChange}
        />
        <Label>
          {isSubmitting ? 'Actualizando...' : (isActive ? 'Desactivar' : 'Activar')}
        </Label>
      </FlexBox>
      {error && (
        <Text style={{ color: 'var(--sapNegativeColor)', fontSize: 'var(--sapFontSize)' }}>
          {error}
        </Text>
      )}
    </FlexBox>
  );
};

export default PresentationStatus;