import React from 'react';
import {
  Card,
  Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import StepperContainer from '../components/addProducts/StepperContainer'; // SUCCESS: Importamos el contenedor correcto

const StepperPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7f7f7',
      padding: '20px'
    }}>
      {/* Simplemente renderizamos el StepperContainer que ya tiene toda la lógica */}
      <StepperContainer />
    </div>
  );
};

export default StepperPage;
