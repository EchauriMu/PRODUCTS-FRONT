import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  TableRow,
  TableCell,
  Text,
  Title,
  CheckBox,
  Button, 
  BusyIndicator,
  MessageStrip,
  FlexBox,
  Label,
  // ObjectStatus no se usa directamente en este archivo, se puede omitir o mantener
} from '@ui5/webcomponents-react';
import { Tag } from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import ProductDetailModal from './ProductDetailModal';
import ProductSearch from './ProductSearch'; 
import "@ui5/webcomponents-fiori/dist/illustrations/NoData.js"; 
import ProductTableActions from './ProductTableActions';

const ProductsTableCard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 

  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSKUIDs, setSelectedSKUIDs] = useState([]); 
  const navigate = useNavigate();

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
    setSelectedSKUIDs([]);
  }, []);

  // Efecto para filtrar productos
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    if (!term) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p =>
        p.PRODUCTNAME?.toLowerCase().includes(term) ||
        p.SKUID?.toLowerCase().includes(term) ||
        p.MARCA?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await productService.getAllProducts();
      
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
      
      setProducts(productsList);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar productos';
      setError(`Error al obtener productos: ${errorMessage}`);
    } finally {
      setSelectedSKUIDs([]);
      setLoading(false);
    }
  };

  // --- Lógica de Formato (sin cambios) ---
  
  const getProductStatus = (product) => {
    if (product.DELETED === true) {
      return { design: 'Negative', text: 'Eliminado' };
    }
    if (product.ACTIVED === true) {
      return { design: 'Positive', text: 'Activo' };
    }
    if (product.ACTIVED === false) {
      return { design: 'Critical', text: 'Inactivo' };
    }
    return { design: 'Information', text: 'Desconocido' };
  };

  const formatCategories = (categories) => {
    if (!categories) return 'Sin categoría';
    if (Array.isArray(categories)) {
      return categories.join(', ');
    }
    return categories.toString();
  };

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

  const handleProductUpdate = useCallback(() => {
    handleCloseModal();
    loadProducts();
  }, [handleCloseModal]);

  // --- Lógica de Selección (sin cambios) ---

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      // Seleccionar todos los SKUIDs de los productos visibles
      setSelectedSKUIDs(filteredProducts.map(p => p.SKUID).filter(id => id)); // IMPORTANTE: Usar filteredProducts
    } else {
      setSelectedSKUIDs([]);
    }
  };

  const handleRowSelectChange = (skuid, isSelected) => {
    if (!skuid) return; 
    
    if (isSelected) {
      setSelectedSKUIDs(prev => [...prev, skuid]);
    } else {
      setSelectedSKUIDs(prev => prev.filter(id => id !== skuid));
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
  };

  // --- Renderizado con Barra Superior ---

  return (
    <div style={{ margin: '1rem' }}>
      {/* 1. BARRA SUPERIOR (Fuera de Card) */}
      <FlexBox 
        alignItems="Center" 
        justifyContent="SpaceBetween" 
        style={{ 
            marginBottom: '1rem', 
            padding: '0.5rem 0', 
            borderBottom: '1px solid #ccc' 
        }}
      >
        {/* Título y Subtítulo */}
        <FlexBox direction="Column">
          <Title level="H3">Lista de Productos</Title>
          <Text style={{ color: '#666' }}>{filteredProducts.length} productos encontrados</Text>
        </FlexBox>

        {/* Acciones */}
        <FlexBox alignItems="Center" justifyContent="End" style={{ gap: '1rem' }}>
          {/* Búsqueda */}
          <ProductSearch 
            loading={loading}
            onSearch={setSearchTerm}
          />
          {/* Botones de Acción (Editar, Eliminar, Activar, Crear) */}
          <ProductTableActions
            selectedSKUIDs={selectedSKUIDs}
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onActionStart={() => { setLoading(true); setError(''); setSuccessMessage(''); }}
            onActionSuccess={(message) => { 
              setSuccessMessage(message);
              loadProducts(); 
              setSelectedSKUIDs([]); 
              setTimeout(() => setSuccessMessage(''), 5000); 
            }}
            onActionError={(message) => { 
              setError(message); 
              setLoading(false); 
            }}
          />
        </FlexBox>
      </FlexBox>

      {/* 2. CARD para el contenido de la tabla */}
      <Card
        // Eliminamos el CardHeader ya que el título y las acciones se movieron arriba
        style={{ maxWidth: '100%' }}
      >
        <div style={{ padding: '1rem' }}>
          {/* Mensajes de éxito/error */}
          {successMessage && (
            <MessageStrip 
              design="Positive" 
              style={{ marginBottom: '1rem' }}
              onClose={() => setSuccessMessage('')}
            >
              {successMessage}
            </MessageStrip>
          )}
          {error && (
            <MessageStrip 
              type="Negative" 
              style={{ marginBottom: '1rem' }}
              onClose={() => setError('')}
            >
              {error}
            </MessageStrip>
          )}

          {/* Indicador de Carga / No Data */}
          {loading && products.length === 0 ? (
            <FlexBox 
              justifyContent="Center" 
              alignItems="Center" 
              style={{ height: '200px', flexDirection: 'column' }}
            >
              <BusyIndicator active />
              <Text style={{ marginTop: '1rem' }}>Cargando productos...</Text>
            </FlexBox>
          ) : filteredProducts.length === 0 && !loading ? (
            <FlexBox 
              justifyContent="Center" 
              alignItems="Center" 
              style={{ height: '200px', flexDirection: 'column' }}
            >
              <Title level="H4" style={{ color: '#666', marginBottom: '0.5rem' }}>
                No hay productos disponibles
              </Title> 
              <Text>{searchTerm ? 'Intenta con otro término de búsqueda.' : 'No se encontraron productos en el sistema.'}</Text>
            </FlexBox>
          ) : (
            /* Tabla de Productos */
            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              <Table
                stickyColumnHeader
                noDataText="No hay productos para mostrar"
                style={{ width: '100%' }}
                headerRow={
                  <TableRow>
                    {/* CheckBox para seleccionar todo */}
                    <TableCell>
                      <CheckBox
                        checked={filteredProducts.length > 0 && selectedSKUIDs.length === filteredProducts.length}
                        onChange={handleSelectAllChange}
                      />
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>
                      <Text>SKU ID</Text>
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>
                      <Text>Producto</Text>
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>
                      <Text>Marca</Text>
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold', }}>
                      <Text>Categoría</Text>
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
              >
                {filteredProducts.map((product, index) => {
                const productStatus = getProductStatus(product);
                const lastAction = getLastHistoryAction(product.HISTORY);
                const isSelected = selectedSKUIDs.includes(product.SKUID);
                
                return (
                  <TableRow 
                    key={product._id || product.SKUID || index}
                    style={{ cursor: 'pointer' }}
                    className="ui5-table-row-hover"
                  >
                    {/* CheckBox de selección de fila */}
                    <TableCell>
                      <CheckBox 
                        checked={isSelected}
                        onChange={(e) => handleRowSelectChange(product.SKUID, e.target.checked)}
                      />
                    </TableCell>
                    
                    {/* Resto de las celdas */}
                    <TableCell onClick={() => handleRowClick(product)}>
                      <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {product.SKUID || `SKU-${index + 1}`}
                      </Text>
                    </TableCell>
                    
                    <TableCell onClick={() => handleRowClick(product)}>
                      <FlexBox direction="Column">
                        <Text style={{ fontWeight: 'bold', color: '#32363a' }}>
                          {product.PRODUCTNAME || 'Sin nombre'}
                        </Text>
                      </FlexBox>
                    </TableCell>

                    <TableCell onClick={() => handleRowClick(product)}>
                      <Text style={{ fontWeight: '500' }}>
                        {product.MARCA || 'N/A'}
                      </Text>
                    </TableCell>
                    
                    <TableCell onClick={() => handleRowClick(product)}>
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
                  
                    
                    <TableCell onClick={() => handleRowClick(product)}>
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
                    
                    <TableCell onClick={() => handleRowClick(product)}>
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
                    
                    <TableCell onClick={() => handleRowClick(product)}>
                      <Tag design={productStatus.design}>
                        {productStatus.text}
                      </Tag>
                    </TableCell>
                  </TableRow>
                );
                })}
              </Table>
            </div>
          )}

          {/* Información adicional en el footer */}
          {filteredProducts.length > 0 && (
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
                Mostrando **{filteredProducts.length}** de **{products.length}** productos
              </Text>
              <FlexBox style={{ gap: '1rem' }}>
                <Text style={{ fontSize: '0.875rem', color: '#666' }}> 
                  Activos: **{products.filter(p => p.ACTIVED === true).length}**
                </Text>
                <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                  Seleccionados: **{selectedSKUIDs.length}**
                </Text>
                <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                  Total registros: **{products.length}**
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
          onProductUpdate={handleProductUpdate}
        />

      </Card>
    </div>
  );
};

export default ProductsTableCard;