import React from 'react';
import CategoriasTableCard from '../components/Categorias/CategoriasTableCard';
import RejectionItems from '../components/Categorias/RejectionItems';
const Categorias = () => {
  return (
    <div style={{ padding: '1rem' }}>
         <RejectionItems />
      <CategoriasTableCard />
    </div>
  );
};

export default Categorias;