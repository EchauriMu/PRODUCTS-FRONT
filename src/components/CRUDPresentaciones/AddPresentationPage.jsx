// src/components/CRUDPresentaciones/AddPresentationPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Card,
  CardHeader,
  FlexBox,
  Button,
  Input,
  Label,
  Text,
  TextArea,
  MessageStrip,
  Switch,
  Title,
  FileUploader,
  Icon
} from '@ui5/webcomponents-react';
import productPresentacionesService from '../../api/productPresentacionesService';

export default function AddPresentationPage() {
  const navigate = useNavigate();
  const { skuid } = useParams();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const productName = qs.get('productName') || skuid;
  
  const [idPresentaOK, setIdPresentaOK] = useState('');
  const [nombrePresentacion, setNombrePresentacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  // Nuevos estados para propiedades y archivos, como en ComponenteDos
  const [propiedadesExtras, setPropiedadesExtras] = useState({});
  const [files, setFiles] = useState([]);
  const [propKey, setPropKey] = useState('');
  const [propValue, setPropValue] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  
  useEffect(() => {
    // Lógica inspirada en ComponenteDos.jsx para autogenerar el IdPresentaOK
    if (nombrePresentacion && skuid) {
      // Crea un "slug" a partir del nombre de la presentación
      const presentationSlug = nombrePresentacion
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-') // Reemplaza espacios con guiones
        .replace(/[^A-Z0-9-]/g, ''); // Elimina caracteres no alfanuméricos excepto guiones

      const generatedId = `${skuid}-${presentationSlug}`;
      setIdPresentaOK(generatedId);
    } else {
      // Si no hay nombre, se limpia el ID
      setIdPresentaOK('');
    }
  }, [nombrePresentacion, skuid]);

  // Funciones para manejar propiedades y archivos
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
        // El API espera el string completo con el prefijo data:
        const base64String = reader.result;
        const newFile = {
          fileBase64: base64String,
          FILETYPE: file.type.startsWith('image/') ? 'IMG' : file.type === 'application/pdf' ? 'PDF' : 'OTHER',
          originalname: file.name,
          mimetype: file.type,
          PRINCIPAL: files.length === 0, // El primero es el principal
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

  async function handleSubmit() {
    setErrorMsg('');
    setOkMsg('');

    if (!idPresentaOK?.trim() || !skuid?.trim() || !nombrePresentacion?.trim()) {
      setErrorMsg('Completa los campos obligatorios: Id, SKU y Nombre.');
      return;
    }

    const descripcionSafe = (descripcion || nombrePresentacion).trim();
    if (!descripcionSafe) {
      setErrorMsg('La descripción no puede ir vacía.');
      return;
    }

    // Payload completo como en el ejemplo
    const payload = {
      IdPresentaOK: idPresentaOK.trim(),
      SKUID: skuid.trim(),
      NOMBREPRESENTACION: nombrePresentacion.trim(),
      Descripcion: descripcionSafe,
      ACTIVED: !!activo,
      PropiedadesExtras: JSON.stringify(propiedadesExtras), // Convertido a string JSON
      files: files
    };

    try {
      setIsSubmitting(true);
      await productPresentacionesService.addPresentacion(payload, 'EECHAURIM');
      setOkMsg('Presentación creada correctamente.');
      setTimeout(() => navigate(-1), 400);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.messageDEV ||
        err?.response?.data?.messageUSR ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Request failed';
      console.error('AddPresentacion error:', err?.response?.data || err);
      setErrorMsg(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FlexBox justifyContent="Center" alignItems="Start" style={{ padding: '1.5rem' }}>
      <Card style={{ maxWidth: 720, width: '100%' }}>
        <CardHeader titleText="Añadir Nueva Presentación" />
        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
          {errorMsg && (
            <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>
              {errorMsg}
            </MessageStrip>
          )}
          {okMsg && (
            <MessageStrip design="Positive" style={{ marginBottom: '1rem' }}>
              {okMsg}
            </MessageStrip>
          )}

          <FlexBox direction="Column" style={{ gap: '1rem' }}>
            <div>
              <Label>Producto (SKU)</Label>
              <Input
                value={`${decodeURIComponent(productName || '')} — ${skuid}`}
                disabled
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <Label>ID Presentación (auto-generado)</Label>
              <Input
                value={idPresentaOK}
                disabled
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <Label required>Nombre de la Presentación</Label>
              <Input
                value={nombrePresentacion}
                onInput={(e) => setNombrePresentacion(e.target.value)}
                required
                style={{ width: '100%', marginTop: '0.25rem' }}
                placeholder="Ej. Versión 256GB Negro Fantasma"
              />
            </div>

            <div>
              <Label required>Descripción</Label>
              <TextArea
                value={descripcion}
                onInput={(e) => setDescripcion(e.target.value)}
                required
                style={{ width: '100%', marginTop: '0.25rem', minHeight: '60px' }}
                placeholder="Breve descripción de la presentación"
              />
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
              <Button icon="upload">Subir Archivos</Button>
            </FileUploader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {files.map((file, index) => (
                <FlexBox key={index} alignItems="Center" justifyContent="SpaceBetween" style={{ background: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                  <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                    {file.FILETYPE === 'IMG' ? (
                      <img src={file.fileBase64} alt={file.originalname} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <Icon name="attachment" style={{ fontSize: '1.5rem' }} />
                    )}
                    <Text style={{ fontSize: '14px' }}>{file.originalname}</Text>
                    {file.PRINCIPAL && <Label style={{ color: 'green' }}>(Principal)</Label>}
                  </FlexBox>
                  <Button icon="delete" design="Transparent" onClick={() => removeFile(index)} />
                </FlexBox>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              <Label>Activo</Label>
            </div>

            <FlexBox justifyContent="End" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button design="Transparent" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button design="Emphasized" icon="add" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Aceptando...' : 'Aceptar'}
              </Button>
            </FlexBox>
          </FlexBox>
        </div>
      </Card>
    </FlexBox>
  );
}
