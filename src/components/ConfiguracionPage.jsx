import React from 'react';
import { Card, Button } from 'antd';
import { PercentageOutlined, UserOutlined } from '@ant-design/icons';

const ConfiguracionPage = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Configuración del Sistema</h2>
        <p style={{ color: '#8c8c8c', margin: 0 }}>Ajustes generales y reglas de precios</p>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Reglas de Precios">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <PercentageOutlined style={{ fontSize: 36, color: '#52c41a', marginBottom: 12 }} />
            <p style={{ color: '#8c8c8c' }}>
              Configura las reglas de markup y descuentos aplicables a los productos.
              Actualmente tienes 2 reglas activas.
            </p>
            <Button type="primary">Gestionar Reglas</Button>
          </div>
        </Card>

        <Card title="Vendedores y Asignaciones">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: 36, color: '#1890ff', marginBottom: 12 }} />
            <p style={{ color: '#8c8c8c' }}>
              Administra los vendedores del sistema y sus asignaciones de productos.
              Actualmente 4 vendedores activos.
            </p>
            <Button type="primary">Gestionar Vendedores</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
