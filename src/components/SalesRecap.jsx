import { useState } from 'react';
import {
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell
} from '@ui5/webcomponents-react';

const ProductsTable = () => {
  const products = [
    {
      id: 'FO12214AF',
      name: 'Secador de pelo Philips 200',
      category: 'Electrónica',
      distributor: 'Jojo Optima',
      qty: 1223,
      price: '$110.00'
    },
    {
      id: 'FO12214AG',
      name: 'HD Smart Tv T4501',
      category: 'Electrónica',
      distributor: 'Jaya Solusindo',
      qty: 2412,
      price: '$1950.00'
    },
    {
      id: 'FO12214AH',
      name: 'CCTV inteligente para interiores',
      category: 'Electrónica',
      distributor: 'Bala Bala Komp',
      qty: 2114,
      price: '$50.00'
    },
    {
      id: 'FO12214AI',
      name: 'Mini licuadora exprimidor',
      category: 'Electrónica',
      distributor: 'Grupo Halimawan',
      qty: 1211,
      price: '$23.00'
    },
    {
      id: 'FO12214AJ',
      name: 'Lámpara de estudio Flexible',
      category: 'Electrónica',
      distributor: 'Tara Tekno',
      qty: 3918,
      price: '$11.00'
    },
    {
      id: 'FO12214AK',
      name: 'Micrófono inalámbrico con clip',
      category: 'Electrónica',
      distributor: 'Tara Tekno',
      qty: 521,
      price: '$921.00'
    }
  ];

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Card Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🛒
          </div>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            margin: 0,
            color: '#1f2937'
          }}>
            Resumen de ventas
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
         Buscar
          </button>
          
          <button style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
            El mes pasado
          </button>
          
          <button style={{
            padding: '0.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
            ↓
          </button>
          
          <button style={{
            padding: '0.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
            Config
          </button>
          
          <button style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
            Filtrar
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        headerRow={
          <TableHeaderRow>
            <TableHeaderCell>Producto</TableHeaderCell>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Distribuidor</TableHeaderCell>
            <TableHeaderCell horizontalAlign="End">Cantidad</TableHeaderCell>
            <TableHeaderCell horizontalAlign="End">Precio fijo</TableHeaderCell>
          </TableHeaderRow>
        }
      >
        {products.map((product) => (
          <TableRow key={product.id} rowKey={product.id}>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  Inventory
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {product.category}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span style={{ color: '#6b7280' }}>#{product.id}</span>
            </TableCell>
            <TableCell>{product.distributor}</TableCell>
            <TableCell horizontalAlign="End">
              <span style={{ fontWeight: '500' }}>{product.qty}</span>
            </TableCell>
            <TableCell horizontalAlign="End">
              <span style={{ 
                color: '#059669', 
                fontWeight: '600',
                fontSize: '0.9375rem'
              }}>
                {product.price}
              </span>
              <span style={{ color: '#d1d5db', marginLeft: '0.25rem' }}>•••</span>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

export default ProductsTable;