import { useState, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  Input,
  MessageStrip,
  BusyIndicator
} from '@ui5/webcomponents-react';
import preciosItemsService from '../../api/preciosItemsService'; // Asegúrate de que la ruta es correcta

// Función para formato de moneda (ajusta según necesites)
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Función para calcular CostoFin
const calculateCostoFin = (costoIni, formula, precio) => {
  let costoFinal = costoIni;
  if (formula) {
    try {
      const formulaEval = formula.replace(/COSTO/g, costoIni);
      costoFinal = eval(formulaEval); 
    } catch (e) {
      costoFinal = costoIni; 
    }
  } else if (precio > 0) {
    costoFinal = costoIni;
  }
  return parseFloat(costoFinal.toFixed(2));
};

const AddPresentationPriceModalNuevo = ({ open, onClose, skuid, idPresentaOK, selectedListId, selectedListName, initialValues, onPriceActionCompleted }) => {
  const [newPrice, setNewPrice] = useState({
    selectedListId: selectedListId || '',
    CostoIni: initialValues?.CostoIni || 0,
    Formula: initialValues?.Formula || '',
    Precio: initialValues?.Precio || 0,
    CostoFin: 0
  });
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Resetear/Inicializar el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      const costoIni = initialValues?.CostoIni || 0;
      const formula = initialValues?.Formula || '';
      const precio = initialValues?.Precio || 0;

      setNewPrice({
        selectedListId: selectedListId || '',
        CostoIni: costoIni,
        Formula: formula,
        Precio: precio,
        CostoFin: calculateCostoFin(costoIni, formula, precio) 
      });
      setPriceError('');
      setSaveMessage('');
    }
  }, [open, selectedListId, initialValues]);

  // Recalcular CostoFin cuando cambian los valores
  useEffect(() => {
    if (open) {
      const nuevoCostoFin = calculateCostoFin(
        newPrice.CostoIni,
        newPrice.Formula,
        newPrice.Precio
      );
      setNewPrice(prev => ({ ...prev, CostoFin: nuevoCostoFin }));
    }
  }, [newPrice.CostoIni, newPrice.Formula, newPrice.Precio, open]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = (name === 'Formula' || value === '') ? value : parseFloat(value);
    setNewPrice(prev => ({ ...prev, [name]: val }));
    setPriceError('');
    setSaveMessage('');
  };

  const handleSave = async () => {
    if (newPrice.CostoIni < 0 || newPrice.Precio < 0) {
      setPriceError('Costo Inicial y Precio de Venta no pueden ser negativos.');
      return;
    }
    
    setSavingPrice(true);
    setPriceError('');
    setSaveMessage('');

    try {
      const dataToCreate = {
        IdPresentaOK: idPresentaOK,
        IdListaOK: newPrice.selectedListId,
        SKUID: skuid,
        CostoIni: newPrice.CostoIni,
        Formula: newPrice.Formula,
        Precio: newPrice.Precio,
        CostoFin: newPrice.CostoFin,
      };

      await preciosItemsService.createPrice(dataToCreate);

      setSaveMessage('✅ Precio creado exitosamente.');
      setTimeout(() => {
        onPriceActionCompleted(); 
      }, 1000);
    } catch (error) {
      console.error('Error al crear precio:', error);
      setPriceError(`❌ Error al crear precio: ${error.message || 'Error desconocido'}`);
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      header={
        <Bar
          design="Header"
          endContent={
            <Button
              design="Transparent"
              icon="decline"
              onClick={onClose}
              title="Cerrar"
              disabled={savingPrice}
            />
          }
        >
          <Title level="H3">➕ Añadir Precio de Presentación</Title>
        </Bar>
      }
      footer={
        <Bar
          endContent={
            <>
              <Button design="Emphasized" onClick={handleSave} disabled={savingPrice}>
                {savingPrice ? <BusyIndicator active size="Small" /> : 'Guardar Precio'}
              </Button>
              <Button design="Transparent" onClick={onClose} disabled={savingPrice}>
                Cancelar
              </Button>
            </>
          }
        />
      }
      style={{ minWidth: '400px', maxWidth: '600px' }}
    >
      <FlexBox direction="Column" style={{ padding: '1rem', gap: '1rem' }}>
        {priceError && <MessageStrip type="Negative">{priceError}</MessageStrip>}
        {saveMessage && <MessageStrip type="Positive">{saveMessage}</MessageStrip>}

        <FlexBox direction="Column">
          <Label>Lista de Precios:</Label>
          <Text style={{ fontWeight: 'bold' }}>{selectedListName || selectedListId}</Text>
        </FlexBox>

        <FlexBox direction="Column">
          <Label required>Costo Inicial</Label>
          <Input
            type="Number"
            name="CostoIni"
            value={newPrice.CostoIni}
            onChange={handleChange}
            placeholder="Costo de entrada del producto"
          />
        </FlexBox>

        <FlexBox direction="Column">
          <Label>Fórmula Aplicada (Opcional)</Label>
          <Input
            name="Formula"
            value={newPrice.Formula}
            onChange={handleChange}
            placeholder="Ej: CostoIni * 1.16"
          />
          <Text style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Puedes usar la variable **CostoIni** en tu fórmula.
          </Text>
        </FlexBox>

        <FlexBox direction="Column">
          <Label required>Precio de Venta</Label>
          <Input
            type="Number"
            name="Precio"
            value={newPrice.Precio}
            onChange={handleChange}
            placeholder="Precio final de venta al público"
          />
        </FlexBox>

        {/* Muestra el Costo Final (resultado del cálculo) */}
        <FlexBox direction="Column" style={{ background: '#e6f7ff', padding: '1rem', borderRadius: '8px' }}>
          <Label style={{ fontWeight: 'bold', color: '#005b96' }}>Costo Final (Resultado)</Label>
          <Title level="H3" style={{ color: '#005b96', marginTop: '0.25rem' }}>
            {formatCurrency(newPrice.CostoFin)}
          </Title>
          <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            {newPrice.Formula ? '✓ Calculado automáticamente' : 'Costo Inicial sin fórmula aplicada'}
          </Text>
        </FlexBox>
      </FlexBox>
    </Dialog>
  );
};

export default AddPresentationPriceModalNuevo;