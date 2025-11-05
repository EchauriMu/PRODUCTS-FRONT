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
  Select,
  Option,
  Avatar,
  BusyIndicator,
  Icon,
  MultiComboBox,
  ComboBoxItem,
  TabContainer,
  Tab
} from '@ui5/webcomponents-react';
import promoService from '../../api/promoService';
import productService from '../../api/productService';

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
  const [searchTerm, setSearchTerm] = useState('');

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
        skuids: promotion.SKUIDS || []
      });

      // Establecer productos seleccionados
      if (promotion.SKUIDS && Array.isArray(promotion.SKUIDS)) {
        setSelectedProducts(new Set(promotion.SKUIDS));
      }

      // Cargar productos disponibles
      loadProducts();
    }
  }, [open, promotion]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      
      let productsData = [];
      if (response?.data?.[0]?.dataRes) {
        productsData = response.data[0].dataRes;
      } else if (Array.isArray(response?.data)) {
        productsData = response.data;
      }

      setAllProducts(productsData.filter(p => p.ACTIVED && !p.DELETED));
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos: ' + err.message);
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

      // Preparar datos para la API
      const updateData = {
        ...promotion,
        Titulo: editData.titulo,
        Descripcion: editData.descripcion,
        FechaIni: editData.fechaInicio,
        FechaFin: editData.fechaFin,
        TipoDescuento: editData.tipoDescuento,
        'Descuento%': editData.tipoDescuento === 'PORCENTAJE' ? editData.descuentoPorcentaje : 0,
        DescuentoMonto: editData.tipoDescuento === 'MONTO_FIJO' ? editData.descuentoMonto : 0,
        ACTIVED: editData.actived,
        SKUIDS: Array.from(selectedProducts)
      };

      // Llamar al servicio de actualización (necesitarás implementar este método)
      await promoService.updatePromotion(promotion.IdPromoOK, updateData);

      onSave && onSave(updateData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la promoción "${editData.titulo}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      // Llamar al servicio de eliminación
      await promoService.deletePromotion(promotion.IdPromoOK);
      
      onDelete && onDelete(promotion);
      onClose();
    } catch (err) {
      setError('Error al eliminar la promoción: ' + err.message);
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

  const getFilteredProducts = () => {
    if (!searchTerm) return allProducts;
    
    const searchLower = searchTerm.toLowerCase();
    return allProducts.filter(product => 
      product.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
      product.SKUID?.toLowerCase().includes(searchLower) ||
      product.MARCA?.toLowerCase().includes(searchLower)
    );
  };

  const formatPromotionStatus = () => {
    const now = new Date();
    const startDate = new Date(editData.fechaInicio);
    const endDate = new Date(editData.fechaFin);
    
    if (!editData.actived) {
      return { state: 'Error', text: 'Inactiva' };
    }
    
    if (now < startDate) {
      return { state: 'Information', text: 'Programada' };
    }
    
    if (now > endDate) {
      return { state: 'Warning', text: 'Expirada' };
    }
    
    return { state: 'Success', text: 'Activa' };
  };

  if (!promotion) return null;

  const status = formatPromotionStatus();

  return (
    <Dialog
      open={open}
      headerText={`Editar Promoción: ${promotion.IdPromoOK}`}
      style={{ width: '90vw', maxWidth: '900px', height: '85vh' }}
      footer={
        <Bar
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button 
                design="Negative"
                onClick={handleDelete}
                disabled={saving || deleting}
                icon="delete"
              >
                {deleting ? (
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <BusyIndicator size="Small" />
                    Eliminando...
                  </FlexBox>
                ) : (
                  'Eliminar'
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
      <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
        
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
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader 
            titleText={`Promoción ${promotion.IdPromoOK}`}
            subtitleText={`Creada por ${promotion.REGUSER || 'N/A'} el ${new Date(promotion.REGDATE).toLocaleDateString()}`}
            action={
              <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                <ObjectStatus state={status.state}>
                  {status.text}
                </ObjectStatus>
                <CheckBox 
                  checked={editData.actived}
                  onChange={(e) => setEditData(prev => ({ ...prev, actived: e.target.checked }))}
                  text="Activa"
                />
              </FlexBox>
            }
          />
        </Card>

        {/* Tabs de navegación */}
        <TabContainer
          onTabSelect={(e) => setActiveTab(e.detail.tab.dataset.key)}
          style={{ height: 'calc(100% - 120px)' }}
        >
          <Tab 
            text="Detalles" 
            icon="edit"
            data-key="details"
            selected={activeTab === 'details'}
          >
            <div style={{ padding: '1rem' }}>
              <FlexBox direction="Column" style={{ gap: '1rem' }}>
                
                {/* Información básica */}
                <Card>
                  <CardHeader titleText="Información Básica" />
                  <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
                    
                    <div>
                      <Label required>Título:</Label>
                      <Input
                        value={editData.titulo}
                        onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Título de la promoción"
                        style={{ width: '100%', marginTop: '0.25rem' }}
                      />
                    </div>

                    <div>
                      <Label>Descripción:</Label>
                      <TextArea
                        value={editData.descripcion}
                        onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                        placeholder="Descripción de la promoción"
                        rows={3}
                        style={{ width: '100%', marginTop: '0.25rem' }}
                      />
                    </div>

                    <FlexBox style={{ gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <Label required>Fecha de Inicio:</Label>
                        <DatePicker
                          value={editData.fechaInicio}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.25rem' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Label required>Fecha de Fin:</Label>
                        <DatePicker
                          value={editData.fechaFin}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaFin: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.25rem' }}
                        />
                      </div>
                    </FlexBox>

                  </div>
                </Card>

                {/* Configuración de descuento */}
                <Card>
                  <CardHeader titleText="Configuración de Descuento" />
                  <div style={{ padding: '1rem' }}>
                    <FlexBox direction="Column" style={{ gap: '1rem' }}>
                      
                      <div>
                        <Label>Tipo de Descuento:</Label>
                        <Select
                          value={editData.tipoDescuento}
                          onChange={(e) => setEditData(prev => ({ ...prev, tipoDescuento: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.25rem' }}
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
                            style={{ width: '200px', marginTop: '0.25rem' }}
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
                            style={{ width: '200px', marginTop: '0.25rem' }}
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
            icon="product"
            data-key="products"
            selected={activeTab === 'products'}
          >
            <div style={{ padding: '1rem' }}>
              <Card>
                <CardHeader 
                  titleText={`Productos en la Promoción (${selectedProducts.size})`}
                  action={
                    <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                      {selectedProducts.size} de {allProducts.length} productos seleccionados
                    </Text>
                  }
                />
                <div style={{ padding: '1rem' }}>
                  
                  {/* Buscador */}
                  <FlexBox direction="Column" style={{ marginBottom: '1rem' }}>
                    <Label>Buscar productos:</Label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, SKU o marca..."
                      icon="search"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                    />
                  </FlexBox>

                  {loading ? (
                    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                      <BusyIndicator size="Large" />
                    </FlexBox>
                  ) : (
                    <FlexBox direction="Column" style={{ 
                      gap: '0.5rem', 
                      maxHeight: '400px', 
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '0.5rem'
                    }}>
                      {getFilteredProducts().map((product, index) => (
                        <FlexBox 
                          key={product.SKUID || index} 
                          justifyContent="SpaceBetween" 
                          alignItems="Center" 
                          style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '4px',
                            backgroundColor: selectedProducts.has(product.SKUID) ? '#e8f5e8' : 'white',
                            cursor: 'pointer'
                          }} 
                          onClick={() => toggleProductSelection(product.SKUID)}
                        >
                          <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                            <CheckBox checked={selectedProducts.has(product.SKUID)} />
                            <Avatar size="S" initials={product.PRODUCTNAME?.charAt(0) || 'P'} />
                            <FlexBox direction="Column" style={{ flex: 1 }}>
                              <Text style={{ fontWeight: 'bold' }}>
                                {product.PRODUCTNAME || 'Sin nombre'}
                              </Text>
                              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                                SKU: {product.SKUID} • Marca: {product.MARCA || 'Sin marca'}
                              </Text>
                            </FlexBox>
                          </FlexBox>
                          <ObjectStatus state="Information">
                            ${product.PRECIO?.toLocaleString() || 'N/A'}
                          </ObjectStatus>
                        </FlexBox>
                      ))}
                    </FlexBox>
                  )}

                </div>
              </Card>
            </div>
          </Tab>

        </TabContainer>

      </div>
    </Dialog>
  );
};

export default PromotionEditModal;