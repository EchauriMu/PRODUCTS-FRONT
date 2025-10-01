import React, { useState } from 'react';
import { Layout as AntLayout, Drawer, Tabs, Row, Col } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from './DashboardPage';
import CatalogoPage from './CatalogoPage';
import ConfiguracionPage from './ConfiguracionPage';
import AnalisisPage from './AnalisisPage';

const { Sider, Content } = AntLayout;


const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuSelect = (key) => {
    setSelectedMenu(key);
    if (isMobile) setMobileDrawerOpen(false);
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardPage isMobile={isMobile} />;
      case 'catalogo':
        return <CatalogoPage />;
      case 'configuracion':
        return <ConfiguracionPage />;
      case 'analisis':
        return <AnalisisPage />;
      default:
        return <DashboardPage isMobile={isMobile} />;
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Sidebar Desktop */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onCollapse={setCollapsed}
            selectedMenu={selectedMenu}
            onMenuSelect={handleMenuSelect}
            isMobile={isMobile}
          />
        </Sider>
      )}

      {/* Drawer Mobile */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0, height: '100vh', overflow: 'auto' }}
          width={250}
        >
          <Sidebar
            collapsed={false}
            selectedMenu={selectedMenu}
            onMenuSelect={handleMenuSelect}
            isMobile={isMobile}
          />
        </Drawer>
      )}

      <AntLayout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), transition: 'margin-left 0.2s' }}>
        <Header
          isMobile={isMobile}
          onMenuClick={() => setMobileDrawerOpen(true)}
          selectedMenu={selectedMenu}
          onMenuSelect={handleMenuSelect}
        />

        <Content style={{ margin: isMobile ? '12px' : '24px', minHeight: 280, padding: 0 }}>
          <Tabs
            activeKey={selectedMenu}
            onChange={handleMenuSelect}
            items={[ 
              { key: 'dashboard', label: 'Dashboard', children: selectedMenu === 'dashboard' ? renderContent() : null },
              { key: 'catalogo', label: 'Catálogo', children: selectedMenu === 'catalogo' ? renderContent() : null },
              { key: 'configuracion', label: 'Configuración', children: selectedMenu === 'configuracion' ? renderContent() : null },
              { key: 'analisis', label: 'Análisis', children: selectedMenu === 'analisis' ? renderContent() : null },
            ]}
            style={{ marginBottom: 16 }}
          />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;