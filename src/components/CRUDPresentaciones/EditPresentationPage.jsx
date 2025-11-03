import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  FlexBox,
  List,
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
  Text
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import productPresentacionesService from '../../api/productPresentacionesService';

const EditPresentationForm = ({ presentaId, onCancel }) => {
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
    const fetchPresentationData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // NOTA: Asegúrate que en 'productPresentacionesService.js', la función 'getPresentacionById'
        // use el método GET y pase correctamente el LoggedUser.
        const presentationToEdit = await productPresentacionesService.getPresentacionById(presentaId);

        if (presentationToEdit) {
          setNombrePresentacion(presentationToEdit.NombrePresentacion || '');
          setDescripcion(presentationToEdit.Descripcion);
          setActivo(presentationToEdit.ACTIVED);

          // Cargar propiedades extras (parseando el JSON)
          if (presentationToEdit.PropiedadesExtras) {
            try {
              const props = JSON.parse(presentationToEdit.PropiedadesExtras);
              setPropiedadesExtras(props);
            } catch {
              setPropiedadesExtras({}); // Si el JSON es inválido
            }
          }

          // Cargar archivos asociados
          const presentationFiles = await productPresentacionesService.getFilesByPresentacionId(presentaId);
          setFiles(presentationFiles || []);

        } else {
          setError('No se encontró la presentación para editar.');
        }
      } catch (err) {
        setError('Error al cargar los datos de la presentación.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentationData();
  }, [presentaId]);

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
      const updatedData = {
        NOMBREPRESENTACION: nombrePresentacion,
        Descripcion: descripcion,
        ACTIVED: activo,
        PropiedadesExtras: JSON.stringify(propiedadesExtras),
        files: files,
        MODUSER: 'EECHAURIM' // Usuario que modifica
      };

      await productPresentacionesService.updatePresentacion(presentaId, updatedData);
      
      onCancel(); // Llama a la función para volver a la lista

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
    <>
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

          {error && <MessageStrip design="Negative" style={{ marginTop: '1rem' }}>{error}</MessageStrip>}

          <FlexBox justifyContent="End" style={{ gap: '0.5rem', marginTop: '1rem' }}>
            <Button design="Transparent" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button design="Emphasized" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </FlexBox>
        </div>
      </Card>
    </>
  );
};

// --- Componente de Tarjeta Individual para el Grid ---
const PresentationCard = ({ presentation, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Imprime en la consola los datos de esta presentación para depuración.
  // Revisa la consola del navegador (F12) para ver esta información.
  console.log('Renderizando tarjeta para:', presentation.idpresentaok, 'con datos:', presentation);

  const imageToShow = presentation.files?.find(f => f.PRINCIPAL === true) || presentation.files?.find(f => f.fileBase64 || f.FILE);

  const cardStyle = {
    width: '240px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
    boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
  };

  return (
    <Card
      key={presentation.idpresentaok}
      onClick={() => onSelect(presentation.idpresentaok)}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {imageToShow ? (
        <img src={imageToShow.fileBase64 || imageToShow.FILE} alt={presentation.NOMBREPRESENTACION} style={{ width: '100%', height: '200px', objectFit: 'cover', borderBottom: '1px solid #eee' }} />
      ) : (
        <FlexBox justifyContent="Center" alignItems="Center" style={{ width: '100%', height: '200px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee', flexDirection: 'column', gap: '8px' }}>
          <Icon name="product" style={{ fontSize: '3rem', color: '#999' }} />
          <Text style={{color: '#999'}}>Sin Imagen</Text>
        </FlexBox>
      )}
      <div style={{ padding: '1rem' }}>
        <Title level="H5" wrappingType="Normal" style={{ marginBottom: '0.5rem', minHeight: '44px', lineHeight: '1.3' }}>{presentation.NOMBREPRESENTACION}</Title>
        <Text style={{ fontSize: '14px', color: '#555', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '38px' }}>
          {presentation.Descripcion || ''}
        </Text>
      </div>
    </Card>
  );
};

// --- Componente de la Lista de Selección (¡NUEVO DISEÑO!) ---
const SelectPresentationList = ({ skuid, onSelect }) => {
  const [presentations, setPresentations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPresentations = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Paso 1: Obtener la lista de presentaciones básicas.
        const data = await productPresentacionesService.getPresentacionesByProductId(skuid);

        // Paso 2: Para cada presentación, obtener sus archivos por separado y fusionar los datos.
        // Esta es la lógica que usa el formulario de edición y que sabemos que funciona.
        const presentationsWithFiles = await Promise.all(
          data.map(async (pres) => {
            // Usamos la función que ya existe y funciona en el formulario de edición.
            const presentationFiles = await productPresentacionesService.getFilesByPresentacionId(pres.idpresentaok);
            return {
              ...pres, // Copia los datos originales de la presentación
              files: presentationFiles || [] // Añade los archivos que acabamos de obtener
            };
          })
        );
        setPresentations(presentationsWithFiles);

      } catch (err) {
        console.error("Error detallado en fetchPresentations:", err);
        setError('Error al cargar la lista de presentaciones y sus archivos.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresentations();
  }, [skuid]);

  if (isLoading) {
    return <BusyIndicator active />;
  }

  return (
    <Card
      header={<CardHeader titleText="Seleccionar Presentación para Editar" subtitleText={`Para producto SKU: ${skuid}`} />}
      style={{ width: '100%', maxWidth: '1200px', background: '#f9f9f9' }}
    >
      {error && <MessageStrip design="Negative" style={{ margin: '1rem' }}>{error}</MessageStrip>}
      
      <div style={{ padding: '1.5rem' }}>
        {presentations.length > 0 ? (
          <FlexBox justifyContent="Center" wrap="Wrap" style={{ gap: '1.5rem' }}>
            {presentations.map((pres) => (
              <PresentationCard key={pres.idpresentaok} presentation={pres} onSelect={onSelect} />
            ))}
          </FlexBox>
        ) : (
          <FlexBox direction="Column" justifyContent="Center" alignItems="Center" style={{ minHeight: '200px', gap: '1rem' }}>
            <Icon name="search" style={{ fontSize: '3rem', color: '#888' }} />
            <Title level="H4">No se encontraron presentaciones</Title>
            <Text>Este producto no tiene ninguna presentación asociada todavía.</Text>
          </FlexBox>
        )}
      </div>
    </Card>
  );
};


// --- Componente Principal que decide qué mostrar ---
const EditPresentationPage = () => {
  const { skuid, presentaId } = useParams();
  const navigate = useNavigate();

  // Decide si estamos en modo selección o edición basado en la URL
  const isSelectionMode = presentaId === 'select-edit';

  const handleSelectPresentation = (selectedId) => {
    // Navega a la URL de edición para esa presentación
    navigate(`/products/${skuid}/presentations/${selectedId}`);
  };

  const handleCancelEdit = () => {
    // Vuelve a la página anterior en el historial del navegador
    navigate(-1);
  };

  return (
    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
      {isSelectionMode ? (
        <SelectPresentationList skuid={skuid} onSelect={handleSelectPresentation} />
      ) : (
        <EditPresentationForm presentaId={presentaId} onCancel={handleCancelEdit} />
      )}
    </FlexBox>
  );
};

export default EditPresentationPage;