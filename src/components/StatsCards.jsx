import React from 'react';
import { Card, Statistic } from 'antd';
import { DatabaseOutlined, ShopOutlined, SettingOutlined, PercentageOutlined } from '@ant-design/icons';

const StatsCards = ({ isMobile }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 16,
      marginBottom: 24
    }}>
      <Card>
        <Statistic
          title="Total Productos"
          value={3}
          prefix={<DatabaseOutlined />}
          suffix={<div style={{ fontSize: 14, color: '#8c8c8c' }}>En catálogo maestro</div>}
        />
      </Card>
      <Card>
        <Statistic
          title="Vendedores Clave"
          value={4}
          prefix={<ShopOutlined />}
          suffix={<div style={{ fontSize: 14, color: '#8c8c8c' }}>Activos en sistema</div>}
        />
      </Card>
      <Card>
        <Statistic
          title="Configuraciones"
          value={2}
          prefix={<SettingOutlined />}
          suffix={<div style={{ fontSize: 14, color: '#8c8c8c' }}>Reglas de precios activas</div>}
        />
      </Card>
      <Card>
        <Statistic
          title="Markup Promedio"
          value={17.5}
          prefix={<PercentageOutlined />}
          suffix="%"
          valueStyle={{ color: '#3f8600' }}
        />
        <div style={{ fontSize: 14, color: '#8c8c8c', marginTop: 8 }}>Margen configurado</div>
      </Card>
    </div>
  );
};

export default StatsCards;
