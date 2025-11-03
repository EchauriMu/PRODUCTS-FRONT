import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  Table,
  TableRow,
  TableCell,
  Text,
  Title,
  BusyIndicator,
  MessageStrip,
  FlexBox,
  Label,
  Button,
  ObjectStatus
} from '@ui5/webcomponents-react';
import categoriasService from '../../api/categoriasService';
import CategoriaDetailModal from './CategoriaDetailModal';

const CategoriasTableCard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar categorías desde la API
  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await categoriasService.GetAllZTCategorias();
      console.log('API Response:', resp);
      let list = [];

      // Tu backend devuelve: { data: [ { dataRes: [...] } ] }
      if (resp?.data?.[0]?.dataRes) {
        list = resp.data[0].dataRes;
      } else if (Array.isArray(resp?.dataRes)) {
        list = resp.dataRes;
      } else if (Array.isArray(resp)) {
        list = resp;
      }

setCategories(list);

      setCategories(list);
    } catch (err) {
      console.error('Error cargando categorías:', err);
      const msg = err.response?.data?.message || err.message || 'Error al cargar categorías';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Estado de la categoría
  const getStatus = (cat) => {
    if (cat.DELETED === true) return { state: 'Error', text: 'Eliminada' };
    if (cat.ACTIVED === true) return { state: 'Success', text: 'Activa' };
    return { state: 'Warning', text: 'Inactiva' };
  };

  const handleRowClick = useCallback((cat) => {
    setSelectedCategory(cat);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCategory(null);
    loadCategories();
  }, []);

  return (
    <Card
      header={
        <CardHeader
          titleText="Lista de Categorías"
          subtitleText={`${categories.length} categorías encontradas`}
          action={
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Button
                icon="add"
                design="Emphasized"
                onClick={() => setSelectedCategory({})}
              >
                Añadir Categoría
              </Button>
              {loading && <BusyIndicator active size="Small" />}
              <Label
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: categories.length > 0 ? '#0a6ed1' : '#666',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                Total: {categories.length}
              </Label>
            </FlexBox>
          }
        />
      }
      style={{ margin: '1rem', maxWidth: '100%' }}
    >
      <div style={{ padding: '1rem' }}>
        {error && (
          <MessageStrip
            type="Negative"
            style={{ marginBottom: '1rem' }}
            onClose={() => setError('')}
          >
            {error}
          </MessageStrip>
        )}

        {loading && categories.length === 0 ? (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '200px', flexDirection: 'column' }}>
            <BusyIndicator active />
            <Text style={{ marginTop: '1rem' }}>Cargando categorías...</Text>
          </FlexBox>
        ) : categories.length === 0 && !loading ? (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '200px', flexDirection: 'column' }}>
            <Title level="H4" style={{ color: '#666', marginBottom: '0.5rem' }}>
              No hay categorías disponibles
            </Title>
            <Text>No se encontraron categorías en el sistema</Text>
          </FlexBox>
        ) : (
          <Table
            noDataText="No hay categorías para mostrar"
            headerRow={
              <TableRow>
                <TableCell><Text style={{ fontWeight: 'bold' }}>CATID</Text></TableCell>
                <TableCell><Text style={{ fontWeight: 'bold' }}>Nombre</Text></TableCell>
                <TableCell><Text style={{ fontWeight: 'bold' }}>Padre</Text></TableCell>
                <TableCell><Text style={{ fontWeight: 'bold' }}>Creado Por</Text></TableCell>
                <TableCell><Text style={{ fontWeight: 'bold' }}>Fecha</Text></TableCell>
                <TableCell><Text style={{ fontWeight: 'bold' }}>Estado</Text></TableCell>
              </TableRow>
            }
          >
            {categories.map((cat, index) => {
              const status = getStatus(cat);
              return (
                <TableRow
                  key={cat.CATID || index}
                  onClick={() => handleRowClick(cat)}
                  style={{ cursor: 'pointer' }}
                  className="ui5-table-row-hover"
                >
                  <TableCell><Text>{cat.CATID || `CAT-${index + 1}`}</Text></TableCell>
                  <TableCell><Text>{cat.Nombre || 'Sin nombre'}</Text></TableCell>
                  <TableCell><Label>{cat.PadreCATID || 'N/A'}</Label></TableCell>
                  <TableCell><Text>{cat.REGUSER || 'N/A'}</Text></TableCell>
                  <TableCell><Text>{formatDate(cat.REGDATE)}</Text></TableCell>
                  <TableCell><ObjectStatus state={status.state}>{status.text}</ObjectStatus></TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      {/* Modal Detalle Categoría */}
      <CategoriaDetailModal
        category={selectedCategory}
        open={!!selectedCategory}
        onClose={handleCloseModal}
      />
    </Card>
  );
};

export default CategoriasTableCard;
