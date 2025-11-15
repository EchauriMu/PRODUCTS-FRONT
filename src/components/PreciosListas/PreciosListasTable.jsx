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
import PrecioSkuModal from './PrecioListaSkuModal';
import SKUButton from './PreciosListasSKUButton';
import { createActionHandlers } from './PreciosListasActions';

const PreciosListasTable = () => {
  const [listas, setListas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLista, setEditingLista] = useState(null);
  const [messageStrip, setMessageStrip] = useState(null);
  const [selectedListas, setSelectedListas] = useState(new Set()); // Para rastrear listas seleccionadas
  const [selectedSKU, setSelectedSKU] = useState(null); // Para el modal de precios del SKU: { skuId, skusList }

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

  // === Inicializar handlers de acciones ===
  const {
    handleAdd,
    handleSave,
    handleToggleStatus,
    handleDeleteSelected
  } = createActionHandlers(
    setEditingLista,
    setIsModalOpen,
    setError,
    setLoading,
    setSelectedListas,
    setMessageStrip,
    fetchListas,
    listas,
    selectedListas
  );

  // === Handlers CRUD ===
  // Removido: handlers ahora vienen de createActionHandlers

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLista(null);
  };

  // === Handler para expandir/contraer SKUs ===
  // === Handler para abrir modal de SKU ===
  const handleSKUClick = (skuId, skusList, idListaOK) => {
    setSelectedSKU({ skuId, skusList, idListaOK });
  };

  const handleCloseSKUModal = () => {
    setSelectedSKU(null);
  };

  const handleSKUModalUpdate = () => {
    fetchListas();
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
  // Removido: handleToggleStatus y handleDeleteSelected ahora vienen de createActionHandlers

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
    <div style={{ margin: '1rem' }}>
      {/* 1. BARRA SUPERIOR (Fuera de Card) */}
      <FlexBox 
        alignItems="Center" 
        justifyContent="SpaceBetween" 
        style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem 0', 
          borderBottom: '1px solid #ccc' 
        }}
      >
        {/* Título y Subtítulo */}
        <FlexBox direction="Column">
          <Title level="H3">Listas de Precios</Title>
          <Text style={{ color: '#666' }}>{filteredListas.length} listas encontradas</Text>
        </FlexBox>

        {/* Acciones */}
        <FlexBox alignItems="Center" justifyContent="End" style={{ gap: '1rem' }}>
          {/* Búsqueda */}
          <Input
            icon={<Icon name="search" />}
            placeholder="Buscar por descripción o SKU..."
            onInput={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
          />
          
          {/* Botones de Acción */}
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

          {/* Botón Activar/Desactivar */}
          <Button 
            icon="accept" 
            design="Positive" 
            disabled={selectedListas.size === 0 || loading}
            onClick={handleToggleStatus}
          >
            {selectedListas.size > 0 
              ? Array.from(selectedListas).some(id => {
                  const lista = listas.find(l => l.IDLISTAOK === id);
                  return lista && (lista.ACTIVED === false || lista.DELETED === true);
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
        </FlexBox>
      </FlexBox>

      {/* 2. CARD para el contenido de la tabla */}
      <Card
        style={{ maxWidth: '100%' }}
      >
        <div style={{ padding: '1rem' }}>
          {/* Mensajes de éxito/error */}
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
                  onClick={(e) => {
                    // No abrir modal si el click fue en el checkbox
                    if (e.target.tagName === 'INPUT' || e.target.closest('[role="checkbox"]')) {
                      return;
                    }
                    if (lista.SKUSIDS && lista.SKUSIDS.length > 0) {
                      handleSKUClick(lista.SKUSIDS[0], lista.SKUSIDS, lista.IDLISTAOK);
                    }
                  }}
                  style={{
                    backgroundColor: selectedListas.has(lista.IDLISTAOK) ? '#f0f7ff' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <CheckBox
                        checked={selectedListas.has(lista.IDLISTAOK)}
                        onChange={() => handleSelectLista(lista.IDLISTAOK)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {lista.IDLISTAOK}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(lista.SKUSIDS) && lista.SKUSIDS.length > 0 ? (
                      <SKUButton 
                        skuId={lista.SKUSIDS[0]}
                        skusCount={lista.SKUSIDS.length}
                        skusList={lista.SKUSIDS}
                        onSkuClick={() => handleSKUClick(lista.SKUSIDS[0], lista.SKUSIDS, lista.IDLISTAOK)}
                      />
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
      </Card>

      {/* === Modal === */}
      <PreciosListasModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        lista={editingLista}
      />

      {/* === Modal de Precios del SKU === */}
      <PrecioSkuModal
        skuId={selectedSKU?.skuId}
        skusList={selectedSKU?.skusList}
        idListaOK={selectedSKU?.idListaOK}
        open={!!selectedSKU}
        onClose={handleCloseSKUModal}
      />
    </div>
  );
};

export default PreciosListasTable;
