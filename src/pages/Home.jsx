import React from 'react';
import { Card, CardHeader, Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell, Button, Input, Select, Option, ProgressIndicator, CheckBox, Label } from '@ui5/webcomponents-react';
import ProductsBreakdown from '../components/ProductsBreakdown';
import SalesRecap from '../components/SalesRecap';

import ProductsTableCard from '../components/Products/ProductsTableCard';



export default function ProductList() {
    return (
        <div style={{}}>
         
        
            <div className="content-grid" >
          
            <ProductsTableCard/>
            </div>
        </div>

    );
}