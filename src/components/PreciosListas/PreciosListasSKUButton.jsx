import React, { useState } from 'react';
import { Label, Popover } from '@ui5/webcomponents-react';

const SKUButton = ({ skuId, skusCount, skusList, onSkuClick }) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [popoverRef, setPopoverRef] = useState(null);

  const handleMouseEnter = (e) => {
    setPopoverRef(e.currentTarget);
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
            {Array.isArray(skusList) && skusList.slice(0, 10).map((sku, idx) => (
              <div key={idx} style={{ padding: '0.25rem 0', borderBottom: idx < Math.min(10, skusList.length - 1) ? '1px solid #eee' : 'none' }}>
                • {sku}
              </div>
            ))}
            {skusList.length > 10 && (
              <div style={{ padding: '0.5rem 0', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ddd', color: '#999', fontStyle: 'italic', textAlign: 'center' }}>
                +{skusList.length - 10} más...
              </div>
            )}
          </div>
        </Popover>
      )}
    </>
  );
};

export default SKUButton;
