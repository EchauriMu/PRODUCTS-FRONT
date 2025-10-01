import React from 'react';
import { Card, Badge, Progress } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';

const MejoresVendedores = () => {
  const vendedores = [
    { nombre: 'Ana García', meta: 85, badge: 'Top Performer' },
    { nombre: 'Carlos Ruiz', meta: 72, badge: null },
    { nombre: 'María López', meta: 68, badge: null },
  ];

  return (
    <Card title={
      <span>
        <TrophyOutlined style={{ marginRight: 8 }} />
        Mejores Vendedores
      </span>
    }>
      {vendedores.map((vendedor, index) => (
        <div key={index} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: index === 0 ? '#ffd700' : '#8c8c8c' }} />
              <span style={{ fontWeight: 500 }}>{vendedor.nombre}</span>
              {vendedor.badge && (
                <Badge
                  count={vendedor.badge}
                  style={{ backgroundColor: '#000' }}
                />
              )}
            </div>
            <span style={{ fontWeight: 600 }}>{vendedor.meta}%</span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Meta Mensual</div>
            <Progress
              percent={vendedor.meta}
              strokeColor={index === 0 ? '#52c41a' : '#1890ff'}
              showInfo={false}
            />
          </div>
        </div>
      ))}
    </Card>
  );
};

export default MejoresVendedores;
