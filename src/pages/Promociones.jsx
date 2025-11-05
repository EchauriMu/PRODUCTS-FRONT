import React, { useState } from 'react';
import PromotionsTableCard from '../components/Promotions/PromotionsTableCard';
import PromotionCalendar from '../components/Promotions/PromotionCalendar';
import PromotionEditModal from '../components/Promotions/PromotionEditModal';
import { useNavigate } from 'react-router-dom';
import { FlexBox, Title, Button } from '@ui5/webcomponents-react';

const Promociones = () => {
  const navigate = useNavigate();
  // Tabs: lista de promociones y calendario
  const [activeTab, setActiveTab] = useState('promotions'); // 'promotions' | 'calendar'

  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);

  const handleCreatePromotion = () => {
    navigate('/promociones/crear');
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
          <Title level="H2">Gestión de Promociones</Title>
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
        </FlexBox>
      </FlexBox>

      {/* Contenido según pestaña */}
      {activeTab === 'promotions' && (
        <PromotionsTableCard 
          onPromotionClick={handlePromotionClick}
          key={refreshTable}
        />
      )}

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

      {/* Wizard removido: creación se movió a /promociones/crear */}

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