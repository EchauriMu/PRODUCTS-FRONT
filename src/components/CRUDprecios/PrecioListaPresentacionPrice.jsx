import React, { useEffect, useState } from 'react';
import {
  FlexBox,
  Label,
  Text,
  Button,
  Title,
  BusyIndicator,
  MessageStrip,
  Dialog,
  Bar,
  Input
} from '@ui5/webcomponents-react';
import preciosItemsService from '../../api/preciosItemsService';
import AddPrecioListaPresentationPriceModal from './AddPrecioListaPresentationPriceModal';

const PrecioListaPresentacionPrice = ({
  idPresentaOK,
  skuid,
  idListaOK,
  listaNombre,
  onPriceChanged
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  const [isAdding, setIsAdding] = useState(false);

  // -------- helpers --------
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

  // -------- cargar precio de esta presentación / lista --------
  useEffect(() => {
    const loadPrice = async () => {
      if (!idPresentaOK || !idListaOK) {
        setCurrentPrice(null);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const prices = await preciosItemsService.getPricesByIdPresentaOK(idPresentaOK);
        const priceForList = Array.isArray(prices)
          ? prices.find((p) => p.IdListaOK === idListaOK)
          : null;
        setCurrentPrice(priceForList || null);
      } catch (err) {
        console.error('Error al cargar precio de presentación:', err);
        setError('Error al cargar el precio para esta presentación.');
      } finally {
        setLoading(false);
      }
    };

    loadPrice();
  }, [idPresentaOK, idListaOK]);

  // -------- edición --------
  const handleEditClick = () => {
    if (!currentPrice) return;
    setEditingPrice({ ...currentPrice });
    setIsEditing(true);
    setPriceError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPrice(null);
    setPriceError('');
  };

  const handleCostoIniChange = (newValue) => {
    const costoIni = parseFloat(newValue) || 0;
    const updatedPrice = {
      ...editingPrice,
      CostoIni: costoIni
    };
    if (updatedPrice.Formula) {
      updatedPrice.Precio = calculatePrice(costoIni, updatedPrice.Formula);
      updatedPrice.CostoFin = calculatePrice(costoIni, updatedPrice.Formula);
    }
    setEditingPrice(updatedPrice);
  };

  const handleFormulaChange = (newValue) => {
    const updatedPrice = {
      ...editingPrice,
      Formula: newValue
    };
    if (editingPrice.CostoIni) {
      updatedPrice.Precio = calculatePrice(editingPrice.CostoIni, newValue);
      updatedPrice.CostoFin = calculatePrice(editingPrice.CostoIni, newValue);
    }
    setEditingPrice(updatedPrice);
  };

  const handleSavePrice = async () => {
    if (!editingPrice || !editingPrice.IdPrecioOK) {
      setPriceError('Error: No se puede guardar el precio.');
      return;
    }

    if (editingPrice.Precio <= 0) {
      setPriceError('El precio de venta debe ser mayor a 0.');
      return;
    }

    setSavingPrice(true);
    setPriceError('');

    try {
      const dataToSave = {
        Precio: editingPrice.Precio,
        CostoIni: editingPrice.CostoIni,
        CostoFin: editingPrice.CostoFin,
        Formula: editingPrice.Formula
      };

      const updatedPrice = await preciosItemsService.updatePrice(
        editingPrice.IdPrecioOK,
        dataToSave
      );

      setCurrentPrice(updatedPrice);
      setIsEditing(false);
      setEditingPrice(null);

      if (onPriceChanged) {
        onPriceChanged(updatedPrice);
      }
    } catch (err) {
      console.error('Error al guardar precio de presentación:', err);
      setPriceError('Error al guardar el precio. Intente nuevamente.');
    } finally {
      setSavingPrice(false);
    }
  };

  // Cuando se agrega desde el botón "+"
  const handlePriceAdded = (newPrice) => {
    const priceObject = Array.isArray(newPrice) ? newPrice[0] : newPrice;
    setCurrentPrice(priceObject || null);
    setIsAdding(false);
    setError('');
    if (onPriceChanged && priceObject) {
      onPriceChanged(priceObject);
    }
  };

  return (
    <FlexBox direction="Column" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
      {/* encabezado + botones */}
      <FlexBox
        justifyContent="SpaceBetween"
        alignItems="Center"
        style={{ borderTop: '1px dashed #ddd', paddingTop: '0.5rem' }}
      >
        <Label style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#444' }}>
          Precio para esta Lista
        </Label>
        <FlexBox style={{ gap: '0.25rem' }}>
          <Button
            icon="add"
            design="Transparent"
            tooltip="Agregar precio a esta presentación"
            disabled={!!currentPrice || !idListaOK}
            onClick={() => setIsAdding(true)}
          />
          <Button
            icon="edit"
            design="Transparent"
            tooltip="Editar precio"
            disabled={!currentPrice}
            onClick={handleEditClick}
          />
        </FlexBox>
      </FlexBox>

      {/* estados de carga / error */}
      {loading && (
        <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
          <BusyIndicator active />
          <Text style={{ fontSize: '0.8rem', color: '#777' }}>Cargando precio…</Text>
        </FlexBox>
      )}

      {error && <MessageStrip design="Negative">{error}</MessageStrip>}

      {/* contenido principal */}
      {!loading && !error && (
        currentPrice ? (
          <FlexBox
            direction="Column"
            style={{
              gap: '0.5rem',
              backgroundColor: '#f7f8fa',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}
          >
            <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
              <Label style={{ fontSize: '0.75rem', color: '#666' }}>Precio de Venta</Label>
              <Title level="H5" style={{ margin: 0, color: 'var(--sapIndicationColor_5)' }}>
                {formatCurrency(currentPrice.Precio)}
              </Title>
            </FlexBox>

            <FlexBox style={{ gap: '1.25rem', flexWrap: 'wrap' }}>
              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '150px' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Costo Inicial</Label>
                <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                  {formatCurrency(currentPrice.CostoIni)}
                </Text>
              </FlexBox>

              <FlexBox direction="Column" style={{ gap: '0.15rem', minWidth: '150px' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Costo Final</Label>
                <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                  {formatCurrency(currentPrice.CostoFin)}
                </Text>
              </FlexBox>

              <FlexBox direction="Column" style={{ gap: '0.15rem', flex: '1 1 100%' }}>
                <Label style={{ fontSize: '0.75rem', color: '#666' }}>Fórmula Aplicada</Label>
                <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                  {currentPrice.Formula || 'N/A'}
                </Text>
              </FlexBox>
            </FlexBox>

            <FlexBox style={{ gap: '1rem', flexWrap: 'wrap' }}>
              {currentPrice.REGUSER && (
                <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                  <Label style={{ fontSize: '0.7rem', color: '#777' }}>Registrado por</Label>
                  <Text style={{ fontSize: '0.8rem', color: '#333' }}>{currentPrice.REGUSER}</Text>
                </FlexBox>
              )}
              {currentPrice.REGDATE && (
                <FlexBox direction="Column" style={{ gap: '0.15rem' }}>
                  <Label style={{ fontSize: '0.7rem', color: '#777' }}>Fecha Registro</Label>
                  <Text style={{ fontSize: '0.8rem', color: '#333' }}>
                    {new Date(currentPrice.REGDATE).toLocaleDateString('es-ES')}
                  </Text>
                </FlexBox>
              )}
            </FlexBox>
          </FlexBox>
        ) : (
          <Text style={{ fontSize: '0.75rem', color: '#999' }}>
            No hay precio asignado para esta presentación en esta lista.
          </Text>
        )
      )}

      {/* MODAL EDITAR */}
      <Dialog
        open={isEditing}
        onClose={handleCancelEdit}
        header={<Bar startContent={<Title>Editar Precio de Presentación</Title>} />}
        footer={
          <Bar
            endContent={
              <>
                <Button design="Transparent" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                <Button design="Emphasized" onClick={handleSavePrice} disabled={savingPrice}>
                  {savingPrice ? 'Guardando...' : 'Guardar'}
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

          {editingPrice && (
            <FlexBox direction="Column" style={{ gap: '1.25rem' }}>
              <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                <Label style={{ fontWeight: 'bold' }}>Costo Inicial</Label>
                <Input
                  type="number"
                  value={editingPrice.CostoIni || ''}
                  onChange={(e) => handleCostoIniChange(e.target.value)}
                  placeholder="Ingrese costo inicial"
                  disabled={savingPrice}
                  step="0.01"
                />
              </FlexBox>

              <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                <Label style={{ fontWeight: 'bold' }}>Fórmula de Cálculo</Label>
                <Input
                  value={editingPrice.Formula || ''}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="Ej: COSTO * 1.35"
                  disabled={savingPrice}
                />
                <Text style={{ fontSize: '0.8rem', color: '#666' }}>
                  Use "COSTO" como variable. Ej: COSTO * 1.35, (COSTO + 500) * 1.2
                </Text>
              </FlexBox>

              <div style={{ borderTop: '1px solid #e0e0e0', padding: '0.5rem 0' }} />

              <FlexBox
                direction="Column"
                style={{ gap: '0.5rem', background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}
              >
                <Label style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  Precio de Venta (Resultado)
                </Label>
                <Title level="H4" style={{ margin: 0, color: '#1b5e20' }}>
                  {formatCurrency(editingPrice.Precio)}
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
                  {formatCurrency(editingPrice.CostoFin)}
                </Title>
              </FlexBox>

              <div style={{ background: '#f7f8fa', padding: '0.75rem', borderRadius: '6px' }}>
                <Title level="H6" style={{ margin: 0, marginBottom: '0.5rem' }}>
                  Información
                </Title>
                <Text style={{ fontSize: '0.8rem', display: 'block' }}>
                  Lista: {listaNombre || idListaOK || 'N/D'}
                </Text>
                <Text style={{ fontSize: '0.8rem', display: 'block' }}>
                  SKUID: {skuid}
                </Text>
                <Text style={{ fontSize: '0.8rem', display: 'block' }}>
                  IdPresentaOK: {idPresentaOK}
                </Text>
              </div>
            </FlexBox>
          )}
        </div>
      </Dialog>

      {/* MODAL AGREGAR ("+") */}
      <AddPrecioListaPresentationPriceModal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        skuid={skuid}
        idPresentaOK={idPresentaOK}
        idListaOK={idListaOK}
        listaNombre={listaNombre}
        onPriceAdded={handlePriceAdded}
      />
    </FlexBox>
  );
};

export default PrecioListaPresentacionPrice;
