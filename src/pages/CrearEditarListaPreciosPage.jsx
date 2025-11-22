import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PreciosListasStepperContainer from '../components/PreciosListas/PreciosListasStepperContainer';

const CrearEditarListaPreciosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lista = location.state?.lista || null;

  const handleClose = () => {
    navigate('/precios-listas');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <PreciosListasStepperContainer
        onClose={handleClose}
        lista={lista}
      />
    </div>
  );
};

export default CrearEditarListaPreciosPage;
