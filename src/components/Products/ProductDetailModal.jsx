import React, { useEffect, useState } from 'react';
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
  Carousel
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import productFilesService from '../../api/productFilesService';

const ProductDetailModal = ({ product, open, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  useEffect(() => {
    if (open && product?.SKUID) {
      setLoadingFiles(true);
      setErrorFiles(null);
      productFilesService.getFilesBySKUID(product.SKUID, 'EECHAURIM')
        .then(setFiles)
        .catch(err => setErrorFiles('Error al cargar archivos'))
        .finally(() => setLoadingFiles(false));
    } else {
      setFiles([]);
    }
  }, [open, product]);

  if (!product) {
    return null;
  }

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

  const renderFilesByType = () => {
    const imageFiles = files.filter(f => f.FILETYPE === 'IMG');
    const pdfFiles = files.filter(f => f.FILETYPE === 'PDF');
    const docFiles = files.filter(f => f.FILETYPE === 'DOC');
    const videoFiles = files.filter(f => f.FILETYPE === 'VIDEO');
    const otherFiles = files.filter(f => f.FILETYPE === 'OTHER');

    return (
      <FlexBox direction="Column" style={{ gap: '1rem' }}>
        {/* Imágenes en Carrusel */}
        {imageFiles.length > 0 && (
          <div>
            <Label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              <Icon name="image" style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
              Imágenes ({imageFiles.length})
            </Label>
            <Carousel
              style={{ 
                width: '100%',
                backgroundColor: '#fafafa',
                borderRadius: '6px',
                border: '1px solid #e0e0e0'
              }}
            >
              {imageFiles.map((file, idx) => (
                <div 
                  key={file.FILEID || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '120px',
                    padding: '0.5rem'
                  }}
                >
                  <img 
                    src={file.FILE} 
                    alt={file.INFOAD || `Imagen ${idx + 1}`}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              ))}
            </Carousel>
          </div>
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
                    padding: '0.5rem',
                    backgroundColor: '#fff3f3',
                    borderRadius: '4px',
                    border: '1px solid #ffcdd2',
                    cursor: 'pointer',
                    width: '80px'
                  }}
                  onClick={() => window.open(file.FILE, '_blank')}
                >
                  <Icon name="pdf-attachment" style={{ fontSize: '2rem', color: '#d32f2f' }} />
                  <Text style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                    {file.INFOAD || `PDF ${idx + 1}`}
                  </Text>
                </FlexBox>
              ))}
            </FlexBox>
          </div>
        )}

        {/* Documentos */}
        {docFiles.length > 0 && (
          <div>
            <Label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              <Icon name="document" style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
              Documentos ({docFiles.length})
            </Label>
            <FlexBox style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
              {docFiles.map((file, idx) => (
                <FlexBox
                  key={file.FILEID || idx}
                  direction="Column"
                  alignItems="Center"
                  style={{ 
                    padding: '0.5rem',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    border: '1px solid #bbdefb',
                    cursor: 'pointer',
                    width: '80px'
                  }}
                  onClick={() => window.open(file.FILE, '_blank')}
                >
                  <Icon name="document" style={{ fontSize: '2rem', color: '#1976d2' }} />
                  <Text style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                    {file.INFOAD || `Doc ${idx + 1}`}
                  </Text>
                </FlexBox>
              ))}
            </FlexBox>
          </div>
        )}

        {/* Videos */}
        {videoFiles.length > 0 && (
          <div>
            <Label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              <Icon name="video" style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
              Videos ({videoFiles.length})
            </Label>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              {videoFiles.map((file, idx) => (
                <div key={file.FILEID || idx}>
                  <video 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxHeight: '180px', 
                      borderRadius: '4px',
                      backgroundColor: '#000'
                    }}
                    src={file.FILE}
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                  <Text style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    {file.INFOAD || `Video ${idx + 1}`}
                  </Text>
                </div>
              ))}
            </FlexBox>
          </div>
        )}

        {/* Otros Archivos */}
        {otherFiles.length > 0 && (
          <div>
            <Label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', display: 'block' }}>
              <Icon name="attachment" style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
              Otros ({otherFiles.length})
            </Label>
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              {otherFiles.map((file, idx) => (
                <FlexBox
                  key={file.FILEID || idx}
                  alignItems="Center"
                  justifyContent="SpaceBetween"
                  style={{ 
                    padding: '0.5rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(file.FILE, '_blank')}
                >
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Icon name="attachment" style={{ fontSize: '1.25rem', color: '#666' }} />
                    <FlexBox direction="Column">
                      <Text style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {file.INFOAD || 'Archivo sin nombre'}
                      </Text>
                      <Text style={{ fontSize: '0.7rem', color: '#666' }}>{file.FILEID}</Text>
                    </FlexBox>
                  </FlexBox>
                  <Button design="Transparent" icon="download" style={{ fontSize: '0.875rem' }}>
                    Descargar
                  </Button>
                </FlexBox>
              ))}
            </FlexBox>
          </div>
        )}
      </FlexBox>
    );
  };

  const status = getProductStatus(product);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={
        <Bar>
          <Title level="H4">Detalle del Producto</Title>
        </Bar>
      }
      footer={
        <Bar endContent={<Button onClick={onClose}>Cerrar</Button>} />
      }
      style={{ width: '800px', maxWidth: '95vw' }}
    >
      <FlexBox direction="Column" style={{ padding: '1rem', gap: '1rem' }}>
        {/* SECCIÓN 1: Información Principal */}
        <Card>
          <div style={{ padding: '1rem' }}>
            <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: '0.5rem' }}>
              <Title level="H5">{product.DESSKU || 'Sin descripción'}</Title>
              <ObjectStatus state={status.state}>{status.text}</ObjectStatus>
            </FlexBox>
            <Text style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>{product.SKUID}</Text>
            {product.INFOAD && (
              <Text style={{ fontSize: '0.875rem', color: '#888', fontStyle: 'italic' }}>{product.INFOAD}</Text>
            )}
          </div>
        </Card>

        {/* SECCIÓN 2: Detalles del Producto */}
        <Card>
          <div style={{ padding: '1rem' }}>
            <Title level="H6" style={{ marginBottom: '0.75rem' }}>Información del Producto</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Código de Barras</Label>
                <Text style={{ fontSize: '0.875rem' }}>{product.BARCODE || 'N/A'}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Unidad de Medida</Label>
                <Text style={{ fontSize: '0.875rem' }}>{product.IDUNIDADMEDIDA || 'N/A'}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Categorías</Label>
                <Text style={{ fontSize: '0.875rem' }}>
                  {Array.isArray(product.CATEGORIAS)
                    ? product.CATEGORIAS.join(', ')
                    : (product.CATEGORIAS || 'N/A')}
                </Text>
              </FlexBox>
            </div>
          </div>
        </Card>

        {/* SECCIÓN 3: Archivos del Producto */}
        <Card>
          <div style={{ padding: '1rem' }}>
            <Title level="H6" style={{ marginBottom: '0.75rem' }}>Archivos del Producto</Title>
            {loadingFiles && <Text style={{ fontSize: '0.875rem' }}>Cargando archivos...</Text>}
            {errorFiles && <Text style={{ fontSize: '0.875rem', color: '#d32f2f' }}>{errorFiles}</Text>}
            {!loadingFiles && !errorFiles && files.length === 0 && (
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>No hay archivos asociados</Text>
            )}
            {!loadingFiles && !errorFiles && files.length > 0 && renderFilesByType()}
          </div>
        </Card>

        {/* SECCIÓN 4: Información de Auditoría */}
        <Card>
          <div style={{ padding: '1rem' }}>
            <Title level="H6" style={{ marginBottom: '0.75rem' }}>Auditoría</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Creado por</Label>
                <Text style={{ fontSize: '0.875rem' }}>{product.REGUSER || 'N/A'}</Text>
                <Text style={{ fontSize: '0.75rem', color: '#888' }}>{formatDate(product.REGDATE)}</Text>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Modificado por</Label>
                <Text style={{ fontSize: '0.875rem' }}>{product.MODUSER || 'N/A'}</Text>
                <Text style={{ fontSize: '0.75rem', color: '#888' }}>{formatDate(product.MODDATE)}</Text>
              </FlexBox>
            </div>
          </div>
        </Card>

        {/* SECCIÓN 5: Historial de Cambios */}
        {product.HISTORY && product.HISTORY.length > 0 && (
          <Card>
            <div style={{ padding: '1rem' }}>
              <Title level="H6" style={{ marginBottom: '0.75rem' }}>Historial</Title>
              <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                {product.HISTORY.slice().reverse().map((item, index) => (
                  <FlexBox 
                    key={index}
                    alignItems="Center" 
                    justifyContent="SpaceBetween"
                    style={{ 
                      padding: '0.5rem', 
                      backgroundColor: '#f9f9f9', 
                      borderRadius: '4px' 
                    }}
                  >
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Icon 
                        name={item.action === 'CREATE' ? 'add' : 'edit'} 
                        style={{ fontSize: '1rem' }}
                      />
                      <FlexBox direction="Column" style={{ gap: '0.1rem' }}>
                        <Text style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{item.action}</Text>
                        <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                          {item.user || 'N/A'} - {formatDate(item.date)}
                        </Text>
                      </FlexBox>
                    </FlexBox>
                    <ObjectStatus 
                      state={item.action === 'CREATE' ? ValueState.Success : ValueState.Information}
                    >
                      {item.action}
                    </ObjectStatus>
                  </FlexBox>
                ))}
              </FlexBox>
            </div>
          </Card>
        )}
      </FlexBox>
    </Dialog>
  );
};

export default ProductDetailModal;