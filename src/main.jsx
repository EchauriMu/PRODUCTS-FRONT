import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm, // base claro (puedes cambiarlo a theme.darkAlgorithm)
        token: {
          colorPrimary: '#1677ff',   // azul estándar de Ant Design
          borderRadius: 8,           // bordes redondeados globales
          fontSize: 14,              // tamaño de fuente global
          colorBgBase: '#ffffff',    // fondo base
          colorTextBase: '#000000',  // texto principal
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
