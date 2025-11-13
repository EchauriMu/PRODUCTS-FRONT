import React, { useState } from 'react';
import { Button, BusyIndicator, MessageBox, MessageBoxAction } from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import * as yup from 'yup';

// Esquema de validación con Yup
const productValidationSchema = yup.object().shape({
  PRODUCTNAME: yup.string()
    .required('El nombre del producto es obligatorio.')
    .min(3, 'El nombre del producto debe tener al menos 3 caracteres.'),
  DESSKU: yup.string()
    .required('La descripción es obligatoria.'),
  IDUNIDADMEDIDA: yup.string()
    .required('La unidad de medida es obligatoria.'),
  MARCA: yup.string().optional(),
  BARCODE: yup.string().matches(/^[0-9]*$/, 'El código de barras solo debe contener números.').optional(),
  CATEGORIAS: yup.array().of(yup.string()).optional(),
  INFOAD: yup.string().optional(),
});

const ProductSaveButton = ({ productData, onSaveSuccess, onSaveError }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);

  const handleSave = async () => {
    if (!productData) {
      onSaveError('No hay datos de producto para guardar.');
      return;
    }

    setIsSaving(true);
    setValidationErrors(null);
    try {
      // 1. Validar los datos del producto usando el esquema de Yup
      // Usamos abortEarly: false para obtener todos los errores de validación.
      await productValidationSchema.validate(productData, { abortEarly: false });

      // 2. Si la validación es exitosa, preparamos el payload para la API

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
      // Si el error es de Yup, formateamos los mensajes.
      if (error instanceof yup.ValidationError) {
        const errorMessages = (
          <ul>
            {error.inner.map((e, index) => <li key={index}>{e.message}</li>)}
          </ul>
        );
        setValidationErrors(errorMessages);
      } else { // Si es un error de la API u otro
        onSaveError(error.message || 'Error al guardar los cambios.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button design="Emphasized" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <BusyIndicator active size="Small" /> : 'Guardar'}
      </Button>
      <MessageBox
        open={!!validationErrors}
        type="Error"
        titleText="Errores de Validación"
        actions={[MessageBoxAction.OK]}
        onClose={() => setValidationErrors(null)}
      >
        {validationErrors}
      </MessageBox>
    </>
  );
};

export default ProductSaveButton;