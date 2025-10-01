import React, { useState, useEffect } from "react";
import { Form, Input, Button, Spin, notification , Typography} from "antd";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { ArrowRightOutlined } from "@ant-design/icons";


const { Title } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Track window width for responsive styles
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);

    // 🔥 Verifica los datos antes de enviarlos
    console.log("Datos a enviar:", values);

    try {
      const response = await axiosInstance.post("/auth/register", values);

      if (response.status === 201) {
        notification.success({
          message: "Registro Exitoso",
          description: "Se ha enviado un correo de verificación.",
          placement: "bottomRight",
        });

        // Redirigir a login después de éxito
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      notification.error({
        message: "Error en el Registro",
        description: error.response?.data?.message || "Ocurrió un error inesperado.",
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  // Escuchar los cambios de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Estilos en línea
  const styles = {
    registerPage: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#18171c",
      padding: "20px",
    },
    registerContainer: {
      display: "flex",
      flexDirection: windowWidth <= 768 ? "column" : "row", // Responsive direction based on window width
      width: "100%",
      maxWidth: "900px",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(149, 157, 165, 0.2)",
      background: "#141414",
    },
    imageContainer: {
      flex: "1 1 50%",
      background: "#141414",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "20px",
      minHeight: "200px",
    },
    formContainer: {
      flex: "1 1 50%",
      padding: "40px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    formItem: {
      marginBottom: "16px",
    },
    input: {
      borderRadius: "8px",
      height: "45px",
    },
    button: {
      height: "45px",
      borderRadius: "8px",
      background: "#ffa500",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    linkText: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: "14px",
    },
    link: {
      color: "#6B46C1",
    },
    image: {
      borderRadius: 50,
      maxHeight: "80%",
      maxWidth: "80%",
      objectFit: "contain",
      zIndex: 1,
    },
  };

  return (
    <div style={styles.registerPage}>
      <div style={styles.registerContainer}>
        {/* Imagen lateral o superior (según viewport) */}
        <div style={styles.imageContainer}>
          <img
            src="https://itt0resources.blob.core.windows.net/notifinance/1.png"
            alt="Imagen de registro"
            style={styles.image}
          />
        </div>

        {/* Formulario de registro */}
        <div style={styles.formContainer}>
          <div style={{ marginBottom: "24px" }}>
            <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
              Registrate en Notifinance.
            </Title>

          </div>

          <Form onFinish={onFinish} layout="vertical" style={{ width: "100%" }}>
            <Form.Item
              label="Nombre de Usuario"
              name="username"
              rules={[
                { required: true, message: "Ingresa tu usuario" },
                {
                  pattern: /^[a-zA-Z0-9_.-]+$/,
                  message: "El nombre de usuario solo puede contener letras, números, guiones bajos (_), puntos (.) o guiones (-).",
                },
                {
                  max: 20,
                  message: "El nombre de usuario no puede tener más de 20 caracteres.",
                },
              ]}
              style={styles.formItem}
              hasFeedback
            >
              <Input style={styles.input} size="large" />
            </Form.Item>

            <Form.Item
              label="Correo Electrónico"
              name="email"
              rules={[
                { required: true, message: "Ingresa tu correo" },
                { type: "email", message: "Ingresa un correo válido." },
              ]}
              style={styles.formItem}
              hasFeedback
            >
              <Input type="email" style={styles.input} size="large" />
            </Form.Item>

            <Form.Item
              label="Contraseña"
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
              style={styles.formItem}
              hasFeedback
            >
              <Input.Password style={styles.input} size="large" />
            </Form.Item>

            <Form.Item style={styles.formItem}>
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={loading}
                style={styles.button}
              >
                {loading ? (
                  <Spin size="small" />
                ) : (
                  <>
                    {windowWidth <= 768 ? "Registrarse" : "Registrarse"}
                    <ArrowRightOutlined style={{ marginLeft: "8px" }} />
                  </>
                )}
              </Button>
            </Form.Item>
          </Form>

          {/* Enlace para iniciar sesión */}
          <div style={styles.linkText}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={styles.link}>
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
