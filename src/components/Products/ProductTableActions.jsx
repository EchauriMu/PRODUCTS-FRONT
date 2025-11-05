import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  BusyIndicator,
  FlexBox,
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';

const ProductTableActions = ({
  selectedSKUIDs,
  products,
  loading,
  onActionStart,
  onActionSuccess,
  onActionError,
  onEdit,
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (selectedSKUIDs.length === 1) {
      const productToEdit = products.find(p => p.SKUID === selectedSKUIDs[0]);
      onEdit(productToEdit);
    }
  };

  const handleDelete = async () => {
    onActionStart();
    try {
      // A futuro, esto puede iterar sobre `selectedSKUIDs`
      console.log('Eliminando productos con SKUIDs:', selectedSKUIDs);
      // await productService.deleteProduct(selectedSKUIDs[0]); // Ejemplo de llamada
      onActionSuccess('Productos eliminados (simulado).');
    } catch (error) {
      onActionError('Error al eliminar productos (simulado).');
    }
  };

  const handleDeactivate = async () => {
    onActionStart();
    try {
      // A futuro, esto puede iterar sobre `selectedSKUIDs`
      console.log('Desactivando productos con SKUIDs:', selectedSKUIDs);
      // await productService.deactivateProduct(selectedSKUIDs[0]); // Ejemplo de llamada
      onActionSuccess('Productos desactivados (simulado).');
    } catch (error) {
      onActionError('Error al desactivar productos (simulado).');
    }
  };

  return (
    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
      <Button icon="add" design="Emphasized" onClick={() => navigate('/add-products')}>
        Añadir Producto
      </Button>
      <Button icon="edit" design="Transparent" disabled={selectedSKUIDs.length !== 1} onClick={handleEdit}>
        Editar
      </Button>
      <Button icon="delete" design="Negative" disabled={selectedSKUIDs.length === 0} onClick={handleDelete}>
        Eliminar
      </Button>
      <Button icon="decline" design="Attention" disabled={selectedSKUIDs.length === 0} onClick={handleDeactivate}>
        Desactivar
      </Button>
      {loading && <BusyIndicator active size="Small" />}
    </FlexBox>
  );
};

export default ProductTableActions;