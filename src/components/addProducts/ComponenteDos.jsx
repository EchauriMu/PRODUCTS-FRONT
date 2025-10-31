import React, { useState } from 'react';
import {
  Card, 
  CardHeader,
  Title,
  Text,
  Label,
  FlexBox,
  Input,
  Button,
  TextArea,
  FileUploader,
  Icon,
  MessageStrip, 
  ObjectStatus,
  Tag // Mantienes Tag (anteriormente Badge)
  // ❌ Eliminado: List,
  // ❌ Eliminado: StandardListItem
} from "@ui5/webcomponents-react";
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
// La importación de ValueState desde la base es correcta
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState'; 


const initialPresentationState = {
  IdPresentaOK: '',
  Descripcion: '',
  CostoIni: 0,
  PropiedadesExtras: {},
  files: [],
};

const ComponenteDos = ({ presentations, setPresentations, productSKU }) => {
  const [newPresentation, setNewPresentation] = useState(initialPresentationState);
  const [propKey, setPropKey] = useState('');
  const [propValue, setPropValue] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPresentation(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProperty = () => {
    if (propKey) {
      setNewPresentation(prev => ({
        ...prev,
        PropiedadesExtras: { ...prev.PropiedadesExtras, [propKey]: propValue }
      }));
      setPropKey('');
      setPropValue('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        const newFile = {
          fileBase64: base64String,
          FILETYPE: file.type.startsWith('image/') ? 'IMG' : file.type === 'application/pdf' ? 'PDF' : 'OTHER',
          originalname: file.name,
          mimetype: file.type,
          PRINCIPAL: newPresentation.files.length === 0, // El primero es el principal
          INFOAD: `Archivo ${file.name}`
        };
        setNewPresentation(prev => ({ ...prev, files: [...prev.files, newFile] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPresentation = () => {
    // Generar un IdPresentaOK si está vacío
    const presentationToAdd = { ...newPresentation };
    if (!presentationToAdd.IdPresentaOK) {
      presentationToAdd.IdPresentaOK = `${productSKU}-${Date.now()}`;
    }
    setPresentations(prev => [...prev, presentationToAdd]);
    setNewPresentation(initialPresentationState); // Reset form
    setToast({ show: true, message: '✅ Variante guardada' });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

  const removePresentation = (index) => {
    setPresentations(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (fileIndex) => {
    setNewPresentation(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== fileIndex)
    }));
  };

  return (
    <FlexBox style={{ width: '100%', gap: '1.5rem' }}>
      {/* Columna del Formulario */}
      <Card style={{ flex: 1, marginTop: '20px' }} header={<CardHeader titleText="Añadir Nueva Presentación" />}>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FlexBox direction="Column"><Label>ID Presentación (Opcional)</Label><Input name="IdPresentaOK" value={newPresentation.IdPresentaOK} onInput={handleInputChange} placeholder="Se autogenera si se deja vacío" /></FlexBox>
          <FlexBox direction="Column">
            <Label required>Descripción</Label>
            <TextArea
              name="Descripcion"
              value={newPresentation.Descripcion}
              onInput={handleInputChange}
              style={{ minHeight: '60px' }}
              // Usar un ValueState explícito para validación
              valueState={!newPresentation.Descripcion ? ValueState.Error : ValueState.None}
              valueStateMessage={<span>La descripción es obligatoria.</span>}
            />
          </FlexBox>
          <FlexBox style={{ gap: '1rem' }}>
            <FlexBox direction="Column" style={{ flex: 1 }}><Label required>Costo Inicial</Label><Input name="CostoIni" type="Number" value={newPresentation.CostoIni} onInput={handleInputChange} /></FlexBox>
          </FlexBox>

          <Title level="H5" style={{ marginTop: '1rem' }}>Propiedades Extras</Title>
          <FlexBox style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
            <FlexBox direction="Column" style={{ flex: 2 }}><Label>Propiedad</Label><Input value={propKey} onInput={(e) => setPropKey(e.target.value)} placeholder="Ej: Color" /></FlexBox>
            <FlexBox direction="Column" style={{ flex: 3 }}><Label>Valor</Label><Input value={propValue} onInput={(e) => setPropValue(e.target.value)} placeholder="Ej: Rojo" /></FlexBox>
            <Button icon="add" onClick={handleAddProperty} disabled={!propKey}>Añadir</Button>
          </FlexBox>
          <FlexBox wrap="Wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
            {Object.entries(newPresentation.PropiedadesExtras).map(([key, value]) => (
              <ObjectStatus key={key} state={ValueState.Indication01}>
                {key}: {value}
              </ObjectStatus>
            ))}
          </FlexBox>

          <Title level="H5" style={{ marginTop: '1rem' }}>Archivos</Title>
          <FileUploader multiple onChange={handleFileChange}><Button>Subir Archivos</Button></FileUploader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {newPresentation.files.map((file, index) => (
              <FlexBox key={index} alignItems="Center" justifyContent="SpaceBetween" style={{ background: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  <Icon name="attachment" />
                  <Text style={{ fontSize: '14px' }}>{file.originalname}</Text>
                </FlexBox>
                <Button icon="delete" design="Transparent" onClick={() => removeFile(index)} />
              </FlexBox>
            ))}
          </div>

          <Button design="Emphasized" onClick={handleAddPresentation} style={{ marginTop: '1rem' }} disabled={!newPresentation.Descripcion}>Añadir Presentación a la Lista</Button>
        </div>
      </Card>

      {/* Columna de la Lista */}
      <div style={{ flex: 1, marginTop: '20px', position: 'relative' }}>
        {toast.show && <MessageStrip design="Positive" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>{toast.message}</MessageStrip>}
        <Card
          header={<CardHeader titleText="Lista de Presentaciones" subtitleText={`${presentations.length} añadidas`} />}
          style={{ height: '100%', overflowY: 'auto' }}
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {presentations.length === 0 ? (
            <Text>Aún no has añadido ninguna presentación.</Text>
          ) : (
            <>
              {presentations.map((p, index) => (
                <Card key={p.IdPresentaOK || index}>
                  <CardHeader
                    titleText={p.Descripcion}
                    subtitleText={`ID: ${p.IdPresentaOK}`}
                    action={<Button icon="delete" design="Transparent" onClick={() => removePresentation(index)} />}
                  />
                  <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                    <ObjectStatus state={ValueState.Success}>Costo: ${parseFloat(p.CostoIni).toFixed(2)}</ObjectStatus>
                    <ObjectStatus state={ValueState.Indication01}>{p.files.length} archivos</ObjectStatus>
                  </div>
                </Card>
              ))}
            </>
          )}
          </div>
        </Card>
      </div>
    </FlexBox>
  );
};

export default ComponenteDos;