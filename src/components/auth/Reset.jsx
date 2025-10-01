import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Spin, notification, Typography } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

// ====== COMPONENTE DE RESETEO DE CONTRASEÑA ======
const ResetPassword = () => {
  // ====== DECLARACIÓN DE VARIABLES Y HOOKS ======
  const { Title } = Typography;
  const [loading, setLoading] = useState(false);
  const { token } = useParams();  // Obtener el token de la URL
  const navigate = useNavigate(); // Hook para navegación

  // ====== VALIDACIÓN DEL TOKEN EN LA URL ======
  useEffect(() => {
    // Si no se recibe un token, redirigir a la página de inicio de sesión o error.
    if (!token) {
      notification.error({
        message: "Error",
        description: "Token inválido o no proporcionado.",
        placement: "bottomRight",
      });
      navigate("/login");
    }
  }, [token, navigate]);

  // ====== FUNCIÓN PARA ENVIAR EL NUEVO PASSWORD ======
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Enviar el nuevo password y el token al backend
      const response = await axiosInstance.post("/reset/reset-password", {
        token: token, // Token obtenido de la URL
        newPassword: values.password, // Nueva contraseña
      });

      if (response.status === 200) {
        notification.success({
          message: "Contraseña Restablecida",
          description: "Tu contraseña ha sido cambiada exitosamente.",
          placement: "bottomRight",
        });

        // Redirigir al login después de restablecer la contraseña
        navigate("/successchange");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Ocurrió un error al restablecer la contraseña.";

      notification.error({
        message: "Error",
        description: errorMessage,
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  // ====== RENDERIZADO DEL FORMULARIO ======
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}> 
      <div style={{ display: 'flex', alignItems: 'center', marginBottom:10 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          <span style={{ color: 'white' }}>Noti</span>
          <span style={{ color: '#ffa500' }}>Finance</span>
        </Title>
      </div>
      <Card title="Restablecer Contraseña" style={{ width: 350 }}>
        <Form onFinish={onFinish} layout="vertical">
          {/* ====== CAMPO: NUEVA CONTRASEÑA ====== */}
          <Form.Item
            label="Nueva Contraseña"
            name="password"
            rules={[
              { required: true, message: "Ingresa tu contraseña" },
              {
                min: 8,
                message: "La contraseña debe tener al menos 8 caracteres.",
              },
              {
                pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial. Solo se permiten estos caracteres especiales: @ $ ! % * ? &",
              },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          {/* ====== CAMPO: CONFIRMAR CONTRASEÑA ====== */}
          <Form.Item
            label="Confirmar Contraseña"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: "Confirma tu nueva contraseña" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          {/* ====== BOTÓN DE ENVÍO ====== */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={loading}>
              {loading ? <Spin /> : "Restablecer Contraseña"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
