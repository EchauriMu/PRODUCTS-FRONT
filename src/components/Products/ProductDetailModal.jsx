import React, { useEffect, useState } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox
} from '@ui5/webcomponents-react';
import ProductStatus from './ProductStatus';
import productPresentacionesService from '../../api/productPresentacionesService';
import ProductDetailPresentations from './ProductDetailPresentations';

const ProductDetailModal = ({ product, open, onClose }) => {
  const [presentaciones, setPresentaciones] = useState([]);
  const [localProduct, setLocalProduct] = useState(product);
  const [loadingPresentaciones, setLoadingPresentaciones] = useState(false);
  const [errorPresentaciones, setErrorPresentaciones] = useState(null);

  // Cargar presentaciones al abrir
  useEffect(() => {
    setLocalProduct(product); // Sincroniza el producto local al abrir/cambiar
    if (open && product?.SKUID) {
      setLoadingPresentaciones(true);
      setErrorPresentaciones(null);
      productPresentacionesService
        .getPresentacionesBySKUID(product.SKUID, 'EECHAURIM')
        .then((dataRes) => {
          setPresentaciones(dataRes);
        })
        .catch(() => setErrorPresentaciones('Error al cargar presentaciones'))
        .finally(() => setLoadingPresentaciones(false));
    } else {
      setPresentaciones([]);
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
  }

  if (!localProduct) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar><Title level="H4">Detalle del Producto</Title></Bar>}
      footer={<Bar endContent={<Button design="Emphasized" onClick={onClose}>Cerrar</Button>} />}
      style={{ width: '95vw', maxWidth: '1400px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', height: 'calc(80vh - 50px)', overflow: 'hidden' }}>
        {/* Columna Izquierda: Info Producto */}
        <div style={{ background: '#f7f8fa', padding: '1.5rem', borderRight: '1px solid #e5e5e5', overflowY: 'auto' }}>
          <FlexBox direction="Column" style={{ gap: '2rem' }}>
            {/* Encabezado y Estado del Producto */}
            <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
              <Title level="H3" style={{ flexShrink: 1, marginRight: '1rem' }}>{localProduct.PRODUCTNAME || 'Sin Nombre'}</Title>
              <Text style={{ color: '#666', fontStyle: 'italic', marginBottom: '1rem' }}>{localProduct.DESSKU || 'Sin descripción'}</Text>
              <ProductStatus product={localProduct} onStatusChange={handleProductStatusChange} />
            </FlexBox>

            {/* Detalles */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
                Información General
              </Title>
              <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                <FlexBox direction="Column"><Label>SKU</Label><Text>{localProduct.SKUID || 'N/A'}</Text></FlexBox>
                <FlexBox direction="Column"><Label>Marca</Label><Text>{localProduct.MARCA || 'N/A'}</Text></FlexBox>
                <FlexBox direction="Column"><Label>Código de Barras</Label><Text>{localProduct.BARCODE || 'N/A'}</Text></FlexBox>
                <FlexBox direction="Column"><Label>Unidad de Medida</Label><Text>{localProduct.IDUNIDADMEDIDA || 'N/A'}</Text></FlexBox>
                <FlexBox direction="Column"><Label>Categorías</Label><Text>{Array.isArray(localProduct.CATEGORIAS) ? localProduct.CATEGORIAS.join(', ') : (localProduct.CATEGORIAS || 'N/A')}</Text></FlexBox>
                {localProduct.INFOAD && <FlexBox direction="Column"><Label>Info Adicional</Label><Text>{localProduct.INFOAD}</Text></FlexBox>}
              </FlexBox>
            </FlexBox>

            {/* Auditoría */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H5" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '0.5rem' }}>
                Auditoría
              </Title>
              <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                <FlexBox direction="Column">
                  <Label>Creado por</Label>
                  <Text>{localProduct.REGUSER || 'N/A'}</Text>
                  <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(localProduct.REGDATE)}</Text>
                </FlexBox>
                <FlexBox direction="Column">
                  <Label>Modificado por</Label>
                  <Text>{localProduct.MODUSER || 'N/A'}</Text>
                  <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(localProduct.MODDATE)}</Text>
                </FlexBox>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </div>

        {/* Columna Derecha: Presentaciones y Archivos */}
        <ProductDetailPresentations
          product={localProduct}
          presentaciones={presentaciones}
          onPresentacionesChange={setPresentaciones}
          loading={loadingPresentaciones}
          error={errorPresentaciones}
        />
      </div>
    </Dialog>
  );
};

export default ProductDetailModal;
