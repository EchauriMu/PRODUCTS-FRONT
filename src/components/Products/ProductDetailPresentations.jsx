import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Title,
  Text,
  FlexBox,
  Card,
  Icon,
  Carousel,
  Select,
  Option,
  ResponsivePopover,
  IllustratedMessage,
  Bar,
  Label,
  MessageStrip
} from '@ui5/webcomponents-react';

import productFilesService from '../../api/productFilesService';
import PresentationStatus from '../CRUDPresentaciones/PresentationStatus';
import productPresentacionesService from '../../api/productPresentacionesService';
import PresentationPriceViewer from '../CRUDprecios/PresentationPriceViewer';

const ProductDetailPresentations = ({ product, presentaciones, onPresentacionesChange, loading, error }) => {
  const navigate = useNavigate();
  const [selectedPresenta, setSelectedPresenta] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  const delPopoverRef = useRef(null);
  const delBtnRef = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (presentaciones.length > 0 && !presentaciones.some(p => p.IdPresentaOK === selectedPresenta?.IdPresentaOK)) {
      setSelectedPresenta(presentaciones[0]);
    } else if (presentaciones.length === 0) {
      setSelectedPresenta(null);
    }
  }, [presentaciones, selectedPresenta]);

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

  const handlePresentaChange = (e) => {
    // UI5 Select: obtener value del option seleccionado
    const selectedVal = e.detail?.selectedOption?.value ?? e.target.value;
    const presenta = presentaciones.find((p) => p.IdPresentaOK === selectedVal);
    setSelectedPresenta(presenta || null);
  };

  const handleStatusChange = (updatedPresentation) => {
    const updatedPresentaciones = presentaciones.map(p =>
      p.IdPresentaOK === updatedPresentation.IdPresentaOK ? updatedPresentation : p
    );
    onPresentacionesChange(updatedPresentaciones);

    if (selectedPresenta?.IdPresentaOK === updatedPresentation.IdPresentaOK) {
      setSelectedPresenta(updatedPresentation);
    }
  };

  const handleDeleteSingle = async () => {
    if (!selectedPresenta?.IdPresentaOK) return;
    setDeleting(true);
    setDeleteError('');
    let ok = false;

    try {
      await productPresentacionesService.deletePresentacion(
        selectedPresenta.IdPresentaOK,
        'admin01'
      );
      ok = true;

      const updated = presentaciones.filter(
        p => p.IdPresentaOK !== selectedPresenta.IdPresentaOK
      );
      onPresentacionesChange(updated);
      setSelectedPresenta(updated[0] || null);
      setFiles([]);
    } catch (err) {
      const msg =
        err?.response?.data?.messageUSR ||
        err?.message ||
        'Error al eliminar la presentación.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
      if (ok) delPopoverRef.current?.close();
    }
  };

  const openDeletePopover = () => {
    if (!selectedPresenta || !delPopoverRef.current || !delBtnRef.current) return;
    setDeleteError('');

    const pop = delPopoverRef.current;
    const opener = delBtnRef.current;

    if (typeof pop.showAt === 'function') {
      pop.showAt(opener);
    } else {
      // Fallback para builds donde no exista showAt
      pop.opener = opener;
      pop.open = true;
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
        {imageFiles.length > 0 && (
          <Card style={{ boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <Label><Icon name="image" style={{ marginRight: '0.25rem' }} />Imágenes ({imageFiles.length})</Label>
              <Carousel style={{ width: '100%', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0', minHeight: '140px' }}>
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
                      style={{ width: '100%', height: '100%', maxWidth: '300px', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'block' }}
                    />
                  </FlexBox>
                ))}
              </Carousel>
            </FlexBox>
          </Card>
        )}

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
                  style={{ padding: '0.5rem', backgroundColor: '#fff3f3', borderRadius: '4px', border: '1px solid #ffcdd2', cursor: 'pointer', width: '80px', transition: 'box-shadow 0.2s', boxShadow: '0 2px 6px rgba(255,205,210,0.15)' }}
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

  return (
    <div style={{ padding: '1.5rem', height: 'auto' }}>
      <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
        <FlexBox direction="Column" style={{ gap: '1rem' }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween">
            <Title level="H4">Presentaciones</Title>
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              {selectedPresenta && (
                <PresentationStatus
                  presentation={selectedPresenta}
                  onStatusChange={handleStatusChange}
                />
              )}
              <Button
                design="Emphasized"
                icon="add"
                onClick={() => navigate(`/products/${product.SKUID}/presentations/add`)}
              >
                Insertar
              </Button>
              <Button
                design="Transparent"
                icon="edit"
                onClick={() =>
                  navigate(`/products/${product.SKUID}/presentations/edit/${selectedPresenta.IdPresentaOK}`)
                }
                disabled={!selectedPresenta}
              />
              <Button
                design="Negative"
                icon="delete"
                ref={delBtnRef}
                disabled={!selectedPresenta}
                onClick={openDeletePopover}
              />
            </FlexBox>
          </FlexBox>

          {loading && <Text>Cargando presentaciones...</Text>}
          {error && <Text style={{ color: '#d32f2f' }}>{error}</Text>}

          {!loading && !error && presentaciones.length > 0 && (
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

        {selectedPresenta ? (
          <FlexBox direction="Column" style={{ gap: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <Title level="H6">Archivos Asociados</Title>
              {loadingFiles && <Text>Cargando archivos...</Text>}
              {errorFiles && <Text style={{ color: '#d32f2f' }}>{errorFiles}</Text>}
              {!loadingFiles && files.length === 0 && (
                <Text style={{ color: '#666' }}>No hay archivos para esta presentación.</Text>
              )}
              {!loadingFiles && files.length > 0 && renderFilesByType()}
            </FlexBox>

            <PresentationPriceViewer
              skuid={selectedPresenta.SKUID}
              idPresentaOK={selectedPresenta.IdPresentaOK}
            />
          </FlexBox>
        ) : (
          !loading && (
            <IllustratedMessage
              name="NoData"
              titleText="Sin Presentaciones"
              subtitleText="Este producto no tiene presentaciones o no se ha seleccionado ninguna."
            />
          )
        )}
      </FlexBox>

      <ResponsivePopover
        ref={delPopoverRef}
        placementType="Bottom"
        footer={
          <Bar
            endContent={
              <>
                <Button
                  design="Transparent"
                  onClick={() => delPopoverRef.current?.close()}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  design="Negative"
                  icon="delete"
                  onClick={handleDeleteSingle}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </>
            }
          />
        }
      >
        <Bar startContent={<Title level="H6">Eliminar presentación</Title>} />
        <div style={{ padding: '1rem', maxWidth: 360 }}>
          <Text>
            ¿Seguro que deseas eliminar <b>{selectedPresenta?.Descripcion}</b>?
          </Text>
          {deleteError && (
            <MessageStrip design="Negative" style={{ marginTop: '1rem' }}>
              {deleteError}
            </MessageStrip>
          )}
        </div>
      </ResponsivePopover>
    </div>
  );
};

export default ProductDetailPresentations;
