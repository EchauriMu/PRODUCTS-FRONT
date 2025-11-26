import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FlexBox,
  Icon,
  Avatar,
  Text,
  Switch,
  Button,
} from '@ui5/webcomponents-react';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const [useCosmosDB, setUseCosmosDB] = useState(
    sessionStorage.getItem('DBServer') === 'CosmosDB'
  );
  const [user, setUser] = useState({ name: '', email: '' });

  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const loggedUser = sessionStorage.getItem('LoggedUser');
    if (loggedUser) {
      setUser({ name: loggedUser, email: `${loggedUser.toLowerCase()}@sapcito.com` });
    }
  }, []);
  
  const handleDbChange = () => {
    const newUseCosmosDB = !useCosmosDB;
    setUseCosmosDB(newUseCosmosDB);
    
    if (newUseCosmosDB) {
      sessionStorage.setItem('DBServer', 'CosmosDB');
    } else {
      sessionStorage.removeItem('DBServer');
    }
    window.location.reload();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('LoggedUser');
    window.location.href = '/login';
  };

  const menuItems = [
    { key: 'productos', text: 'Productos', path: '/' },
    { key: 'precios-listas', text: 'Precios Listas', path: '/precios-listas' },
    { key: 'promociones', text: 'Promociones', path: '/promociones' },
    { key: 'categorias', text: 'Categorías', path: '/categorias' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };
  return (
    <div className="sidebar-content" style={{ 
        width: '240px',
        backgroundColor: '#F8F9FA',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
    }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #E0E0E0' }}>
          <FlexBox alignItems="Center" style={{ justifyContent: 'space-between' }}>
            <FlexBox alignItems="Center">
               <img
        src="/logo2.png"
        alt="Logo"
        style={{ width: "52px", height: "52px", borderRadius: "50%", marginRight: "8px" }}
      />

             <Text style={{ fontSize: '16px', fontWeight: '600' }}>Tralaleros Inc.</Text>
            </FlexBox>
            {isMobile && (
              <Icon 
                name="decline" 
                style={{ cursor: 'pointer' }} 
                className="mobile-close"
                onClick={onClose}
              />
            )}
          </FlexBox>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '16px 16px 8px', color: '#666', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Menú Principal</div>
          <FlexBox direction="Column" style={{ padding: '0 8px' }}>
            {menuItems.map((item) => (
              <Button
                key={item.key}
                design={location.pathname === item.path ? 'Emphasized' : 'Transparent'}
                onClick={() => handleNavigation(item.path)}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                {item.text}
              </Button>
            ))}
          </FlexBox>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #E0E0E0' }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween">
            <Text style={{ fontSize: '14px' }}>
              Conexion a BD: <b>{useCosmosDB ? 'CosmosDB' : 'MongoDB'}</b>
            </Text>
            <Switch checked={useCosmosDB} onChange={handleDbChange} />
          </FlexBox>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="S" icon="person-placeholder" />
          <div style={{ flex: 1 }}>
         <div style={{ fontSize: '14px', fontWeight: '600' }}>{user.name}</div>
          <div style={{ fontSize: '12px', color: '#757575' }}>{user.email}</div>
          </div>
        <Icon name="log" style={{ cursor: 'pointer' }} onClick={handleLogout} />
        </div>
      </div>
  );
};

export default Sidebar;