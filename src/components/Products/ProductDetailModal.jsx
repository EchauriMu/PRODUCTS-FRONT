import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  Card,
  Icon,
  Carousel,
  Select,
  Option,
  ResponsivePopover,
  IllustratedMessage,
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productFilesService from '../../api/productFilesService';
import PresentationStatus from '../CRUDPresentaciones/PresentationStatus';
import ProductStatus from './ProductStatus';
import productPresentacionesService from '../../api/productPresentacionesService';

const ProductDetailModal = ({ product, open, onClose }) => {
  const navigate = useNavigate();
  const [presentaciones, setPresentaciones] = useState([]);
  const [selectedPresenta, setSelectedPresenta] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [localProduct, setLocalProduct] = useState(product);
  const [errorFiles, setErrorFiles] = useState(null);

  // Popover confirm delete (1 a 1)
  const delPopoverRef = useRef(null);
  const delBtnRef = useRef(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar presentaciones al abrir
  useEffect(() => {
    setLocalProduct(product); // Sincroniza el producto local al abrir/cambiar
    if (open && product?.SKUID) {
      setLoadingFiles(true);
      setErrorFiles(null);
      productPresentacionesService
        .getPresentacionesBySKUID(product.SKUID, 'EECHAURIM')
        .then((dataRes) => {
          setPresentaciones(dataRes);
          setSelectedPresenta(dataRes[0] || null);
        })
        .catch(() => setErrorFiles('Error al cargar presentaciones'))
        .finally(() => setLoadingFiles(false));
    } else {
      setPresentaciones([]);
      setSelectedPresenta(null);
    }
  }, [open, product]);

  // Cargar archivos cuando cambia la presentación
  useEffect(() => {
    if (selectedPresenta?.IdPresentaOK) {
      setLoadingFiles(true);
      setErrorFiles(null);
      productFilesService
        .getFilesByIdPresentaOK(selectedPresenta.IdPresentaOK, 'EECHAURIM')
        .then(setFiles)
        .catch(() => setErrorFiles('Error al cargar archivos'))
        .finally(() => setLoadingFiles(false));
    } else {
      setFiles([]);
    }
  }, [selectedPresenta]);

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

  const handlePresentaChange = (e) => {
    const presentaId = e.target.value;
    const presenta = presentaciones.find((p) => p.IdPresentaOK === presentaId);
    setSelectedPresenta(presenta || null);
  };

  const handleProductStatusChange = (updatedProduct) => {
    setLocalProduct(updatedProduct);
  }

  const handleStatusChange = (updatedPresentation) => {
    // Actualiza la presentación en el estado local para reflejar el cambio
    setPresentaciones(prev =>
      prev.map(p =>
        p.IdPresentaOK === updatedPresentation.IdPresentaOK ? updatedPresentation : p
      )
    );
    // Si la presentación actualizada es la seleccionada, actualiza también `selectedPresenta`
    if (selectedPresenta?.IdPresentaOK === updatedPresentation.IdPresentaOK) {
      setSelectedPresenta(updatedPresentation);
    }
  };

  if (!localProduct) return null;

  // === Delete single ===
  const handleDeleteSingle = async () => {
    if (!selectedPresenta?.IdPresentaOK) return;
    setDeleting(true);
    try {
      await productPresentacionesService.deletePresentacion(
        selectedPresenta.IdPresentaOK,
        'EECHAURIM'
      );
      setPresentaciones((prev) => {
        const updated = prev.filter((p) => p.IdPresentaOK !== selectedPresenta.IdPresentaOK);
        setSelectedPresenta(updated[0] || null);
        return updated;
      });
      setFiles([]);
    } catch (e) {
      console.error(e);
      setErrorFiles('Error al eliminar presentación');
    } finally {
      setDeleting(false);
      delPopoverRef.current?.close();
    }
  };

  const renderFilesByType = () => {
    const imageFiles = files.filter((f) => f.FILETYPE === 'IMG');
    const pdfFiles = files.filter((f) => f.FILETYPE === 'PDF');
    const docFiles = files.filter((f) => f.FILETYPE === 'DOC');
    const videoFiles = files.filter((f) => f.FILETYPE === 'VIDEO');
    const otherFiles = files.filter((f) => f.FILETYPE === 'OTHER');

    return (
      <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
        {/* Imágenes */}
        {imageFiles.length > 0 && (
          <Card style={{ boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label><Icon name="image" style={{ marginRight: '0.25rem' }} />Imágenes ({imageFiles.length})</Label>
              <Carousel
                style={{
                  width: '100%',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  minHeight: '140px'
                }}
              >
                {imageFiles.map((file, idx) => (
                  <FlexBox
                    key={file.FILEID || idx}
                    alignItems="Center"
                    justifyContent="Center"
                    style={{ height: '200px', padding: '0.5rem', maxWidth: '300px', maxHeight: '300px', overflow: 'hidden' }}
                  >
                    <img
                      src={file.FILE}
                      alt={file.INFOAD || `Imagen ${idx + 1}`}
                      style={{
                        width: '100%', height: '100%', maxWidth: '300px', maxHeight: '300px',
                        objectFit: 'contain', borderRadius: '8px', border: '2px solid #fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'block'
                      }}
                    />
                  </FlexBox>
                ))}
              </Carousel>
            </FlexBox>
          </Card>
        )}

        {/* PDFs */}
        {pdfFiles.length > 0 && (
          <div>
            <Label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              <Icon name="pdf-attachment" style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
              PDFs ({pdfFiles.length})
            </Label>
            <FlexBox style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
              {pdfFiles.map((file, idx) => (
                <FlexBox
                  key={file.FILEID || idx}
                  direction="Column"
                  alignItems="Center"
                  style={{
                    padding: '0.5rem', backgroundColor: '#fff3f3', borderRadius: '4px', border: '1px solid #ffcdd2',
                    cursor: 'pointer', width: '80px', transition: 'box-shadow 0.2s',
                    boxShadow: '0 2px 6px rgba(255,205,210,0.15)'
                  }}
                  onClick={() => window.open(file.FILE, '_blank')}
                  title={file.INFOAD || `PDF ${idx + 1}`}
                >
                  <Icon name="pdf-attachment" style={{ fontSize: '2rem', color: '#d32f2f', marginBottom: '0.25rem' }} />
                  <Text style={{ fontSize: '0.8rem', color: '#d32f2f', textAlign: 'center', wordBreak: 'break-word' }}>
                    {file.INFOAD || `PDF ${idx + 1}`}
                  </Text>
                </FlexBox>
              ))}
            </FlexBox>
          </div>
        )}

        {/* Documentos */}
        {docFiles.length > 0 && (
          <Card style={{ boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <Label><Icon name="document" style={{ marginRight: '0.25rem' }} />Documentos ({docFiles.length})</Label>
            <FlexBox style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              {docFiles.map((file, idx) => (
                <Button
                  key={file.FILEID || idx}
                  icon="document"
                  design="Default"
                  style={{ minWidth: '100px', marginBottom: '0.5rem' }}
                  onClick={() => window.open(file.FILE, '_blank')}
                >
                  {file.INFOAD || `Doc ${idx + 1}`}
                </Button>
              ))}
            </FlexBox>
          </Card>
        )}

        {/* Videos */}
        {videoFiles.length > 0 && (
          <Card style={{ boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <Label><Icon name="video" style={{ marginRight: '0.25rem' }} />Videos ({videoFiles.length})</Label>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              {videoFiles.map((file, idx) => (
                <FlexBox key={file.FILEID || idx} direction="Column" style={{ gap: '0.25rem' }}>
                  <video controls style={{ width: '100%', maxHeight: '180px', borderRadius: '8px', backgroundColor: '#000' }} src={file.FILE} />
                  <Text style={{ fontSize: '0.85rem', color: '#666' }}>{file.INFOAD || `Video ${idx + 1}`}</Text>
                </FlexBox>
              ))}
            </FlexBox>
          </Card>
        )}

        {/* Otros */}
        {otherFiles.length > 0 && (
          <Card style={{ boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <Label><Icon name="attachment" style={{ marginRight: '0.25rem' }} />Otros ({otherFiles.length})</Label>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              {otherFiles.map((file, idx) => (
                <Button
                  key={file.FILEID || idx}
                  icon="download"
                  design="Transparent"
                  style={{ minWidth: '120px', marginBottom: '0.5rem' }}
                  onClick={() => window.open(file.FILE, '_blank')}
                >
                  {file.INFOAD || 'Archivo sin nombre'}
                </Button>
              ))}
            </FlexBox>
          </Card>
        )}
      </FlexBox>
    );
  };

  const openDeletePopover = () => {
  if (!selectedPresenta) return;
  const anchor =
    delBtnRef.current?.getDomRef?.() || delBtnRef.current; // compatible con distintas versiones
  delPopoverRef.current?.showAt(anchor);
};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar><Title level="H4">Detalle del Producto</Title></Bar>}
      footer={<Bar endContent={<Button design="Emphasized" onClick={onClose}>Cerrar</Button>} />}
      style={{ width: '95vw', maxWidth: '1400px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', height: 'calc(80vh - 50px)' }}>
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
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
            {/* Controles de Presentación */}
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                <Title level="H4">Presentaciones</Title>
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  {selectedPresenta && (
                    <PresentationStatus presentation={selectedPresenta} onStatusChange={handleStatusChange} />
                  )}
                  <Button design="Emphasized" icon="add" onClick={() => navigate(`/products/${localProduct.SKUID}/presentations/add`)}>Insertar</Button>
                  <Button design="Transparent" icon="edit" onClick={() => navigate(`/products/${localProduct.SKUID}/presentations/select-edit`)} />
                  <Button design="Negative" icon="delete" ref={delBtnRef} disabled={!selectedPresenta} onClick={openDeletePopover} />
                </FlexBox>
              </FlexBox>

              {loadingFiles && <Text>Cargando presentaciones...</Text>}
              {errorFiles && <Text style={{ color: '#d32f2f' }}>{errorFiles}</Text>}

              {!loadingFiles && !errorFiles && presentaciones.length > 0 && (
                <Select
                  value={selectedPresenta?.IdPresentaOK || ''}
                  onChange={handlePresentaChange}
                  style={{ width: '100%' }}
                >
                  {presentaciones.map((p) => (
                    <Option key={p.IdPresentaOK} value={p.IdPresentaOK}>
                      {p.NOMBREPRESENTACION} ({p.Descripcion})
                    </Option>
                  ))}
                </Select>
              )}
            </FlexBox>

            {/* Contenido de la Presentación Seleccionada */}
            {selectedPresenta ? (
              <FlexBox direction="Column" style={{ gap: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
                {/* Archivos de la Presentación */}
                <FlexBox direction="Column" style={{ gap: '1rem' }}>
                  <Title level="H6">Archivos Asociados</Title>
                  {loadingFiles && <Text>Cargando archivos...</Text>}
                  {!loadingFiles && files.length === 0 && (
                    <Text style={{ color: '#666' }}>No hay archivos para esta presentación.</Text>
                  )}
                  {!loadingFiles && files.length > 0 && renderFilesByType()}
                </FlexBox>
              </FlexBox>
            ) : (
              !loadingFiles && (
                <IllustratedMessage
                  name="NoData"
                  titleText="Sin Presentaciones"
                  subtitleText="Este producto no tiene presentaciones o no se ha seleccionado ninguna."
                />
              )
            )}
          </FlexBox>
        </div>
      </div>

      {/* Popover confirm delete */}
      <ResponsivePopover ref={delPopoverRef} placementType="Bottom" onAfterClose={() => {}}>
        <Bar startContent={<Title level="H6">Eliminar presentación</Title>} />
        <div style={{ padding: '1rem', maxWidth: 360 }}>
          <Text>¿Seguro que deseas eliminar <b>{selectedPresenta?.Descripcion}</b>?</Text>
        </div>
        <Bar
          endContent={
            <>
              <Button design="Transparent" onClick={() => delPopoverRef.current?.close()} disabled={deleting}>Cancelar</Button>
              <Button design="Negative" icon="delete" onClick={handleDeleteSingle} disabled={deleting}>Eliminar</Button>
            </>
          }
        />
      </ResponsivePopover>
    </Dialog>
  );
};

export default ProductDetailModal;
