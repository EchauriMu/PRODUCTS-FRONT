import React, { useEffect, useState } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  MultiComboBox,
  MultiComboBoxItem,
  Input,
  Select,
  Option,
  MessageStrip,
  BusyIndicator
} from '@ui5/webcomponents-react';
import ProductStatus from './ProductStatus';
import productPresentacionesService from '../../api/productPresentacionesService';
import addProductApi from '../../api/addProductApi';
import preciosListasService from '../../api/preciosListasService';
import { unidadesDeMedida } from '../../utils/constants';
import ProductDetailPresentations from './ProductDetailPresentations';
import ProductSaveButton from './ProductSaveButton'; // Importamos el nuevo botón de guardar
import "@ui5/webcomponents-icons/dist/edit.js";
 
const ProductDetailModal = ({ product, open, onClose, onProductUpdate }) => {
  const [presentaciones, setPresentaciones] = useState([]);
  const [localProduct, setLocalProduct] = useState(product);
  const [loadingPresentaciones, setLoadingPresentaciones] = useState(false);
  const [errorPresentaciones, setErrorPresentaciones] = useState(null);

  // Estado para las categorías
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Estados para las listas a las que pertenece el producto
  const [listasProducto, setListasProducto] = useState([]);
  const [loadingListasProducto, setLoadingListasProducto] = useState(false);
  const [errorListasProducto, setErrorListasProducto] = useState(null);

  // Estados para el modo de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);
  const [saveError, setSaveError] = useState('');

  // Cargar presentaciones al abrir
  useEffect(() => {
    // Solo actualiza el producto local si es un producto diferente (basado en SKUID)
    if (product?.SKUID !== localProduct?.SKUID) {
      setLocalProduct(product);
    }

    if (open && product?.SKUID) {
      setLoadingPresentaciones(true); 
      setErrorPresentaciones(null);
      productPresentacionesService
        .getPresentacionesBySKUID(product.SKUID)
        .then((dataRes) => {
          setPresentaciones(dataRes);
        })
        .catch(() => setErrorPresentaciones('Error al cargar presentaciones'))
        .finally(() => setLoadingPresentaciones(false));

      // Cargar listas a las que pertenece el producto
      setLoadingListasProducto(true);
      setErrorListasProducto(null);
      preciosListasService.getListasBySKUID(product.SKUID)
        .then((dataRes) => {
          setListasProducto(dataRes || []);
        })
        .catch(() => setErrorListasProducto('Error al cargar las listas'))
        .finally(() => setLoadingListasProducto(false));

      // Cargar categorías para el MultiComboBox
      setLoadingCategories(true);
      addProductApi.getAllCategories()
        .then(setAllCategories)
        .catch(err => console.error("Error al cargar categorías", err))
        .finally(() => setLoadingCategories(false));

    } else {
      setPresentaciones([]);
      setListasProducto([]);
      // Resetear estados al cerrar
      setIsEditing(false);
      setEditedProduct(null);
      setSaveError('');
      setAllCategories([]);
      setLoadingCategories(true);
      setLoadingListasProducto(false);
      setErrorListasProducto(null);
    }
  }, [open, product]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleProductStatusChange = (updatedProduct) => {
    setLocalProduct(updatedProduct);
    // Notificamos al componente padre (la tabla) para que actualice su estado local
    // y la vista principal se mantenga sincronizada sin una nueva llamada a la API.
    if (onProductUpdate) {
      onProductUpdate(updatedProduct);
    }
  };

  const handleEditClick = () => {
    setEditedProduct({ ...localProduct });
    setIsEditing(true);
    setSaveError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProduct(null);
    setSaveError('');
  };

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    setEditedProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (event) => {
    const selectedItems = event.detail.items;
    // El evento onSelectionChange en MultiComboBox devuelve los items seleccionados.
    // Mapeamos estos items para obtener sus textos (nombres de categoría).
    const selectedCategoryNames = selectedItems.map(item => item.text);
    // También guardamos los IDs para la lógica interna y el guardado.
    const selectedCategoryIds = selectedItems.map(item => allCategories.find(c => c.Nombre === item.text)?.CATID).filter(Boolean);
    setEditedProduct(prev => ({ ...prev, CATEGORIAS: selectedCategoryIds, __CATEGORIAS_NOMBRES: selectedCategoryNames }));
  };

  const handleUnitChange = (e) => {
    const selectedOption = e.detail.selectedOption;
    setEditedProduct(prev => ({ ...prev, IDUNIDADMEDIDA: selectedOption.dataset.value }));
  };


  // Callbacks para el botón de guardar
  const handleSaveSuccess = (updatedDataFromAPI) => {
    // 1. Creamos el objeto de producto completamente actualizado
    const fullyUpdatedProduct = { ...localProduct, ...editedProduct, ...updatedDataFromAPI };
    
    // 2. Actualizamos el estado local del modal con la respuesta de la API
    setLocalProduct(fullyUpdatedProduct);
    setEditedProduct(null);
    setIsEditing(false);

    // 3. Notificamos al componente padre (la tabla) para que actualice su lista localmente
    if (onProductUpdate) {
      onProductUpdate(fullyUpdatedProduct);
    }
  };

  const handleSaveError = (errorMessage) => {
    setSaveError(errorMessage);
  };

  const renderFooter = () => {
    if (isEditing) {
      return (
        <Bar endContent={
          <>
            <Button design="Transparent" onClick={handleCancelEdit}>Cancelar</Button>
            <ProductSaveButton
              productData={editedProduct}
              onSaveSuccess={handleSaveSuccess}
              onSaveError={handleSaveError}
            />
          </>
        } />
      );
    }
    return <Bar endContent={<Button design="Emphasized" onClick={onClose}>Cerrar</Button>} />;
  };

  const getCategoryNameById = (catId) => {
    const category = allCategories.find(cat => cat.CATID === catId);
    return category ? category.Nombre : catId;
  };

  const getUnitTextByValue = (unitValue) => {
    const unit = unidadesDeMedida.find(u => u.value === unitValue);
    return unit ? unit.text : (unitValue || 'N/A');
  };

  const currentProduct = isEditing ? editedProduct : localProduct;
  if (!currentProduct) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar startContent={<Title>Detalle del Producto</Title>} />}
      footer={renderFooter()}
      style={{ width: '95vw', maxWidth: '1400px' }}
    >
      {/* Contenedor principal adaptable (responsive) */}
      <FlexBox
        style={{
          height: 'calc(80vh - 50px)',
          width: '100%',
        }}
        className="responsive-splitter-container"
      >
        {/* Columna Izquierda: Info Producto */}
        <div
          className="responsive-splitter-side"
          style={{
            background: '#f7f8fa',
            padding: '1.5rem',
            overflowY: 'auto',
            flexShrink: 0, // Evita que se encoja
          }}
        >
          <FlexBox direction="Column" style={{ gap: '2rem' }}>
            {/* Encabezado y Estado del Producto */}
            <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
              {isEditing ? (
                <>
                  <Label>Nombre del Producto</Label>
                  <Input value={currentProduct.PRODUCTNAME} onInput={(e) => handleInputChange(e, 'PRODUCTNAME')} />
                  <Label style={{marginTop: '0.5rem'}}>Descripción</Label>
                  <Input value={currentProduct.DESSKU} onInput={(e) => handleInputChange(e, 'DESSKU')} />
                </>
              ) : (
                <>
                  <Title level="H3" style={{ flexShrink: 1, marginRight: '1rem' }}>{currentProduct.PRODUCTNAME || 'Sin Nombre'}</Title>
                  <Text style={{ color: '#666', fontStyle: 'italic', marginBottom: '1rem' }}>{currentProduct.DESSKU || 'Sin descripción'}</Text>
                </>
              )}
              <ProductStatus product={currentProduct} onStatusChange={handleProductStatusChange} onEditClick={handleEditClick} />
            </FlexBox>

            {/* Detalles */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              {saveError && <MessageStrip design="Negative" onClose={() => setSaveError('')}>{saveError}</MessageStrip>}
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
                Información General
              </Title>
              <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                <FlexBox direction="Column"><Label>SKU</Label><Text>{currentProduct.SKUID || 'N/A'}</Text></FlexBox>
                <FlexBox direction="Column">
                  <Label>Marca</Label>
                  {isEditing ? <Input value={currentProduct.MARCA} onInput={(e) => handleInputChange(e, 'MARCA')} /> : <Text>{currentProduct.MARCA || 'N/A'}</Text>}
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Código de Barras</Label>
                  {isEditing ? <Input value={currentProduct.BARCODE} onInput={(e) => handleInputChange(e, 'BARCODE')} /> : <Text>{currentProduct.BARCODE || 'N/A'}</Text>}
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Unidad de Medida</Label>
                  {isEditing ? (
                    <Select
                      style={{ width: '100%' }}
                      onChange={handleUnitChange}
                    >
                      {unidadesDeMedida.map((unidad) => (
                        <Option 
                          key={unidad.value} 
                          data-value={unidad.value} 
                          selected={currentProduct.IDUNIDADMEDIDA === unidad.value}
                        >{unidad.text}</Option>
                      ))}
                    </Select>
                  ) : <Text>{getUnitTextByValue(currentProduct.IDUNIDADMEDIDA)}</Text>}
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Categorías</Label>
                  {isEditing ? 
                    <MultiComboBox
                      style={{ width: '100%'}}
                      value={currentProduct.CATEGORIAS?.map(getCategoryNameById).join(', ')}
                      placeholder={loadingCategories ? "Cargando..." : "Seleccione categorías"}
                      disabled={loadingCategories}
                      onSelectionChange={handleCategoryChange}
                    >
                      {allCategories.map((cat) => (
                        <MultiComboBoxItem 
                          key={cat.CATID}
                          text={cat.Nombre}
                          // La propiedad 'selected' no se usa para preseleccionar en MultiComboBox,
                          // se controla a través de la propiedad 'value' del MultiComboBox.
                        />
                      ))}
                    </MultiComboBox>
                   : (
                    <Text>{Array.isArray(currentProduct.CATEGORIAS) ? currentProduct.CATEGORIAS.map(getCategoryNameById).join(', ') : (currentProduct.CATEGORIAS || 'N/A')}</Text>
                  )}
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Info Adicional</Label>
                  {isEditing ? (
                    <Input value={currentProduct.INFOAD} onInput={(e) => handleInputChange(e, 'INFOAD')} />
                  ) : (
                    currentProduct.INFOAD ? <Text>{currentProduct.INFOAD}</Text> : <Text style={{color: '#666'}}>N/A</Text>
                  )}
                </FlexBox>
              </FlexBox>
            </FlexBox>

            {/* Listas a las que pertenece el producto */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '0.5rem' }}>
                Listas de Precios
              </Title>
              {loadingListasProducto ? (
                <FlexBox justifyContent="Center" alignItems="Center" style={{ padding: '1rem' }}>
                  <BusyIndicator active size="Small" />
                </FlexBox>
              ) : errorListasProducto ? (
                <Text style={{ color: '#c00', fontSize: '0.9rem' }}>{errorListasProducto}</Text>
              ) : listasProducto.length > 0 ? (
                <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                  {listasProducto.map((lista, idx) => (
                    <FlexBox
                      key={idx}
                      direction="Column"
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        borderLeft: '3px solid #0076d7'
                      }}
                    >
                      <Text style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0076d7' }}>
                        {lista.DESLISTA || lista.IDLISTAOK}
                      </Text>
                      {lista.IDLISTAOK && (
                        <Text style={{ fontSize: '0.8rem', color: '#666' }}>
                          ID: {lista.IDLISTAOK}
                        </Text>
                      )}
                      {lista.FECHAEXPIRAINI && lista.FECHAEXPIRAFIN && (
                        <Text style={{ fontSize: '0.8rem', color: '#666' }}>
                          Vigencia: {new Date(lista.FECHAEXPIRAINI).toLocaleDateString('es-ES')} - {new Date(lista.FECHAEXPIRAFIN).toLocaleDateString('es-ES')}
                        </Text>
                      )}
                    </FlexBox>
                  ))}
                </FlexBox>
              ) : (
                <Text style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No está registrado en ninguna lista de precios
                </Text>
              )}
            </FlexBox>

            {/* Auditoría */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '0.5rem' }}>
                Auditoría
              </Title>
              <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                <FlexBox direction="Column">
                  <Label>Creado por</Label>
                  <Text>{currentProduct.REGUSER || 'N/A'}</Text>
                  <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(currentProduct.REGDATE)}</Text>
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Modificado por</Label>
                  <Text>{currentProduct.MODUSER || 'N/A'}</Text>
                  <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(currentProduct.MODDATE)}</Text>
                </FlexBox>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </div>

        {/* Columna Derecha: Presentaciones o Mensaje de Edición */}
        <div className="responsive-splitter-main" style={{ flexGrow: 1, borderLeft: '1px solid #e5e5e5' }}>
          {isEditing ? (
            <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '100%', background: '#f5f5f5' }}>
              <Text>La edición de presentaciones está deshabilitada mientras se edita el producto principal.</Text>
            </FlexBox>
          ) : (
            <ProductDetailPresentations
              product={currentProduct}
              presentaciones={presentaciones}
              onPresentacionesChange={setPresentaciones}
              loading={loadingPresentaciones}
              error={errorPresentaciones}
            />
          )}
        </div>
      </FlexBox>

      {/* Estilos para la responsividad */}
      <style>{`
        .responsive-splitter-container {
          flex-direction: row;
        }
        .responsive-splitter-side {
          width: 380px;
        }
        .responsive-splitter-main {
          width: calc(100% - 380px);
        }

        @media (max-width: 900px) {
          .responsive-splitter-container {
            flex-direction: column;
            height: auto;
            overflow-y: auto;
          }
          .responsive-splitter-side, .responsive-splitter-main {
            width: 100%;
            border-left: none;
            border-bottom: 1px solid #e5e5e5;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default ProductDetailModal;
