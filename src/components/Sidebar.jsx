import React from 'react';
import { NavLink } from 'react-router-dom';
import { FlexBox, Icon, Avatar, Text } from '@ui5/webcomponents-react';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
          className="mobile-overlay"
          onClick={onClose}
        />
      )}
      
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
            <Icon 
              name="decline" 
              style={{ cursor: 'pointer' }} 
              className="mobile-close"
              onClick={onClose}
            />
          </FlexBox>
        </div>

        <div style={{ padding: '16px 0', flex: 1 }}>
          <div style={{ padding: '8px 16px', color: '#9E9E9E', fontSize: '12px', fontWeight: '600' }}>MENU</div>
          <NavLink to="/" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Home</NavLink>
        <NavLink to="/products-files" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Products Files</NavLink>
          <NavLink to="/products-presentaciones" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Products Presentaciones</NavLink>
          <NavLink to="/precios-listas" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Precios Listas</NavLink>
          <NavLink to="/precios-items" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Precios Items</NavLink>
          <NavLink to="/promociones" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Promociones</NavLink>
          <NavLink to="/categorias" style={{ textDecoration: 'none', color: '#000', padding: '8px 16px', display: 'block' }} activeStyle={{ fontWeight: 'bold' }}>Categorías</NavLink>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="S" icon="person-placeholder" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Usuario Ejemplo</div>
            <div style={{ fontSize: '12px', color: '#757575' }}>papupro@sap.com</div>
          </div>
          <Icon name="overflow" style={{ cursor: 'pointer' }} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;