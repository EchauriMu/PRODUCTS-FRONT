/*
 * =================================================================================
 * Componente: PromotionsTableCard
 * Descripción: Tabla de promociones con filtros, paginación y acciones masivas
 * Autores: LAURA PANIAGUA, ALBERTO PARDO
 * =================================================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ObjectStatus,
  Input,
  Button,
  CheckBox,
  Icon,
  Tag,
  Select,
  Option
} from '@ui5/webcomponents-react'; 
import promoService from '../../api/promoService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';

/* ESTADO Y CONFIGURACIÓN */
const PromotionsTableCard = ({ onPromotionClick, onCreateClick, activeView = 'promotions', onViewChange }) => {
  const { dialogState, showConfirm, showWarning, closeDialog } = useDialog();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'scheduled', 'finished'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar promociones al montar el componente
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await promoService.getAllPromotions();
      
      // Estructura específica de tu API: data.value[0].data[0].dataRes
      let promotionsList = [];
      
      if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
        const mainResponse = data.value[0];
        if (mainResponse.data && Array.isArray(mainResponse.data) && mainResponse.data.length > 0) {
          const dataResponse = mainResponse.data[0];
          if (dataResponse.dataRes && Array.isArray(dataResponse.dataRes)) {
            promotionsList = dataResponse.dataRes;
          }
        }
      }
      
      setPromotions(promotionsList);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar promociones';
      setError(`Error al obtener promociones: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el estado de la promoción
  const getPromotionStatusType = (promotion) => {
    if (!promotion) return 'finished';
    
    // Si está eliminada o no activa
    if (promotion.DELETED === true || promotion.ACTIVED === false) {
      return 'finished';
    }
    
    const today = new Date();
    const inicio = new Date(promotion.FechaIni);
    const fin = new Date(promotion.FechaFin);
    
    if (today < inicio) return 'scheduled';
    if (today >= inicio && today <= fin) return 'active';
    return 'finished';
  };

  // Filtro por búsqueda y estado
  const filteredPromotions = useMemo(() => {
    let filtered = promotions;
    
    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getPromotionStatusType(p) === statusFilter);
    }
    
    // Filtro por búsqueda
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.IdPromoOK || '').toLowerCase().includes(term) ||
        (p.Titulo || '').toLowerCase().includes(term) ||
        (p.Descripcion || '').toLowerCase().includes(term) ||
        (p.SKUID || '').toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [promotions, search, statusFilter]);

  // Paginación
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredPromotions.slice(start, end);
  }, [filteredPromotions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPromotions.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = (checked) => {
    if (checked) setSelectedIds(new Set(paginatedPromotions.map(p => p.IdPromoOK)));
    else setSelectedIds(new Set());
  };

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const promo = promotions.find(p => p.IdPromoOK === id);
    if (promo && onPromotionClick) onPromotionClick(promo);
  };

  // Determinar qué acción tomar según el estado de las promociones seleccionadas
  const getToggleAction = () => {
    if (selectedIds.size === 0) return null;
    
    const selectedPromotions = promotions.filter(p => selectedIds.has(p.IdPromoOK));
    const activeCount = selectedPromotions.filter(p => p.ACTIVED === true && p.DELETED !== true).length;
    const inactiveCount = selectedPromotions.length - activeCount;
    
    // Si todas están activas, desactivar
    if (activeCount === selectedPromotions.length) {
      return { action: 'deactivate', label: 'Desactivar', count: activeCount };
    }
    // Si todas están inactivas, activar
    if (inactiveCount === selectedPromotions.length) {
      return { action: 'activate', label: 'Activar', count: inactiveCount };
    }
    // Si hay mezcla, intercambiar estados
    return { action: 'toggle', label: 'Activar/Desactivar', activeCount, inactiveCount };
  };

  // Elimina permanentemente de la base de datos (NO reversible)
  const handleDeleteHardSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await showWarning(
      `¿Estás seguro de que quieres eliminar PERMANENTEMENTE ${selectedIds.size} promoción(es)? Esta acción NO se puede deshacer.`,
      'Advertencia: Eliminar Permanentemente',
      { confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const idsArray = Array.from(selectedIds);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Hacer llamadas individuales para cada ID
      for (const id of idsArray) {
        try {
          await promoService.deletePromotionHard(id);
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push({ id, error: err.message });
        }
      }
      
      // Mostrar mensaje según resultados
      if (errorCount === 0) {
        setInfo(`Se eliminaron permanentemente ${successCount} promoción(es) exitosamente`);
      } else if (successCount === 0) {
        setError(`Error: No se pudo eliminar ninguna promoción`);
      } else {
        setInfo(`Se eliminaron ${successCount} de ${idsArray.length} promoción(es). ${errorCount} fallaron.`);
      }
      
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error eliminando permanentemente promociones');
    } finally {
      setLoading(false);
    }
  };

  // Maneja el toggle de estado: activar, desactivar o intercambiar
  const handleToggleSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const toggleAction = getToggleAction();
    if (!toggleAction) return;
    
    // Preparar mensaje de confirmación
    let confirmMessage = '';
    let confirmTitle = '';
    
    if (toggleAction.action === 'activate') {
      confirmMessage = `¿Estás seguro de que quieres activar ${toggleAction.count} promoción(es)?`;
      confirmTitle = 'Activar Promociones';
    } else if (toggleAction.action === 'deactivate') {
      confirmMessage = `¿Estás seguro de que quieres desactivar ${toggleAction.count} promoción(es)?`;
      confirmTitle = 'Desactivar Promociones';
    } else {
      confirmMessage = `Se activarán ${toggleAction.inactiveCount} promoción(es) y se desactivarán ${toggleAction.activeCount}. ¿Continuar?`;
      confirmTitle = 'Intercambiar Estados';
    }
    
    const confirmed = await showConfirm(confirmMessage, confirmTitle);
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const selectedPromotions = promotions.filter(p => selectedIds.has(p.IdPromoOK));
      let activatedCount = 0;
      let deactivatedCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Procesar cada promoción según su estado actual
      for (const promo of selectedPromotions) {
        const isActive = promo.ACTIVED === true && promo.DELETED !== true;
        
        try {
          if (toggleAction.action === 'activate') {
            // Solo activar
            await promoService.activatePromotion(promo.IdPromoOK);
            activatedCount++;
          } else if (toggleAction.action === 'deactivate') {
            // Solo desactivar
            await promoService.deletePromotionLogic(promo.IdPromoOK);
            deactivatedCount++;
          } else {
            // Intercambiar: si está activa, desactivar; si está inactiva, activar
            if (isActive) {
              await promoService.deletePromotionLogic(promo.IdPromoOK);
              deactivatedCount++;
            } else {
              await promoService.activatePromotion(promo.IdPromoOK);
              activatedCount++;
            }
          }
        } catch (err) {
          errorCount++;
          errors.push({ id: promo.IdPromoOK, error: err.message });
        }
      }
      
      // Mostrar mensaje según resultados
      if (errorCount === 0) {
        if (toggleAction.action === 'toggle') {
          setInfo(`Se activaron ${activatedCount} y se desactivaron ${deactivatedCount} promoción(es) exitosamente`);
        } else if (toggleAction.action === 'activate') {
          setInfo(`Se activaron ${activatedCount} promoción(es) exitosamente`);
        } else {
          setInfo(`Se desactivaron ${deactivatedCount} promoción(es) exitosamente`);
        }
      } else {
        const totalSuccess = activatedCount + deactivatedCount;
        if (totalSuccess === 0) {
          setError(`Error: No se pudo procesar ninguna promoción`);
        } else {
          setInfo(`Se procesaron ${totalSuccess} de ${selectedPromotions.length} promoción(es). ${errorCount} fallaron.`);
        }
      }
      
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error procesando promociones');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear porcentaje de descuento
  const formatDiscount = (discount) => {
    if (!discount && discount !== 0) return '0%';
    return `${parseFloat(discount).toFixed(1)}%`;
  };

  // Función para obtener estado de la promoción
  const getPromotionStatus = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.FechaIni);
    const endDate = new Date(promotion.FechaFin);
    
    // Usar los campos ACTIVED y DELETED de tu API
    // Si está eliminada lógicamente (DELETED: true), mostrar como Inactiva
    if (promotion.DELETED === true) {
      return { design: 'Negative', text: 'Inactiva' };
    }
    
    // Si ACTIVED es false, mostrar como Inactiva
    if (promotion.ACTIVED === false) {
      return { design: 'Negative', text: 'Inactiva' };
    }
    
    // Verificar fechas de vigencia
    if (now < startDate) {
      return { design: 'Information', text: 'Programada' };
    }
    
    if (now > endDate) {
      return { design: 'Critical', text: 'Expirada' };
    }
    
    if (promotion.ACTIVED === true && now >= startDate && now <= endDate) {
      return { design: 'Positive', text: 'Activa' };
    }
    
    return { design: 'Neutral', text: 'Desconocido' };
  };

  // Función para formatear fechas
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

  // Función para formatear rango de fechas
  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  };

  // Función para obtener el tipo de descuento y valor
  const getDiscountInfo = (promotion) => {
    // Buscar diferentes campos de descuento en tu API
    const discountPercentage = promotion['Descuento%'] || promotion.DescuentoPorcentaje || 0;
    
    return {
      value: discountPercentage,
      formatted: formatDiscount(discountPercentage)
    };
  };

  // Función para determinar si la promoción está vigente
  const isPromotionActive = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.FechaIni);
    const endDate = new Date(promotion.FechaFin);
    
    return promotion.ACTIVED === true && 
           now >= startDate && 
           now <= endDate && 
           promotion.DELETED !== true;
  };

  const handleRowClick = useCallback((promotion) => {
    setSelectedPromotion(promotion);
    
    if (onPromotionClick) {
      onPromotionClick(promotion);
    }
  }, [onPromotionClick]);

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
          <Title level="H3">Lista de Promociones</Title>
          {/* Botones de vista */}
          {onViewChange && (
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button
                design={activeView === 'promotions' ? 'Emphasized' : 'Transparent'}
                onClick={() => onViewChange('promotions')}
              >
                Promociones
              </Button>
              <Button
                design={activeView === 'calendar' ? 'Emphasized' : 'Transparent'}
                onClick={() => onViewChange('calendar')}
              >
                Calendario
              </Button>
            </FlexBox>
          )}
        </FlexBox>
        <Text style={{ color: '#666', fontSize: '0.875rem' }}>
          {filteredPromotions.length} promociones encontradas
        </Text>
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
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <Option value="all">Todas</Option>
            <Option value="active">Activas</Option>
            <Option value="scheduled">Programadas</Option>
            <Option value="finished">Finalizadas</Option>
          </Select>
          <Input
            placeholder="Buscar por producto, SKU, marca..."
            value={search}
            onInput={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: '150px', maxWidth: '400px' }}
            icon={<Icon name="search" />}
          />
        </FlexBox>
        
        <FlexBox alignItems="Center" style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {onCreateClick && (
            <Button
              design="Emphasized"
              icon="add"
              onClick={onCreateClick}
              style={{ whiteSpace: 'nowrap' }}
            >
              Nueva Promoción
            </Button>
          )}
          <Button
            icon="edit"
            onClick={handleEditSelected}
            disabled={selectedIds.size !== 1}
            style={{ 
              backgroundColor: '#E3F2FD',
              color: '#1976D2',
              border: 'none'
            }}
          >
            Editar
          </Button>
          <Button
            icon={(() => {
              const action = getToggleAction();
              if (!action) return 'activate';
              if (action.action === 'activate') return 'activate';
              if (action.action === 'deactivate') return 'decline';
              return 'switch-views';
            })()}
            onClick={handleToggleSelected}
            disabled={selectedIds.size === 0}
            style={{ 
              backgroundColor: (() => {
                const action = getToggleAction();
                if (!action) return '#E8F5E9';
                if (action.action === 'activate') return '#E8F5E9';
                if (action.action === 'deactivate') return '#FFF3E0';
                return '#E3F2FD';
              })(),
              color: (() => {
                const action = getToggleAction();
                if (!action) return '#2E7D32';
                if (action.action === 'activate') return '#2E7D32';
                if (action.action === 'deactivate') return '#E65100';
                return '#1976D2';
              })(),
              border: 'none'
            }}
            tooltip={(() => {
              const action = getToggleAction();
              if (!action) return '';
              if (action.action === 'activate') return 'Activar promociones seleccionadas';
              if (action.action === 'deactivate') return 'Desactivar promociones seleccionadas';
              return `Intercambiar: activar ${action.inactiveCount} e inactivar ${action.activeCount}`;
            })()}
          >
            {(() => {
              const action = getToggleAction();
              if (!action) return 'Activar';
              return action.label;
            })()}
          </Button>
          <Button
            icon="delete"
            onClick={handleDeleteHardSelected}
            disabled={selectedIds.size === 0}
            style={{ 
              backgroundColor: '#FCE4EC',
              color: '#C2185B',
              border: 'none'
            }}
            tooltip="Eliminar permanentemente (NO reversible)"
          >
            Eliminar
          </Button>
          {loading && <BusyIndicator active size="Small" />}
        </FlexBox>
      </FlexBox>

      {/* Mensajes */}
      {info && (
        <MessageStrip type="Positive" style={{ marginBottom: '0.5rem' }} onClose={() => setInfo('')}>
          {info}
        </MessageStrip>
      )}
      {error && (
        <MessageStrip 
          type="Negative" 
          style={{ marginBottom: '1rem' }}
          onClose={() => setError('')}
        >
          {error}
        </MessageStrip>
      )}

      {/* Contenedor de la tabla */}
      <Card style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <div style={{ padding: '0', minWidth: '800px' }}>
          {loading && promotions.length === 0 ? (
            <FlexBox 
              justifyContent="Center" 
              alignItems="Center" 
              style={{ height: '200px', flexDirection: 'column' }}
            >
              <BusyIndicator active />
              <Text style={{ marginTop: '1rem' }}>Cargando promociones...</Text>
            </FlexBox>
          ) : promotions.length === 0 && !loading ? (
            <FlexBox 
              justifyContent="Center" 
              alignItems="Center" 
            style={{ height: '200px', flexDirection: 'column' }}
          >
            <Title level="H4" style={{ color: '#666', marginBottom: '0.5rem' }}>
              No hay promociones disponibles
            </Title>
            <Text>No se encontraron promociones en el sistema</Text>
          </FlexBox>
        ) : (
          <Table
            noDataText="No hay promociones para mostrar"
            headerRow={
              <TableRow>
                <TableCell style={{ width: '60px', minWidth: '60px' }}>
                  <CheckBox
                    checked={selectedIds.size > 0 && selectedIds.size === paginatedPromotions.length && paginatedPromotions.length > 0}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < paginatedPromotions.length}
                    onChange={(e) => selectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>ID Promoción</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Título</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Descripción</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Descuento</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Vigencia</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Creado Por</Text>
                </TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  <Text>Estado</Text>
                </TableCell>
              </TableRow>
            }
            style={{ width: '100%' }}
            >
            {paginatedPromotions.map((promotion, index) => {
              const promotionStatus = getPromotionStatus(promotion);
              const discountInfo = getDiscountInfo(promotion);
              const isActive = isPromotionActive(promotion);
              
              return (
                <TableRow 
                  key={promotion._id || promotion.IdPromoOK || index}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#f8fff8' : 'transparent'
                  }}
                  className="ui5-table-row-hover"
                  onClick={() => handleRowClick(promotion)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <CheckBox
                      checked={selectedIds.has(promotion.IdPromoOK)}
                      onChange={() => toggleSelect(promotion.IdPromoOK)}
                    />
                  </TableCell>
                  <TableCell>
                    <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {promotion.IdPromoOK || `PROMO-${index + 1}`}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text 
                      style={{ fontWeight: '500' }}
                      title={promotion.Titulo}
                    >
                      {promotion.Titulo || 'Sin título'}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text 
                      style={{ 
                        fontSize: '0.875rem',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={promotion.Descripcion}
                    >
                      {promotion.Descripcion || 'Sin descripción'}
                    </Text>
                  </TableCell>
                  
                  
                  <TableCell>
                    <FlexBox alignItems="Center">
                      <Label
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: discountInfo.value > 0 ? '#e8f5e8' : '#f5f5f5',
                          color: discountInfo.value > 0 ? '#2e7d32' : '#666',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {discountInfo.formatted}
                      </Label>
                    </FlexBox>
                  </TableCell>
                  
                  <TableCell>
                    <Text style={{ fontSize: '0.875rem' }}>
                      {formatDateRange(promotion.FechaIni, promotion.FechaFin)}
                    </Text>
                    <Text 
                      style={{ 
                        fontSize: '0.75rem', 
                        color: isActive ? '#2e7d32' : '#666',
                        display: 'block',
                        fontWeight: isActive ? 'bold' : 'normal'
                      }}
                    >
                      {isActive ? 'VIGENTE' : 'No vigente'}
                    </Text>
                  </TableCell>
                  
                  <TableCell>
                    <Text style={{ fontWeight: '500' }}>
                      {promotion.REGUSER || 'N/A'}
                    </Text>
                    {promotion.REGDATE && (
                      <Text 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          display: 'block'
                        }}
                      >
                        {formatDate(promotion.REGDATE)}
                      </Text>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Tag design={promotionStatus.design}>
                      {promotionStatus.text}
                    </Tag>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}

        {/* Información adicional y paginación en el footer */}
        {promotions.length > 0 && (
          <FlexBox 
            justifyContent="SpaceBetween" 
            alignItems="Center"
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 0',
              borderTop: '1px solid #e0e0e0',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredPromotions.length)} de {filteredPromotions.length}
              </Text>
              <Select
                value={pageSize.toString()}
                onChange={(e) => setPageSize(Number(e.detail.selectedOption.value))}
                style={{ width: '80px' }}
              >
                <Option value="5">5</Option>
                <Option value="10">10</Option>
                <Option value="25">25</Option>
                <Option value="50">50</Option>
                <Option value="100">100</Option>
              </Select>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>por página</Text>
            </FlexBox>
            
            {totalPages > 1 && (
              <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                <Button
                  icon="navigation-left-arrow"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  design="Transparent"
                />
                <Text style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Página {currentPage} de {totalPages}
                </Text>
                <Button
                  icon="navigation-right-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  design="Transparent"
                />
              </FlexBox>
            )}
            
            <FlexBox style={{ gap: '1rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Activas: {filteredPromotions.filter(p => isPromotionActive(p)).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Con descuento: {filteredPromotions.filter(p => getDiscountInfo(p).value > 0).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Promedio descuento: {filteredPromotions.length > 0 ? 
                  (filteredPromotions.reduce((sum, p) => sum + getDiscountInfo(p).value, 0) / filteredPromotions.length).toFixed(1) + '%' : 
                  '0%'
                }
              </Text>
            </FlexBox>
          </FlexBox>
        )}
        </div>
      </Card>

      {/* Diálogo personalizado */}
      <CustomDialog
        open={dialogState.open}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmDesign={dialogState.confirmDesign}
      />
    </div>
  );
};

export default PromotionsTableCard;