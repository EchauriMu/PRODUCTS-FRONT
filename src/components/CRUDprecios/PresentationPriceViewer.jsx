import React, { useState, useEffect } from 'react';
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
  MessageStrip
} from '@ui5/webcomponents-react';
import preciosListasService from '../../api/preciosListasService';
import preciosItemsService from '../../api/preciosItemsService';

const PresentationPriceViewer = ({ skuid, idPresentaOK }) => {
  const [priceLists, setPriceLists] = useState([]);
  const [presentationPrices, setPresentationPrices] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Cargar las listas de precios y los precios de la presentación
  useEffect(() => {
    if (!skuid || !idPresentaOK) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [lists, prices] = await Promise.all([
          preciosListasService.getListasBySKUID(skuid),
          preciosItemsService.getPricesByIdPresentaOK(idPresentaOK),
        ]);

        setPriceLists(lists);
        setPresentationPrices(prices);

        // Seleccionar la primera lista por defecto si existe
        if (lists.length > 0) {
          setSelectedListId(lists[0].IDLISTAOK);
        } else {
          setSelectedListId('');
          setCurrentPrice(null);
        }
      } catch (err) {
        setError('Error al cargar datos de precios.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [skuid, idPresentaOK]);

  // 2. Actualizar el precio mostrado cuando cambia la lista seleccionada
  useEffect(() => {
    if (!selectedListId || presentationPrices.length === 0) {
      setCurrentPrice(null); // Limpiar si no hay lista o precios
      return;
    }
    // Busca el objeto de precio completo que coincide con la lista seleccionada
    const foundPriceObject = presentationPrices.find(p => p.IdListaOK === selectedListId);
    setCurrentPrice(foundPriceObject || null); // Guarda el objeto completo o null
  }, [selectedListId, presentationPrices, idPresentaOK]);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/D';
    return `$${value.toFixed(2)}`;
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

  const renderPriceDetails = () => {
    if (currentPrice) {
      return (
        <FlexBox direction="Column" style={{ gap: '1rem' }}>
          {/* Precio principal y botón de edición */}
          <FlexBox justifyContent="SpaceBetween" alignItems="Start">
            <FlexBox direction="Column">
              <Label>Precio de Venta</Label>
              <Title level="H3" style={{ color: 'var(--sapIndicationColor_5)', marginTop: '0.25rem' }}>
                {formatCurrency(currentPrice.Precio)}
              </Title>
            </FlexBox>
            <Button icon="edit" design="Transparent" tooltip="Editar precio" />
          </FlexBox>

          {/* Resto de detalles en dos columnas */}
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
        <Button icon="add" design="Emphasized" tooltip="Asignar precio a esta lista" disabled={!selectedListId} />
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
    </Card>
  );
};

export default PresentationPriceViewer;