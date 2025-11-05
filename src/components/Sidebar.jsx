import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FlexBox, Icon, Avatar, Text, Switch } from '@ui5/webcomponents-react';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const [useCosmosDB, setUseCosmosDB] = useState(
    sessionStorage.getItem('DBServer') === 'CosmosDB'
  );
  const [user, setUser] = useState({ name: '', email: '' });

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

        <div style={{ padding: '16px 0', flex: 1 }}>
          <div style={{ padding: '8px 16px', color: '#9E9E9E', fontSize: '12px', fontWeight: '600' }}>MENU</div>
          <NavLink to="/" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>PRODUCTOS</NavLink>
      <NavLink to="/precios-listas" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Precios Listas</NavLink>
          <NavLink to="/precios-items" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Precios Items</NavLink>
          <NavLink to="/promociones" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Promociones</NavLink>
          <NavLink to="/categorias" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Categorías</NavLink>
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