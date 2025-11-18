import React from 'react';
import {
  Dialog,
  Bar,
  Button,
  FlexBox,
  Text,
  Icon,
  MessageStrip
} from '@ui5/webcomponents-react';
import warningIcon from '../../assets/warning.png';

/**
 * CustomDialog - Componente modal personalizado para alertas y confirmaciones
 * 
 * @param {boolean} open - Estado de apertura del diálogo
 * @param {string} type - Tipo de diálogo: 'alert', 'confirm', 'warning', 'success', 'error'
 * @param {string} title - Título del diálogo
 * @param {string} message - Mensaje del diálogo
 * @param {function} onClose - Callback al cerrar (para alertas)
 * @param {function} onConfirm - Callback al confirmar (para confirmaciones)
 * @param {function} onCancel - Callback al cancelar (para confirmaciones)
 * @param {string} confirmText - Texto del botón de confirmación (default: "OK" o "Aceptar")
 * @param {string} cancelText - Texto del botón de cancelación (default: "Cancelar")
 * @param {string} confirmDesign - Diseño del botón de confirmación (default: "Emphasized")
 */
const CustomDialog = ({
  open,
  type = 'alert',
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  confirmText,
  cancelText = 'Cancelar',
  confirmDesign
}) => {
  // Configuración según el tipo
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'message-success',
          iconColor: '#2e7d32',
          stripType: 'Positive',
          defaultConfirmText: 'OK',
          defaultTitle: 'Éxito',
          design: 'Emphasized'
        };
      case 'error':
        return {
          icon: 'message-error',
          iconColor: '#d32f2f',
          stripType: 'Negative',
          defaultConfirmText: 'OK',
          defaultTitle: 'Error',
          design: 'Emphasized'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#f57c00',
          stripType: 'Critical',
          defaultConfirmText: 'Aceptar',
          defaultTitle: 'Advertencia',
          design: 'Negative',
          useCustomIcon: true
        };
      case 'confirm':
        return {
          icon: 'question-mark',
          iconColor: '#0854a0',
          stripType: 'Information',
          defaultConfirmText: 'Aceptar',
          defaultTitle: 'Confirmar',
          design: 'Emphasized'
        };
      case 'alert':
      default:
        return {
          icon: 'message-information',
          iconColor: '#0288d1',
          stripType: 'Information',
          defaultConfirmText: 'OK',
          defaultTitle: 'Información',
          design: 'Emphasized'
        };
    }
  };

  const config = getConfig();
  const isConfirmDialog = type === 'confirm' || type === 'warning';

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      headerText={title || config.defaultTitle}
      onAfterClose={handleCancel}
      style={{
        '--_ui5_dialog_resize_handle_color': 'transparent',
        minWidth: '400px',
        maxWidth: '600px'
      }}
      footer={
        <Bar
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              {isConfirmDialog && (
                <Button
                  design="Transparent"
                  onClick={handleCancel}
                >
                  {cancelText}
                </Button>
              )}
              <Button
                design={confirmDesign || config.design}
                onClick={handleConfirm}
              >
                {confirmText || config.defaultConfirmText}
              </Button>
            </FlexBox>
          }
        />
      }
    >
      <div style={{ padding: '1rem' }}>
        <FlexBox direction="Column" style={{ gap: '1rem' }}>
          <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
            {config.useCustomIcon && type === 'warning' ? (
              <img 
                src={warningIcon} 
                alt="Advertencia"
                style={{ 
                  width: '2.5rem', 
                  height: '2.5rem',
                  flexShrink: 0
                }} 
              />
            ) : (
              <Icon 
                name={config.icon} 
                style={{ 
                  fontSize: '2.5rem', 
                  color: config.iconColor,
                  flexShrink: 0
                }} 
              />
            )}
            <Text style={{ 
              fontSize: '1rem', 
              lineHeight: '1.5',
              color: '#333',
              flex: 1
            }}>
              {message}
            </Text>
          </FlexBox>
        </FlexBox>
      </div>
    </Dialog>
  );
};

export default CustomDialog;
