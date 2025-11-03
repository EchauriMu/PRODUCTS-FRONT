import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  Table,
  TableRow,
  TableCell,
  Button,
  Title,
  Input,
  ObjectStatus,
  MessageStrip,
  BusyIndicator,
  FlexBox,
  FlexBoxJustifyContent,
  FlexBoxDirection,
  Text,
  Icon,
  Label
} from '@ui5/webcomponents-react';
import preciosListasService from '../../api/preciosListasService';
import PreciosListasModal from './PreciosListasModal';

const PreciosListasTable = () => {
  const [listas, setListas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLista, setEditingLista] = useState(null);

  // === Cargar listas al montar ===
  useEffect(() => {
    fetchListas();
  }, []);

  const fetchListas = async () => {
    setLoading(true);
    try {
      const result = await preciosListasService.getAllListas();
      setListas(result);
      setError('');
    } catch (err) {
      setError('Error al obtener las listas de precios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === Handlers CRUD ===
  const handleAdd = useCallback(() => {
    setEditingLista(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((record) => {
    setEditingLista(record);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (lista) => {
    if (window.confirm(`¿Eliminar la lista "${lista.DESLISTA}"?`)) {
      try {
        await preciosListasService.delete(lista.IDLISTAOK);
        setListas((prev) => prev.filter((item) => item.IDLISTAOK !== lista.IDLISTAOK));
      } catch (err) {
        setError('Error al eliminar la lista de precios.');
        console.error(err);
      }
    }
  }, []);

  const handleSave = async (listaData) => {
    try {
      if (editingLista) {
        await preciosListasService.update(editingLista.IDLISTAOK, listaData);
      } else {
        await preciosListasService.create(listaData);

      }
      setIsModalOpen(false);
      fetchListas();
    } catch (err) {
      setError('Error al guardar la lista de precios.');
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLista(null);
  };

  // === Utilidades ===
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getListaStatus = (lista) => {
    if (lista.DELETED) return { state: 'Error', text: 'Eliminado' };
    if (lista.ACTIVED) return { state: 'Success', text: 'Activo' };
    return { state: 'Warning', text: 'Inactivo' };
  };

  // === Filtro por descripción o SKU ===
  const filteredListas = listas.filter((lista) => {
    const term = searchTerm.toLowerCase();
    return (
      lista.DESLISTA?.toLowerCase().includes(term) ||
      lista.SKUID?.toLowerCase().includes(term)
    );
  });

  return (
    <Card
      header={
        <CardHeader
          titleText="Listas de Precios"
          subtitleText={`${filteredListas.length} listas encontradas`}
          action={
            <FlexBox alignItems="Center" justifyContent={FlexBoxJustifyContent.End} style={{ gap: '0.75rem' }}>
              <Input
                icon={<Icon name="search" />}
                placeholder="Buscar por descripción o SKU..."
                onInput={(e) => setSearchTerm(e.target.value)}
                style={{ width: '300px' }}
              />
              <Button design="Emphasized" icon="add" onClick={handleAdd}>
                Crear Lista
              </Button>
              {loading && <BusyIndicator active size="Small" />}
              <Label
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#0a6ed1',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                Total: {listas.length}
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
            design="Negative"
            style={{ marginBottom: '1rem' }}
            onClose={() => setError('')}
          >
            {error}
          </MessageStrip>
        )}

        {/* === Estado de carga === */}
        {loading && filteredListas.length === 0 ? (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '200px', flexDirection: 'column' }}>
            <BusyIndicator active />
            <Text style={{ marginTop: '1rem' }}>Cargando listas de precios...</Text>
          </FlexBox>
        ) : !loading && filteredListas.length === 0 ? (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '200px', flexDirection: 'column' }}>
            <Title level="H4" style={{ color: '#666', marginBottom: '0.5rem' }}>
              No se encontraron listas de precios
            </Title>
            <Text>Intenta con otro término de búsqueda o crea una nueva lista.</Text>
          </FlexBox>
        ) : (
          // === Tabla de datos ===
          <Table
            noDataText="No hay listas para mostrar"
            headerRow={
              <TableRow>
                <TableCell><Text>ID Lista</Text></TableCell>
                <TableCell><Text>SKU ID</Text></TableCell>
                <TableCell><Text>Descripción</Text></TableCell>
                <TableCell><Text>Instituto</Text></TableCell>
                <TableCell><Text>Tipo Lista</Text></TableCell>
                <TableCell><Text>Tipo General</Text></TableCell>
                <TableCell><Text>Tipo Fórmula</Text></TableCell>
                <TableCell><Text>Inicio Vigencia</Text></TableCell>
                <TableCell><Text>Fin Vigencia</Text></TableCell>
                <TableCell><Text>Registro</Text></TableCell>
                <TableCell><Text>Modificación</Text></TableCell>
                <TableCell><Text>Estado</Text></TableCell>
                <TableCell><Text>Acciones</Text></TableCell>
              </TableRow>
            }
          >
            {filteredListas.map((lista, index) => {
              const status = getListaStatus(lista);
              return (
                <TableRow key={lista.IDLISTAOK || index} className="ui5-table-row-hover">
                  <TableCell><Text style={{ fontFamily: 'monospace' }}>{lista.IDLISTAOK}</Text></TableCell>
                  <TableCell><Text>{lista.SKUID || '-'}</Text></TableCell>
                  <TableCell><Text>{lista.DESLISTA || '-'}</Text></TableCell>
                  <TableCell><Text>{lista.IDINSTITUTOOK || '-'}</Text></TableCell>
                  <TableCell><Text>{lista.IDTIPOLISTAOK || '-'}</Text></TableCell>
                  <TableCell><Text>{lista.IDTIPOGENERALISTAOK || '-'}</Text></TableCell>
                  <TableCell><Text>{lista.IDTIPOFORMULAOK || '-'}</Text></TableCell>
                  <TableCell><Text>{formatDate(lista.FECHAEXPIRAINI)}</Text></TableCell>
                  <TableCell><Text>{formatDate(lista.FECHAEXPIRAFIN)}</Text></TableCell>
                  <TableCell>
                    <FlexBox direction={FlexBoxDirection.Column}>
                      <Text style={{ fontSize: '0.875rem' }}>{lista.REGUSER || 'N/A'}</Text>
                    </FlexBox>
                  </TableCell>
                  <TableCell>
                    <FlexBox direction={FlexBoxDirection.Column}>
                      <Text style={{ fontSize: '0.875rem' }}>{lista.MODUSER || 'N/A'}</Text>
                      <Text style={{ fontSize: '0.75rem', color: '#666' }}>{formatDate(lista.MODDATE)}</Text>
                    </FlexBox>
                  </TableCell>
                  <TableCell>
                    <ObjectStatus state={status.state}>{status.text}</ObjectStatus>
                  </TableCell>
                  <TableCell>
                    <FlexBox style={{ gap: '0.25rem' }}>
                      <Button icon="edit" design="Transparent" onClick={() => handleEdit(lista)} />
                      <Button icon="delete" design="Transparent" onClick={() => handleDelete(lista)} />
                    </FlexBox>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}

        {/* === Footer de información === */}
        {listas.length > 0 && (
          <FlexBox
            justifyContent="SpaceBetween"
            alignItems="Center"
            style={{ marginTop: '1rem', padding: '0.5rem 0', borderTop: '1px solid #e0e0e0' }}
          >
            <Text style={{ fontSize: '0.875rem', color: '#666' }}>
              Mostrando {filteredListas.length} listas
            </Text>
            <FlexBox style={{ gap: '1rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Activas: {listas.filter(l => l.ACTIVED === true).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Eliminadas: {listas.filter(l => l.DELETED === true).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Total: {listas.length}
              </Text>
            </FlexBox>
          </FlexBox>
        )}
      </div>

      {/* === Modal === */}
      <PreciosListasModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        lista={editingLista}
      />
    </Card>
  );
};

export default PreciosListasTable;
