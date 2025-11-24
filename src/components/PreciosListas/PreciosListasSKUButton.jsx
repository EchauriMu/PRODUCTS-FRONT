import React, { useState, useRef } from 'react';
import { Label, Popover } from '@ui5/webcomponents-react';

const SKUButton = ({ skuId, skusCount, skusList, onSkuClick }) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [popoverRef, setPopoverRef] = useState(null);
  const closeTimeoutRef = useRef(null);

  const handleMouseEnter = (e) => {
    // Limpiar cualquier cierre pendiente
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setPopoverRef(e.currentTarget);
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
    // Esperar un poco antes de cerrar, para permitir que el usuario entre al popover
    closeTimeoutRef.current = setTimeout(() => {
      setOpenPopover(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    // Si el ratón entra al popover, limpiar el timeout de cierre
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    // Si el ratón sale del popover, cerrarlo
    setOpenPopover(false);
  };

  return (
    <>
      <Label 
        ref={setPopoverRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onSkuClick();
        }}
        style={{
          padding: '0.3rem 1.5rem',
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'inline-block',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '1px solid #1976d2',
          whiteSpace: 'nowrap'
        }}
      >
        SKUs
      </Label>

      {openPopover && popoverRef && (
        <Popover
          open={openPopover}
          opener={popoverRef}
          placement="Bottom"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          style={{
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            padding: '0.75rem',
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Productos registrados ({skusCount})
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {Array.isArray(skusList) && skusList.map((sku, idx) => (
              <div key={idx} style={{ padding: '0.25rem 0', borderBottom: idx < skusList.length - 1 ? '1px solid #eee' : 'none' }}>
                • {sku}
              </div>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
};

export default SKUButton;
