import React, { useState, useEffect, useCallback } from 'react';
import {
  FlexBox,
  Label,
  Text,
  Button,
  BusyIndicator,
  Input,
  MessageStrip
} from '@ui5/webcomponents-react';
import preciosItemsService from '../../api/preciosItemsService';
// ❌ IMPORTACIÓN ELIMINADA: Ya no se necesita AddPresentationPriceModalNuevo

// --- HELPERS ---

// Función para formato de moneda (ajusta la localización si es necesario)
const formatCurrency = (value) => {
  if (value === null || value === undefined || typeof value !== 'number') {
    return 'N/D';
  }
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Función para calcular el resultado de la Fórmula o el Costo Inicial
// Solo reconoce la variable 'COSTO'
const calculateFormulaResult = (costoIni, formula) => {
  const costoBase = Number(costoIni) || 0;
  if (formula) {
    try {
      // CRÍTICO: SOLO REEMPLAZA 'COSTO' con el valor de costoBase
      const formulaEval = formula.replace(/COSTO/g, costoBase);
      
      // Asegúrate de que no haya divisiones por cero o NaN
      const result = eval(formulaEval); 
      if (isNaN(result) || !isFinite(result)) {
        return costoBase;
      }
      return parseFloat(result.toFixed(2));
    } catch (e) {
      // Si la fórmula es inválida, devuelve el costo base
      return costoBase; 
    }
  }
  // Si no hay fórmula, el valor base es el Costo Inicial
  return costoBase; 
};


// --- COMPONENTE PRINCIPAL ---

const PrecioListaPresentacionActions = ({ idPresentaOK, skuid, idListaOK }) => {
  const [currentPrice, setCurrentPrice] = useState(null); 
  const [editingValues, setEditingValues] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Obtener el precio actual
  const fetchCurrentPrice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allPricesForPresentation = await preciosItemsService.getPricesByIdPresentaOK(idPresentaOK);
      const price = allPricesForPresentation.find(p => p.IdListaOK === idListaOK);

      const initialPrice = price || { CostoIni: 0, Formula: '', Precio: 0 };
      
      setCurrentPrice(price);
      
      // Calcular el precio inicial si hay fórmula, sino usar el Precio de Venta guardado
      const calculatedInitialPrice = initialPrice.Formula 
        ? calculateFormulaResult(Number(initialPrice.CostoIni) || 0, initialPrice.Formula)
        : (Number(initialPrice.Precio) || 0);

      setEditingValues({
        CostoIni: Number(initialPrice.CostoIni) || 0,
        Formula: initialPrice.Formula || '',
        // El precio inicial del estado debe ser el calculado o el guardado
        Precio: calculatedInitialPrice,
      });

    } catch (err) {
      setError('Error al cargar el precio');
      setCurrentPrice(null);
      setEditingValues({ CostoIni: 0, Formula: '', Precio: 0 }); 
    } finally {
      setLoading(false);
    }
  }, [idPresentaOK, idListaOK, refreshKey]);

  useEffect(() => {
    fetchCurrentPrice();
  }, [fetchCurrentPrice]);


  // 2. EFECTO PARA EL CÁLCULO AUTOMÁTICO del Precio de Venta
  useEffect(() => {
      const { CostoIni, Formula } = editingValues;
      
      // Obtiene el resultado de la fórmula (o CostoIni si no hay fórmula)
      const newCalculatedPrice = calculateFormulaResult(CostoIni || 0, Formula || '');
      
      // Si el precio calculado es diferente al valor actual del Precio, actualiza el estado.
      if (Math.abs(editingValues.Precio - newCalculatedPrice) > 0.001) {
        setEditingValues(prev => ({ 
          ...prev, 
          Precio: newCalculatedPrice 
        }));
      }
      
  }, [editingValues.CostoIni, editingValues.Formula]);


  // Manejador para el cambio en los Inputs (solo CostoIni y Formula)
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // Solo permitimos editar CostoIni y Formula
    if (name === 'CostoIni' || name === 'Formula') {
        const val = (name === 'Formula' || value === '') ? value : parseFloat(value);
        setEditingValues(prev => ({ ...prev, [name]: val }));
        setError(''); 
    }
  };

  // Manejador para recargar (usado después de guardar/añadir)
  const handlePriceActionCompleted = () => {
    setError(''); 
    setRefreshKey(prev => prev + 1); 
  };

  // Determinar si hay cambios para habilitar los botones
  const isChanged = currentPrice 
    ? (editingValues.CostoIni !== (Number(currentPrice.CostoIni) || 0) ||
       editingValues.Formula !== (currentPrice.Formula || '') ||
       // CRÍTICO: Se compara el Precio calculado con el Precio guardado
       Math.abs(editingValues.Precio - (Number(currentPrice.Precio) || 0)) > 0.001) 
    : (editingValues.CostoIni !== 0 || editingValues.Formula !== '' || editingValues.Precio !== 0);

  const hasPrice = currentPrice && currentPrice.IdPrecioOK;
  

  // --- Lógica de Guardar/Añadir (Unificada) ---
  const handleSave = async () => {
    const { CostoIni, Formula, Precio } = editingValues;

    if (CostoIni < 0 || Precio < 0) {
      setError('Costo Inicial no puede ser negativo.');
      return;
    }
    if (Precio === 0 && !Formula && CostoIni === 0) {
        setError('Ingrese al menos un valor de costo o fórmula para guardar.');
        return;
    }

    setIsSaving(true);
    setError('');
    
    // 1. Calcular CostoFin
    const CostoFin = Formula 
        ? calculateFormulaResult(CostoIni, Formula) 
        : CostoIni; 
    
    // 2. Definir campos comunes (incluyendo los críticos)
    const loggedUser = localStorage.getItem('user') || 'admin'; // Obtener usuario logueado
    const tipoFormula = Formula ? 'FORM001' : ''; // Asumimos 'FORM001' si hay fórmula
    
    const dataToSave = {
        CostoIni: CostoIni,
        Formula: Formula,
        Precio: Precio, 
        CostoFin: CostoFin, 
        IdPresentaOK: idPresentaOK,
        IdListaOK: idListaOK, 
        SKUID: skuid, 
        ACTIVED: true, 
        
        // CRÍTICO: CAMPOS FALTANTES QUE CAUSAN EL ERROR 500
        IdTipoFormulaOK: tipoFormula,
        REGUSER: loggedUser, 
    };

    // 3. MODO EDITAR: Si ya existe un precio
    if (hasPrice) {
      try {
        const dataToUpdate = {
            ...dataToSave,
            IdPrecioOK: currentPrice.IdPrecioOK,
        }
        await preciosItemsService.updatePrice(currentPrice.IdPrecioOK, dataToUpdate);
        setError('✅ Precio actualizado correctamente.');
        setTimeout(() => handlePriceActionCompleted(), 1000);

      } catch (err) {
        setError(`❌ Error al editar: ${err.message || 'Error desconocido'}`);
      } finally {
        setIsSaving(false);
      }
    } 
    // 4. MODO AÑADIR (Directo)
    else {
      try {
        // CRÍTICO: Generar el IdPrecioOK antes de crear (patrón del modal anterior)
        const generatedIdPrecioOK = `PRECIOS-${Date.now()}`;

        const dataToCreate = {
            ...dataToSave,
            IdPrecioOK: generatedIdPrecioOK, // ¡Este era crítico!
        };

        const newPrice = await preciosItemsService.createPrice(dataToCreate);
        
        setCurrentPrice(newPrice); 
        setError('✅ Precio añadido correctamente.');
        setTimeout(() => handlePriceActionCompleted(), 1000); 

      } catch (err) {
        // Mejor manejo del error de backend
        const errorMessage = err.response?.data?.message || err.message || 'Error desconocido en el servidor.';
        setError(`❌ Error al añadir precio: ${errorMessage}`);
      } finally {
        setIsSaving(false);
      }
    }
};

  // --- Renderizado ---

  if (loading) {
    return <BusyIndicator active size="Small" style={{ margin: '1rem' }} />;
  }

  return (
    <FlexBox direction="Column" style={{ width: '100%', padding: '0.5rem' }}>
      
      {/* Mensaje de Error/Éxito */}
      {error && (
          <MessageStrip 
            type={error.startsWith('✅') ? 'Positive' : 'Negative'} 
            style={{ marginBottom: '0.5rem' }}
          >
            {error}
          </MessageStrip>
      )}

      {/* Row de Inputs y Botones */}
      <FlexBox direction="Row" alignItems="End" style={{ gap: '0.5rem' }}>
        
        {/* Costo Inicial */}
        <FlexBox direction="Column" style={{ flex: 1, minWidth: '80px' }}>
          <Label style={{ fontSize: '0.75rem', color: '#666' }}>Costo Inicial</Label>
          <Input 
            type="Number" 
            name="CostoIni" 
            value={editingValues.CostoIni} 
            onChange={handleEditChange} 
            placeholder="0.00"
            style={{ width: '100%' }}
            disabled={isSaving}
          />
        </FlexBox>

        {/* Fórmula Aplicada */}
        <FlexBox direction="Column" style={{ flex: 2, minWidth: '150px' }}>
          <Label style={{ fontSize: '0.75rem', color: '#666' }}>Fórmula Aplicada</Label>
          <Input 
            name="Formula" 
            value={editingValues.Formula} 
            onChange={handleEditChange} 
            placeholder="Ej: COSTO * 1.16"
            style={{ width: '100%' }}
            disabled={isSaving}
          />
        </FlexBox>

        {/* Precio de Venta (Calculado, en Azul y con Formato Moneda) */}
        <FlexBox direction="Column" style={{ flex: 1, minWidth: '80px' }}>
          <Label style={{ fontSize: '0.75rem', color: '#666' }}>Precio de Venta</Label>
          
          <Text 
            style={{ 
              fontWeight: 'bold', 
              color: '#0A6ED1', // Color Azul
              fontSize: '1rem',
              // CRÍTICO: Estos estilos alinean el 'Text' con los 'Input'
              padding: '0.5625rem 0.625rem', // Ajustado para igualar la altura del Input
              border: '1px solid #959595', // Borde más oscuro similar al Input
              borderRadius: '0.25rem',
              backgroundColor: '#f5f5f5', // Fondo ligero para indicar 'solo lectura'
              height: '2.5rem', // Altura fija si es necesario para la alineación
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {formatCurrency(editingValues.Precio)}
          </Text>


        </FlexBox>
        
        {/* Botones de Acción */}
        <FlexBox style={{ alignSelf: 'flex-end', gap: '0.2rem' }}>
          {isChanged && (
            <>
              {/* Botón de Guardar/Añadir */}
              <Button
                design="Emphasized"
                icon={hasPrice ? "edit" : "add"} 
                onClick={handleSave} // Llama a la lógica unificada
                title={hasPrice ? "Guardar Edición" : "Añadir Precio"}
                disabled={isSaving}
              >
                {isSaving ? <BusyIndicator active size="Small" /> : (hasPrice ? 'Editar' : 'Añadir')}
              </Button>

              {/* Botón de Cancelar */}
              <Button
                design="Transparent"
                icon="sys-cancel"
                onClick={() => fetchCurrentPrice()} 
                title="Cancelar Cambios"
                disabled={isSaving}
              />
            </>
          )}
        </FlexBox>
      </FlexBox>      
    </FlexBox>
  );
};

export default PrecioListaPresentacionActions;