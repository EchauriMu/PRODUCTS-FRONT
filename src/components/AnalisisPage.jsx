import React from 'react';
import { Card, Button, Statistic } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const AnalisisPage = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Análisis y Reportes</h2>
        <p style={{ color: '#8c8c8c', margin: 0 }}>Métricas y estadísticas del sistema</p>
      </div>

      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <BarChartOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
          <h3>Panel de Análisis</h3>
          <p style={{ color: '#8c8c8c', maxWidth: 500, margin: '0 auto' }}>
            Visualiza reportes detallados sobre ventas, rendimiento de vendedores, 
            productos más vendidos y análisis de márgenes de ganancia.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button type="primary">Generar Reporte</Button>
            <Button>Exportar Datos</Button>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 16, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Card>
          <Statistic
            title="Ventas del Mes"
            value={45320}
            prefix="$"
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Productos Vendidos"
            value={156}
            suffix="unidades"
          />
        </Card>
        <Card>
          <Statistic
            title="Margen Promedio"
            value={17.5}
            suffix="%"
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default AnalisisPage;
