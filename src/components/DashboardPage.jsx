import React from 'react';
import { Card, Tabs } from 'antd';
import StatsCards from './StatsCards';


const DashboardPage = ({ isMobile }) => {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Panel de Control</h2>
        <p style={{ color: '#8c8c8c', margin: 0 }}>Resumen general del catálogo y rendimiento del sistema</p>
      </div>

      <StatsCards isMobile={isMobile} />

      <Card 
      title="Análisis Detallado"
      style={{ marginBottom: 24 }}>
        <Tabs
          defaultActiveKey="rendimiento"
          items={[
            { key: 'rendimiento', label: 'Rendimiento' },
            { key: 'configuracion', label: 'Configuración' },
            { key: 'vendedores', label: 'Vendedores' },
            { key: 'catalogo', label: 'Catálogo' },
          ]}
        />
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16
      }}>
   
    
      </div>
    </>
  );
};

export default DashboardPage;
