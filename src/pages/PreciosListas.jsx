import React, { useEffect, useState } from 'react';
import preciosListasService from '../api/preciosListasService';

const PreciosListas = () => {
  const [listas, setListas] = useState([]);
  const [error, setError] = useState('');

  // Cargar datos automáticamente cuando el componente se monte
  useEffect(() => {
    const fetchListas = async () => { 
      try {
        const result = await preciosListasService.getAllListas();
        setListas(result);
      } catch (err) {
        setError('Error al obtener las listas de precios.');
        console.error(err);
      }
    };

    fetchListas();
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Listas de Precios</h1>
      <p>Contenido relacionado con las listas de precios.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {listas.length > 0 ? (
        // 🔹 Contenedor con scroll horizontal
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            border="1"
            cellPadding="8"
            style={{
              marginTop: '1rem',
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: '1200px', // 🔹 evita que las columnas se compriman demasiado
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f3f3' }}>
                <th>IDLISTAOK</th>
                <th>IDINSTITUTOOK</th>
                <th>IDLISTABK</th>
                <th>DESLISTA</th>
                <th>FECHAEXPIRAINI</th>
                <th>FECHAEXPIRAFIN</th>
                <th>IDTIPOLISTAOK</th>
                <th>IDTIPOPGENERALISTAOK</th>
                <th>IDTIPOFORMULAOK</th>
                <th>REGUSER</th>
                <th>REGDATE</th>
                <th>MODUSER</th>
                <th>MODDATE</th>
                <th>ACTIVED</th>
                <th>DELETED</th>
                <th>HISTORY</th>
              </tr>
            </thead>

            <tbody>
              {listas.map((lista, index) => (
                <tr key={index}>
                  <td>{lista.IDLISTAOK}</td>
                  <td>{lista.IDINSTITUTOOK}</td>
                  <td>{lista.IDLISTABK}</td>
                  <td>{lista.DESLISTA}</td>
                  <td>{new Date(lista.FECHAEXPIRAINI).toLocaleDateString()}</td>
                  <td>{new Date(lista.FECHAEXPIRAFIN).toLocaleDateString()}</td>
                  <td>{lista.IDTIPOLISTAOK}</td>
                  <td>{lista.IDTIPOPGENERALISTAOK}</td>
                  <td>{lista.IDTIPOFORMULAOK}</td>
                  <td>{lista.REGUSER}</td>
                  <td>{new Date(lista.REGDATE).toLocaleDateString()}</td>
                  <td>{lista.MODUSER || '-'}</td>
                  <td>{lista.MODDATE ? new Date(lista.MODDATE).toLocaleDateString() : '-'}</td>
                  <td>{lista.ACTIVED ? '✅' : '❌'}</td>
                  <td>{lista.DELETED ? '🗑️' : '—'}</td>
                  <td>
                    {lista.HISTORY && lista.HISTORY.length > 0
                      ? lista.HISTORY.map((h, i) => (
                          <div key={i}>
                            {h.user} — {h.action} ({new Date(h.date).toLocaleDateString()})
                          </div>
                        ))
                      : 'Sin historial'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay listas registradas.</p>
      )}
    </div>
  );
};

export default PreciosListas;
