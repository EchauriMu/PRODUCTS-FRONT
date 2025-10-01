import React from 'react';
import ProductosTable from './products_table';
import { Card, Button } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

const CatalogoPage = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Catálogo de Productos</h2>
        <p style={{ color: '#8c8c8c', margin: 0 }}>Gestión completa del catálogo maestro</p>
      </div>
      <ProductosTable />
    </div>
  );
};

export default CatalogoPage;
