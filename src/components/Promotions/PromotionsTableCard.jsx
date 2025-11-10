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
  Tag
} from '@ui5/webcomponents-react'; 
import promoService from '../../api/promoService';

const PromotionsTableCard = ({ onPromotionClick }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState('');

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
      console.error('Error loading promotions:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Filtro por búsqueda
  const filteredPromotions = useMemo(() => {
    if (!search.trim()) return promotions;
    const term = search.toLowerCase();
    return promotions.filter(p =>
      (p.IdPromoOK || '').toLowerCase().includes(term) ||
      (p.Titulo || '').toLowerCase().includes(term) ||
      (p.Descripcion || '').toLowerCase().includes(term) ||
      (p.SKUID || '').toLowerCase().includes(term)
    );
  }, [promotions, search]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = (checked) => {
    if (checked) setSelectedIds(new Set(filteredPromotions.map(p => p.IdPromoOK)));
    else setSelectedIds(new Set());
  };

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    const promo = promotions.find(p => p.IdPromoOK === id);
    if (promo && onPromotionClick) onPromotionClick(promo);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`¿Estás seguro de que quieres desactivar ${selectedIds.size} promoción(es)? Se marcarán como eliminadas pero podrás reactivarlas después.`)) {
      return;
    }
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await promoService.deletePromotion(id);
      }
      setInfo(`Se desactivaron ${selectedIds.size} promoción(es)`);
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error desactivando promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHardSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que quieres eliminar PERMANENTEMENTE ${selectedIds.size} promoción(es)? Esta acción NO se puede deshacer.`)) {
      return;
    }
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await promoService.deletePromotionHard(id);
      }
      setInfo(`Se eliminaron permanentemente ${selectedIds.size} promoción(es)`);
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error eliminando permanentemente promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await promoService.activatePromotion(id);
      }
      setInfo(`Se activaron ${selectedIds.size} promoción(es)`);
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error activando promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await promoService.updatePromotion(id, { ACTIVED: false });
      }
      setInfo(`Se desactivaron ${selectedIds.size} promoción(es)`);
      setSelectedIds(new Set());
      await loadPromotions();
    } catch (e) {
      setError(e.message || 'Error desactivando promociones');
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
    console.log('Selected promotion:', promotion);
    
    // Llamar al callback del componente padre si existe
    if (onPromotionClick) {
      onPromotionClick(promotion);
    }
  }, [onPromotionClick]);

  return (
    <Card
      header={
        <CardHeader 
          titleText="Lista de Promociones"
          subtitleText={`${filteredPromotions.length} promociones encontradas`}
          action={
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Input
                placeholder="Buscar por producto, SKU, marca..."
                value={search}
                onInput={(e) => setSearch(e.target.value)}
                style={{ width: '360px' }}
                icon={<Icon name="search" />}
              />
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
                icon="delete"
                onClick={handleDeleteHardSelected}
                disabled={selectedIds.size === 0}
                style={{ 
                  backgroundColor: '#FCE4EC',
                  color: '#C2185B',
                  border: 'none'
                }}
              >
                Eliminar
              </Button>
              <Button
                icon="decline"
                onClick={handleDeactivateSelected}
                disabled={selectedIds.size === 0}
                style={{ 
                  backgroundColor: '#FFF3E0',
                  color: '#E65100',
                  border: 'none'
                }}
              >
                Desactivar
              </Button>
              {loading && <BusyIndicator active size="Small" />}
            </FlexBox>
          }
        />
      }
      style={{ margin: '1rem', maxWidth: '100%' }}
    >
      <div style={{ padding: '1rem' }}>
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
                    checked={selectedIds.size > 0 && selectedIds.size === filteredPromotions.length && filteredPromotions.length > 0}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredPromotions.length}
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
            {filteredPromotions.map((promotion, index) => {
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
                >
                  <TableCell>
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
                      onClick={() => handleRowClick(promotion)}
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

        {/* Información adicional en el footer */}
        {promotions.length > 0 && (
          <FlexBox 
            justifyContent="SpaceBetween" 
            alignItems="Center"
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 0',
              borderTop: '1px solid #e0e0e0' 
            }}
          >
            <Text style={{ fontSize: '0.875rem', color: '#666' }}>
              Mostrando {filteredPromotions.length} promociones
            </Text>
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
  );
};

export default PromotionsTableCard;