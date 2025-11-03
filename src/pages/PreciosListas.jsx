import React from 'react';
import { ThemeProvider, Title, Text } from '@ui5/webcomponents-react';
import PreciosListasTable from '../components/PreciosListas/PreciosListasTable';

const PreciosListas = () => {
  return (
    <ThemeProvider>
      <div style={{ padding: '1rem' }}>
        <Title level="H1">Listas de Precios</Title>
        <Text style={{ display: 'block', margin: '1rem 0' }}>Contenido relacionado con las listas de precios.</Text>
        <PreciosListasTable />
      </div>
    </ThemeProvider>
  );
};

export default PreciosListas;
