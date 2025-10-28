import React from 'react';
import { Card, CardHeader, Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell, Button, Input, Select, Option, ProgressIndicator, CheckBox, Label } from '@ui5/webcomponents-react';
import ProductsBreakdown from '../components/ProductsBreakdown';
import SalesRecap from '../components/SalesRecap';
import RejectionItems from '../components/RejectionItems';
import ProductsTableCard from '../components/Products/ProductsTableCard';

// Datos estáticos mínimos
const products = [
    { id: '1', name: 'Philips Hair dryer 200', sku: '#F012214AF', distributor: 'Jojo Optima', qty: 1223, price: '$110.00', icon: '🔌', bg: '#f0f0f2' },
    { id: '2', name: 'HD Smart Tv T4501', sku: '#F012214AG', distributor: 'Jaya Solusindo', qty: 2412, price: '$1,950.00', icon: '📺', bg: '#e8eaf6' },
    { id: '3', name: 'Smart Indoor CCTV', sku: '#F012214AH', distributor: 'Bala Bala Komp', qty: 2114, price: '$50.00', icon: '📷', bg: '#f3e5f5' }
];

const channels = [
    { name: 'Website', value: 100, color: '#5ac8fa', width: '47.6%' },
    { name: 'Ebay', value: 50, color: '#34c759', width: '23.8%' },
    { name: 'Amazon', value: 60, color: '#007aff', width: '28.6%' }
];

export default function ProductList() {
    return (
        <div style={{}}>
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '4px' }}>Product List</h3>
                <p style={{ color: '#757575', fontSize: '14px' }}>Real-time insights on sales performance and stock status</p>
            </div>
            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                <ProductsBreakdown />
                <RejectionItems />
            </div>
            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
          
            <ProductsTableCard/>
            </div>
        </div>

    );
}