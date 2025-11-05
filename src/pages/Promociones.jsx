import React, { useState } from 'react';
import PromotionsTableCard from '../components/Promotions/PromotionsTableCard';
import AdvancedFilters from '../components/Promotions/AdvancedFilters';
import PromotionExpressWizard from '../components/Promotions/PromotionExpressWizard';
import PromotionCalendar from '../components/Promotions/PromotionCalendar';
import PromotionEditModal from '../components/Promotions/PromotionEditModal';
import { FlexBox, Title, Button, MessageStrip, Card, Text } from '@ui5/webcomponents-react';

const Promociones = () => {
  const [activeFilters, setActiveFilters] = useState({});
  const [showExpressWizard, setShowExpressWizard] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('promotions'); // 'promotions', 'calendar'
  
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);

  const handleFiltersChange = (newFilters) => {
    setActiveFilters(newFilters);
    
    // Si hay productos filtrados en el cambio, guardarlos
    if (newFilters._filteredProducts) {
      setFilteredProducts(newFilters._filteredProducts);
    }
  };

  const handleCreatePromotion = () => {
    setShowExpressWizard(true);
    console.log('Abriendo Promoción Express con filtros:', activeFilters);
  };

  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    setShowEditModal(true);
    console.log('Abriendo edición de promoción:', promotion);
  };

  const handlePromotionSave = (updatedPromotion) => {
    console.log('Promoción actualizada:', updatedPromotion);
    // Forzar actualización de la tabla
    setRefreshTable(prev => prev + 1);
  };

  const handlePromotionDelete = (deletedPromotion) => {
    console.log('Promoción eliminada:', deletedPromotion);
    // Forzar actualización de la tabla
    setRefreshTable(prev => prev + 1);
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header con título y acciones */}
      <FlexBox 
        justifyContent="SpaceBetween" 
        alignItems="Center"
        style={{ marginBottom: '1rem' }}
      >
        <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
          <Title level="H2">� Gestión de Promociones</Title>
          
          {/* Tabs de navegación */}
          <FlexBox style={{ gap: '0.5rem' }}>
            <Button
              design={activeTab === 'promotions' ? 'Emphasized' : 'Transparent'}
              onClick={() => setActiveTab('promotions')}
            >
              Promociones
            </Button>
            <Button
              design={activeTab === 'calendar' ? 'Emphasized' : 'Transparent'}
              onClick={() => setActiveTab('calendar')}
            >
              Calendario
            </Button>
          </FlexBox>
        </FlexBox>
        <FlexBox style={{ gap: '0.5rem' }}>
          <Button 
            design="Emphasized"
            icon="add"
            onClick={handleCreatePromotion}
          >
            Nueva Promoción
          </Button>
          <Button 
            design="Transparent"
            icon="duplicate"
          >
            Plantillas
          </Button>
        </FlexBox>
      </FlexBox>

      {/* Información sobre filtros activos - ELIMINADO */}

      {/* Vista de Promociones */}
      {activeTab === 'promotions' && (
        <>
          {/* Componente de Filtros Avanzados */}
          <AdvancedFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={activeFilters}
          />

          {/* Tabla de promociones existentes */}
          <PromotionsTableCard 
            onPromotionClick={handlePromotionClick}
            key={refreshTable} // Forzar re-render cuando se actualiza
          />
        </>
      )}

      {/* Vista de Calendario */}
      {activeTab === 'calendar' && (
        <PromotionCalendar 
          onPromotionClick={(promotion) => {
            console.log('Promoción seleccionada desde calendario:', promotion);
          }}
          onDateChange={(date) => {
            console.log('Fecha cambiada:', date);
          }}
        />
      )}

      {/* Wizard de Promoción Express */}
      <PromotionExpressWizard
        open={showExpressWizard}
        onClose={() => setShowExpressWizard(false)}
        activeFilters={activeFilters}
        productsFromFilters={filteredProducts}
      />

      {/* Modal de Edición de Promociones */}
      <PromotionEditModal
        open={showEditModal}
        promotion={selectedPromotion}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPromotion(null);
        }}
        onSave={handlePromotionSave}
        onDelete={handlePromotionDelete}
      />
    </div>
  );
};

export default Promociones;