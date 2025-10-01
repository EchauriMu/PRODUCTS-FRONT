import React, { useState } from 'react';
import {
  ShellBar,
  SideNavigation,
  SideNavigationItem,
  Card,
  CardHeader,
  Title,
  Label,
  Button,
  ProgressIndicator,
  
  FlexBox,
  Avatar,
  Text,
  Icon
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

// ==================== PAGES ====================

const DashboardPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <Title level="H3" style={{ marginBottom: '2rem' }}>Panel de Control</Title>
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {['3 Productos', '4 Vendedores', '2 Configuraciones', '17.5% Markup'].map((stat, i) => (
          <Card key={i}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Title level="H2">{stat.split(' ')[0]}</Title>
              <Text>{stat.split(' ').slice(1).join(' ')}</Text>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card header={<CardHeader titleText="Mejores Vendedores" />}>
          <div style={{ padding: '1rem' }}>
            {['Ana García - 85%', 'Carlos Ruiz - 72%', 'María López - 68%'].map((v, i) => (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <FlexBox justifyContent="SpaceBetween" style={{ marginBottom: '0.5rem' }}>
                  <Text>{v.split(' - ')[0]}</Text>
                  <Text>{v.split(' - ')[1]}</Text>
                </FlexBox>
                <ProgressIndicator value={parseInt(v.split(' - ')[1])} />
              </div>
            ))}
          </div>
        </Card>

        <Card header={<CardHeader titleText="Objetivos del Mes" />}>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <FlexBox justifyContent="SpaceBetween" style={{ marginBottom: '0.5rem' }}>
                <Text>Productos Configurados</Text>
                <Text>92%</Text>
              </FlexBox>
              <ProgressIndicator value={92} valueState="Success" />
            </div>
            <div>
              <FlexBox justifyContent="SpaceBetween" style={{ marginBottom: '0.5rem' }}>
                <Text>Asignaciones Vendedores</Text>
                <Text>78%</Text>
              </FlexBox>
              <ProgressIndicator value={78} valueState="Information" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const CatalogoPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <Title level="H3" style={{ marginBottom: '2rem' }}>Catálogo de Productos</Title>
      
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Icon name="product" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <Title level="H4">Gestión de Productos</Title>
          <Text style={{ display: 'block', margin: '1rem 0' }}>
            Administra todos los productos del catálogo maestro
          </Text>
          <Button design="Emphasized">Agregar Producto</Button>
        </div>
      </Card>

      <Card style={{ marginTop: '1rem' }}>
        <CardHeader titleText="Lista de Productos" />
        <div style={{ padding: '1rem' }}>
          {['Producto A - PRD-001', 'Producto B - PRD-002', 'Producto C - PRD-003'].map((p, i) => (
            <div key={i} style={{ 
              padding: '1rem', 
              borderBottom: i < 2 ? '1px solid #e5e5e5' : 'none' 
            }}>
              <Text>{p}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ConfiguracionPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <Title level="H3" style={{ marginBottom: '2rem' }}>Configuración del Sistema</Title>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card header={<CardHeader titleText="Reglas de Precios" />}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Icon name="measuring-point" style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
            <Text style={{ display: 'block', marginBottom: '1rem' }}>
              Configura markup y descuentos. 2 reglas activas.
            </Text>
            <Button>Gestionar Reglas</Button>
          </div>
        </Card>

        <Card header={<CardHeader titleText="Vendedores" />}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Icon name="group" style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
            <Text style={{ display: 'block', marginBottom: '1rem' }}>
              Administra vendedores y asignaciones. 4 activos.
            </Text>
            <Button>Gestionar Vendedores</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const AnalisisPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <Title level="H3" style={{ marginBottom: '2rem' }}>Análisis y Reportes</Title>
      
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Icon name="bar-chart" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <Title level="H4">Panel de Análisis</Title>
          <Text style={{ display: 'block', margin: '1rem 0' }}>
            Visualiza reportes y métricas del sistema
          </Text>
          <FlexBox justifyContent="Center" style={{ gap: '1rem' }}>
            <Button design="Emphasized">Generar Reporte</Button>
            <Button>Exportar Datos</Button>
          </FlexBox>
        </div>
      </Card>

      <div style={{
        marginTop: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        {[
          { label: 'Ventas del Mes', value: '$45,320' },
          { label: 'Productos Vendidos', value: '156' },
          { label: 'Margen Promedio', value: '17.5%' }
        ].map((stat, i) => (
          <Card key={i}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Label>{stat.label}</Label>
              <Title level="H2" style={{ marginTop: '0.5rem' }}>{stat.value}</Title>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== LAYOUT ====================

const Layout = () => {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const pages = {
    dashboard: <DashboardPage />,
    catalogo: <CatalogoPage />,
    configuracion: <ConfiguracionPage />,
    analisis: <AnalisisPage />
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <ShellBar
        primaryTitle="Catálogo Maestro"
        logo={<Icon name="product" />}
        profile={<Avatar icon="employee" />}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{borderRight: '1px solid #e5e5e5', overflow: 'auto' }}>
          <SideNavigation onSelectionChange={(e) => {
            const key = e.detail.item.dataset.key;
            if (key) setSelectedMenu(key);
          }}>
            <SideNavigationItem
              text="Dashboard"
              icon="home"
              selected={selectedMenu === 'dashboard'}
              data-key="dashboard"
            />
            <SideNavigationItem
              text="Catálogo"
              icon="product"
              selected={selectedMenu === 'catalogo'}
              data-key="catalogo"
            />
            <SideNavigationItem
              text="Configuración"
              icon="action-settings"
              selected={selectedMenu === 'configuracion'}
              data-key="configuracion"
            />
            <SideNavigationItem
              text="Análisis"
              icon="bar-chart"
              selected={selectedMenu === 'analisis'}
              data-key="analisis"
            />
          </SideNavigation>
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#fafafa' }}>
          {pages[selectedMenu]}
        </div>
      </div>
    </div>
  );
};

export default Layout;