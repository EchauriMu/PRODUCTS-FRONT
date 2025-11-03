import React, { useState, useEffect } from 'react';
import { FlexBox, Label, Switch, Tag, Text } from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';

// Mock del servicio de productos, en un futuro se conectará a la API real.
const productService = {
  async toggleProductStatus(skuid, newStatus) {
    console.log(`Simulando cambio de estado para producto ${skuid}: ${newStatus}`);
    // Simula una llamada a la API que puede fallar o tener éxito
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% de éxito
          resolve({ SKUID: skuid, ACTIVED: newStatus });
        } else {
          reject(new Error('Error de red simulado.'));
        }
      }, 500);
    });
  }
};

const ProductStatus = ({ product, onStatusChange }) => {
  const [isActive, setIsActive] = useState(product.ACTIVED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsActive(product.ACTIVED);
  }, [product.ACTIVED]);

  const getStatusInfo = (prod) => {
    if (prod.DELETED) {
      return { design: 'Negative', text: 'Eliminado', state: ValueState.Error };
    }
    return isActive ? { design: 'Positive', text: 'Activo', state: ValueState.Success }
                    : { design: 'Critical', text: 'Inactivo', state: ValueState.Warning };
  };

  const handleSwitchChange = async (e) => {
    const newStatus = e.target.checked;
    setIsSubmitting(true);
    setError('');

    try {
      await productService.toggleProductStatus(product.SKUID, newStatus);
      setIsActive(newStatus);
      if (onStatusChange) {
        onStatusChange({ ...product, ACTIVED: newStatus });
      }
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusInfo = getStatusInfo(product);

  return (
    <FlexBox direction="Column" style={{ minWidth: '120px' }}>
      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
        <Tag design={statusInfo.design}>{statusInfo.text}</Tag>
        <Switch
          checked={isActive}
          disabled={isSubmitting || product.DELETED}
          onChange={handleSwitchChange}
        />
        <Label>{isSubmitting ? 'Actualizando...' : (isActive ? 'Desactivar' : 'Activar')}</Label>
      </FlexBox>
      {error && <Text style={{ color: 'var(--sapNegativeColor)', fontSize: 'var(--sapFontSize)' }}>{error}</Text>}
    </FlexBox>
  );
};

export default ProductStatus;