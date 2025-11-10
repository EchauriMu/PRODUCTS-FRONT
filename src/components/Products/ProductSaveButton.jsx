import React, { useState } from 'react';
import { Button, BusyIndicator } from '@ui5/webcomponents-react';
import productService from '../../api/productService';

const ProductSaveButton = ({ productData, onSaveSuccess, onSaveError }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!productData) {
      onSaveError('No hay datos de producto para guardar.');
      return;
    }

    setIsSaving(true);
    try {
      // Quitamos campos que no se deben enviar en el body de la actualización
      const { __v, _id, REGDATE, REGUSER, MODDATE, MODUSER, HISTORY, ACTIVED, DELETED, createdAt, updatedAt, ...payload } = productData;
      
      // Aseguramos que CATEGORIAS se envíe como un string JSON si es un array
      if (Array.isArray(payload.CATEGORIAS)) {
        payload.CATEGORIAS = JSON.stringify(payload.CATEGORIAS);
      }
      
      // El usuario logueado se envía automáticamente a través del interceptor de Axios
      const updatedProduct = await productService.updateProduct(productData.SKUID, payload);
      
      // Notifica al componente padre que todo fue exitoso, pasando el producto actualizado
      onSaveSuccess(updatedProduct);

    } catch (error) {
      // Notifica al componente padre sobre el error
      onSaveError(error.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button design="Emphasized" onClick={handleSave} disabled={isSaving}>
      {isSaving ? <BusyIndicator active size="Small" /> : 'Guardar'}
    </Button>
  );
};

export default ProductSaveButton;