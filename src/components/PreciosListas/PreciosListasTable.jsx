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
  MessageStrip,
  BusyIndicator,
  FlexBox,
  FlexBoxJustifyContent,
  FlexBoxDirection,
  Text,
  Icon,
  Label,
  CheckBox,
  Tag
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
  const [messageStrip, setMessageStrip] = useState(null);
  const [expandedSKURows, setExpandedSKURows] = useState({});
  const [selectedListas, setSelectedListas] = useState(new Set()); // Para rastrear listas seleccionadas // Para rastrear filas expandidas

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
    if (!lista.IDLISTAOK) {
      setError('ID de lista no válido');
      return;
    }

    if (window.confirm(`¿Está seguro que desea eliminar permanentemente la lista "${lista.DESLISTA}"? Esta acción no se puede deshacer.`)) {
      setLoading(true);
      try {
        console.log('Iniciando eliminación de lista:', lista.IDLISTAOK);
        
        // Intentar eliminar la lista
        await preciosListasService.delete(lista.IDLISTAOK);
        
        // Si llegamos aquí, la eliminación fue exitosa
        console.log('Lista eliminada exitosamente');
        
        // Actualizar la interfaz
        await fetchListas();
        setError('');
        
        // Mostrar mensaje de éxito temporal
        setMessageStrip({
          message: `Lista "${lista.DESLISTA}" eliminada exitosamente`,
          type: 'Success'
        });
        setTimeout(() => setMessageStrip(null), 3000);
        
      } catch (err) {
        console.error('Error al eliminar:', err);
        
        // Extraer el mensaje de error más relevante
        let errorMessage;
        if (err.response?.data?.messageUSR) {
          errorMessage = err.response.data.messageUSR;
        } else if (err.response?.status === 400) {
          errorMessage = 'Error en la solicitud. Verifique los datos.';
        } else if (err.response?.status === 404) {
          errorMessage = 'La lista no existe o ya fue eliminada.';
        } else {
          errorMessage = err.message || 'Error desconocido al eliminar la lista de precios';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleSave = async (listaData) => {
    setLoading(true);
    try {
      if (editingLista) {
        // Si cambia el estado ACTIVED, llama a ActivateOne o DeleteLogic
        if (typeof listaData.ACTIVED !== 'undefined' && editingLista.ACTIVED !== listaData.ACTIVED) {
          if (listaData.ACTIVED) {
            // Activar
            await preciosListasService.activate(editingLista.IDLISTAOK);
          } else {
            // Desactivar (lógica)
            await preciosListasService.deleteLogic(editingLista.IDLISTAOK);
          }
        } else {
          // Actualización normal
          await preciosListasService.update(editingLista.IDLISTAOK, listaData);
        }
      } else {
        // Crear nueva lista
        await preciosListasService.create(listaData);
      }
      await fetchListas(); // Recargar datos
      setIsModalOpen(false);
      setError('');
    } catch (err) {
      setError('Error al guardar la lista de precios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLista(null);
  };

  // === Handler para expandir/contraer SKUs ===
  const handleToggleSKUExpand = (listaId) => {
    setExpandedSKURows(prev => ({
      ...prev,
      [listaId]: !prev[listaId]
    }));
  };

  // === Handlers para selección ===
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedListas(new Set(filteredListas.map(l => l.IDLISTAOK)));
    } else {
      setSelectedListas(new Set());
    }
  };

  const handleSelectLista = (listaId) => {
    setSelectedListas(prev => {
      const next = new Set(prev);
      if (next.has(listaId)) {
        next.delete(listaId);
      } else {
        next.add(listaId);
      }
      return next;
    });
  };

  // === Handlers para acciones en lote ===
  const handleToggleStatus = async () => {
    if (selectedListas.size === 0) return;
    
    // Determinar si la mayoría están activas o inactivas
    const listasArray = Array.from(selectedListas).map(id => listas.find(l => l.IDLISTAOK === id));
    const activasCount = listasArray.filter(l => l && l.ACTIVED === true).length;
    const inactivasCount = listasArray.filter(l => l && (l.ACTIVED === false || l.DELETED === true)).length;
    
    // Si la mayoría están activas, desactivas. Si la mayoría están inactivas, activas.
    const shouldActivate = inactivasCount > activasCount;
    const action = shouldActivate ? 'activar' : 'desactivar';
    
    if (!window.confirm(`¿Está seguro que desea ${action} ${selectedListas.size} lista(s)?`)) return;

    setLoading(true);
    try {
      for (const listaId of selectedListas) {
        if (shouldActivate) {
          await preciosListasService.activate(listaId);
        } else {
          await preciosListasService.deleteLogic(listaId);
        }
      }
      await fetchListas();
      setSelectedListas(new Set());
      setError('');
    } catch (err) {
      setError(`Error al ${action} listas: ` + (err.response?.data?.messageUSR || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedListas.size === 0) return;
    if (!window.confirm(`¿Está seguro que desea eliminar permanentemente ${selectedListas.size} lista(s)? Esta acción no se puede deshacer.`)) return;

    setLoading(true);
    try {
      for (const listaId of selectedListas) {
        await preciosListasService.delete(listaId);
      }
      await fetchListas();
      setSelectedListas(new Set());
      setError('');
    } catch (err) {
      setError('Error al eliminar listas: ' + (err.response?.data?.messageUSR || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSelected = () => {
    if (selectedListas.size !== 1) return;
    const listaId = Array.from(selectedListas)[0];
    const lista = listas.find(l => l.IDLISTAOK === listaId);
    if (lista) {
      setEditingLista(lista);
      setIsModalOpen(true);
    }
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
    if (lista.DELETED) return { design: 'Negative', text: 'Inactivo' };
    if (lista.ACTIVED) return { design: 'Positive', text: 'Activo' };
    return { design: 'Critical', text: 'Inactivo' };
  };

  const getLastAction = (lista) => {
    // Determinar si fue creado recientemente o modificado
    if (lista.REGDATE && lista.MODDATE) {
      const regDate = new Date(lista.REGDATE);
      const modDate = new Date(lista.MODDATE);
      const isRecent = (modDate.getTime() - regDate.getTime()) < 1000; // menos de 1 segundo = recién creado
      const action = isRecent ? 'CREATE' : 'UPDATE';
      return {
        action,
        user: lista.MODUSER || 'N/A',
        date: lista.MODDATE
      };
    }
    return {
      action: 'CREATE',
      user: lista.REGUSER || 'N/A',
      date: lista.REGDATE
    };
  };

  // === Filtro por descripción o SKU ===
  const filteredListas = listas.filter((lista) => {
  const term = searchTerm.toLowerCase();
  const skus = Array.isArray(lista.SKUSIDS)
    ? lista.SKUSIDS.join(',').toLowerCase()
    : '';

  return (
    lista.DESLISTA?.toLowerCase().includes(term) ||
    skus.includes(term)
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

              {/* Botón Editar */}
              <Button 
                icon="edit" 
                design="Transparent" 
                disabled={selectedListas.size !== 1 || loading}
                onClick={handleEditSelected}
              >
                Editar
              </Button>

              {/* Botón Activar/Desactivar unificado */}
              <Button 
                icon="accept" 
                design="Positive" 
                disabled={selectedListas.size === 0 || loading}
                onClick={handleToggleStatus}
              >
                {selectedListas.size > 0 
                  ? Array.from(selectedListas).some(id => {
                      const lista = listas.find(l => l.IDLISTAOK === id);
                      return lista && lista.ACTIVED === false || lista.DELETED === true;
                    })
                    ? 'Activar'
                    : 'Desactivar'
                  : 'Activar'}
              </Button>

              {/* Botón Eliminar */}
              <Button 
                icon="delete" 
                design="Negative" 
                disabled={selectedListas.size === 0 || loading}
                onClick={handleDeleteSelected}
              >
                Eliminar
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
            style={{ width: '100%' }}
            headerRow={
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <CheckBox
                    checked={filteredListas.length > 0 && selectedListas.size === filteredListas.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>ID Lista</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>SKU ID</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Descripción</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Instituto</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Tipo Lista</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Tipo General</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Tipo Fórmula</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Inicio Vigencia</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Fin Vigencia</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Registro</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Modificación</Text></TableCell>
                <TableCell style={{ fontWeight: 'bold' }}><Text>Estado</Text></TableCell>
              </TableRow>
            }
          >
            {filteredListas.map((lista, index) => {
              const status = getListaStatus(lista);
              const lastAction = getLastAction(lista);
              return (
                <TableRow 
                  key={lista.IDLISTAOK || index} 
                  className="ui5-table-row-hover"
                  style={{
                    backgroundColor: selectedListas.has(lista.IDLISTAOK) ? '#f0f7ff' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <TableCell>
                    <CheckBox
                      checked={selectedListas.has(lista.IDLISTAOK)}
                      onChange={() => handleSelectLista(lista.IDLISTAOK)}
                    />
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {lista.IDLISTAOK}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(lista.SKUSIDS) && lista.SKUSIDS.length > 0 ? (
                      <FlexBox direction="Column" style={{ gap: '0.25rem' }}>
                        <Label 
                          onClick={() => handleToggleSKUExpand(lista.IDLISTAOK)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '0.25rem',
                            fontSize: '0.55rem',
                            fontWeight: '600',
                            display: 'inline-block',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: expandedSKURows[lista.IDLISTAOK] ? '1px solid #1976d2' : '1px solid transparent',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {lista.SKUSIDS[0]} {lista.SKUSIDS.length > 1 && `+${lista.SKUSIDS.length - 1}`}
                        </Label>
                        
                        {expandedSKURows[lista.IDLISTAOK] && (
                          <FlexBox direction="Column" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                            {lista.SKUSIDS.map((sku, idx) => (
                              <Label
                                key={idx}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#f5f5f5ff',
                                  color: '#333',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.5rem',
                                  border: '1px solid #ddd',
                                  display: 'inline-block'
                                }}
                              >
                                {sku}
                              </Label>
                            ))}
                          </FlexBox>
                        )}
                      </FlexBox>
                    ) : (
                      <Text>-</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontWeight: '500' }}>
                      {lista.DESLISTA || '-'}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text>{lista.IDINSTITUTOOK || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{lista.IDTIPOLISTAOK || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{lista.IDTIPOGENERALISTAOK || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{lista.IDTIPOFORMULAOK || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontSize: '0.875rem' }}>
                      {formatDate(lista.FECHAEXPIRAINI)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontSize: '0.875rem' }}>
                      {formatDate(lista.FECHAEXPIRAFIN)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <FlexBox direction={FlexBoxDirection.Column}>
                      <Text style={{ fontSize: '0.875rem' }}>
                        {lista.REGUSER || 'N/A'}
                      </Text>
                    </FlexBox>
                  </TableCell>
                  <TableCell>
                    <FlexBox direction={FlexBoxDirection.Column}>
                      <Label
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: lastAction.action === 'CREATE' ? '#e8f5e8' : '#fff3e0',
                          color: lastAction.action === 'CREATE' ? '#2e7d32' : '#f57c00',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-block',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {lastAction.action}
                      </Label>
                      <Text 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          display: 'block'
                        }}
                      >
                        {lastAction.user} - {formatDate(lastAction.date)}
                      </Text>
                    </FlexBox>
                  </TableCell>
                  <TableCell>
                    <Tag design={status.design}>
                      {status.text}
                    </Tag>
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
                Seleccionadas: {selectedListas.size}
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
