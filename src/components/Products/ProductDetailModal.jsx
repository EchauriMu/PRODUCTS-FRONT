import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  ObjectStatus,
  Card,
  Icon,
  Carousel,
  Select,
  Option,
  ResponsivePopover
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productFilesService from '../../api/productFilesService';
import productPresentacionesService from '../../api/productPresentacionesService';
import PresentaCreateDialog from '../CRUDPresentaciones/PresentaCreateDialog';
import PresentaPickerDialog from '../CRUDPresentaciones/PresentaPickerDialog';
import PresentaEditDialog from '../CRUDPresentaciones/PresentaEditDialog';

const ProductDetailModal = ({ product, open, onClose }) => {
  const [presentaciones, setPresentaciones] = useState([]);
  const [selectedPresenta, setSelectedPresenta] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  const [openCreatePres, setOpenCreatePres] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Popover confirm delete (1 a 1)
  const delPopoverRef = useRef(null);
  const delBtnRef = useRef(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar presentaciones al abrir
  useEffect(() => {
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

  if (!product) return null;

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

  const getProductStatus = (p) => {
    if (p.DELETED) return { state: ValueState.Error, text: 'Eliminado' };
    if (p.ACTIVED) return { state: ValueState.Success, text: 'Activo' };
    return { state: ValueState.Warning, text: 'Inactivo' };
  };

  const handlePresentaChange = (e) => {
    const presentaId = e.target.value;
    const presenta = presentaciones.find((p) => p.IdPresentaOK === presentaId);
    setSelectedPresenta(presenta || null);
  };

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

  const status = getProductStatus(product);

  const openDeletePopover = () => {
    if (!selectedPresenta) return;
    // Algunos setups requieren el DOM nativo como opener
    const openerEl = delBtnRef.current?.getDomRef ? delBtnRef.current.getDomRef() : delBtnRef.current;
    delPopoverRef.current?.showAt(openerEl);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={<Bar><Title level="H4">Detalle del Producto</Title></Bar>}
      footer={<Bar endContent={<Button onClick={onClose}>Cerrar</Button>} />}
      style={{ width: '820px', maxWidth: '98vw', borderRadius: '12px' }}
    >
      <FlexBox direction="Column" style={{ padding: '1.5rem', gap: '1.5rem', background: '#f5f7fa' }}>
        {/* Información principal */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '0.5rem' }}>
            <FlexBox alignItems="Center" justifyContent="SpaceBetween">
              <Title level="H5">{product.DESSKU || 'Sin descripción'}</Title>
              <ObjectStatus state={status.state}>{status.text}</ObjectStatus>
            </FlexBox>
            <Text style={{ fontSize: '0.95rem', color: '#666' }}>{product.SKUID}</Text>
            {product.INFOAD && <Text style={{ fontSize: '0.95rem', color: '#888', fontStyle: 'italic' }}>{product.INFOAD}</Text>}
          </FlexBox>
        </Card>

        {/* Detalles */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '0.75rem' }}>
            <Title level="H6">Información del Producto</Title>
            <FlexBox style={{ gap: '2rem', flexWrap: 'wrap' }}>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '140px' }}>
                <Label>Código de Barras</Label>
                <Text>{product.BARCODE || 'N/A'}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '140px' }}>
                <Label>Unidad de Medida</Label>
                <Text>{product.IDUNIDADMEDIDA || 'N/A'}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '140px' }}>
                <Label>Categorías</Label>
                <Text>{Array.isArray(product.CATEGORIAS) ? product.CATEGORIAS.join(', ') : (product.CATEGORIAS || 'N/A')}</Text>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </Card>

        {/* Presentaciones */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '1rem' }}>
            <FlexBox alignItems="Center" justifyContent="SpaceBetween">
              <Title level="H6">Presentaciones</Title>
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Emphasized" icon="add" onClick={() => setOpenCreatePres(true)}>Insertar</Button>
                <Button design="Transparent" icon="edit" onClick={() => setOpenPicker(true)} />
                <Button
                  design="Negative"
                  icon="delete"
                  ref={delBtnRef}
                  disabled={!selectedPresenta}
                  onClick={openDeletePopover}
                >
                  Eliminar
                </Button>
              </FlexBox>
            </FlexBox>

            {loadingFiles && <Text>Cargando presentaciones...</Text>}
            {errorFiles && <Text style={{ color: '#d32f2f' }}>{errorFiles}</Text>}
            {!loadingFiles && !errorFiles && presentaciones.length === 0 && (
              <Text style={{ color: '#666' }}>No hay presentaciones asociadas</Text>
            )}
            {!loadingFiles && !errorFiles && presentaciones.length > 0 && (
              <>
                <Label>Selecciona presentación:</Label>
                <Select
                  value={selectedPresenta?.IdPresentaOK || ''}
                  onChange={handlePresentaChange}
                  style={{ marginBottom: '1rem', minWidth: '220px' }}
                >
                  {presentaciones.map((p) => (
                    <Option key={p.IdPresentaOK} value={p.IdPresentaOK}>
                      {p.Descripcion}
                    </Option>
                  ))}
                </Select>

                {selectedPresenta && (
                  <FlexBox direction="Row" style={{ gap: '2rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                      <Text style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedPresenta.Descripcion}</Text>
                      <Text style={{ fontSize: '1rem', color: '#1976d2' }}>
                        <Icon name="money-bills" style={{ marginRight: '0.25rem' }} />
                        Precio: <span style={{ fontWeight: 'bold' }}>${selectedPresenta.Precio}</span>
                      </Text>
                      <Text style={{ fontSize: '1rem', color: '#388e3c' }}>
                        <Icon name="inventory" style={{ marginRight: '0.25rem' }} />
                        Stock: <span style={{ fontWeight: 'bold' }}>{selectedPresenta.Stock}</span>
                      </Text>
                    </FlexBox>
                  </FlexBox>
                )}
              </>
            )}
          </FlexBox>
        </Card>

        {/* Archivos */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '1rem' }}>
            <Title level="H6">Archivos de la Presentación</Title>
            {loadingFiles && <Text>Cargando archivos...</Text>}
            {errorFiles && <Text style={{ color: '#d32f2f' }}>{errorFiles}</Text>}
            {!loadingFiles && !errorFiles && files.length === 0 && (
              <Text style={{ color: '#666' }}>No hay archivos asociados</Text>
            )}
            {!loadingFiles && !errorFiles && files.length > 0 && renderFilesByType()}
          </FlexBox>
        </Card>

        {/* Auditoría */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '10px' }}>
          <FlexBox direction="Column" style={{ padding: '1rem', gap: '1rem' }}>
            <Title level="H6">Auditoría</Title>
            <FlexBox style={{ gap: '2rem', flexWrap: 'wrap' }}>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '180px' }}>
                <Label>Creado por</Label>
                <Text>{product.REGUSER || 'N/A'}</Text>
                <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(product.REGDATE)}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '180px' }}>
                <Label>Modificado por</Label>
                <Text>{product.MODUSER || 'N/A'}</Text>
                <Text style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(product.MODDATE)}</Text>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </Card>
      </FlexBox>

      {/* Crear */}
      <PresentaCreateDialog
        open={openCreatePres}
        onClose={() => setOpenCreatePres(false)}
        skuid={product?.SKUID}
        loggedUser="EECHAURIM"
        onCreated={(nuevo) => {
          if (!nuevo) return;
          setPresentaciones((prev) => (prev.some((p) => p.IdPresentaOK === nuevo.IdPresentaOK) ? prev : [...prev, nuevo]));
          setSelectedPresenta(nuevo);
        }}
      />

      {/* Picker */}
      <PresentaPickerDialog
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        skuid={product?.SKUID}
        presentaciones={presentaciones}
        onPick={(p) => { setEditItem(p); setOpenPicker(false); }}
        onBulkDeleted={(deletedIds) => {
          if (!deletedIds?.length) return;
          setPresentaciones((prev) => prev.filter((x) => !deletedIds.includes(x.IdPresentaOK)));
          setSelectedPresenta((prevSel) => {
            if (prevSel && deletedIds.includes(prevSel.IdPresentaOK)) {
              const remaining = presentaciones.filter((x) => !deletedIds.includes(x.IdPresentaOK));
              setFiles([]);
              return remaining[0] || null;
            }
            return prevSel;
          });
        }}
      />

      {/* Editor */}
      <PresentaEditDialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        presenta={editItem}
        onUpdated={(upd) => {
          if (!upd) return;
          setPresentaciones((prev) => prev.map((x) => (x.IdPresentaOK === upd.IdPresentaOK ? { ...x, ...upd } : x)));
          setSelectedPresenta((prevSel) => (prevSel?.IdPresentaOK === upd.IdPresentaOK ? { ...prevSel, ...upd } : prevSel));
        }}
      />

      {/* Popover confirm delete */}
      <ResponsivePopover ref={delPopoverRef} placementType="Bottom">
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
