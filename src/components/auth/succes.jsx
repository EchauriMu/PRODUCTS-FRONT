import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Space,
  Divider,
  Spin,
  notification,
} from 'antd';
import {
  SmileOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  NumberOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Succes = () => {
 
  const navigate = useNavigate();  // Usar useNavigate

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>

      <Card title="Aviso" style={{ width: 450 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          <Title level={2}>¡Correo de recuperacion enviado correctamente!</Title>
          <Paragraph>
          Revisa el correo electronico que acabos de enviarte y sigue instrucciones
          </Paragraph>
        </div>

     

        <Button
          type="primary"
          size="large"
          block
          onClick={() => {
            navigate('/login');
          }}
          icon={<SmileOutlined />}
        >
          Volver al inicio
        </Button>
      </Space>
      </Card>
      </div>
  );
};

export default Succes;
