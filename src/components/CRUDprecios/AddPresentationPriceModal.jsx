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
  MessageStrip
} from '@ui5/webcomponents-react';
import preciosItemsService from '../../api/preciosItemsService';

const AddPresentationPriceModal = ({ open, onClose, skuid, idPresentaOK, selectedListId, selectedListName, onPriceAdded }) => {
  const [newPrice, setNewPrice] = useState({
    selectedListId: selectedListId || '',
    CostoIni: 0,
    Formula: '',
    Precio: 0,
    CostoFin: 0
  });
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Sincronizar selectedListId cuando cambia el prop
  useEffect(() => {
    setNewPrice(prev => ({
      ...prev,
      selectedListId: selectedListId || ''
    }));
  }, [selectedListId]);

  // Resetear el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      setNewPrice({
        selectedListId: selectedListId || '',
        CostoIni: 0,
        Formula: '',
        Precio: 0,
        CostoFin: 0
      });
      setPriceError('');
    }
  }, [open, selectedListId]);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/D';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculatePrice = (costoIni, formula) => {
    if (!formula || !costoIni) return 0;

    try {
      const formulaProcessed = formula.replace(/COSTO/gi, costoIni);
      const result = Function('"use strict"; return (' + formulaProcessed + ')')();
      return isFinite(result) ? parseFloat(result.toFixed(2)) : 0;
    } catch (err) {
      console.warn('Error al calcular fórmula:', err);
      return 0;
    }
  };



  const handleCostoIniChange = (newValue) => {
    const costoIni = parseFloat(newValue) || 0;
    const updatedPrice = {
      ...newPrice,
      CostoIni: costoIni
    };
    if (updatedPrice.Formula) {
      updatedPrice.Precio = calculatePrice(costoIni, updatedPrice.Formula);
      updatedPrice.CostoFin = calculatePrice(costoIni, updatedPrice.Formula);
    }
    setNewPrice(updatedPrice);
  };

  const handleFormulaChange = (newValue) => {
    const updatedPrice = {
      ...newPrice,
      Formula: newValue
    };
    if (newPrice.CostoIni) {
      updatedPrice.Precio = calculatePrice(newPrice.CostoIni, newValue);
      updatedPrice.CostoFin = calculatePrice(newPrice.CostoIni, newValue);
    }
    setNewPrice(updatedPrice);
  };

  const handleSaveNewPrice = async () => {
    // Validaciones
    if (!newPrice.selectedListId) {
      setPriceError('Debe seleccionar una lista de precios.');
      return;
    }

    if (!newPrice.CostoIni || newPrice.CostoIni <= 0) {
      setPriceError('El costo inicial debe ser mayor a 0.');
      return;
    }

    if (!newPrice.Formula) {
      setPriceError('Debe ingresar una fórmula de cálculo.');
      return;
    }

    if (newPrice.Precio <= 0) {
      setPriceError('El precio de venta debe ser mayor a 0.');
      return;
    }

    setSavingPrice(true);
    setPriceError('');

    try {
      // Preparar datos para guardar con todos los campos requeridos por el backend
      const generatedIdPrecioOK = `PRECIOS-${Date.now()}`;
      const loggedUser = localStorage.getItem('user') || 'admin';

      const dataToSave = {
        IdPrecioOK: generatedIdPrecioOK,
        IdListaOK: newPrice.selectedListId,
        IdPresentaOK: idPresentaOK,
        SKUID: skuid,
        IdTipoFormulaOK: 'FORM001', // Valor por defecto; ajusta según tu lógica
        Formula: newPrice.Formula,
        CostoIni: newPrice.CostoIni,
        CostoFin: newPrice.CostoFin,
        Precio: newPrice.Precio,
        REGUSER: loggedUser
      };

      // Llamar al servicio para agregar el precio
      const createdPrice = await preciosItemsService.createPrice(dataToSave);

      // Notificar al componente padre
      if (onPriceAdded) {
        onPriceAdded(createdPrice);
      }

      // Cerrar modal y resetear estado
      handleCancel();
    } catch (err) {
      // Mejorar el mensaje de error con la respuesta del servidor (si existe)
      const errorDetails = err?.response?.data?.value?.[0];
      const serverMsg = errorDetails?.message || err?.response?.data?.message || err?.response?.data?.error?.message || err?.message;
      setPriceError(`Error al crear el precio: ${serverMsg || 'Intente nuevamente.'}`);
      console.error('Error al crear precio (detalles):', {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
        errorDetails: errorDetails
      });
    } finally {
      setSavingPrice(false);
    }
  };

  const handleCancel = () => {
    setNewPrice({
      selectedListId: selectedListId || '',
      CostoIni: 0,
      Formula: '',
      Precio: 0,
      CostoFin: 0
    });
    setPriceError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      header={<Bar startContent={<Title>Agregar Precio a Lista</Title>} />}
      footer={
        <Bar endContent={
          <>
            <Button design="Transparent" onClick={handleCancel}>Cancelar</Button>
            <Button design="Emphasized" onClick={handleSaveNewPrice} disabled={savingPrice}>
              {savingPrice ? 'Guardando...' : 'Agregar Precio'}
            </Button>
          </>
        } />
      }
    >
      <div style={{ padding: '1.5rem', minWidth: '400px' }}>
        {priceError && (
          <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>
            {priceError}
          </MessageStrip>
        )}

        <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
          {/* Sección: Lista de Precios (Solo Lectura) */}
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            <Label style={{ fontWeight: 'bold' }}>Lista de Precios</Label>
            <div style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              background: '#f5f5f5',
              minHeight: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem'
            }}>
              {selectedListName || 'Sin seleccionar'}
            </div>
          </FlexBox>

          {/* Sección: Costo Inicial */}
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            <Label style={{ fontWeight: 'bold' }}>Costo Inicial</Label>
            <Input
              type="number"
              value={newPrice.CostoIni || ''}
              onChange={(e) => handleCostoIniChange(e.target.value)}
              placeholder="Ingrese costo inicial"
              disabled={savingPrice}
              step="0.01"
            />
          </FlexBox>

          {/* Sección: Fórmula */}
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            <Label style={{ fontWeight: 'bold' }}>Fórmula de Cálculo</Label>
            <Input
              value={newPrice.Formula || ''}
              onChange={(e) => handleFormulaChange(e.target.value)}
              placeholder="Ej: COSTO * 1.35"
              disabled={savingPrice}
            />
            <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Use &quot;COSTO&quot; como variable. Ej: COSTO * 1.35, (COSTO + 500) * 1.2
            </Text>
          </FlexBox>

          {/* Separador */}
          <div style={{ borderTop: '1px solid #e0e0e0', padding: '0.5rem 0' }} />

          {/* Sección: Precio de Venta (Resultado) */}
          <FlexBox direction="Column" style={{ gap: '0.5rem', background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
            <Label style={{ fontWeight: 'bold', color: '#2e7d32' }}>Precio de Venta (Resultado)</Label>
            <Title level="H3" style={{ color: '#1b5e20', marginTop: '0.25rem' }}>
              {formatCurrency(newPrice.Precio)}
            </Title>
            <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              {newPrice.Formula ? '✓ Calculado automáticamente' : 'Ingrese una fórmula para calcular'}
            </Text>
          </FlexBox>

          {/* Sección: Costo Final (Resultado) */}
          <FlexBox direction="Column" style={{ gap: '0.5rem', background: '#f3e5f5', padding: '1rem', borderRadius: '8px' }}>
            <Label style={{ fontWeight: 'bold', color: '#6a1b9a' }}>Costo Final (Resultado)</Label>
            <Title level="H3" style={{ color: '#4a148c', marginTop: '0.25rem' }}>
              {formatCurrency(newPrice.CostoFin)}
            </Title>
            <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              {newPrice.Formula ? '✓ Calculado automáticamente' : 'Ingrese una fórmula para calcular'}
            </Text>
          </FlexBox>

          {/* Información de referencia */}
          <div style={{ background: '#f7f8fa', padding: '1rem', borderRadius: '8px' }}>
            <Title level="H5" style={{ marginTop: 0, marginBottom: '0.75rem' }}>Información de Referencia</Title>
            <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
              <FlexBox direction="Column">
                <Label style={{ fontSize: '0.85rem', color: '#666' }}>ID de Presentación</Label>
                <Text style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{idPresentaOK}</Text>
              </FlexBox>
              <FlexBox direction="Column">
                <Label style={{ fontSize: '0.85rem', color: '#666' }}>SKU del Producto</Label>
                <Text style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{skuid}</Text>
              </FlexBox>
            </FlexBox>
          </div>
        </FlexBox>
      </div>
    </Dialog>
  );
};

export default AddPresentationPriceModal;
