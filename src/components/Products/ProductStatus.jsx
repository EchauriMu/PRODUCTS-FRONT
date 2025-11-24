import React, { useState, useEffect } from 'react';
import { FlexBox, Label, Switch, Tag, Text } from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import ProductEditButton from './ProductEditButton'; // Importamos el nuevo componente
import productService from '../../api/productService'; // Importamos el servicio real

const ProductStatus = ({ product, onStatusChange, onEditClick }) => {
  const [isActive, setIsActive] = useState(product.ACTIVED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' });

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
    setFeedbackMessage({ text: '', type: '' });

    try {
      let updatedProduct;
      if (newStatus) {
        // Si el nuevo estado es 'activo', siempre llamamos a la API de activación
        updatedProduct = await productService.activateProduct(product.SKUID);
      } else {
        // Si el nuevo estado es 'inactivo', llamamos a la API de borrado lógico
        updatedProduct = await productService.deleteProduct(product.SKUID);
      }
      setIsActive(updatedProduct?.value?.[0]?.data?.[0]?.dataRes?.ACTIVED ?? newStatus);
      if (onStatusChange) {
        // Extraemos la data real de la respuesta anidada de la API.
        // Hacemos un merge con el producto actual para asegurar que todos los campos estén presentes.
        const apiProductData = updatedProduct?.value?.[0]?.data?.[0]?.dataRes || {};
        const finalUpdatedProduct = { ...product, ...apiProductData, ACTIVED: newStatus, DELETED: !newStatus };
        // Notificamos al padre con el producto completamente actualizado desde el backend
        onStatusChange(finalUpdatedProduct);
        setFeedbackMessage({ text: 'Estado actualizado con éxito.', type: 'Success' });
        setTimeout(() => setFeedbackMessage({ text: '', type: '' }), 3000);
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cambiar el estado.';
      setFeedbackMessage({ text: errorMessage, type: 'Negative' });
      setTimeout(() => setFeedbackMessage({ text: '', type: '' }), 3000);
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
          disabled={isSubmitting}
          onChange={handleSwitchChange}
        />
        <Label>{isSubmitting ? 'Actualizando...' : (isActive ? 'Desactivar' : 'Activar')}</Label>
        <ProductEditButton product={product} onEditClick={onEditClick} />
      </FlexBox>
      {feedbackMessage.text && (
        <Text style={{ 
          color: feedbackMessage.type === 'Success' ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)', 
          fontSize: 'var(--sapFontSize)', 
          marginTop: '0.25rem' 
        }}>
          {feedbackMessage.text}
        </Text>
      )}
    </FlexBox>
  );
};

export default ProductStatus;