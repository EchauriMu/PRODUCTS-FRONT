import React, { useState, useEffect } from 'react';
import { Card, FlexBox, Text, Title, BusyIndicator } from '@ui5/webcomponents-react';
import productService from '../../api/productService';

const RejectionItems = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const data = await productService.getAllProducts();
        let productsList = [];
        if (data && data.value && Array.isArray(data.value) && data.value.length > 0 && data.value[0].data && Array.isArray(data.value[0].data) && data.value[0].data.length > 0 && data.value[0].data[0].dataRes) {
            productsList = data.value[0].data[0].dataRes;
        }

        const categoryCounts = productsList.reduce((acc, product) => {
          const categories = product.CATEGORIAS && product.CATEGORIAS.length > 0 ? product.CATEGORIAS : ['Sin Categoría'];
          categories.forEach(category => {
            acc[category] = (acc[category] || 0) + 1;
          });
          return acc;
        }, {});

        const total = productsList.length;
        setTotalItems(total);

        const formattedData = Object.entries(categoryCounts).map(([label, value], index) => ({
          label,
          value,
          percent: total > 0 ? (value / total) * 100 : 0,
          color: ['#4DD0E1', '#00ACC1', '#1976D2', '#0a6ed1', '#d32f2f'][index % 5],
          bg: ['#E0F7FA', '#E0F7FA', '#E3F2FD', '#e3f2fd', '#ffebee'][index % 5],
        }));

        setCategoryData(formattedData);
      } catch (error) {
        console.error("Error al cargar las categorías:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  return (
    <Card>
      <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
        <Title level="H5" style={{ marginBottom: '16px' }}>Productos por Categoría</Title>
        {loading ? <BusyIndicator active /> : categoryData.map((item, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <FlexBox justifyContent="SpaceBetween" style={{ marginBottom: '4px' }}>
              <Text style={{ fontSize: '12px' }}>{item.label}</Text>
              <Text style={{ fontSize: '12px', fontWeight: '600' }}>{item.value}</Text>
            </FlexBox>
            <div style={{ width: '100%', height: '8px', backgroundColor: item.bg, borderRadius: '4px' }}>
              <div style={{ width: `${item.percent}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RejectionItems;