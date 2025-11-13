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
  MessageBox,
  MessageStrip,
  MessageBoxAction,
  BusyIndicator
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import ComponenteUno from './ComponenteUno';
import ComponenteDos from './ComponenteDos';
import ComponenteTres from './ComponenteTres';
import addProductApi from '../../api/addProductApi'; // SUCCESS: Usando el nuevo servicio con Axios
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

// Esquema de validación para el producto principal
const productValidationSchema = yup.object().shape({
  PRODUCTNAME: yup.string().required('El nombre del producto es obligatorio.').min(3, 'El nombre del producto debe tener al menos 3 caracteres.'),
  DESSKU: yup.string().required('La descripción es obligatoria.'),
  MARCA: yup.string().required('La marca es obligatoria.'),
  IDUNIDADMEDIDA: yup.string().required('La unidad de medida es obligatoria.'),
});

// Esquema de validación para cada presentación
const presentationValidationSchema = yup.object().shape({
  IdPresentaOK: yup.string().required('El ID de la presentación es obligatorio.'),
  NOMBREPRESENTACION: yup.string().required('El nombre de la presentación es obligatorio.'),
  Descripcion: yup.string().required('La descripción de la presentación es obligatoria.'),
  PropiedadesExtras: yup.string().test(
    'is-json',
    'Las propiedades extras no son un JSON válido.',
    value => { try { JSON.parse(value); return true; } catch (e) { return false; } }
  ),
  files: yup.array().optional(),
});

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
  const [isSaving, setIsSaving] = useState(false);

  const stepTitles = [
    "Información General",
    "Añadir Presentaciones",
    "Resumen y Confirmación"
  ];

  const totalSteps = 3;

  const handleNext = async () => {
    setIsSaving(true);
    setApiStatus({ loading: false, error: null, success: null }); // Limpiar errores al avanzar

    try {
      if (currentStep === 0) {
        // Validación para el Paso 1
        await productValidationSchema.validate(productData, { abortEarly: false });
      }
      if (currentStep === 1) {
        // Validación para el Paso 2
        if (presentations.length === 0) {
          throw new yup.ValidationError('Debe agregar al menos una presentación.');
        }
      }

      // Si la validación es exitosa, avanza al siguiente paso
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      const errorMessages = (
        <ul>
          {error.errors.map((e, index) => <li key={index}>{e}</li>)}
        </ul>
      );
      setApiStatus({ loading: false, error: errorMessages, success: null });
    } finally {
      setIsSaving(false);
      return;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) {
      // Basic validation for step 1: check if required fields are filled.
      return productData.PRODUCTNAME && productData.DESSKU && productData.MARCA && productData.IDUNIDADMEDIDA;
    }
    if (currentStep === 1) {
      // Validation for step 2: ensure at least one presentation is added.
      return presentations.length > 0;
    }
    // For other steps, the button is either not 'Next' or always enabled.
    return true;
  };


  const handleFinalize = async () => {
    setIsSaving(true);
    setApiStatus({ loading: true, error: null, success: null });

    try {
      // 1. Validar el producto principal
      await productValidationSchema.validate(productData, { abortEarly: false });

      // 2. Validar cada presentación
      await Promise.all(presentations.map((pres, index) => {
        return presentationValidationSchema.validate(pres, { abortEarly: false })
          .catch(err => {
            // Añadir contexto a los errores de presentación
            const presentationErrors = err.inner.map(e => `Presentación #${index + 1}: ${e.message}`);
            throw new Error(presentationErrors.join('\n'));
          });
      }));

      // Si todas las validaciones pasan, continuamos con el envío
    } catch (error) {
      const errorMessages = (
        <ul>
          {error.errors.map((e, index) => <li key={index}>{e}</li>)}
        </ul>
      );
      setApiStatus({ loading: false, error: errorMessages, success: null });
      return; // Detener la ejecución si hay errores de validación
    }
    setIsSaving(false);

    try {
      // Desestructuramos productData para excluir SKUID del payload final.
      const { SKUID, ...productPayload } = productData;
      
      const payload = {
        product: productData, // Enviamos el productData completo como espera la API
        presentations: presentations.map(p => {
          // Construimos el objeto de presentación explícitamente para que coincida con el body requerido.
          return {
            IdPresentaOK: p.IdPresentaOK,
            NOMBREPRESENTACION: p.NOMBREPRESENTACION,
            Descripcion: p.Descripcion,
            PropiedadesExtras: p.PropiedadesExtras, // Ya es un string JSON desde ComponenteDos
            files: p.files || []
          };
        })
      };

      // El interceptor de Axios se encargará de añadir LoggedUser automáticamente.
      await addProductApi.createCompleteProduct(payload);
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
          {apiStatus.error && typeof apiStatus.error === 'string' && (
            <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>{apiStatus.error}</MessageStrip>
          )}
          <MessageBox
            open={!!apiStatus.error && typeof apiStatus.error !== 'string'}
            type="Error"
            titleText="Errores de Validación"
            actions={[MessageBoxAction.OK]}
            onClose={() => setApiStatus({ loading: false, error: null, success: null })}
          >
            {apiStatus.error}
          </MessageBox>
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
            {currentStep === totalSteps - 1 ? (
              <Button
                design="Emphasized"
                onClick={handleFinalize}
                disabled={isSaving || apiStatus.loading}
              >
                {isSaving || apiStatus.loading ? 'Enviando...' : 'Finalizar'}
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