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
  ObjectStatus
} from '@ui5/webcomponents-react'; 
import promoService from '../../api/promoService';

const PromotionsTableCard = ({ onPromotionClick }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);

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
    if (promotion.DELETED === true) {
      return { state: 'Error', text: 'Eliminada' };
    }
    
    if (promotion.ACTIVED === false) {
      return { state: 'Warning', text: 'Inactiva' };
    }
    
    // Verificar fechas de vigencia
    if (now < startDate) {
      return { state: 'Information', text: 'Programada' };
    }
    
    if (now > endDate) {
      return { state: 'Warning', text: 'Expirada' };
    }
    
    if (promotion.ACTIVED === true && now >= startDate && now <= endDate) {
      return { state: 'Success', text: 'Activa' };
    }
    
    return { state: 'Information', text: 'Desconocido' };
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
          subtitleText={`${promotions.length} promociones encontradas`}
          action={
            <FlexBox alignItems="Center">
              {loading && <BusyIndicator active size="Small" />}
              <Label 
                style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: promotions.length > 0 ? '#0a6ed1' : '#666',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                Total: {promotions.length}
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
                  <Text>SKU Aplicable</Text>
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
            {promotions.map((promotion, index) => {
              const promotionStatus = getPromotionStatus(promotion);
              const discountInfo = getDiscountInfo(promotion);
              const isActive = isPromotionActive(promotion);
              
              return (
                <TableRow 
                  key={promotion._id || promotion.IdPromoOK || index}
                  onClick={() => handleRowClick(promotion)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#f8fff8' : 'transparent'
                  }}
                  className="ui5-table-row-hover"
                >
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
                    <Label 
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {promotion.SKUID || 'N/A'}
                    </Label>
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
                    <ObjectStatus 
                      state={promotionStatus.state}
                    >
                      {promotionStatus.text}
                    </ObjectStatus>
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
              Mostrando {promotions.length} promociones
            </Text>
            <FlexBox style={{ gap: '1rem' }}>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Activas: {promotions.filter(p => isPromotionActive(p)).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Con descuento: {promotions.filter(p => getDiscountInfo(p).value > 0).length}
              </Text>
              <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                Promedio descuento: {promotions.length > 0 ? 
                  (promotions.reduce((sum, p) => sum + getDiscountInfo(p).value, 0) / promotions.length).toFixed(1) + '%' : 
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