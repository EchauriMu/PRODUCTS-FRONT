import React from 'react';
import { Button } from '@ui5/webcomponents-react';

const ProductEditButton = ({ product, onEditClick }) => {
  return (
    <Button
      icon="edit"
      design="Transparent"
      disabled={product.DELETED}
      onClick={onEditClick}
      tooltip="Editar Producto"
    />
  );
};

export default ProductEditButton;