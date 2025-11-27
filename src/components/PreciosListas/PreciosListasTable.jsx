import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import PrecioSkuModal from './PrecioListaSkuModal';
import SKUButton from './PreciosListasSKUButton';
import { createActionHandlers } from './PreciosListasActions';

/**
 * ================================================================================
 * TABLA DE LISTAS DE PRECIOS - PreciosListasTable.jsx
 * ================================================================================
 */

const PreciosListasTable = () => {
  const navigate = useNavigate();
  
  // === ESTADOS LOCALES ===
  const [listas, setListas] = useState([]); // Array de todas las listas
  const [error, setError] = useState(''); // Mensaje de error
  const [loading, setLoading] = useState(true); // Indicador de carga
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [messageStrip, setMessageStrip] = useState(null); // Mensaje temporal de éxito
  const [selectedListas, setSelectedListas] = useState(new Set()); // Set de IDs de listas seleccionadas
  const [selectedSKU, setSelectedSKU] = useState(null); // Modal de precios del SKU: { skuId, skusList }

  /**
   *CARGAR LISTAS AL MONTAR EL COMPONENTE
\n   */
  useEffect(() => {
    fetchListas(); 
  }, []);

  /**
   * OBTENER LISTAS DEL SERVIDOR
   */
  const fetchListas = async () => {
    setLoading(true);
    try {
      // Obtener todas las listas del servidor
      const result = await preciosListasService.getAllListas();
      
      // Parsear SKUSIDS si viene como string JSON
      const listasConSkusParsed = result.map(lista => {
        let skusids = lista.SKUSIDS;
        
        // Si es string, parsear (puede ocurrir si se guarda como JSON string)
        if (typeof skusids === 'string') {
          try {
            skusids = JSON.parse(skusids);
          } catch (e) {
            console.warn('No se pudo parsear SKUSIDS:', skusids);
            skusids = [];
          }
        }
        
        // Asegurar que sea array
        if (!Array.isArray(skusids)) {
          console.warn('SKUSIDS no es array después de parsear:', skusids);
          skusids = [];
        }
        
        return {
          ...lista,
          SKUSIDS: skusids
        };
      });
      
      setListas(listasConSkusParsed);
      setError('');
    } catch (err) {
      setError('Error al obtener las listas de precios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === MANEJADORES LOCALES ===
  const handleAdd = () => {
    navigate('/precios-listas/crear');
  };

  const {
    handleToggleStatus,
    handleDeleteSelected
  } = createActionHandlers(
    null, // setEditingLista (no usado)
    null, // setIsModalOpen (no usado)
    setError,
    setLoading,
    setSelectedListas,
    setMessageStrip,
    fetchListas,
    listas,
    selectedListas
  );

  /**
   * ABRIR MODAL DE PRECIOS DEL SKU
   */
  const handleSKUClick = (skuId, skusList, idListaOK) => {
    setSelectedSKU({ skuId, skusList, idListaOK });
  };

  const handleCloseSKUModal = () => {
    setSelectedSKU(null);
  };

  const handleSKUModalUpdate = () => {
    fetchListas();
  };

  /**
   * SELECCIONAR TODAS LAS LISTAS
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Seleccionar todas las listas mostradas (después de filtro)
      setSelectedListas(new Set(filteredListas.map(l => l.IDLISTAOK)));
    } else {
      // Deseleccionar todas
      setSelectedListas(new Set());
    }
  };

  /**
   * SELECCIONAR UNA LISTA INDIVIDUAL
   */
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

  /**
   * EDITAR LA LISTA SELECCIONADA
   */
  const handleEditSelected = () => {
    if (selectedListas.size !== 1) return;
    const listaId = Array.from(selectedListas)[0];
    const lista = listas.find(l => l.IDLISTAOK === listaId);
    if (lista) {
      // Navegar a la página de edición (pasar la lista como state)
      navigate('/precios-listas/crear', { state: { lista, isEditMode: true } });
    }
  };

  /**
   *UTILIDADES PARA FORMATO Y ESTADO
   */
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

  /**
   *FILTRAR LISTAS POR BÚSQUEDA
   */
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
    <div style={{ padding: '0', position: 'relative', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
      {/* === BARRA SUPERIOR: TÍTULO, BÚSQUEDA Y BOTONES === */}
      <FlexBox 
        alignItems="Center" 
        justifyContent="SpaceBetween" 
        direction={window.innerWidth < 768 ? 'Column' : 'Row'}
        style={{ 
          zIndex: 100,
          marginBottom: '1rem', 
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          gap: window.innerWidth < 768 ? '0.75rem' : '0'
        }}
      >
        {/* Título y contador */}
        <FlexBox direction="Column">
          <Title level="H3" style={{ margin: '0' }}>Listas de Precios</Title>
          <Text style={{ color: '#666', fontSize: '0.875rem' }}>{filteredListas.length} listas encontradas</Text>
        </FlexBox>
      </FlexBox>

      {/* === BARRA STICKY DE FILTROS Y ACCIONES === */}
      <FlexBox 
        alignItems="Center" 
        justifyContent="SpaceBetween" 
        direction={window.innerWidth < 768 ? 'Column' : 'Row'}
        style={{ 
          position: 'sticky',
          top: '0',
          zIndex: 99,
          marginBottom: '1rem', 
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          gap: window.innerWidth < 768 ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Búsqueda */}
        <Input
          icon={<Icon name="search" />}
          placeholder="Buscar por descripción o SKU..."
          onInput={(e) => setSearchTerm(e.target.value)}
          style={{ 
            flex: '1 1 200px',
            minWidth: '150px',
            maxWidth: '350px'
          }}
        />
        
        {/* Botones de acciones */}
        <FlexBox 
          alignItems="Center" 
          justifyContent="End" 
          direction={window.innerWidth < 768 ? 'Column' : 'Row'}
          style={{ 
            gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
            width: window.innerWidth < 768 ? '100%' : 'auto',
            flexWrap: 'wrap'
          }}
        >
          <Button 
            icon="refresh" 
            design="Transparent" 
            disabled={loading}
            onClick={fetchListas}
            title="Refrescar tabla"
          >
            Refresh
          </Button>

          <Button design="Emphasized" icon="add" onClick={handleAdd}>
            Crear Lista
          </Button>

          <Button 
            icon="edit" 
            design="Transparent" 
            disabled={selectedListas.size !== 1 || loading}
            onClick={handleEditSelected}
          >
            Editar
          </Button>

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

      {/* === CARD CON LA TABLA === */}
      <Card
        style={{ maxWidth: '100%' }}
      >
        <div style={{ padding: '1rem' }}>
          {/* Mostrar errores si hay */}
          {error && (
            <MessageStrip 
              design="Negative" 
              style={{ marginBottom: '1rem' }}
              onClose={() => setError('')}
            >
              {error}
            </MessageStrip>
          )}

        {/* === ESTADO DE CARGA === */}
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
          // === TABLA DE DATOS ===
          // Renderiza la tabla con todas las listas
          // Cada fila es una lista
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
                    // No abrir modal si el clic fue en el checkbox
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
                  {/* Casilla para seleccionar/deseleccionar la lista */}
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

        {/* === PIE DE PÁGINA CON INFORMACIÓN === */}
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

      {/* === MODAL PARA CREAR/EDITAR LISTA === */}
      {/* 
        Se abre cuando: isModalOpen=true
        Modo CREAR: navegar a /precios-listas/crear
        Modo EDITAR: navegar a /precios-listas/editar/{id}
      */}

      {/* === MODAL PARA PRECIOS DEL SKU === */}
      {/* 
        Se abre cuando haces clic en un SKU en la tabla
        Muestra los precios de ese SKU en esa lista
      */}
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

