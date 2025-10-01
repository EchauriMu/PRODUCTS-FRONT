import React from 'react';
import { Menu } from 'antd';
import { DashboardOutlined, ShoppingOutlined, SettingOutlined, BarChartOutlined, DatabaseOutlined } from '@ant-design/icons';

const Sidebar = ({ collapsed, onCollapse, selectedMenu, onMenuSelect, isMobile }) => {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'catalogo',
      icon: <ShoppingOutlined />,
      label: 'Catálogo',
    },
    {
      key: 'configuracion',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      key: 'analisis',
      icon: <BarChartOutlined />,
      label: 'Análisis',
    },
  ];

  return (
    <>
      <div style={{
        height: 64,
        margin: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1890ff',
        fontSize: collapsed ? 20 : 24,
        fontWeight: 'bold'
      }}>
        <DatabaseOutlined style={{ marginRight: collapsed ? 0 : 8 }} />
        {!collapsed && 'CM'}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedMenu]}
        items={menuItems}
        onClick={({ key }) => onMenuSelect(key)}
      />
    </>
  );
};

export default Sidebar;
