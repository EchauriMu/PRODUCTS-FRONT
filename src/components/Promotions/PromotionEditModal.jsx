/*
 * =================================================================================
 * Componente: PromotionEditModal
 * Descripción: Modal para editar promociones existentes con gestión de presentaciones
 * Autores: LAURA PANIAGUA, ALBERTO PARDO
 * =================================================================================
 */

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
  TabContainer,
  Tab,
  Tag
} from '@ui5/webcomponents-react';
import promoService from '../../api/promoService';
import productService from '../../api/productService';
import productPresentacionesService from '../../api/productPresentacionesService';
import AdvancedFilters from './AdvancedFilters';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';

/* ESTADO Y CONFIGURACIÓN */
const PromotionEditModal = ({ open, promotion, onClose, onSave, onDelete }) => {
  const { dialogState, showConfirm, showWarning, showSuccess, closeDialog } = useDialog();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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

  // Estados para gestión de productos y presentaciones
  const [selectedPresentaciones, setSelectedPresentaciones] = useState([]); // Array de presentaciones
  const [originalPresentaciones, setOriginalPresentaciones] = useState([]); // Presentaciones originales de la promo
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para presentaciones expandidas en la lista de productos de la promoción
  const [expandedProductsInList, setExpandedProductsInList] = useState(new Set());
  
  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const [productPresentacionesInList, setProductPresentacionesInList] = useState({});
  const [loadingPresentacionesInList, setLoadingPresentacionesInList] = useState({});
  
  // Estados para selección múltiple y eliminación
  const [selectedPresentacionesForDelete, setSelectedPresentacionesForDelete] = useState(new Set());
  const [selectedProductsForDelete, setSelectedProductsForDelete] = useState(new Set());
  
  // Estados para modal de agregar productos
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [filteredProductsToAdd, setFilteredProductsToAdd] = useState([]);

  // Extraer presentaciones de la promoción
  const extractPresentacionesFromPromotion = (promo) => {
    if (!promo) return [];
    // Campo ProductosAplicables (array de objetos con IdPresentaOK)
    if (Array.isArray(promo.ProductosAplicables)) {
      return promo.ProductosAplicables.filter(p => p && p.IdPresentaOK).map(p => ({
        IdPresentaOK: p.IdPresentaOK,
        SKUID: p.SKUID,
        NOMBREPRESENTACION: p.NombrePresentacion || '',
        Precio: p.PrecioOriginal || 0,
        producto: {
          SKUID: p.SKUID,
          PRODUCTNAME: p.NombreProducto || ''
        }
      }));
    }
    return [];
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
        // Solo activa si ACTIVED es true Y NO está marcada como DELETED
        actived: promotion.ACTIVED === true && promotion.DELETED !== true,
        skuids: []
      });

      const presentacionesInPromo = extractPresentacionesFromPromotion(promotion);
      setSelectedPresentaciones(presentacionesInPromo);
      setOriginalPresentaciones(presentacionesInPromo);

      // Cargar productos disponibles
      loadProducts();
    }
  }, [open, promotion]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();

      // Extraer productos con la misma estructura que AdvancedFilters
      const productosData = response?.value?.[0]?.data?.[0]?.dataRes
        ?? response?.data?.[0]?.dataRes
        ?? [];

      // Normalizar: solo activos y no eliminados si esos flags existen (actualmente no se usa allProducts directamente)
      const _activos = Array.isArray(productosData)
        ? productosData.filter(p => (p.ACTIVED !== false) && (p.DELETED !== true))
        : [];
    } catch (err) {
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

      // Validar que haya al menos una presentación seleccionada
      if (!selectedPresentaciones || selectedPresentaciones.length === 0) {
        throw new Error('Debe seleccionar al menos una presentación para la promoción');
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

      // Preparar presentaciones aplicables con validación
      const presentacionesAplicables = selectedPresentaciones
        .filter(presentacion => presentacion && presentacion.IdPresentaOK)
        .map(presentacion => ({
          IdPresentaOK: presentacion.IdPresentaOK,
          SKUID: presentacion.producto?.SKUID || presentacion.SKUID || '',
          NombreProducto: presentacion.producto?.PRODUCTNAME || '',
          NombrePresentacion: presentacion.NOMBREPRESENTACION || '',
          PrecioOriginal: presentacion.Precio || 0
        }));

      const updateData = {
        Titulo: editData.titulo,
        Descripcion: editData.descripcion,
        FechaIni: new Date(editData.fechaInicio).toISOString(),
        FechaFin: new Date(editData.fechaFin).toISOString(),
        TipoDescuento: editData.tipoDescuento,
        ProductosAplicables: presentacionesAplicables,
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

      const response = await promoService.updatePromotion(promotion.IdPromoOK, updateData);

      onSave && onSave({ ...promotion, ...updateData });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHard = async () => {
    const confirmed = await showWarning(
      `¿Estás seguro de que quieres eliminar PERMANENTEMENTE la promoción "${editData.titulo}"? Esta acción NO se puede deshacer.`,
      'Advertencia: Eliminar Permanentemente',
      { confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      const response = await promoService.deletePromotionHard(promotion.IdPromoOK);
      
      onDelete && onDelete(promotion);
      onClose();
    } catch (err) {
      setError('Error al eliminar permanentemente la promoción: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };



  const handleFiltersChange = (filteredPresentaciones) => {
    if (Array.isArray(filteredPresentaciones)) {
      setFilteredProductsToAdd(filteredPresentaciones);
    } else {
      setFilteredProductsToAdd([]);
    }
  };

  // Función para agregar las presentaciones filtradas a la promoción
  const handleAddFilteredProducts = async () => {
    if (!Array.isArray(filteredProductsToAdd) || filteredProductsToAdd.length === 0) {
      await showSuccess('No hay presentaciones seleccionadas para agregar', 'Información');
      return;
    }

    // Combinar presentaciones originales con las nuevas
    const existingIds = new Set(selectedPresentaciones.map(p => p.IdPresentaOK));
    const newPresentaciones = filteredProductsToAdd.filter(p => p && p.IdPresentaOK && !existingIds.has(p.IdPresentaOK));
    
    const updatedPresentaciones = [...selectedPresentaciones, ...newPresentaciones];
    
    setSelectedPresentaciones(updatedPresentaciones);
    setOriginalPresentaciones(updatedPresentaciones); // Actualizar originales
    setShowAddProductsModal(false);
    setFilteredProductsToAdd([]);
    
    if (newPresentaciones.length > 0) {
      await showSuccess(`Se agregaron ${newPresentaciones.length} presentación(es) a la promoción`, 'Éxito');
    } else {
      await showSuccess('Las presentaciones ya estaban incluidas en la promoción', 'Información');
    }
  };

  const getFilteredProducts = () => {
    // Mostrar presentaciones que están seleccionadas
    if (!searchTerm) return selectedPresentaciones;
    
    const searchLower = searchTerm.toLowerCase();
    return selectedPresentaciones.filter(presentacion => 
      presentacion?.producto?.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
      presentacion?.producto?.SKUID?.toLowerCase().includes(searchLower) ||
      presentacion?.NOMBREPRESENTACION?.toLowerCase().includes(searchLower) ||
      presentacion?.producto?.MARCA?.toLowerCase().includes(searchLower)
    );
  };

  // Agrupar presentaciones seleccionadas por producto (SKUID)
  const getProductsWithPresentaciones = () => {
    const productMap = new Map();
    
    selectedPresentaciones.forEach(presentacion => {
      const skuid = presentacion.producto?.SKUID || presentacion.SKUID;
      if (!productMap.has(skuid)) {
        productMap.set(skuid, {
          SKUID: skuid,
          PRODUCTNAME: presentacion.producto?.PRODUCTNAME || 'Sin nombre',
          MARCA: presentacion.producto?.MARCA || '',
          presentaciones: []
        });
      }
      productMap.get(skuid).presentaciones.push(presentacion);
    });

    // Convertir a array y aplicar filtro de búsqueda
    let products = Array.from(productMap.values());
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      products = products.filter(product => 
        product.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
        product.SKUID?.toLowerCase().includes(searchLower) ||
        product.MARCA?.toLowerCase().includes(searchLower) ||
        product.presentaciones.some(p => p.NOMBREPRESENTACION?.toLowerCase().includes(searchLower))
      );
    }

    return products;
  };

  // Expandir/contraer producto en la lista
  const toggleProductExpansionInList = async (skuid) => {
    const newExpanded = new Set(expandedProductsInList);
    
    if (newExpanded.has(skuid)) {
      newExpanded.delete(skuid);
    } else {
      newExpanded.add(skuid);
      
      // Si no hemos cargado las presentaciones de este producto, cargarlas
      if (!productPresentacionesInList[skuid]) {
        setLoadingPresentacionesInList(prev => ({ ...prev, [skuid]: true }));
        try {
          const presentaciones = await productPresentacionesService.getPresentacionesBySKUID(skuid);
          setProductPresentacionesInList(prev => ({
            ...prev,
            [skuid]: presentaciones || []
          }));
        } catch (error) {
          setProductPresentacionesInList(prev => ({ ...prev, [skuid]: [] }));
        } finally {
          setLoadingPresentacionesInList(prev => ({ ...prev, [skuid]: false }));
        }
      }
    }
    
    setExpandedProductsInList(newExpanded);
  };

  // Quitar una presentación específica
  const removePresentacion = (idPresentaOK) => {
    const updated = selectedPresentaciones.filter(p => p.IdPresentaOK !== idPresentaOK);
    setSelectedPresentaciones(updated);
    setOriginalPresentaciones(updated);
  };

  // Toggle selección de presentación para eliminar
  const togglePresentacionForDelete = (idPresentaOK) => {
    const newSelection = new Set(selectedPresentacionesForDelete);
    if (newSelection.has(idPresentaOK)) {
      newSelection.delete(idPresentaOK);
    } else {
      newSelection.add(idPresentaOK);
    }
    setSelectedPresentacionesForDelete(newSelection);
    
    // Actualizar estado del producto si todas sus presentaciones están seleccionadas
    const presentacion = selectedPresentaciones.find(p => p.IdPresentaOK === idPresentaOK);
    if (presentacion) {
      const productPresentaciones = selectedPresentaciones.filter(p => p.SKUID === presentacion.SKUID);
      const allSelected = productPresentaciones.every(p => 
        newSelection.has(p.IdPresentaOK)
      );
      
      const newProductSelection = new Set(selectedProductsForDelete);
      if (allSelected) {
        newProductSelection.add(presentacion.SKUID);
      } else {
        newProductSelection.delete(presentacion.SKUID);
      }
      setSelectedProductsForDelete(newProductSelection);
    }
  };

  // Toggle selección de producto (todas sus presentaciones) para eliminar
  const toggleProductForDelete = (skuid) => {
    const newProductSelection = new Set(selectedProductsForDelete);
    const newPresentacionSelection = new Set(selectedPresentacionesForDelete);
    
    // Obtener todas las presentaciones de este producto
    const productPresentaciones = selectedPresentaciones.filter(p => p.SKUID === skuid);
    
    if (newProductSelection.has(skuid)) {
      // Deseleccionar producto y todas sus presentaciones
      newProductSelection.delete(skuid);
      productPresentaciones.forEach(p => newPresentacionSelection.delete(p.IdPresentaOK));
    } else {
      // Seleccionar producto y todas sus presentaciones
      newProductSelection.add(skuid);
      productPresentaciones.forEach(p => newPresentacionSelection.add(p.IdPresentaOK));
    }
    
    setSelectedProductsForDelete(newProductSelection);
    setSelectedPresentacionesForDelete(newPresentacionSelection);
  };

  // Eliminar presentaciones seleccionadas
  const removeSelectedPresentaciones = async () => {
    if (selectedPresentacionesForDelete.size === 0) return;
    
    const confirmed = await showConfirm(
      `¿Estás seguro de eliminar ${selectedPresentacionesForDelete.size} presentación(es) de la promoción?`,
      'Eliminar Presentaciones'
    );
    if (!confirmed) return;
    
    const updated = selectedPresentaciones.filter(p => !selectedPresentacionesForDelete.has(p.IdPresentaOK));
    setSelectedPresentaciones(updated);
    setOriginalPresentaciones(updated);
    
    // Limpiar selección
    setSelectedPresentacionesForDelete(new Set());
    setSelectedProductsForDelete(new Set());
  };

  // Seleccionar/deseleccionar todas las presentaciones
  const toggleSelectAll = () => {
    if (selectedPresentacionesForDelete.size === selectedPresentaciones.length) {
      // Deseleccionar todo
      setSelectedPresentacionesForDelete(new Set());
      setSelectedProductsForDelete(new Set());
    } else {
      // Seleccionar todo
      const allPresentacionIds = new Set(selectedPresentaciones.map(p => p.IdPresentaOK));
      const allProductIds = new Set(selectedPresentaciones.map(p => p.SKUID));
      setSelectedPresentacionesForDelete(allPresentacionIds);
      setSelectedProductsForDelete(allProductIds);
    }
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
      style={{ width: 'min(95vw, 1400px)', maxWidth: '100%' }}
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
  <div style={{ padding: '0rem' }}>
        
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
        <Card style={{ marginBottom: '0rem', flexShrink: 0 }}>
          <CardHeader 
            titleText={`Promoción ${promotion.IdPromoOK}`}
            subtitleText={`Creada por ${promotion.REGUSER || 'N/A'} el ${new Date(promotion.REGDATE).toLocaleDateString()}`}
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
        >
          <Tab 
            text="Detalles" 
            data-key="details"
            selected={activeTab === 'details'}
          >
            <div style={{ 
              padding: '0.5rem', 
              maxHeight: '65vh',
              overflowY: 'auto'
            }}>
              <FlexBox style={{ gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                
                {/* Información básica */}
                <Card style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <CardHeader titleText="Información Básica" />
                  <div style={{ padding: '0.5rem' }}>
                    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                      
                      <div>
                        <Label required>Título:</Label>
                        <Input
                          value={editData.titulo}
                          onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Título de la promoción"
                          style={{ width: '100%', marginTop: '0.15rem' }}
                        />
                      </div>

                      <div>
                        <Label>Descripción:</Label>
                        <TextArea
                          value={editData.descripcion}
                          onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                          placeholder="Descripción de la promoción"
                          rows={3}
                          style={{ width: '100%', marginTop: '0.15rem' }}
                        />
                      </div>

                      <div>
                        <Label required>Fecha de Inicio:</Label>
                        <DatePicker
                          value={editData.fechaInicio}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.15rem' }}
                        />
                      </div>
                      
                      <div>
                        <Label required>Fecha de Fin:</Label>
                        <DatePicker
                          value={editData.fechaFin}
                          onChange={(e) => setEditData(prev => ({ ...prev, fechaFin: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.15rem' }}
                        />
                      </div>

                    </FlexBox>
                  </div>
                </Card>

                {/* Configuración de descuento */}
                <Card style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <CardHeader titleText="Configuración de Descuento" />
                  <div style={{ padding: '0.5rem' }}>
                    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                      
                      <div>
                        <Label>Tipo de Descuento:</Label>
                        <Select
                          value={editData.tipoDescuento}
                          onChange={(e) => setEditData(prev => ({ ...prev, tipoDescuento: e.target.value }))}
                          style={{ width: '100%', marginTop: '0.15rem' }}
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
                            style={{ width: '100%', marginTop: '0.15rem' }}
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
                            style={{ width: '100%', marginTop: '0.15rem' }}
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
            <div style={{ 
              padding: '0rem',
              maxHeight: '65vh',
              overflowY: 'auto'
            }}>
              <Card style={{ 
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'fit-content'
              }}>
                <CardHeader 
                  titleText={`Presentaciones en la Promoción (${selectedPresentaciones.length})`}
                  style={{ flexShrink: 0 }}
                  action={
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      {selectedPresentacionesForDelete.size > 0 && (
                        <Button
                          icon="delete"
                          design="Negative"
                          onClick={removeSelectedPresentaciones}
                        >
                          Eliminar {selectedPresentacionesForDelete.size} seleccionada(s)
                        </Button>
                      )}
                      <Button
                        icon="multiselect-all"
                        design="Transparent"
                        onClick={toggleSelectAll}
                        disabled={selectedPresentaciones.length === 0}
                      >
                        {selectedPresentacionesForDelete.size === selectedPresentaciones.length ? 'Deseleccionar' : 'Seleccionar'} todo
                      </Button>
                      <Button
                        icon="add"
                        design="Emphasized"
                        onClick={() => setShowAddProductsModal(true)}
                      >
                        Agregar Productos
                      </Button>
                    </FlexBox>
                  }
                />
                <div style={{ 
                  padding: '0.4rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  
                  {/* Buscador */}
                  <FlexBox alignItems="Center" style={{ gap: '0.4rem' }}>
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
                    <>
                      <div style={{ 
                        border: '1px solid #e8e8e8',
                        borderRadius: '4px',
                        padding: '0.5rem'
                      }}>
                        {getProductsWithPresentaciones().length === 0 ? (
                          <FlexBox 
                            justifyContent="Center" 
                            alignItems="Center" 
                            style={{ padding: '2rem', flexDirection: 'column', gap: '1rem' }}
                          >
                            <Icon name="product" style={{ fontSize: '3rem', color: '#ccc' }} />
                            <Text style={{ color: '#666', textAlign: 'center' }}>
                              {selectedPresentaciones.length === 0 
                                ? 'No hay presentaciones en esta promoción. Usa el botón "Agregar Productos" para incluir presentaciones.'
                                : 'No se encontraron presentaciones con ese criterio de búsqueda.'
                              }
                            </Text>
                          </FlexBox>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {getProductsWithPresentaciones()
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((product) => {
                            const isExpanded = expandedProductsInList.has(product.SKUID);
                            const presentacionesSeleccionadas = product.presentaciones;
                            const isProductSelected = selectedProductsForDelete.has(product.SKUID);
                            const allPresentacionesSelected = presentacionesSeleccionadas.every(p => 
                              selectedPresentacionesForDelete.has(p.IdPresentaOK)
                            );

                            return (
                              <div key={product.SKUID} style={{ marginBottom: '0.25rem' }}>
                                {/* Producto principal */}
                                <FlexBox 
                                  justifyContent="SpaceBetween" 
                                  alignItems="Center" 
                                  style={{ 
                                    padding: '0.4rem', 
                                    border: '1px solid #d0d0d0', 
                                    borderRadius: '3px',
                                    backgroundColor: isProductSelected ? '#fff3e0' : '#ffffff'
                                  }}
                                >
                                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                                    <CheckBox 
                                      checked={allPresentacionesSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleProductForDelete(product.SKUID);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div 
                                      onClick={() => toggleProductExpansionInList(product.SKUID)}
                                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                      <Icon 
                                        name={isExpanded ? 'navigation-down-arrow' : 'navigation-right-arrow'} 
                                        style={{ fontSize: '0.9rem', color: '#0854A0' }}
                                      />
                                      <Avatar size="XS" initials={product.PRODUCTNAME?.charAt(0) || 'P'} />
                                      <FlexBox direction="Column">
                                        <Text style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: 1.2 }}>
                                          {product.PRODUCTNAME}
                                        </Text>
                                        <Text style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.1 }}>
                                          SKU: {product.SKUID} • {presentacionesSeleccionadas.length} presentación(es)
                                        </Text>
                                      </FlexBox>
                                    </div>
                                  </FlexBox>
                                  <Tag colorScheme="2">{presentacionesSeleccionadas.length}</Tag>
                                </FlexBox>

                                {/* Presentaciones expandidas */}
                                {isExpanded && (
                                  <div style={{ 
                                    marginLeft: '1.5rem', 
                                    marginTop: '0.3rem', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '0.25rem' 
                                  }}>
                                    {loadingPresentacionesInList[product.SKUID] ? (
                                      <FlexBox justifyContent="Center" style={{ padding: '0.5rem' }}>
                                        <BusyIndicator size="Small" />
                                      </FlexBox>
                                    ) : (
                                      presentacionesSeleccionadas.map((presentacion) => {
                                        const isPresentacionSelected = selectedPresentacionesForDelete.has(presentacion.IdPresentaOK);
                                        return (
                                        <FlexBox 
                                          key={presentacion.IdPresentaOK} 
                                          justifyContent="SpaceBetween" 
                                          alignItems="Center" 
                                          style={{ 
                                            padding: '0.3rem 0.4rem', 
                                            border: '1px solid #eeeeee', 
                                            borderRadius: '3px',
                                            backgroundColor: isPresentacionSelected ? '#fff3e0' : '#f0f8ff'
                                          }}
                                        >
                                          <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: 1 }}>
                                            <CheckBox 
                                              checked={isPresentacionSelected}
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                togglePresentacionForDelete(presentacion.IdPresentaOK);
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <FlexBox direction="Column" style={{ flex: 1 }}>
                                              <Text style={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: 1.2 }}>
                                                {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                              </Text>
                                              <Text style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.1 }}>
                                                ID: {presentacion.IdPresentaOK}
                                              </Text>
                                            </FlexBox>
                                          </FlexBox>
                                          <FlexBox direction="Column" alignItems="End" style={{ gap: '0.2rem' }}>
                                            <Text style={{ fontSize: '0.7rem', color: '#999', textDecoration: 'line-through' }}>
                                              ${presentacion.Precio?.toLocaleString() || 'N/A'}
                                            </Text>
                                            <ObjectStatus state="Positive">
                                              ${
                                                editData.tipoDescuento === 'PORCENTAJE'
                                                  ? ((presentacion.Precio ?? 0) * (1 - editData.descuentoPorcentaje / 100)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                  : ((presentacion.Precio ?? 0) - editData.descuentoMonto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                              }
                                            </ObjectStatus>
                                          </FlexBox>
                                        </FlexBox>
                                      )})
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Paginación */}
                    {getProductsWithPresentaciones().length > itemsPerPage && (
                      <FlexBox 
                        justifyContent="SpaceBetween" 
                        alignItems="Center" 
                        style={{ 
                          padding: '0.75rem', 
                          borderTop: '1px solid #e8e8e8',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px'
                        }}
                      >
                        <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                          Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getProductsWithPresentaciones().length)} de {getProductsWithPresentaciones().length} productos
                        </Text>
                        <FlexBox style={{ gap: '0.5rem' }}>
                          <Button
                            icon="navigation-left-arrow"
                            design="Transparent"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          <Text style={{ padding: '0 0.5rem', alignSelf: 'center', fontSize: '0.875rem' }}>
                            Página {currentPage} de {Math.ceil(getProductsWithPresentaciones().length / itemsPerPage)}
                          </Text>
                          <Button
                            icon="navigation-right-arrow"
                            design="Transparent"
                            iconEnd
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getProductsWithPresentaciones().length / itemsPerPage), prev + 1))}
                            disabled={currentPage >= Math.ceil(getProductsWithPresentaciones().length / itemsPerPage)}
                          >
                            Siguiente
                          </Button>
                        </FlexBox>
                      </FlexBox>
                    )}
                  </>
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
      style={{ 
        '--_ui5_popup_content_padding_s': '0',
        '--_ui5_popup_content_padding_m_l_xl': '0',
        width: '95vw',
        height: '85vh',
        maxWidth: '1600px'
      }}
      contentStyle={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <AdvancedFilters 
          onFiltersChange={handleFiltersChange} 
          preselectedPresentaciones={selectedPresentaciones}
        />
      </div>
    </Dialog>

    {/* Diálogo personalizado */}
    <CustomDialog
      open={dialogState.open}
      type={dialogState.type}
      title={dialogState.title}
      message={dialogState.message}
      onClose={closeDialog}
      onConfirm={dialogState.onConfirm}
      onCancel={dialogState.onCancel}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      confirmDesign={dialogState.confirmDesign}
    />
    </>
  );
};

export default PromotionEditModal;