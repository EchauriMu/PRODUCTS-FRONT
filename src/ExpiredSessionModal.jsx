import React from 'react';
import { Modal, Button, message } from 'antd';
import axiosInstance from './api/axiosInstance'; // Asegúrate de que la importación sea correcta

const ExpiredSessionModal = ({ socket, setIsAuthenticated, setModalVisible }) => {

  const handleLogout = async () => {
    try {
      // Realizar la llamada a logout
      await axiosInstance.post("/auth/logout");

      // Limpiar datos locales
      sessionStorage.clear();
      localStorage.removeItem("token");

      // Establecer estado de autenticación a falso
      setIsAuthenticated(false);

      // Recargar la página
      window.location.reload();
    } catch (error) {
   sessionStorage.clear();
      localStorage.removeItem("token");
      window.location.reload();
    }
  };

  const handleOk = () => {
    handleLogout();
    setModalVisible(false); // Cerrar el modal
  };

  const handleCancel = () => {
    handleLogout();
    setModalVisible(false); // Cerrar el modal
  };

  return (
    <Modal
      title="⚠️ Tu sesión expiró"
      open={true}
      closable={false}
      footer={[
        <Button key="ok" type="primary" onClick={handleOk}>
          Aceptar
        </Button>,
      ]}
    >
      <p>Tu sesión ha expirado debido a cambios en tu cuenta. Vuelve a iniciar sesión.</p>
    </Modal>
  );
};

export default ExpiredSessionModal;
