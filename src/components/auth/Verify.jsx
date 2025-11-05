import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const VerifyToken = () => {
  const [loading, setLoading] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      message.error("WARNING: No se encontró el ID de usuario en la URL.");
    }
  }, [userId]);

  const onFinish = async (values) => {
    if (!userId) {
      message.error("ERROR: No se encontró el ID de usuario.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(`/auth/verify/${userId}`, {
        token: values.token,
      });

      message.success({
        content: "SUCCESS: ¡Cuenta verificada con éxito! Redirigiendo a login...",
        duration: 2,
        style: { bottom: 50, right: 50 },
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      message.error(error.response?.data?.error || "ERROR: Error al verificar el token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Verificación de Token" style={{ width: 400, margin: "50px auto", textAlign: "center" }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Código de Verificación"
          name="token"
          rules={[
            { required: true, message: "Por favor, ingresa el código de 6 dígitos." },
            { pattern: /^[0-9]{6}$/, message: "El código debe tener exactamente 6 dígitos." },
          ]}
        >
          <Input maxLength={6} placeholder="123456" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block disabled={loading}>
            {loading ? <Spin /> : "Verificar Cuenta"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default VerifyToken;
