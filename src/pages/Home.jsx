import React from 'react';
import { Card, CardHeader, Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell, Button, Input, Select, Option, ProgressIndicator, CheckBox, Label } from '@ui5/webcomponents-react';
import ProductsBreakdown from '../components/ProductsBreakdown';
import SalesRecap from '../components/SalesRecap';

import ProductsTableCard from '../components/Products/ProductsTableCard';



export default function ProductList() {
    return (
        <div style={{}}>
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '4px' }}>Product List</h3>
                <p style={{ color: '#757575', fontSize: '14px' }}>Real-time insights on sales performance and stock status</p>
            </div>
            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                <ProductsBreakdown />
             
            </div>
            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
          
            <ProductsTableCard/>
            </div>
        </div>

    );
}