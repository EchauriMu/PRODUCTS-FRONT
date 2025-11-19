import React, { useEffect, useState } from 'react';
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

const AddPrecioListaPresentationPriceModal = ({
  open,
  onClose,
  skuid,
  idPresentaOK,
  idListaOK,
  listaNombre,
  onPriceAdded
}) => {
  const [newPrice, setNewPrice] = useState({
    CostoIni: 0,
    Formula: '',
    Precio: 0,
    CostoFin: 0
  });
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Cuando se abre el modal, reseteamos los valores
  useEffect(() => {
    if (open) {
      setNewPrice({
        CostoIni: 0,
        Formula: '',
        Precio: 0,
        CostoFin: 0
      });
      setPriceError('');
    }
  }, [open]);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/D';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const calculatePrice = (costoIni, formula) => {
    if (!formula || !costoIni) return 0;
    try {
      const formulaProcessed = formula.replace(/COSTO/gi, costoIni);
      const result = Function('"use strict"; return (' + formulaProcessed + ')')();
      return Number.isFinite(result) ? parseFloat(result.toFixed(2)) : 0;
    } catch (err) {
      console.warn('Error al calcular fórmula:', err);
      return 0;
    }
  };

  const handleCostoIniChange = (value) => {
    const costoIni = parseFloat(value) || 0;
    const updated = { ...newPrice, CostoIni: costoIni };
    if (updated.Formula) {
      updated.Precio = calculatePrice(costoIni, updated.Formula);
      updated.CostoFin = calculatePrice(costoIni, updated.Formula);
    }
    setNewPrice(updated);
  };

  const handleFormulaChange = (value) => {
    const updated = { ...newPrice, Formula: value };
    if (newPrice.CostoIni) {
      updated.Precio = calculatePrice(newPrice.CostoIni, value);
      updated.CostoFin = calculatePrice(newPrice.CostoIni, value);
    }
    setNewPrice(updated);
  };

  const handleCancel = () => {
    setNewPrice({
      CostoIni: 0,
      Formula: '',
      Precio: 0,
      CostoFin: 0
    });
    setPriceError('');
    onClose();
  };

  const handleSaveNewPrice = async () => {
    // Validaciones básicas
    if (!idListaOK) {
      setPriceError('No se recibió IdListaOK para esta lista.');
      return;
    }
    if (!idPresentaOK) {
      setPriceError('No se recibió IdPresentaOK de la presentación.');
      return;
    }
    if (!skuid) {
      setPriceError('No se recibió SKUID del producto.');
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
      const generatedIdPrecioOK = `PRECIOS-${Date.now()}`;
      const loggedUser = localStorage.getItem('user') || 'admin';

      const dataToSave = {
        IdPrecioOK: generatedIdPrecioOK,
        IdListaOK: idListaOK,
        IdPresentaOK: idPresentaOK,
        SKUID: skuid,
        IdTipoFormulaOK: 'FORM001', // mismo valor que usas en productos
        Formula: newPrice.Formula,
        CostoIni: newPrice.CostoIni,
        CostoFin: newPrice.CostoFin,
        Precio: newPrice.Precio,
        REGUSER: loggedUser
      };

      // Llamar al servicio para agregar el precio
      const createdPrice = await preciosItemsService.createPrice(dataToSave);

      // Notificar al padre (PrecioListaPresentacionPrice)
      if (onPriceAdded) {
        onPriceAdded(createdPrice);
      }

      // Cerrar y resetear
      handleCancel();
    } catch (err) {
      const errorDetails = err?.response?.data?.value?.[0];
      const serverMsg =
        errorDetails?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message;

      setPriceError(`Error al crear el precio: ${serverMsg || 'Intente nuevamente.'}`);
      console.error('Error al crear precio desde lista (detalles):', {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
        errorDetails
      });
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      header={<Bar startContent={<Title>Agregar Precio a esta Lista</Title>} />}
      footer={
        <Bar
          endContent={
            <>
              <Button design="Transparent" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button design="Emphasized" onClick={handleSaveNewPrice} disabled={savingPrice}>
                {savingPrice ? 'Guardando...' : 'Agregar Precio'}
              </Button>
            </>
          }
        />
      }
    >
      <div style={{ padding: '1.5rem', minWidth: '380px' }}>
        {priceError && (
          <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>
            {priceError}
          </MessageStrip>
        )}

        <FlexBox direction="Column" style={{ gap: '1.25rem' }}>
          {/* Lista (solo lectura) */}
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            <Label style={{ fontWeight: 'bold' }}>Lista de Precios</Label>
            <div
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                background: '#f5f5f5',
                minHeight: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem'
              }}
            >
              {listaNombre || idListaOK || 'Sin seleccionar'}
            </div>
          </FlexBox>

          {/* Costo inicial */}
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

          {/* Fórmula */}
          <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
            <Label style={{ fontWeight: 'bold' }}>Fórmula de Cálculo</Label>
            <Input
              value={newPrice.Formula || ''}
              onChange={(e) => handleFormulaChange(e.target.value)}
              placeholder="Ej: COSTO * 1.35"
              disabled={savingPrice}
            />
            <Text style={{ fontSize: '0.85rem', color: '#666' }}>
              Use "COSTO" como variable. Ej: COSTO * 1.35, (COSTO + 500) * 1.2
            </Text>
          </FlexBox>

          <div style={{ borderTop: '1px solid #e0e0e0', padding: '0.5rem 0' }} />

          {/* Resultados calculados */}
          <FlexBox
            direction="Column"
            style={{ gap: '0.5rem', background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}
          >
            <Label style={{ fontWeight: 'bold', color: '#2e7d32' }}>
              Precio de Venta (Resultado)
            </Label>
            <Title level="H4" style={{ margin: 0, color: '#1b5e20' }}>
              {formatCurrency(newPrice.Precio)}
            </Title>
          </FlexBox>

          <FlexBox
            direction="Column"
            style={{ gap: '0.5rem', background: '#f3e5f5', padding: '1rem', borderRadius: '8px' }}
          >
            <Label style={{ fontWeight: 'bold', color: '#6a1b9a' }}>
              Costo Final (Resultado)
            </Label>
            <Title level="H4" style={{ margin: 0, color: '#4a148c' }}>
              {formatCurrency(newPrice.CostoFin)}
            </Title>
          </FlexBox>

          {/* Info de referencia */}
          <div style={{ background: '#f7f8fa', padding: '1rem', borderRadius: '8px' }}>
            <Title level="H6" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
              Información de Referencia
            </Title>
            <Text style={{ fontSize: '0.8rem', display: 'block' }}>SKUID: {skuid}</Text>
            <Text style={{ fontSize: '0.8rem', display: 'block' }}>
              IdPresentaOK: {idPresentaOK}
            </Text>
          </div>
        </FlexBox>
      </div>
    </Dialog>
  );
};

export default AddPrecioListaPresentationPriceModal;
