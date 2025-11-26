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
 * 
 * Este es el componente PRINCIPAL que:
 * 1. Obtiene todas las listas de precios del servidor
 * 2. Muestra una tabla con todas las listas
 * 3. Permite buscar, filtrar y seleccionar listas
 * 4. Abre modal para crear/editar listas
 * 5. Maneja acciones como activar, desactivar y eliminar
 * 6. Muestra detalles de productos (SKUs) asociados a cada lista
 * 
 * FLUJO PRINCIPAL:\n * 1. Se monta el componente (useEffect línea 39)
 * 2. Se ejecuta fetchListas() que llama a preciosListasService.getAllListas()
 * 3. Se cargan todas las listas en el estado
 * 4. Se renderiza la tabla con las listas
 * 5. Usuario puede hacer clic en botones para crear, editar, activar, etc
 * 6. Las acciones se manejan en PreciosListasActions
 * 7. Se recargan los datos después de cada operación
 * 
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
   * 🔹 CARGAR LISTAS AL MONTAR EL COMPONENTE
   * 
   * ¿QUÉ SUCEDE?\n   * - Se ejecuta una sola vez cuando se monta el componente
   * - Llama fetchListas() que trae todas las listas del servidor
   * - Usa preciosListasService.getAllListas() ← ⭐ ESTA LÍNEA\n   */
  useEffect(() => {
    fetchListas(); 
  }, []);

  /**
   * 🔹 OBTENER LISTAS DEL SERVIDOR
   * 
   * ¿QUÉ SUCEDE?\n   * - Establece loading=true para mostrar indicador
   * - Llama preciosListasService.getAllListas()
   *   URL: POST /ztprecios-listas/preciosListasCRUD?ProcessType=GetAll&ShowInactive=true
   * - Obtiene array de todas las listas
   * - Actualiza el estado listas
   * - Si hay error, muestra mensaje
   * 
   * LLAMADO DESDE:\n   * - useEffect al montar (línea 39-42)
   * - handleSave() después de crear/actualizar/activar/desactivar (Actions línea 73)
   * - handleToggleStatus() después de cambiar estados (Actions línea 99)
   * - handleDeleteSelected() después de eliminar (Actions línea 113)
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
   * 🔹 ABRIR MODAL DE PRECIOS DEL SKU
   * 
   * ¿QUÉ SUCEDE?\n   * - Cuando haces clic en un SKU en la tabla
   * - Se abre un modal mostrando los precios de ese SKU en esa lista
   * 
   * PARÁMETROS:
   * - skuId: ID del SKU (producto)
   * - skusList: Array con todos los SKUs de la lista
   * - idListaOK: ID de la lista
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
   * 🔹 SELECCIONAR TODAS LAS LISTAS
   * 
   * ¿QUÉ SUCEDE?\n   * - Cuando haces clic en el checkbox del encabezado de la tabla
   * - Selecciona o deselecciona todas las listas visibles
   * 
   * PARÁMETRO:
   * - e.target.checked: boolean, si está marcado el checkbox
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
   * 🔹 SELECCIONAR UNA LISTA INDIVIDUAL
   * 
   * ¿QUÉ SUCEDE?\n   * - Cuando haces clic en un checkbox de una fila
   * - Agrega o quita esa lista del Set de seleccionadas
   * 
   * PARÁMETRO:
   * - listaId: ID de la lista a seleccionar/deseleccionar
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
   * 🔹 EDITAR LA LISTA SELECCIONADA
   * 
   * ¿QUÉ SUCEDE?\n   * - Si hay exactamente 1 lista seleccionada
   * - Navega a la página de edición
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
   * 🔹 UTILIDADES PARA FORMATO Y ESTADO
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
   * 🔹 FILTRAR LISTAS POR BÚSQUEDA
   * 
   * ¿QUÉ SUCEDE?\n   * - Filtra las listas según el término de búsqueda
   * - Busca en descripción (DESLISTA) y en SKUs
   * - En tiempo real mientras escribes en el campo de búsqueda
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

/**
 * ================================================================================
 * RESUMEN COMPLETO DEL FLUJO DE PRECIOLISTAS
 * ================================================================================
 * 
 * CREAR NUEVA LISTA:\n * 1. Usuario hace clic en botón "Crear Lista" (línea 142)
 * 2. handleAdd() se ejecuta (PreciosListasActions línea 24-26)
 * 3. Modal se abre con editingLista=null
 * 4. Usuario completa formulario y hace clic "Guardar"
 * 5. Modal valida con Yup
 * 6. onSave(dataToSave) → handleSave() en PreciosListasActions
 * 7. detecta que NO hay editingLista.IDLISTAOK
 * 8. Ejecuta: preciosListasService.create(dataToSave) ← ⭐\n * 9. Backend inserta en BD con ProcessType=AddOne
 * 10. fetchListas() recarga tabla
 * 11. Modal se cierra\n * ACTUALIZAR LISTA:\n * 1. Usuario selecciona lista + clic "Editar" (línea 154)
 * 2. handleEditSelected() se ejecuta (PreciosListasTable línea 107-116)
 * 3. Modal se abre con editingLista={datos}
 * 4. Usuario modifica campos
 * 5. Hace clic "Guardar"
 * 6. Modal valida con Yup
 * 7. onSave(dataToSave) → handleSave() en PreciosListasActions
 * 8. Detecta que SÍ hay editingLista.IDLISTAOK
 * 9. Si NO cambió ACTIVED:
 *    Ejecuta: preciosListasService.update(id, data) ← ⭐ LÍNEA 68 EN ACTIONS\n * 10. Si SÍ cambió ACTIVED:
 *    - Si cambió a TRUE: preciosListasService.activate(id) ← ⭐ LÍNEA 61-62\n *    - Si cambió a FALSE: preciosListasService.deleteLogic(id) ← ⭐ LÍNEA 64-67\n * 11. Backend actualiza en BD
 * 12. fetchListas() recarga tabla
 * 13. Modal se cierra\n * ACTIVAR/DESACTIVAR:\n * 1. Usuario selecciona lista(s) + clic "Activar/Desactivar" (línea 162)
 * 2. handleToggleStatus() se ejecuta (PreciosListasActions línea 118-145)
 * 3. Determina acción según mayoría de estados
 * 4. Loop para cada lista:
 *    - Si activar: preciosListasService.activate(id) ← ⭐ LÍNEA 93-95\n *    - Si desactivar: preciosListasService.deleteLogic(id) ← ⭐ LÍNEA 96-99\n * 5. fetchListas() recarga tabla
 * 6. Limpia selecciones\n * ELIMINAR:\n * 1. Usuario selecciona lista(s) + clic "Eliminar" (línea 174)
 * 2. handleDeleteSelected() se ejecuta (PreciosListasActions línea 146-176)
 * 3. Solicita confirmación
 * 4. Loop para cada lista:
 *    Ejecuta: preciosListasService.delete(id) ← ⭐ LÍNEA 116-117\n * 5. Backend elimina PERMANENTEMENTE (DeleteHard)
 * 6. fetchListas() recarga tabla
 * 7. Limpia selecciones\n * ENDPOINTS UTILIZADOS:\n * - CREATE: POST /ztprecios-listas/preciosListasCRUD?ProcessType=AddOne
 * - UPDATE: POST /ztprecios-listas/preciosListasCRUD?ProcessType=UpdateOne&IDLISTAOK=<id>\n * - ACTIVATE: POST /ztprecios-listas/preciosListasCRUD?ProcessType=ActivateOne&IDLISTAOK=<id>\n * - DEACTIVATE: POST /ztprecios-listas/preciosListasCRUD?ProcessType=DeleteLogic&IDLISTAOK=<id>\n * - DELETE: POST /ztprecios-listas/preciosListasCRUD?ProcessType=DeleteHard&IDLISTAOK=<id>\n * - GET ALL: POST /ztprecios-listas/preciosListasCRUD?ProcessType=GetAll&ShowInactive=true\n * ================================================================================\n */
