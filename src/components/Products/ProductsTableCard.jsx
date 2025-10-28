import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  Table,
  TableRow,
  TableCell,
  Text,
  Title,
  BusyIndicator,
  MessageStrip,
  FlexBox,
  Label,
  ObjectStatus
} from '@ui5/webcomponents-react'; 
import productService from '../../api/productService';
import ProductDetailModal from './ProductDetailModal';

const ProductsTableCard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await productService.getAllProducts();
      
      // DEBUG: Imprimir la respuesta completa para ver qué estamos recibiendo
      console.log('API Response:', data);
      
      // Estructura específica de tu API: data.value[0].data[0].dataRes
      let productsList = [];
      
      if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
        const mainResponse = data.value[0];
        if (mainResponse.data && Array.isArray(mainResponse.data) && mainResponse.data.length > 0) {
          const dataResponse = mainResponse.data[0];
          if (dataResponse.dataRes && Array.isArray(dataResponse.dataRes)) {
            productsList = dataResponse.dataRes;
          }
        }
      }
      
      console.log('Final products list:', productsList);
      console.log('Products count:', productsList.length);
      
      setProducts(productsList);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar productos';
      setError(`Error al obtener productos: ${errorMessage}`);
      console.error('Error loading products:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear precio
  const formatPrice = (price) => {
    if (!price && price !== 0) return '-';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Función para obtener estado del producto
  const getProductStatus = (product) => {
    // Usar los campos ACTIVED y DELETED de tu API
    if (product.DELETED === true) {
      return { state: 'Error', text: 'Eliminado' };
    }
    if (product.ACTIVED === true) {
      return { state: 'Success', text: 'Activo' };
    }
    if (product.ACTIVED === false) {
      return { state: 'Warning', text: 'Inactivo' };
    }
    return { state: 'Information', text: 'Desconocido' };
  };

  // Función para formatear categorías
  const formatCategories = (categories) => {
    if (!categories) return 'Sin categoría';
    if (Array.isArray(categories)) {
      return categories.join(', ');
    }
    return categories.toString();
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el último cambio del historial
  const getLastHistoryAction = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return { action: 'N/A', user: 'N/A', date: null };
    }
    const lastAction = history[history.length - 1];
    return {
      action: lastAction.action || 'N/A',
      user: lastAction.user || 'N/A',
      date: lastAction.date
    };
  };

  const handleRowClick = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const handleCloseModal = useCallback(() => setSelectedProduct(null), []);

  return (
    <Card
      header={
        <CardHeader 
          titleText="Lista de Productos"
          subtitleText={`${products.length} productos encontrados`}
          action={
            <FlexBox alignItems="Center">
              {loading && <BusyIndicator active size="Small" />}
              <Label 
                style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: products.length > 0 ? '#0a6ed1' : '#666',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                Total: {products.length}
              </Label>
            </FlexBox>
          }
        />
      }
      style={{ margin: '1rem', maxWidth: '100%' }}
    >
      <div style={{ padding: '1rem' }}>
        {error && (
          <MessageStrip 
            type="Negative" 
            style={{ marginBottom: '1rem' }}
            onClose={() => setError('')}
          >
            {error}
          </MessageStrip>
        )}

        {loading && products.length === 0 ? (
          <FlexBox 
            justifyContent="Center" 
            alignItems="Center" 
            style={{ height: '200px', flexDirection: 'column' }}
          >
            <BusyIndicator active />
            <Text style={{ marginTop: '1rem' }}>Cargando productos...</Text>
          </FlexBox>
        ) : products.length === 0 && !loading ? (
          <FlexBox 
            justifyContent="Center" 
            alignItems="Center" 
            style={{ height: '200px', flexDirection: 'column' }}
          >
            <Title level="H4" style={{ color: '#666', marginBottom: '0.5rem' }}>
              No hay productos disponibles
            </Title>
            <Text>No se encontraron productos en el sistema</Text>
          </FlexBox>
        ) : (
          <Table
            noDataText="No hay productos para mostrar"
            headerRow={
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>SKU ID</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Descripción</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Categoría</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Unidad Medida</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Código de Barras</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Creado Por</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Fecha Creación</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Última Acción</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Estado</Text>
                </TableCell>
              </TableRow>
            }
            style={{ width: '100%' }}
          >
            {products.map((product, index) => {
              const productStatus = getProductStatus(product);
              const lastAction = getLastHistoryAction(product.HISTORY);
              
              return (
                <TableRow 
                  key={product._id || product.SKUID || index}
                  onClick={() => handleRowClick(product)}
                  style={{ cursor: 'pointer' }}
                  className="ui5-table-row-hover"
                >
                  <TableCell>
                    <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {product.SKUID || `SKU-${index + 1}`}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text 
                      style={{ fontWeight: '500' }}
                      title={product.INFOAD}
                    >
                      {product.DESSKU || 'Sin descripción'}
                    </Text>
                    {product.INFOAD && (
                      <Text 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          display: 'block',
                          marginTop: '0.25rem'
                        }}
                      >
                        {product.INFOAD.substring(0, 30)}...
                      </Text>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Label 
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      {formatCategories(product.CATEGORIAS)}
                    </Label>
                  </TableCell>
                  
                  <TableCell>
                    <Text style={{ textAlign: 'center' }}>
                      {product.IDUNIDADMEDIDA || 'N/A'}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text 
                      style={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    >
                      {product.BARCODE || 'N/A'}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text style={{ fontWeight: '500' }}>
                      {product.REGUSER || 'N/A'}
                    </Text>
                    {product.MODUSER && (
                      <Text 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          display: 'block'
                        }}
                      >
                        Mod: {product.MODUSER}
                      </Text>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Text style={{ fontSize: '0.875rem' }}>
                      {formatDate(product.REGDATE)}
                    </Text>
                    {product.MODDATE && (
                      <Text 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          display: 'block'
                        }}
                      >
                        Mod: {formatDate(product.MODDATE)}
                      </Text>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Label
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: lastAction.action === 'CREATE' ? '#e8f5e8' : '#fff3e0',
                        color: lastAction.action === 'CREATE' ? '#2e7d32' : '#f57c00',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      {lastAction.action}
                    </Label>
                    <Text 
                      style={{ 
                        fontSize: '0.75rem', 
                        color: '#666',
                        display: 'block'
                      }}
                    >
                      {lastAction.user} - {formatDate(lastAction.date)}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <ObjectStatus 
                      state={productStatus.state}
                    >
                      {productStatus.text}
                    </ObjectStatus>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}

        {/* Información adicional en el footer */}
        {products.length > 0 && (
          <FlexBox 
            justifyContent="SpaceBetween" 
            alignItems="Center"
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 0',
              borderTop: '1px solid #e0e0e0' 
            }}
          >
            <Text style={{ fontSize: '0.875rem', color: '#666' }}>
              Mostrando {products.length} productos
            </Text>
            <FlexBox style={{ gap: '1rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Productos activos: {products.filter(p => p.ACTIVED === true).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Creados por SPARDOP: {products.filter(p => p.REGUSER === 'SPARDOP').length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Categorías únicas: {new Set(products.flatMap(p => p.CATEGORIAS || [])).size}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Total registros: {products.length}
              </Text>
            </FlexBox>
          </FlexBox>
        )}
      </div>

      {/* Modal de Detalle del Producto */}
      <ProductDetailModal 
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={handleCloseModal}
      />

    </Card>
  );
};

export default ProductsTableCard;