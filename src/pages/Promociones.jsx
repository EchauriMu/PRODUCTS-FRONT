/*
 * =================================================================================
 * Página: Promociones
 * Descripción: Vista principal del módulo de promociones con tabla y calendario
 * Autores: LAURA PANIAGUA, ALBERTO PARDO
 * =================================================================================
 */

import React, { useState } from 'react';
import PromotionsTableCard from '../components/Promotions/PromotionsTableCard';
import PromotionCalendar from '../components/Promotions/PromotionCalendar';
import PromotionEditModal from '../components/Promotions/PromotionEditModal';
import { useNavigate } from 'react-router-dom';
import { FlexBox, Title, Button } from '@ui5/webcomponents-react';

/* COMPONENTE PRINCIPAL */
const Promociones = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('promotions');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);

  /* MANEJADORES DE EVENTOS */
  const handleCreatePromotion = () => {
    navigate('/promociones/crear');
  };

  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedPromotion(null);
  };

  const handlePromotionSave = (updatedPromotion) => {
    setShowEditModal(false);
    setSelectedPromotion(null);
    setRefreshTable(prev => prev + 1);
  };

  const handlePromotionDelete = (deletedPromotion) => {
    setShowEditModal(false);
    setSelectedPromotion(null);
    setRefreshTable(prev => prev + 1);
  };

  return (
    <div style={{ padding: '1rem' }}>
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
          onPromotionClick={(promotion) => {}}
          onDateChange={(date) => {}}
          activeView={activeTab}
          onViewChange={setActiveTab}
        />
      )}

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