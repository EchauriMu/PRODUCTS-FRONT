import React from 'react';
import { Input, Icon } from '@ui5/webcomponents-react';

const ProductSearch = ({ onSearch, loading, style }) => {
  const handleInputChange = (event) => {
    onSearch(event.target.value);
  };

  return (
    <Input
      icon={<Icon name="search" />}
      placeholder="Buscar por producto, SKU, marca..."
      onInput={handleInputChange}
      disabled={loading}
      style={{ width: '300px', ...style }}
    />
  );
};

export default ProductSearch;