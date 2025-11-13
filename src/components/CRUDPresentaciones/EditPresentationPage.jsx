import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  FlexBox,
  Button,
  Input,
  Label,
  MessageStrip,
  BusyIndicator,
  Switch,
  Title,
  TextArea,
  FileUploader,
  Icon,
  Text,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import productPresentacionesService from '../../api/productPresentacionesService';

const EditPresentationPage = () => {
  const { skuid, presentaId } = useParams();
  const navigate = useNavigate();

  const [nombrePresentacion, setNombrePresentacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  
  // Estados para propiedades y archivos
  const [propiedadesExtras, setPropiedadesExtras] = useState({});
  const [files, setFiles] = useState([]);
  const [propKey, setPropKey] = useState('');
  const [propValue, setPropValue] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFullPresentationData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // SOLUCIÓN: La función del servicio necesita el usuario para evitar un error 400.
        // Se pasa explícitamente el usuario, igual que en otras partes de la aplicación.
        const presentationToEdit = await productPresentacionesService.getPresentacionById(presentaId, 'EECHAURIM');

        if (presentationToEdit) {
          setNombrePresentacion(presentationToEdit.NombrePresentacion || '');
          setDescripcion(presentationToEdit.Descripcion || '');
          setActivo(presentationToEdit.ACTIVED);

          // Cargar propiedades extras, asegurando que sea un string antes de parsear
          if (typeof presentationToEdit.PropiedadesExtras === 'string') {
            try {
              const props = JSON.parse(presentationToEdit.PropiedadesExtras);
              setPropiedadesExtras(props);
            } catch {
              setPropiedadesExtras({}); // Si el JSON es inválido
            }
          }

          // Los archivos ya deberían venir en la respuesta de getPresentacionById
          setFiles(presentationToEdit.Files || []);
        } else {
          setError('No se encontró la presentación para editar.');
        }
      } catch (err) {
        console.error("Error detallado en fetchFullPresentationData:", err);
        setError('Error al cargar los datos de la presentación.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullPresentationData();
  }, [presentaId, skuid]);

  // Funciones para manejar propiedades y archivos (copiadas de AddPresentationPage)
  const handleAddProperty = () => {
    if (propKey) {
      setPropiedadesExtras(prev => ({ ...prev, [propKey]: propValue }));
      setPropKey('');
      setPropValue('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const newFile = {
          fileBase64: base64String,
          FILETYPE: file.type.startsWith('image/') ? 'IMG' : file.type === 'application/pdf' ? 'PDF' : 'OTHER',
          originalname: file.name,
          mimetype: file.type,
          PRINCIPAL: files.length === 0,
          INFOAD: `Archivo ${file.name}`
        };
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProperty = (keyToRemove) => {
    setPropiedadesExtras(prev => {
      const newProps = { ...prev };
      delete newProps[keyToRemove];
      return newProps;
    });
  };

  const removeFile = (fileIndex) => {
    setFiles(prev => prev.filter((_, i) => i !== fileIndex));
  };

  const handleSubmit = async () => {
    if (!nombrePresentacion) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      // Procesar archivos para el payload:
      // - Los archivos nuevos tienen 'fileBase64'.
      // - Los archivos existentes (que vienen del backend) no lo tienen.
      // El backend espera que los archivos existentes no se envíen con la propiedad 'fileBase64'.
      const processedFiles = files.map(f => {
        // Si es un archivo existente (tiene FILEID) y no es un archivo nuevo (no tiene fileBase64),
        // lo enviamos tal cual. Si es un archivo nuevo, también.
        // Si es un archivo existente que por alguna razón tiene fileBase64 (no debería), lo limpiamos.
        if (f.FILEID && f.fileBase64) {
          const { fileBase64, ...rest } = f; // Quitamos fileBase64 para no reenviarlo
          return rest;
        }
        return f;
      });

      const updatedData = {
        NOMBREPRESENTACION: nombrePresentacion,
        Descripcion: descripcion,
        ACTIVED: activo,
        PropiedadesExtras: JSON.stringify(propiedadesExtras),
        files: processedFiles,
        MODUSER: 'EECHAURIM' // Usuario que modifica
      };

      await productPresentacionesService.updatePresentacion(presentaId, updatedData);
      
      navigate(`/products/${skuid}/presentations/select-edit`); // Volver a la lista de selección

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar la presentación';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <BusyIndicator active />;
  }
  return (
    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
      <Card
        header={
          <CardHeader
            titleText="Editar Presentación"
            subtitleText={`ID: ${presentaId}`}
          />
        }
        style={{ width: '100%', maxWidth: '600px' }}
      >
        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
          {isLoading ? <BusyIndicator active /> : (
            <FlexBox direction="Column" style={{ gap: '1rem' }}>
              <div>
                  <Label>ID Presentación</Label>
                <Input value={presentaId} disabled style={{ width: '100%', marginTop: '0.25rem' }} />
              </div>
            <div>
              <Label required>Nombre de la Presentación</Label>
              <Input value={nombrePresentacion} onInput={(e) => setNombrePresentacion(e.target.value)} required style={{ width: '100%', marginTop: '0.25rem' }} placeholder="Ej. Versión 256GB Negro Fantasma" />
            </div>
            <div>
              <Label>Descripción</Label>
              <TextArea value={descripcion} onInput={(e) => setDescripcion(e.target.value)} style={{ width: '100%', marginTop: '0.25rem', minHeight: '60px' }} placeholder="Breve descripción de la presentación" />
            </div>

            {/* Sección de Propiedades Extras */}
            <Title level="H5" style={{ marginTop: '1rem' }}>Propiedades Extras</Title>
            <FlexBox style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
              <FlexBox direction="Column" style={{ flex: 2 }}><Label>Propiedad</Label><Input value={propKey} onInput={(e) => setPropKey(e.target.value)} placeholder="Ej: Color" /></FlexBox>
              <FlexBox direction="Column" style={{ flex: 3 }}><Label>Valor</Label><Input value={propValue} onInput={(e) => setPropValue(e.target.value)} placeholder="Ej: Negro Fantasma" /></FlexBox>
              <Button icon="add" onClick={handleAddProperty} disabled={!propKey}>Añadir</Button>
            </FlexBox>
            <FlexBox wrap="Wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
              {Object.entries(propiedadesExtras).map(([key, value]) => (
                <FlexBox key={key} alignItems="Center" style={{ background: '#f0f0f0', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                  <Text style={{ fontSize: '14px' }}><b>{key}:</b> {value}</Text>
                  <Button icon="delete" design="Transparent" onClick={() => removeProperty(key)} />
                </FlexBox>
              ))}
            </FlexBox>

            {/* Sección de Archivos */}
            <Title level="H5" style={{ marginTop: '1rem' }}>Archivos</Title>
            <FileUploader multiple onChange={handleFileChange}>
              <Button icon="upload">Subir Nuevos Archivos</Button>
            </FileUploader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {files.map((file, index) => (
                <FlexBox key={file.FILEID || index} alignItems="Center" justifyContent="SpaceBetween" style={{ background: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                  <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                    {file.FILETYPE === 'IMG' ? (
                      <img src={file.fileBase64 || file.FILE} alt={file.originalname} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <Icon name="attachment" style={{ fontSize: '1.5rem' }} />
                    )}
                    <Text style={{ fontSize: '14px' }}>{file.originalname || file.INFOAD}</Text>
                    {file.PRINCIPAL && <Label style={{ color: 'green' }}>(Principal)</Label>}
                  </FlexBox>
                  <Button icon="delete" design="Transparent" onClick={() => removeFile(index)} />
                </FlexBox>
              ))}
            </div>

            <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
              <Label>Activo</Label>
              <Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            </FlexBox>
            </FlexBox>
          )}

          {error && <MessageStrip design="Negative" style={{ marginTop: '1rem' }}>{error}</MessageStrip>}

          <FlexBox justifyContent="End" style={{ gap: '0.5rem', marginTop: '1rem' }}>
            <Button design="Transparent"   
            onClick={() => navigate(`/products/${skuid}/presentations/select-edit`, { replace: true })}
                 disabled={isSubmitting}>Cancelar</Button>
            <Button design="Emphasized" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </FlexBox>
        </div>
      </Card>
    </FlexBox>
  );
};

export default EditPresentationPage;