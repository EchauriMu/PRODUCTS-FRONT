// Autor: Lucia López
import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardHeader,
  FlexBox,
  Label,
  Select,
  Option,
  Text,
  BusyIndicator,
  Title,
  IllustratedMessage,
  MessageStrip,
  Dialog,
  Bar,
  Input
} from '@ui5/webcomponents-react';
import preciosListasService from '../../api/preciosListasService';
import preciosItemsService from '../../api/preciosItemsService';
import AddPresentationPriceModal from './AddPresentationPriceModal';

const PresentationPriceViewer = ({ skuid, idPresentaOK }) => {
  const [priceLists, setPriceLists] = useState([]);
  const [presentationPrices, setPresentationPrices] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  const [isAddingPrice, setIsAddingPrice] = useState(false);

  const loadData = useCallback(async () => {
    if (!skuid || !idPresentaOK) return;

      setLoading(true);
      setError('');
      try {
        const [lists, prices] = await Promise.all([
          preciosListasService.getListasBySKUID(skuid),
          preciosItemsService.getPricesByIdPresentaOK(idPresentaOK),
        ]);

        setPriceLists(lists);
        setPresentationPrices(prices);

        if (lists.length > 0) {
          setSelectedListId(lists[0].IDLISTAOK);
        } else {
          setSelectedListId('');
          setCurrentPrice(null);
        }
      } catch (err) {
        setError('Error al cargar datos de precios.');
      } finally {
        setLoading(false);
      }
  }, [skuid, idPresentaOK]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedListId || presentationPrices.length === 0) {
      setCurrentPrice(null);
      return;
    }
    const foundPriceObject = presentationPrices.find(p => p.IdListaOK === selectedListId);
    setCurrentPrice(foundPriceObject || null);
  }, [selectedListId, presentationPrices, idPresentaOK]);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/D';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleEditClick = () => {
    if (currentPrice) {
      setEditingPrice({ ...currentPrice });
      setIsEditingPrice(true);
      setPriceError('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPrice(false);
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

  const calculatePrice = (costoIni, formula) => {
    if (!formula || !costoIni) return 0;
    
    try {
      const formulaProcessed = formula.replace(/COSTO/gi, costoIni);
      const result = Function('"use strict"; return (' + formulaProcessed + ')')();
      return isFinite(result) ? parseFloat(result.toFixed(2)) : 0;
    } catch (err) {
      return 0;
    }
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

      setPresentationPrices(prev =>
        prev.map(p => p.IdPrecioOK === editingPrice.IdPrecioOK ? updatedPrice : p)
      );

      if (currentPrice.IdPrecioOK === editingPrice.IdPrecioOK) {
        setCurrentPrice(updatedPrice);
      }

      setIsEditingPrice(false);
      setEditingPrice(null);
    } catch (err) {
      setPriceError('Error al guardar el precio. Intente nuevamente.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePriceAdded = (newPrice) => {
    const priceObject = Array.isArray(newPrice) ? newPrice[0] : newPrice;
    
    setPresentationPrices(prev => [...prev, priceObject]);
    
    if (priceObject.IdListaOK) {
      setSelectedListId(priceObject.IdListaOK);
    }
    
    setCurrentPrice(priceObject);
    
    setIsAddingPrice(false);
  };

  const renderPriceDetails = () => {
    if (currentPrice) {
      return (
        <FlexBox direction="Column" style={{ gap: '1rem' }}>
          <FlexBox justifyContent="SpaceBetween" alignItems="Start">
            <FlexBox direction="Column">
              <Label>Precio de Venta</Label>
              <Title level="H3" style={{ color: 'var(--sapIndicationColor_5)', marginTop: '0.25rem' }}>
                {formatCurrency(currentPrice.Precio)}
              </Title>
            </FlexBox>
            <Button icon="edit" design="Transparent" tooltip="Editar precio" onClick={handleEditClick} />
          </FlexBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
            <FlexBox direction="Column"><Label>ID del Precio</Label><Text>{currentPrice.IdPrecioOK}</Text></FlexBox>
            <FlexBox direction="Column"><Label>Tipo de Fórmula</Label><Text>{currentPrice.IdTipoFormulaOK || 'N/A'}</Text></FlexBox>
            <FlexBox direction="Column"><Label>Costo Inicial</Label><Text>{formatCurrency(currentPrice.CostoIni)}</Text></FlexBox>
            <FlexBox direction="Column"><Label>Costo Final</Label><Text>{formatCurrency(currentPrice.CostoFin)}</Text></FlexBox>
            <FlexBox direction="Column" style={{ gridColumn: '1 / -1' }}><Label>Fórmula Aplicada</Label><Text>{currentPrice.Formula || 'N/A'}</Text></FlexBox>
            <FlexBox direction="Column"><Label>Registrado por</Label><Text>{currentPrice.REGUSER}</Text></FlexBox>
            <FlexBox direction="Column"><Label>Fecha de Registro</Label><Text>{formatDate(currentPrice.REGDATE)}</Text></FlexBox>
          </div>
        </FlexBox>
      );
    }
    return (
      <FlexBox justifyContent="SpaceBetween" alignItems="Center">
        <Text style={{ color: '#666' }}>Sin precio asignado en esta lista.</Text>
        <Button icon="add" design="Emphasized" tooltip="Asignar precio a esta lista" disabled={!selectedListId} onClick={() => setIsAddingPrice(true)} />
      </FlexBox>
    );
  };

  return (
    <Card
      header={
        <CardHeader
          titleText="Precios por Lista"
          action={
            <Button
              icon="add"
              design="Transparent"
              tooltip="Añadir precio a otra lista"
              disabled={loading}
            />
          }
        />
      }
    >
      <div style={{ padding: '1rem' }}>
        {error && <MessageStrip design="Negative" style={{ marginBottom: '1rem' }}>{error}</MessageStrip>}
        {loading && <BusyIndicator active style={{ width: '100%' }} />}

        {!loading && !error && (
          priceLists.length > 0 ? (
            <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
              <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                <Label>Selecciona una lista para ver el precio:</Label>
                <Select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)} style={{ width: '100%' }}>
                  {priceLists.map(list => (
                    <Option key={list.IDLISTAOK} value={list.IDLISTAOK}>{list.DESLISTA}</Option>
                  ))}
                </Select>
              </FlexBox>

              <div style={{ background: '#f7f8fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                {renderPriceDetails()}
              </div>
            </FlexBox>
          ) : (
            <IllustratedMessage name="NoData" titleText="Sin Listas de Precios" subtitleText="Esta presentación no está incluida en ninguna lista." />
          )
        )}
      </div>

      <Dialog
        open={isEditingPrice}
        onClose={handleCancelEdit}
        header={<Bar startContent={<Title>Editar Precio de Venta</Title>} />}
        footer={
          <Bar endContent={
            <>
              <Button design="Transparent" onClick={handleCancelEdit}>Cancelar</Button>
              <Button design="Emphasized" onClick={handleSavePrice} disabled={savingPrice}>
                {savingPrice ? 'Guardando...' : 'Guardar'}
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
          
          {editingPrice && (
            <FlexBox direction="Column" style={{ gap: '1.5rem' }}>
              
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
                <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Use &quot;COSTO&quot; como variable. Ej: COSTO * 1.35, (COSTO + 500) * 1.2
                </Text>
              </FlexBox>

              <div style={{ borderTop: '1px solid #e0e0e0', padding: '0.5rem 0' }} />

              <FlexBox direction="Column" style={{ gap: '0.5rem', background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
                <Label style={{ fontWeight: 'bold', color: '#2e7d32' }}>Precio de Venta (Resultado)</Label>
                <Title level="H3" style={{ color: '#1b5e20', marginTop: '0.25rem' }}>
                  {formatCurrency(editingPrice.Precio)}
                </Title>
                <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  {editingPrice.Formula ? '✓ Calculado automáticamente' : 'Ingrese una fórmula para calcular'}
                </Text>
              </FlexBox>

              <FlexBox direction="Column" style={{ gap: '0.5rem', background: '#f3e5f5', padding: '1rem', borderRadius: '8px' }}>
                <Label style={{ fontWeight: 'bold', color: '#6a1b9a' }}>Costo Final (Resultado)</Label>
                <Title level="H3" style={{ color: '#4a148c', marginTop: '0.25rem' }}>
                  {formatCurrency(editingPrice.CostoFin)}
                </Title>
                <Text style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  {editingPrice.Formula ? '✓ Calculado automáticamente' : 'Ingrese una fórmula para calcular'}
                </Text>
              </FlexBox>

              <div style={{ background: '#f7f8fa', padding: '1rem', borderRadius: '8px' }}>
                <Title level="H5" style={{ marginTop: 0, marginBottom: '0.75rem' }}>Información de Referencia</Title>
                <FlexBox direction="Column" style={{ gap: '0.75rem' }}>
                  <FlexBox direction="Column">
                    <Label style={{ fontSize: '0.85rem', color: '#666' }}>Lista de Precios</Label>
                    <Text>{priceLists.find(l => l.IDLISTAOK === selectedListId)?.DESLISTA || 'N/A'}</Text>
                  </FlexBox>
                  <FlexBox direction="Column">
                    <Label style={{ fontSize: '0.85rem', color: '#666' }}>ID del Precio</Label>
                    <Text style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{editingPrice.IdPrecioOK}</Text>
                  </FlexBox>
                </FlexBox>
              </div>
            </FlexBox>
          )}
        </div>
      </Dialog>

      <AddPresentationPriceModal
        open={isAddingPrice}
        onClose={() => setIsAddingPrice(false)}
        skuid={skuid}
        idPresentaOK={idPresentaOK}
        selectedListId={selectedListId}
        selectedListName={priceLists.find(l => l.IDLISTAOK === selectedListId)?.DESLISTA || ''}
        onPriceAdded={handlePriceAdded}
      />
    </Card>
  );
};

export default PresentationPriceViewer;
