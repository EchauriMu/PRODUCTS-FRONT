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
  FlexBoxDirection,
  Label,
  Button,
  Input,
  CheckBox,
  Tag,
  Icon
} from '@ui5/webcomponents-react';
import categoriasService from '../../api/categoriasService';
import CategoriaDetailModal from './CategoriaDetailModal';

const CategoriasTableCard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [modalCategory, setModalCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  // Debounce searchTerm to avoid filtering on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCategories(new Set(categories.map(cat => cat.CATID)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleToggleStatus = async () => {
    if (selectedCategories.size === 0) return;
    
    // Determinar si la mayoría están activas o inactivas
    const categoriesArray = Array.from(selectedCategories).map(id => categories.find(c => c.CATID === id));
    const activasCount = categoriesArray.filter(c => c && c.ACTIVED === true).length;
    const inactivasCount = categoriesArray.filter(c => c && (c.ACTIVED === false || c.DELETED === true)).length;
    
    // Si la mayoría están activas, desactivas. Si la mayoría están inactivas, activas.
    const shouldActivate = inactivasCount > activasCount;
    const action = shouldActivate ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro que desea ${action} ${selectedCategories.size} categoría(s)?`)) return;

    setLoading(true);
    try {
      for (const catId of selectedCategories) {
        if (shouldActivate) {
          await categoriasService.UpdateOneZTCategoria(catId, { ACTIVED: true });
        } else {
          await categoriasService.UpdateOneZTCategoria(catId, { ACTIVED: false });
        }
      }
      await loadCategories();
      setSelectedCategories(new Set());
      setError('');
    } catch (err) {
      setError(`Error al ${action} categorías: ` + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías desde la API
  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await categoriasService.GetAllZTCategorias();
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
    if (cat.DELETED === true) return { design: 'Negative', text: 'Eliminada' };
    if (cat.ACTIVED === true) return { design: 'Positive', text: 'Activa' };
    return { design: 'Critical', text: 'Inactiva' };
  };

  const getLastAction = (cat) => {
    // Determinar si fue creado recientemente o modificado
    if (cat.REGDATE && cat.MODDATE) {
      const regDate = new Date(cat.REGDATE);
      const modDate = new Date(cat.MODDATE);
      const isRecent = (modDate.getTime() - regDate.getTime()) < 1000; // menos de 1 segundo = recién creado
      const action = isRecent ? 'CREATE' : 'UPDATE';
      return {
        action,
        user: cat.MODUSER || 'N/A',
        date: cat.MODDATE
      };
    }
    return {
      action: 'CREATE',
      user: cat.REGUSER || 'N/A',
      date: cat.REGDATE
    };
  };

  const handleRowClick = useCallback((cat) => {
    setSelectedCategory(cat);
  }, []);

  const handleRowDoubleClick = useCallback((cat) => {
    setModalCategory(cat);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalCategory(null);
    loadCategories();
  }, []);

  // Calcular categorías filtradas
  const filteredCategories = categories.filter(cat => {
    if (!debouncedTerm) return true;
    const term = debouncedTerm;
    return (
      (cat.Nombre || '').toLowerCase().includes(term) ||
      (cat.CATID || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: '0', position: 'relative', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
      <FlexBox 
        justifyContent="SpaceBetween" 
        alignItems="Center"
        style={{ 
          zIndex: 100,
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <FlexBox alignItems="Center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <Title level="H3">Categorías</Title>
        </FlexBox>
        <Text style={{ color: '#666', fontSize: '0.875rem' }}>{filteredCategories.length} categorías encontradas</Text>
      </FlexBox>

      {/* Barra de filtros y acciones - STICKY */}
      <FlexBox 
        justifyContent="SpaceBetween" 
        alignItems="Center"
        style={{ 
          position: 'sticky',
          top: '0',
          zIndex: 99,
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: '1 1 300px', minWidth: '250px', flexWrap: 'wrap' }}>
          <Input
            icon={<Icon name="search" />}
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: '150px', maxWidth: '400px' }}
          />
        </FlexBox>
        
        <FlexBox alignItems="Center" style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button icon="add" design="Emphasized" onClick={() => setModalCategory({})} style={{ whiteSpace: 'nowrap' }}>
            Crear Categoría
          </Button>
          <Button 
            icon="edit" 
            design="Transparent" 
            disabled={selectedCategories.size !== 1 || loading}
            onClick={() => {
              const catId = Array.from(selectedCategories)[0];
              const cat = categories.find(c => c.CATID === catId);
              setModalCategory(cat);
            }}
          >
            Editar
          </Button>
          <Button 
            icon="accept" 
            design="Positive" 
            disabled={selectedCategories.size === 0 || loading}
            onClick={handleToggleStatus}
          >
            {selectedCategories.size > 0 
              ? Array.from(selectedCategories).some(id => {
                  const cat = categories.find(c => c.CATID === id);
                  return cat && (cat.ACTIVED === false || cat.DELETED === true);
                })
                ? 'Activar'
                : 'Desactivar'
              : 'Activar'}
          </Button>
          <Button 
            icon="delete" 
            design="Negative" 
            disabled={selectedCategories.size === 0 || loading}
            onClick={async () => {
              if (!confirm(`¿Eliminar permanentemente ${selectedCategories.size} categorías?`)) return;
              setLoading(true);
              try {
                for (const catId of selectedCategories) {
                  await categoriasService.DeleteHardZTCategoria(catId);
                }
                await loadCategories();
                setSelectedCategories(new Set());
              } catch (err) {
                setError(err.response?.data?.message || err.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Eliminar
          </Button>

          {loading && <BusyIndicator active size="Small" />}
        </FlexBox>
      </FlexBox>

      <Card style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <CardHeader titleText={`Total: ${filteredCategories.length}`} />
        <div style={{ padding: '1rem' }}>
          {/* Mensajes de error */}
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
              style={{ width: '100%' }}
              headerRow={
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold' }}>
                    <CheckBox
                      checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                      onChange={handleSelectAll}
                      style={{ margin: 0 }}
                    />
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>CATID</Text></TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>Nombre</Text></TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>Padre</Text></TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>Fecha</Text></TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>Modificación</Text></TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}><Text>Estado</Text></TableCell>
                </TableRow>
              }
            >
              {filteredCategories.map((cat, index) => {
                const status = getStatus(cat);
                const lastAction = getLastAction(cat);
                return (
                  <TableRow
                    key={cat.CATID || index}
                    onDoubleClick={() => handleRowDoubleClick(cat)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedCategories.has(cat.CATID) ? '#f0f7ff' : 'transparent'
                    }}
                    className="ui5-table-row-hover"
                  >
                    <TableCell>
                      <CheckBox
                        checked={selectedCategories.has(cat.CATID)}
                        onChange={() => handleSelectCategory(cat.CATID)}
                        style={{ margin: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Label 
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          display: 'inline-block',
                          border: '1px solid #90caf9',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          maxWidth: '150px'
                        }}
                      >
                        {cat.CATID || `CAT-${index + 1}`}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Text style={{ fontWeight: '500', fontSize: '0.65rem', color: '#32363a', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {cat.Nombre || 'Sin nombre'}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Label 
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          display: 'inline-block',
                          border: '1px solid #81c784',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          maxWidth: '150px'
                        }}
                      >
                        {cat.PadreCATID || 'N/A'}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Text style={{ fontSize: '0.875rem' }}>
                        {formatDate(cat.REGDATE)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <FlexBox direction="Column">
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
        </div>
      </Card>

      

      {/* Modal Detalle Categoría */}
      <CategoriaDetailModal
        category={modalCategory}
        open={!!modalCategory}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CategoriasTableCard;
