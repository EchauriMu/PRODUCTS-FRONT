import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
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
  ObjectStatus
} from '@ui5/webcomponents-react'; 
import { Tag } from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import ProductDetailModal from './ProductDetailModal';
import ProductSearch from './ProductSearch'; // Importamos el nuevo componente
import "@ui5/webcomponents-fiori/dist/illustrations/NoData.js"; // Import for IllustratedMessage
import ProductTableActions from './ProductTableActions';

const ProductsTableCard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // Estado para productos filtrados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Estado para mensajes de éxito

  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda
  const [selectedProduct, setSelectedProduct] = useState(null);
  // 👇 ESTADO PARA GUARDAR LOS SKUIDS SELECCIONADOS
  const [selectedSKUIDs, setSelectedSKUIDs] = useState([]); 
  const navigate = useNavigate();

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
    // Limpiar selección al cargar por primera vez
    setSelectedSKUIDs([]);
  }, []);

  // Efecto para filtrar productos cuando cambia el término de búsqueda o la lista de productos
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
      setSelectedSKUIDs([]); // Limpiar selección después de recargar
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

  // Función para recargar los datos después de una actualización exitosa
  const handleProductUpdate = useCallback(() => {
    handleCloseModal(); // Cierra el modal
    loadProducts();     // Recarga los productos
  }, [handleCloseModal]); // loadProducts no necesita ser dependencia aquí

  // --- Lógica de Selección (Reincorporada) ---

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      // Seleccionar todos los SKUIDs de los productos visibles
      setSelectedSKUIDs(products.map(p => p.SKUID).filter(id => id)); // Filtramos IDs nulos o indefinidos
    } else {
      // Limpiar selección
      setSelectedSKUIDs([]);
    }
  };

  const handleRowSelectChange = (skuid, isSelected) => {
    if (!skuid) return; // Ignorar si el SKUID no existe
    
    if (isSelected) {
      // Añadir SKUID
      setSelectedSKUIDs(prev => [...prev, skuid]);
    } else {
      // Remover SKUID
      setSelectedSKUIDs(prev => prev.filter(id => id !== skuid));
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
  };

  // --- Renderizado ---

  return (
    <Card
      header={(
        <CardHeader 
          titleText="Lista de Productos" 
          subtitleText={`${filteredProducts.length} productos encontrados`}
          action={
            <FlexBox alignItems="Center" justifyContent="End" style={{ gap: '1rem' }}>
              <ProductSearch 
                loading={loading}
                onSearch={setSearchTerm}
              />
              <ProductTableActions
                selectedSKUIDs={selectedSKUIDs}
                products={products}
                loading={loading}
                onEdit={handleEdit}
                onActionStart={() => { setLoading(true); setError(''); setSuccessMessage(''); }}
                onActionSuccess={(message) => { 
                  setSuccessMessage(message);
                  loadProducts(); // Recarga la tabla
                  setSelectedSKUIDs([]); // Limpia la selección después de la acción
                  setTimeout(() => setSuccessMessage(''), 5000); // Oculta el mensaje después de 5 segundos
                }}
                onActionError={(message) => { 
                  setError(message); 
                  setLoading(false); 
                }}
              />
             
            </FlexBox>
          }
        />)}
      style={{ margin: '1rem', maxWidth: '100%' }}
    >
      <div style={{ padding: '1rem' }}>
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
          <Table
            noDataText="No hay productos para mostrar"
            style={{ width: '100%' }}
            headerRow={
              <TableRow>
                {/* CheckBox para seleccionar todo */}
                <TableCell style={{  }}>
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
                  // Aquí mantenemos el onClick para el detalle, pero la selección se maneja en la CheckBox
                  style={{ cursor: 'pointer' }}
                  className="ui5-table-row-hover"
                >
                  {/* CheckBox de selección de fila */}
                  <TableCell>
                    <CheckBox 
                      checked={isSelected}
                      // Usamos el SKUID para actualizar el estado
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
  );
};

export default ProductsTableCard;