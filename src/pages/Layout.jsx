import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Home from './Home';

import ProductsFiles from './ProductsFiles';
import ProductsPresentaciones from './ProductsPresentaciones';
import PreciosListas from './PreciosListas';
import PreciosItems from './PreciosItems';
import Promociones from './Promociones';
import Categorias from './Categorias';
import StepperPage from './StepperPage'; // ✅ Importación agregada

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <style>{`
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
        
        /* Sidebar Desktop */
        .sidebar-desktop {
          display: none;
          width: 240px;
          flex-shrink: 0;
        }
        
        .sidebar-desktop .sidebar-content {
          position: fixed;
          width: 240px;
          height: 100vh;
          overflow-y: auto;
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
        }
        
        .main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
        }
        
        /* Responsive Desktop */
        @media (min-width: 769px) {
          .sidebar-desktop {
            display: block !important;
          }
          .sidebar-mobile {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
          .main-content {
            padding: 24px;
          }
        }
        
        /* Responsive Mobile */
        @media (max-width: 768px) {
          .mobile-menu {
            display: block !important;
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

      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        fontFamily: 'var(--sapFontFamily)', 
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Sidebar Desktop - Fixed */}
        <div className="sidebar-desktop">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>

        {/* Sidebar Mobile - Overlay */}
        <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
          <div 
            className="mobile-overlay" 
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="content-with-sidebar">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />

          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products-files" element={<ProductsFiles />} />
              <Route path="/products-presentaciones" element={<ProductsPresentaciones />} />
              <Route path="/precios-listas" element={<PreciosListas />} />
              <Route path="/precios-items" element={<PreciosItems />} />
              <Route path="/promociones" element={<Promociones />} />
              <Route path="/categorias" element={<Categorias />} />
              
              {/* ✅ Nueva ruta agregada */}
              <Route path="/add-products" element={<StepperPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default Layout;
