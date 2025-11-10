import React, { useMemo } from 'react';
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
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${selectedSKUIDs.length} producto(s)? Esta acción no se puede deshacer.`)) {
      onActionStart();
      try {
        await productService.deleteProducts(selectedSKUIDs);
        onActionSuccess(`${selectedSKUIDs.length} producto(s) eliminado(s) permanentemente.`);
      } catch (error) {
        onActionError(`Error al eliminar productos: ${error.message}`);
      }
    }
  };

  // Lógica para determinar el estado de los botones de acción
  const { canDeactivate, canActivate, isMixedState } = useMemo(() => {
    if (selectedSKUIDs.length === 0) {
      return { canDeactivate: false, canActivate: false, isMixedState: false };
    }
    const selectedProducts = products.filter(p => selectedSKUIDs.includes(p.SKUID));
    const activeProducts = selectedProducts.filter(p => p.ACTIVED === true && p.DELETED === false);
    const inactiveProducts = selectedProducts.filter(p => p.ACTIVED === false);

    return {
      canDeactivate: activeProducts.length > 0 && inactiveProducts.length === 0,
      canActivate: inactiveProducts.length > 0 && activeProducts.length === 0,
      isMixedState: activeProducts.length > 0 && inactiveProducts.length > 0,
    };
  }, [selectedSKUIDs, products]);

  const handleToggleActiveState = async () => {
    const actionText = canActivate ? 'activar' : 'desactivar';
    if (window.confirm(`¿Estás seguro de que deseas ${actionText} ${selectedSKUIDs.length} producto(s)?`)) {
      onActionStart();
      try {
        if (canActivate) {
          await productService.activateProducts(selectedSKUIDs);
          onActionSuccess(`${selectedSKUIDs.length} producto(s) activado(s) exitosamente.`);
        } else {
          await productService.deactivateProducts(selectedSKUIDs);
          onActionSuccess(`${selectedSKUIDs.length} producto(s) desactivado(s) exitosamente.`);
        }
      } catch (error) {
        onActionError(`Error al ${actionText} productos: ${error.message}`);
      }
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
      <Button 
        icon={canActivate ? "activate" : "decline"} 
        design={canActivate ? "Positive" : "Attention"} 
        disabled={selectedSKUIDs.length === 0 || isMixedState} 
        onClick={handleToggleActiveState}
      >
        {canActivate ? 'Activar' : 'Desactivar'}
      </Button>
      {loading && <BusyIndicator active size="Small" />}
    </FlexBox>
  );
};

export default ProductTableActions;