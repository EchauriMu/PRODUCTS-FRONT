import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  FlexBox,
  Text,
  Title,
  Card,
  CardHeader,
  Input,
  TextArea,
  DatePicker,
  Label,
  MessageStrip,
  ObjectStatus,
  CheckBox,
  Switch,
  Select,
  Option,
  Avatar,
  BusyIndicator,
  Icon,
  MultiComboBox,
  ComboBoxItem,
  TabContainer,
  Tab,
  Tag
} from '@ui5/webcomponents-react';
import promoService from '../../api/promoService';
import productService from '../../api/productService';
import AdvancedFilters from './AdvancedFilters';

const PromotionEditModal = ({ open, promotion, onClose, onSave, onDelete }) => {
  const [editData, setEditData] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipoDescuento: 'PORCENTAJE',
    descuentoPorcentaje: 0,
    descuentoMonto: 0,
    actived: true,
    skuids: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Estados para gestión de productos
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [originalProducts, setOriginalProducts] = useState(new Set()); // Productos originales de la promo
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modal de agregar productos
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [filteredProductsToAdd, setFilteredProductsToAdd] = useState([]);

  // Extraer SKUs de distintas formas posibles en la promo
  const extractSkusFromPromotion = (promo) => {
    const set = new Set();
    if (!promo) return set;
    // Campo SKUIDS (array de strings)
    if (Array.isArray(promo.SKUIDS)) promo.SKUIDS.forEach((id) => id && set.add(id));
    // Campo ProductosAplicables (array de objetos {SKUID})
    if (Array.isArray(promo.ProductosAplicables)) promo.ProductosAplicables.forEach((o) => o?.SKUID && set.add(o.SKUID));
    // Campo Productos (variaciones)
    if (Array.isArray(promo.Productos)) promo.Productos.forEach((o) => o?.SKUID && set.add(o.SKUID));
    // Campo SKUID (uno solo)
    if (promo.SKUID) set.add(promo.SKUID);
    return set;
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && promotion) {
      setEditData({
        titulo: promotion.Titulo || '',
        descripcion: promotion.Descripcion || '',
        fechaInicio: promotion.FechaIni ? new Date(promotion.FechaIni).toISOString().split('T')[0] : '',
        fechaFin: promotion.FechaFin ? new Date(promotion.FechaFin).toISOString().split('T')[0] : '',
        tipoDescuento: promotion.TipoDescuento || 'PORCENTAJE',
        descuentoPorcentaje: promotion['Descuento%'] || promotion.DescuentoPorcentaje || 0,
        descuentoMonto: promotion.DescuentoMonto || 0,
        actived: promotion.ACTIVED !== false,
        skuids: Array.from(extractSkusFromPromotion(promotion))
      });

      // Establecer productos seleccionados y guardar los originales
      const productsInPromo = extractSkusFromPromotion(promotion);
      setSelectedProducts(productsInPromo);
      setOriginalProducts(new Set(productsInPromo)); // Guardar copia de los originales

      // Cargar productos disponibles
      loadProducts();
    }
  }, [open, promotion]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();

      // Extraer productos de múltiples estructuras (igual que en AdvancedFilters)
      let productosData = [];
      if (response?.data?.[0]?.dataRes) {
        productosData = response.data[0].dataRes;
      } else if (response?.value?.[0]?.data?.[0]?.dataRes) {
        productosData = response.value[0].data[0].dataRes;
      } else if (Array.isArray(response?.data)) {
        productosData = response.data;
      } else if (Array.isArray(response)) {
        productosData = response;
      } else if (Array.isArray(response?.dataRes)) {
        productosData = response.dataRes;
      }

      // Normalizar: solo activos y no eliminados si esos flags existen
      const activos = Array.isArray(productosData)
        ? productosData.filter(p => (p.ACTIVED !== false) && (p.DELETED !== true))
        : [];

      setAllProducts(activos);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos: ' + (err.message || 'desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Validaciones
      if (!editData.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }

      if (!editData.fechaInicio || !editData.fechaFin) {
        throw new Error('Las fechas de inicio y fin son obligatorias');
      }

      if (new Date(editData.fechaFin) <= new Date(editData.fechaInicio)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Validar que haya al menos un producto seleccionado
      if (selectedProducts.size === 0) {
        throw new Error('Debe seleccionar al menos un producto para la promoción');
      }

      // Validar descuento según el tipo
      if (editData.tipoDescuento === 'PORCENTAJE') {
        if (!editData.descuentoPorcentaje || editData.descuentoPorcentaje <= 0 || editData.descuentoPorcentaje > 100) {
          throw new Error('El porcentaje de descuento debe estar entre 1 y 100');
        }
      } else if (editData.tipoDescuento === 'MONTO_FIJO') {
        if (!editData.descuentoMonto || editData.descuentoMonto <= 0) {
          throw new Error('El monto de descuento debe ser mayor a 0');
        }
      }

      // Preparar productos aplicables - Array de objetos con SKUID
      const skuArray = Array.from(selectedProducts);
      const productosAplicables = skuArray.map(skuid => {
        // Buscar el producto en allProducts para obtener info adicional
        const product = allProducts.find(p => p.SKUID === skuid);
        return {
          SKUID: skuid,
          NombreProducto: product?.PRODUCTNAME || '',
          PrecioOriginal: product?.PRECIO || 0
        };
      });

      // Preparar datos para la API - SOLO campos modificables
      const updateData = {
        Titulo: editData.titulo,
        Descripcion: editData.descripcion,
        FechaIni: new Date(editData.fechaInicio).toISOString(),
        FechaFin: new Date(editData.fechaFin).toISOString(),
        TipoDescuento: editData.tipoDescuento,
        ProductosAplicables: productosAplicables,
        ACTIVED: editData.actived
      };

      // Solo agregar descuento si tiene un valor válido
      if (editData.tipoDescuento === 'PORCENTAJE' && editData.descuentoPorcentaje > 0) {
        updateData.DescuentoPorcentaje = editData.descuentoPorcentaje;
        updateData.DescuentoMonto = 0;
      } else if (editData.tipoDescuento === 'MONTO_FIJO' && editData.descuentoMonto > 0) {
        updateData.DescuentoMonto = editData.descuentoMonto;
        updateData.DescuentoPorcentaje = 0;
      }

      console.log('📤 Enviando actualización:', updateData);

      // Llamar al servicio de actualización
      const response = await promoService.updatePromotion(promotion.IdPromoOK, updateData);
      
      console.log('✅ Promoción actualizada:', response);

      onSave && onSave({ ...promotion, ...updateData });
      onClose();
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      setError(err.message || 'Error al guardar la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres desactivar la promoción "${editData.titulo}"? Se marcará como eliminada pero podrás reactivarla después.`)) {
      return;
    }

    setDeleting(true);
    try {
      // Llamar al servicio de eliminación lógica (desactivación)
      const response = await promoService.deletePromotion(promotion.IdPromoOK);
      
      console.log('✅ Promoción desactivada:', response);
      
      onDelete && onDelete(promotion);
      onClose();
    } catch (err) {
      console.error('❌ Error al desactivar:', err);
      setError('Error al desactivar la promoción: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteHard = async () => {
    if (!window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que quieres eliminar PERMANENTEMENTE la promoción "${editData.titulo}"? Esta acción NO se puede deshacer.`)) {
      return;
    }

    setDeleting(true);
    try {
      // Llamar al servicio de eliminación física
      const response = await promoService.deletePromotionHard(promotion.IdPromoOK);
      
      console.log('✅ Promoción eliminada permanentemente:', response);
      
      onDelete && onDelete(promotion);
      onClose();
    } catch (err) {
      console.error('❌ Error al eliminar permanentemente:', err);
      setError('Error al eliminar permanentemente la promoción: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres activar/reactivar la promoción "${editData.titulo}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      // Llamar al servicio de activación
      const response = await promoService.activatePromotion(promotion.IdPromoOK);
      
      console.log('✅ Promoción activada:', response);
      
      onSave && onSave({ ...promotion, ACTIVED: true, DELETED: false });
      onClose();
    } catch (err) {
      console.error('❌ Error al activar:', err);
      setError('Error al activar la promoción: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
      } else {
        newSelection.add(productId);
      }
      return newSelection;
    });
  };

  // Función para recibir productos filtrados del componente AdvancedFilters
  const handleFiltersChange = (filteredProducts) => {
    console.log('📦 Productos filtrados recibidos:', filteredProducts);
    if (Array.isArray(filteredProducts)) {
      // Filtrar solo los productos NUEVOS (que no estaban originalmente en la promoción)
      const newProducts = filteredProducts.filter(p => !originalProducts.has(p.SKUID));
      setFilteredProductsToAdd(newProducts);
      console.log('✨ Productos NUEVOS a agregar:', newProducts.length);
    } else {
      setFilteredProductsToAdd([]);
    }
  };

  // Función para agregar los productos filtrados a la promoción
  const handleAddFilteredProducts = () => {
    if (!Array.isArray(filteredProductsToAdd) || filteredProductsToAdd.length === 0) {
      alert('No hay productos filtrados para agregar');
      return;
    }

    const newProducts = new Set(selectedProducts);
    const newOriginals = new Set(originalProducts);
    let addedCount = 0;

    filteredProductsToAdd.forEach(product => {
      if (product?.SKUID && !newProducts.has(product.SKUID)) {
        newProducts.add(product.SKUID);
        newOriginals.add(product.SKUID); // También agregar a originales para que se muestre
        addedCount++;
      }
    });

    setSelectedProducts(newProducts);
    setOriginalProducts(newOriginals); // Actualizar originales
    setShowAddProductsModal(false);
    setFilteredProductsToAdd([]);
    
    if (addedCount > 0) {
      alert(`Se agregaron ${addedCount} producto(s) a la promoción`);
    } else {
      alert('Los productos ya estaban incluidos en la promoción');
    }
  };

  const getFilteredProducts = () => {
    // Mostrar productos que estaban originalmente O que se han agregado (aunque estén deseleccionados)
    const productsToShow = allProducts.filter(product => 
      originalProducts.has(product.SKUID) || selectedProducts.has(product.SKUID)
    );

    if (!searchTerm) return productsToShow;
    
    const searchLower = searchTerm.toLowerCase();
    return productsToShow.filter(product => 
      product.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
      product.SKUID?.toLowerCase().includes(searchLower) ||
      product.MARCA?.toLowerCase().includes(searchLower)
    );
  };

  const formatPromotionStatus = () => {
    const now = new Date();
    const startDate = new Date(editData.fechaInicio);
    const endDate = new Date(editData.fechaFin);
    
    // Usar los campos ACTIVED y DELETED
    if (promotion.DELETED === true) {
      return { design: 'Negative', text: 'Inactiva' };
    }
    
    if (!editData.actived) {
      return { design: 'Negative', text: 'Inactiva' };
    }
    
    if (now < startDate) {
      return { design: 'Information', text: 'Programada' };
    }
    
    if (now > endDate) {
      return { design: 'Critical', text: 'Expirada' };
    }
    
    return { design: 'Positive', text: 'Activa' };
  };

  if (!promotion) return null;

  const status = formatPromotionStatus();

  return (
    <>
    <Dialog
      open={open}
      headerText={`Editar Promoción: ${promotion.IdPromoOK}`}
      style={{ width: '98vw', maxWidth: '1400px', height: '96vh' }}
      footer={
        <Bar
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button 
                design="Negative"
                onClick={handleDeleteHard}
                disabled={saving || deleting}
                icon="delete"
              >
                {deleting ? (
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <BusyIndicator size="Small" />
                    Eliminando...
                  </FlexBox>
                ) : (
                  'Eliminar Permanentemente'
                )}
              </Button>
              
              <Button 
                design="Transparent"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancelar
              </Button>
              
              <Button 
                design="Emphasized"
                onClick={handleSave}
                disabled={saving || deleting}
              >
                {saving ? (
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <BusyIndicator size="Small" />
                    Guardando...
                  </FlexBox>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </FlexBox>
          }
        />
      }
    >
  <div style={{ padding: '0.5rem', height: '100%', overflow: 'hidden' }}>
        
        {error && (
          <MessageStrip 
            type="Negative" 
            style={{ marginBottom: '1rem' }}
            onClose={() => setError('')}
          >
            {error}
          </MessageStrip>
        )}

        {/* Header con información básica */}
        {/* Encabezado compacto para ahorrar espacio */}
        <Card style={{ marginBottom: '0.25rem' }}>
          <CardHeader 
            titleText={`Promoción ${promotion.IdPromoOK}`}
            subtitleText={`Creada por ${promotion.REGUSER || 'N/A'} el ${new Date(promotion.REGDATE).toLocaleDateString()}`}
            style={{ padding: '0.15rem 0.5rem' }}
            action={
              <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                <Tag design={status.design}>
                  {status.text}
                </Tag>
                <Switch 
                  checked={editData.actived}
                  onChange={(e) => setEditData(prev => ({ ...prev, actived: e.target.checked }))}
                />
                <Label style={{ fontSize: '0.875rem' }}>
                  {editData.actived ? 'Desactivar' : 'Activar'}
                </Label>
              </FlexBox>
            }
          />
        </Card>

        {/* Tabs de navegación */}
        <TabContainer
          onTabSelect={(e) => setActiveTab(e.detail.tab.dataset.key)}
          style={{ '--_ui5_tc_header_height': '44px', '--_ui5_tc_item_height': '40px' }}
        >
          <Tab 
            text="Detalles" 
            data-key="details"
            selected={activeTab === 'details'}
          >
            <div style={{ padding: '0.5rem', height: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
              <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                
                {/* Información básica */}
                <Card>
                  <CardHeader titleText="Información Básica" style={{ padding: '' }} />
                  <div style={{ padding: '0.5rem', display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr', alignItems: 'start' }}>
                    
                    <div>
                      <Label required>Título:</Label>
                      <Input
                        value={editData.titulo}
                        onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Título de la promoción"
                        style={{ width: '100%', marginTop: '0.1rem' }}
                      />
                    </div>

                    <div>
                      <Label>Descripción:</Label>
                      <TextArea
                        value={editData.descripcion}
                        onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                        placeholder="Descripción de la promoción"
                        rows={3}
                        style={{ width: '100%', marginTop: '0.1rem' }}
                      />
                    </div>

                    <FlexBox style={{ gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <Label required>Fecha de Inicio:</Label>
                        <DatePicker
                          value={editData.fechaInicio}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.1rem' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Label required>Fecha de Fin:</Label>
                        <DatePicker
                          value={editData.fechaFin}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaFin: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.1rem' }}
                        />
                      </div>
                    </FlexBox>

                  </div>
                </Card>

                {/* Configuración de descuento */}
                <Card>
                  <CardHeader titleText="Configuración de Descuento" style={{ padding: '' }} />
                  <div style={{ padding: '0.5rem' }}>
                    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                      
                      <div>
                        <Label>Tipo de Descuento:</Label>
                        <Select
                          value={editData.tipoDescuento}
                          onChange={(e) => setEditData(prev => ({ ...prev, tipoDescuento: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.1rem' }}
                        >
                          <Option value="PORCENTAJE">Porcentaje (%)</Option>
                          <Option value="MONTO_FIJO">Monto Fijo ($)</Option>
                        </Select>
                      </div>

                      {editData.tipoDescuento === 'PORCENTAJE' ? (
                        <div>
                          <Label>Porcentaje de Descuento (%):</Label>
                          <Input
                            type="Number"
                            value={editData.descuentoPorcentaje}
                            onChange={(e) => setEditData(prev => ({ 
                              ...prev, 
                              descuentoPorcentaje: parseFloat(e.target.value) || 0 
                            }))}
                            min="0"
                            max="100"
                            step="0.1"
                            style={{ width: '200px', marginTop: '0.1rem' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Monto de Descuento ($):</Label>
                          <Input
                            type="Number"
                            value={editData.descuentoMonto}
                            onChange={(e) => setEditData(prev => ({ 
                              ...prev, 
                              descuentoMonto: parseFloat(e.target.value) || 0 
                            }))}
                            min="0"
                            step="0.01"
                            style={{ width: '200px', marginTop: '0.1rem' }}
                          />
                        </div>
                      )}

                    </FlexBox>
                  </div>
                </Card>

              </FlexBox>
            </div>
          </Tab>

          <Tab 
            text="Productos" 
            data-key="products"
            selected={activeTab === 'products'}
          >
            <div style={{ padding: '0.4rem' }}>
              <Card>
                <CardHeader 
                  titleText={`Productos en la Promoción (${selectedProducts.size})`}
                  style={{ flexShrink: 0 }}
                  action={
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Button
                        icon="add"
                        design="Emphasized"
                        onClick={() => setShowAddProductsModal(true)}
                      >
                        Agregar Productos
                      </Button>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        {selectedProducts.size} de {getFilteredProducts().length} productos seleccionados
                      </Text>
                      <Button
                        design="Transparent"
                        onClick={() => setSelectedProducts(new Set(allProducts.map(p => p.SKUID)))}
                        disabled={allProducts.length === 0}
                      >
                        Seleccionar todos
                      </Button>
                      <Button
                        design="Transparent"
                        onClick={() => setSelectedProducts(new Set())}
                        disabled={selectedProducts.size === 0}
                      >
                        Limpiar selección
                      </Button>
                    </FlexBox>
                  }
                />
                <div style={{ padding: '0.4rem' }}>
                  
                  {/* Buscador */}
                  <FlexBox alignItems="Center" style={{ gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Label style={{ margin: 0 }}>Buscar productos:</Label>
                    <div style={{ flex: 1 }}>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, SKU o marca..."
                        icon="search"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </FlexBox>

                  {loading ? (
                    <FlexBox justifyContent="Center" style={{ padding: '1rem' }}>
                      <BusyIndicator size="Large" />
                    </FlexBox>
                  ) : (
                    <div style={{ 
                      height: '55vh',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      padding: '0.25rem'
                    }}>
                      {getFilteredProducts().length === 0 ? (
                        <FlexBox 
                          justifyContent="Center" 
                          alignItems="Center" 
                          style={{ padding: '2rem', flexDirection: 'column', gap: '1rem' }}
                        >
                          <Icon name="product" style={{ fontSize: '3rem', color: '#ccc' }} />
                          <Text style={{ color: '#666', textAlign: 'center' }}>
                            {selectedProducts.size === 0 
                              ? 'No hay productos en esta promoción. Usa el botón "Agregar Productos" para incluir productos.'
                              : 'No se encontraron productos con ese criterio de búsqueda.'
                            }
                          </Text>
                        </FlexBox>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {getFilteredProducts().map((product, index) => (
                          <FlexBox 
                            key={product.SKUID || index} 
                            justifyContent="SpaceBetween" 
                            alignItems="Center" 
                            style={{ 
                              padding: '0.35rem', 
                              border: '1px solid #eeeeee', 
                              borderRadius: '3px',
                              backgroundColor: selectedProducts.has(product.SKUID) ? '#e8f5e8' : 'white',
                              cursor: 'pointer'
                            }} 
                            onClick={() => toggleProductSelection(product.SKUID)}
                          >
                            <FlexBox alignItems="Center" style={{ gap: '0.4rem' }}>
                              <CheckBox checked={selectedProducts.has(product.SKUID)} />
                              <Avatar size="XS" initials={product.PRODUCTNAME?.charAt(0) || 'P'} />
                              <FlexBox direction="Column" style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: 1.1 }}>
                                  {product.PRODUCTNAME || 'Sin nombre'}
                                </Text>
                                <Text style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.1 }}>
                                  SKU: {product.SKUID} • Marca: {product.MARCA || 'Sin marca'}
                                </Text>
                              </FlexBox>
                            </FlexBox>
                            <ObjectStatus state="Information">
                              ${product.PRECIO?.toLocaleString() || 'N/A'}
                            </ObjectStatus>
                          </FlexBox>
                        ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </Card>
            </div>
          </Tab>

        </TabContainer>

      </div>
    </Dialog>

    {/* Modal para agregar productos con filtros */}
    <Dialog
      open={showAddProductsModal}
      onAfterClose={() => {
        setShowAddProductsModal(false);
        setFilteredProductsToAdd([]);
      }}
      headerText="Agregar Productos a la Promoción"
      style={{ width: '90vw', height: '90vh' }}
      footer={
        <Bar
          endContent={
            <>
              <Button
                design="Transparent"
                onClick={() => {
                  setShowAddProductsModal(false);
                  setFilteredProductsToAdd([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                design="Emphasized"
                onClick={handleAddFilteredProducts}
                disabled={!Array.isArray(filteredProductsToAdd) || filteredProductsToAdd.length === 0}
              >
                Agregar {Array.isArray(filteredProductsToAdd) ? filteredProductsToAdd.length : 0} Producto(s)
              </Button>
            </>
          }
        />
      }
    >
      <div style={{ height: '100%', overflow: 'auto', padding: '0.5rem' }}>
        <AdvancedFilters 
          onFiltersChange={handleFiltersChange} 
          preselectedProducts={selectedProducts}
        />
      </div>
    </Dialog>
    </>
  );
};

export default PromotionEditModal;