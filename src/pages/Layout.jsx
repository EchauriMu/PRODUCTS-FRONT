import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Home from './Home';

import ProductsFiles from './ProductsFiles';
import ProductsPresentaciones from './ProductsPresentaciones';
import PreciosListas from './PreciosListas';
import PreciosItems from './PreciosItems';
import Promociones from './Promociones';
import CrearPromocion from './CrearPromocion';
import Categorias from './Categorias';
import StepperPage from './StepperPage';
import CrearEditarListaPreciosPage from './CrearEditarListaPreciosPage';
import AddPresentationPage from '../components/CRUDPresentaciones/AddPresentationPage';
import SelectPresentationToEditPage from '../components/CRUDPresentaciones/SelectPresentationToEditPage';
import EditPresentationPage from '../components/CRUDPresentaciones/EditPresentationPage';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Inicia abierto en escritorio

  return (
    <div className={`layout-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--sapFontFamily)', width: '100%', overflow: 'hidden' }}>      <style>{`
        /* Reset global para evitar desbordamientos */
        * {
          box-sizing: border-box;
        }
        
        body, html, #root {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          width: 100%;
        }
        
        /* Sidebar (Unificado) */
        .sidebar {
          width: 240px;
          flex-shrink: 0;
          transition: margin-left 0.3s ease;
        }
        
        /* Sidebar Mobile */
        .sidebar-mobile .sidebar-content {
          position: fixed;
          top: 0;
          left: -240px;
          bottom: 0;
          width: 240px;
          height: 100vh;
          z-index: 1000;
          transition: left 0.3s ease;
          overflow-y: auto;
        }
        
        .sidebar-mobile.open .sidebar-content {
          left: 0;
        }
        
        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }
        
        .sidebar-mobile.open .mobile-overlay {
          display: block;
        }
        
        .mobile-close {
          display: none;
        }
        
        /* Content Area */
        .content-with-sidebar {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: margin-left 0.3s ease;
        }
        
        .main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
        }
        
        /* Responsive Desktop */
        @media (min-width: 769px) {
          .sidebar-mobile {
            display: none !important;
          }
          .main-content {
            padding: 24px;
          }
          .sidebar-closed .sidebar {
            margin-left: -240px;
          }
          .sidebar-closed .content-with-sidebar {
            margin-left: 0;
          }
          .sidebar .sidebar-content {
            position: fixed;
            width: 240px;
            height: 100vh;
            overflow-y: auto;
          }
          .mobile-overlay, .mobile-close {
            display: none !important;
          }
        }
        
        /* Responsive Mobile */
        @media (max-width: 768px) {
          .sidebar {
            display: none !important;
          }
          .mobile-close {
            display: block !important;
          }
          .hide-mobile {
            display: none !important;
          }
          .hide-mobile-text button span {
            display: none !important;
          }
          
          .content-grid {
            grid-template-columns: 1fr !important;
          }
          
          .ui5-table-wrapper {
            overflow-x: auto !important;
          }
          
          .main-content {
            padding: 12px;
          }
        }
        
        table {
          max-width: 100%;
        }
        
        .ui5-card {
          max-width: 100%;
          overflow: hidden;
        }
      `}</style>

        {/* Sidebar para Desktop (se oculta/muestra con margen) */}
        <div className="sidebar">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={false} />
        </div>

        {/* Sidebar Mobile - Overlay */}
        <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={true} />
        </div>

        {/* Main Content Area */}
        <div className="content-with-sidebar">
          {/* El botón ahora alterna el estado del sidebar */}
          <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products-files" element={<ProductsFiles />} />
              <Route path="/products-presentaciones" element={<ProductsPresentaciones />} />
              <Route path="/precios-listas" element={<PreciosListas />} />
              <Route path="/precios-listas/crear" element={<CrearEditarListaPreciosPage />} />
              <Route path="/precios-items" element={<PreciosItems />} />
              <Route path="/promociones" element={<Promociones />} />
              <Route path="/promociones/crear" element={<CrearPromocion />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/add-products" element={<StepperPage />} />
              <Route path="/products/:skuid/presentations/add" element={<AddPresentationPage />} />
              <Route path="/products/:skuid/presentations/select-edit" element={<SelectPresentationToEditPage />} />
              <Route path="/products/:skuid/presentations/edit/:presentaId" element={<EditPresentationPage />} />
            </Routes>
          </div>
        </div>
      </div>
  )
};

export default Layout;
