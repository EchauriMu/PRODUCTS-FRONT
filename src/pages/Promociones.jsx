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
    console.log('Abriendo edición de promoción:', promotion);
    setSelectedPromotion(promotion);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedPromotion(null);
  };

  const handlePromotionSave = (updatedPromotion) => {
    console.log('Promoción actualizada:', updatedPromotion);
    setShowEditModal(false);
    setSelectedPromotion(null);
    // Forzar actualización de la tabla
    setRefreshTable(prev => prev + 1);
  };

  const handlePromotionDelete = (deletedPromotion) => {
    console.log('Promoción eliminada:', deletedPromotion);
    setShowEditModal(false);
    setSelectedPromotion(null);
    // Forzar actualización de la tabla
    setRefreshTable(prev => prev + 1);
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Contenido según pestaña */}
      {activeTab === 'promotions' && (
        <PromotionsTableCard 
          onPromotionClick={handlePromotionClick}
          onCreateClick={handleCreatePromotion}
          activeView={activeTab}
          onViewChange={setActiveTab}
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
          activeView={activeTab}
          onViewChange={setActiveTab}
        />
      )}


      {/* Modal de Edición de Promociones */}
      <PromotionEditModal
        key={selectedPromotion?.IdPromoOK || 'new'}
        open={showEditModal}
        promotion={selectedPromotion}
        onClose={handleCloseModal}
        onSave={handlePromotionSave}
        onDelete={handlePromotionDelete}
      />
    </div>
  );
};

export default Promociones;