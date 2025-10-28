import React, { useState, useEffect } from 'react';
import { Card, CardHeader, FlexBox, Icon, ProgressIndicator, Text } from '@ui5/webcomponents-react';
import productService from '../api/productService';

const ProductsBreakdown = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const data = await productService.getAllProducts();
        let productsList = [];
        if (data && data.value && Array.isArray(data.value) && data.value.length > 0 && data.value[0].data && Array.isArray(data.value[0].data) && data.value[0].data.length > 0 && data.value[0].data[0].dataRes) {
            productsList = data.value[0].data[0].dataRes;
        }
        setTotalProducts(productsList.length);
        setActiveProducts(productsList.filter(p => p.ACTIVED).length);
      } catch (error) {
        console.error("Error al cargar el resumen de productos:", error);
      }
    };

    fetchProductsData();
  }, []);

  return (
    <Card>
      <CardHeader titleText="Resumen de Productos" avatar={<Icon name="product" />} />
      <div style={{ padding: '16px' }}>
        <FlexBox justifyContent="SpaceBetween" style={{ marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <FlexBox direction="Column" style={{ flex: '1 1 200px', minWidth: '200px', padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
            <Text style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Productos Activos</Text>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{activeProducts}</Text>
          </FlexBox>
          <FlexBox direction="Column" style={{ flex: '1 1 200px', minWidth: '200px', padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
            <Text style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Total de Productos</Text>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalProducts}</Text>
          </FlexBox>
        </FlexBox>
      </div>
    </Card>
  );
};

export default ProductsBreakdown;