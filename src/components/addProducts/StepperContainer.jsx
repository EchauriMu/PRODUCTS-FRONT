import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Button,
  FlexBox,
  Title,
  Text,
  ProgressIndicator,
  Bar,
  Label,
  MessageStrip,
  BusyIndicator
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import ComponenteUno from './ComponenteUno';
import ComponenteDos from './ComponenteDos';
import ComponenteTres from './ComponenteTres';
import addProductApi from '../../api/addProductApi'; // ✅ Usando el nuevo servicio con Axios
import { useNavigate } from 'react-router-dom';

const StepperContainer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    SKUID: '',
    PRODUCTNAME: '',
    DESSKU: '',
    MARCA: '',
    IDUNIDADMEDIDA: 'PZA',
    CATEGORIAS: [],
    BARCODE: '',
    INFOAD: ''
  });
  const [presentations, setPresentations] = useState([]);
  const [apiStatus, setApiStatus] = useState({ loading: false, error: null, success: null });

  const stepTitles = [
    "Información General",
    "Añadir Presentaciones",
    "Resumen y Confirmación"
  ];

  const totalSteps = 3;

  const isStepValid = () => {
    if (currentStep === 0) {
      // Validación para el Paso 1
      return productData.PRODUCTNAME.trim() !== '' && productData.DESSKU.trim() !== '' && productData.MARCA.trim() !== '';
    }
    if (currentStep === 1) {
      // Validación para el Paso 2
      return presentations.length > 0;
    }
    return true; // El paso 3 siempre es válido para finalizar
  };

  const handleNext = () => {
    if (!isStepValid()) {
      // Opcional: mostrar un mensaje de error general si se intenta avanzar sin validar
      setApiStatus({ loading: false, error: 'Por favor, complete todos los campos obligatorios para continuar.', success: null });
      return;
    }
    setApiStatus({ loading: false, error: null, success: null }); // Limpiar errores al avanzar
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalize = async () => {
    setApiStatus({ loading: true, error: null, success: null });

    try {
      // Desestructuramos productData para excluir SKUID del payload final.
      const { SKUID, ...productPayload } = productData;

      // ✅ Prepara el payload asegurando que PropiedadesExtras sea un string JSON
      const payload = {
        product: productPayload,
        presentations: presentations.map(p => {
          // Construimos el objeto de presentación explícitamente para que coincida con el body requerido.
          return {
            IdPresentaOK: p.IdPresentaOK,
            Descripcion: p.Descripcion,
            CostoIni: parseFloat(p.CostoIni) || 0,
            PropiedadesExtras: JSON.stringify(p.PropiedadesExtras || {}),
            files: p.files || []
          };
        })
      };

      await addProductApi.createCompleteProduct(payload, 'EECHAURIM');
      setApiStatus({ loading: false, error: null, success: '¡Producto y presentaciones creados con éxito!' });
      setTimeout(() => {
        navigate('/'); // Redirige a la tabla de productos
      }, 2000);
    } catch (error) {
      const errorMessage = error.message || 'Error desconocido al crear el producto.';
      setApiStatus({ loading: false, error: `Error: ${errorMessage}`, success: null });
      console.error("Error al finalizar:", error);
    }
  };

  // Pasamos los datos y setters a los componentes hijos
  const stepComponents = [
    <ComponenteUno
      key="step-1"
      productData={productData}
      setProductData={setProductData}
    />,
    <ComponenteDos
      key="step-2"
      presentations={presentations}
      setPresentations={setPresentations}
      productSKU={productData.SKUID}
    />,
    <ComponenteTres
      key="step-3"
      productData={productData}
      presentations={presentations}
      onSubmit={handleFinalize}
      isSubmitting={apiStatus.loading}
    />
  ];

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Loader de pantalla completa */}
      {apiStatus.loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <BusyIndicator active size="Large" />
        </div>
      )}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ padding: '1rem 1.5rem' }}>
          {apiStatus.error && <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>{apiStatus.error}</MessageStrip>}
          {apiStatus.success && <MessageStrip design="Positive" style={{ marginBottom: '1rem' }}>{apiStatus.success}</MessageStrip>}

          <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: '1rem' }}>
            <Title level="H3">Añadir Producto</Title>
            <Text style={{ fontSize: '14px', color: '#32363a' }}>
              Paso {currentStep + 1}: <span style={{ fontWeight: 'bold' }}>{stepTitles[currentStep]}</span>
            </Text>
          </FlexBox>
          <ProgressIndicator value={progress} displayValue={`Paso ${currentStep + 1} de ${totalSteps}`} style={{ width: '100%' }} />
        </div>
      </Card>
      <div style={{ minHeight: '400px' }}>
        {stepComponents[currentStep]}
      </div>
      <Bar
        design="Footer"
        style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden' }}
        startContent={
          <Button design="Transparent" onClick={handlePrevious} disabled={currentStep === 0}>
            ← Anterior
          </Button>
        }
        endContent={
          <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
            <Button design="Transparent" onClick={() => alert('Funcionalidad para guardar borrador no implementada.')}>
              Guardar Borrador
            </Button>
            {currentStep === totalSteps - 1 ? (
              <Button
                design="Emphasized"
                onClick={handleFinalize}
                disabled={apiStatus.loading || !isStepValid()}
              >
                {apiStatus.loading ? 'Enviando...' : 'Finalizar'}
              </Button>
            ) : (
              <Button design="Emphasized" onClick={handleNext} disabled={!isStepValid()}>
                Siguiente →
              </Button>
            )}
          </FlexBox>
        }
      />
      <div style={{ marginTop: '20px', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e5e5' }}>
        <Text style={{ fontSize: '12px', color: '#6a6d70' }}>
          Estado actual: Paso <strong>{currentStep + 1}</strong> de <strong>{totalSteps}</strong>
        </Text>
      </div>
    </div>
  );
};

export default StepperContainer;