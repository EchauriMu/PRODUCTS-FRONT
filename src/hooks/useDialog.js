import { useState } from 'react';

/**
 * Hook personalizado para manejar diálogos de confirmación y alertas
 * 
 * @returns {Object} - Objeto con métodos y estado para manejar diálogos
 */
export const useDialog = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: null,
    cancelText: 'Cancelar',
    confirmDesign: null
  });

  /**
   * Muestra un diálogo de alerta
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título del diálogo (opcional)
   */
  const showAlert = (message, title) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'alert',
        title: title || 'Información',
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK',
        cancelText: null,
        confirmDesign: 'Emphasized'
      });
    });
  };

  /**
   * Muestra un diálogo de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título del diálogo (opcional)
   */
  const showSuccess = (message, title) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'success',
        title: title || 'Éxito',
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK',
        cancelText: null,
        confirmDesign: 'Emphasized'
      });
    });
  };

  /**
   * Muestra un diálogo de error
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título del diálogo (opcional)
   */
  const showError = (message, title) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'error',
        title: title || 'Error',
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        confirmText: 'OK',
        cancelText: null,
        confirmDesign: 'Emphasized'
      });
    });
  };

  /**
   * Muestra un diálogo de confirmación
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título del diálogo (opcional)
   * @param {Object} options - Opciones adicionales (confirmText, cancelText, confirmDesign)
   */
  const showConfirm = (message, title, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'confirm',
        title: title || 'Confirmar',
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        onCancel: () => {
          closeDialog();
          resolve(false);
        },
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        confirmDesign: options.confirmDesign || 'Emphasized'
      });
    });
  };

  /**
   * Muestra un diálogo de advertencia con confirmación
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título del diálogo (opcional)
   * @param {Object} options - Opciones adicionales (confirmText, cancelText)
   */
  const showWarning = (message, title, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'warning',
        title: title || 'Advertencia',
        message,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        onCancel: () => {
          closeDialog();
          resolve(false);
        },
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        confirmDesign: 'Negative'
      });
    });
  };

  /**
   * Cierra el diálogo
   */
  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  return {
    dialogState,
    showAlert,
    showSuccess,
    showError,
    showConfirm,
    showWarning,
    closeDialog
  };
};
