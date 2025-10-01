import React, { useState, useEffect } from "react";
import { Form, Input, Button, Spin, notification , Typography} from "antd";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { ArrowRightOutlined } from "@ant-design/icons";


const { Title } = Typography;

const Login = ({ setIsAuthenticated, setUserRole }) => {
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); 
  const navigate = useNavigate();

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", values);

      if (response.status === 200) {
        const { token, user } = response.data;

        if (!token || !user?.role) {
          throw new Error("Respuesta inválida del servidor");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("userRole", user.role);

        setUserRole(user.role); // Ahora sí usamos la prop correctamente
        setIsAuthenticated(true);

        notification.success({
          message: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente.",
          placement: "bottomRight",
        });

        // Redirigir después de una pequeña pausa para asegurar el estado
        setTimeout(() => {
          navigate(user.role === "admin" ? "/admin" : "/home");
        }, 100);
        
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Ocurrió un error al iniciar sesión";

      notification.error({
        message: "Error de inicio de sesión",
        description: errorMessage,
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  // Listen for window resize events to update window width state
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
    loginPage: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#18171c",
      padding: "20px",
    },
    loginContainer: {
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
      marginBottom:10,
      textAlign: "center",
      color: "#6B7280",
      fontSize: "14px",
    },
    link: {
      color: "#6B46C1",
    },
    image: {
      borderRadius:50,
      maxHeight: "80%",
      maxWidth: "80%",
      objectFit: "contain",
      zIndex: 1,
    },
  };

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginContainer}>
        {/* Imagen lateral o superior (según viewport) */}
        <div style={styles.imageContainer}>
          <img
            src="https://itt0resources.blob.core.windows.net/notifinance/1.png"
            alt="Purple flower"
            style={styles.image}
          />
        </div>

        {/* Formulario */}
        <div style={styles.formContainer}>
          <div style={{ marginBottom: "24px" }}>
            <Title level={2} style={{ color: "withe", }}>
              Iniciar sesión en tu cuenta.
            </Title>
          </div>

          <Form onFinish={onFinish} layout="vertical" style={{ width: "100%" }}>
            <Form.Item
              label="Usuario"
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
            >
              <Input style={styles.input} size="large" />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              style={styles.formItem}
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
                    {windowWidth <= 768 ? "Iniciar Sesión" : "Iniciar Sesión"}
                    <ArrowRightOutlined style={{ marginLeft: "8px" }} />
                  </>
                )}
              </Button>
            </Form.Item>
          </Form>

          <div style={styles.linkText}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" style={styles.link}>
              Regístrate aquí
            </Link>
          </div>
          <div style={styles.linkText}>
            ¿Olvidaste la contraseña?{" "}
            <Link to="/forgot" style={styles.link}>
              Recuperala aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
