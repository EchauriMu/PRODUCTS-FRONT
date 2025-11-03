import React, { useState, useEffect } from 'react';
import {
  FlexBox,
  Label,
  Select,
  Option,
  Text,
  BusyIndicator,
  Icon,
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
    // Si no hay lista seleccionada o no hay precios cargados, no hacer nada.
    if (!selectedListId || presentationPrices.length === 0) {
      setCurrentPrice(null);
      return;
    }

    // Busca el precio que coincide EXACTAMENTE con la lista seleccionada Y la presentación actual.
    // Esto asegura que solo mostramos precios que pertenecen a la presentación que estamos viendo.
    const foundPrice = presentationPrices.find(p => p.IdListaOK === selectedListId && p.IdPresentaOK === idPresentaOK);

    setCurrentPrice(foundPrice ? foundPrice.Precio : null);
  }, [selectedListId, presentationPrices, idPresentaOK]);

  if (loading) {
    return <BusyIndicator active size="Small" />;
  }

  if (error) {
    return <Text style={{ color: 'var(--sapNegativeColor)' }}>{error}</Text>;
  }

  if (priceLists.length === 0) {
    return <Text>Esta presentación no está incluida en ninguna lista de precios.</Text>;
  }

  return (
    <FlexBox direction="Column" style={{ gap: '1rem', borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
      <Label>Consultar Precio por Lista</Label>
      <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
        <Select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)} style={{ flex: 1 }}>
          {priceLists.map(list => (
            <Option key={list.IDLISTAOK} value={list.IDLISTAOK}>{list.DESLISTA}</Option>
          ))}
        </Select>
        <Text style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--sapIndicationColor_5)' }}>
          {currentPrice !== null ? `$${parseFloat(currentPrice).toFixed(2)}` : 'N/D'}
        </Text>
      </FlexBox>
    </FlexBox>
  );
};

export default PresentationPriceViewer;