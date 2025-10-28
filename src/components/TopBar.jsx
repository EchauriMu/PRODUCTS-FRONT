import React from 'react';
import { FlexBox, Icon, Text, Button } from '@ui5/webcomponents-react';
import { useLocation } from 'react-router-dom';

const breadcrumbMap = {
  '/': 'Inicio',
  '/perfil': 'Perfil',
  '/configuracion': 'Configuración',
  '/products-files': 'Archivos de Productos',
  '/products-presentaciones': 'Presentaciones de Productos',
  '/precios-listas': 'Listas de Precios',
  '/precios-items': 'Artículos de Precios',
  '/promociones': 'Promociones',
  '/categorias': 'Categorías',
};

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const breadcrumb = breadcrumbMap[location.pathname] || 'Desconocido';

  return (
    <div style={{ 
      padding: '16px 24px',
      borderBottom: '1px solid #E0E0E0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <FlexBox alignItems="Center" style={{ gap: '12px' }}>
        <Icon 
          name="menu2" 
          style={{ cursor: 'pointer', display: 'none' }} 
          className="mobile-menu"
          onClick={onMenuClick}
        />
        <Icon name="home" style={{ color: '#757575' }} className="hide-mobile" />
        <Icon name="navigation-right-arrow" style={{ fontSize: '12px', color: '#BDBDBD' }} className="hide-mobile" />
        <Text style={{ fontWeight: '600' }}>{breadcrumb}</Text>
      </FlexBox>
      
      <FlexBox alignItems="Center" style={{ gap: '12px', flexWrap: 'wrap' }}>
        <Button icon="premium" design="Transparent" className="hide-mobile-text">Boton sap wow</Button>
        <Icon name="bell" style={{ cursor: 'pointer' }} />
        <Icon name="calendar" style={{ cursor: 'pointer' }} className="hide-mobile" />
        <Icon name="user-settings" style={{ cursor: 'pointer' }} />
      </FlexBox>
    </div>
  );
};

export default TopBar;