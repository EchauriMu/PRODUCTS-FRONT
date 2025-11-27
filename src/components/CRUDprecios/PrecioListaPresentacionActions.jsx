// Autor: Lucia López
import { useState, useEffect, useCallback } from 'react';
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

/**
 * @author Lucia López
 * Helpers
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined || typeof value !== 'number') {
    return 'N/D';
  }
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const calculateFormulaResult = (costoIni, formula) => {
  const costoBase = Number(costoIni) || 0;
  if (formula) {
    try {
      const formulaEval = formula.replace(/COSTO/g, costoBase);
      
      const result = eval(formulaEval); 
      if (isNaN(result) || !isFinite(result)) {
        return costoBase;
      }
      return parseFloat(result.toFixed(2));
    } catch (e) {
      return costoBase; 
    }
  }
  return costoBase; 
};

/**
 * @author Lucia López
 * Componente Principal
 */

const PrecioListaPresentacionActions = ({ idPresentaOK, skuid, idListaOK }) => {
  const [currentPrice, setCurrentPrice] = useState(null); 
  const [editingValues, setEditingValues] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCurrentPrice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allPricesForPresentation = await preciosItemsService.getPricesByIdPresentaOK(idPresentaOK);
      const price = allPricesForPresentation.find(p => p.IdListaOK === idListaOK);

      const initialPrice = price || { CostoIni: 0, Formula: '', Precio: 0 };
      
      setCurrentPrice(price);
      
      const calculatedInitialPrice = initialPrice.Formula 
        ? calculateFormulaResult(Number(initialPrice.CostoIni) || 0, initialPrice.Formula)
        : (Number(initialPrice.Precio) || 0);

      setEditingValues({
        CostoIni: Number(initialPrice.CostoIni) || 0,
        Formula: initialPrice.Formula || '',
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

  useEffect(() => {
      const { CostoIni, Formula } = editingValues;
      
      const newCalculatedPrice = calculateFormulaResult(CostoIni || 0, Formula || '');
      
      if (Math.abs(editingValues.Precio - newCalculatedPrice) > 0.001) {
        setEditingValues(prev => ({ 
          ...prev, 
          Precio: newCalculatedPrice 
        }));
      }
      
  }, [editingValues.CostoIni, editingValues.Formula]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'CostoIni' || name === 'Formula') {
        const val = (name === 'Formula' || value === '') ? value : parseFloat(value);
        setEditingValues(prev => ({ ...prev, [name]: val }));
        setError(''); 
    }
  };

  const handlePriceActionCompleted = () => {
    setError(''); 
    setRefreshKey(prev => prev + 1); 
  };

  const isChanged = currentPrice 
    ? (editingValues.CostoIni !== (Number(currentPrice.CostoIni) || 0) ||
       editingValues.Formula !== (currentPrice.Formula || '') ||
       Math.abs(editingValues.Precio - (Number(currentPrice.Precio) || 0)) > 0.001) 
    : (editingValues.CostoIni !== 0 || editingValues.Formula !== '' || editingValues.Precio !== 0);

  const hasPrice = currentPrice && currentPrice.IdPrecioOK;
  
  /** @author Lucia López */
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
    
    const CostoFin = Formula 
        ? calculateFormulaResult(CostoIni, Formula) 
        : CostoIni; 
    
    const loggedUser = localStorage.getItem('user') || 'admin';
    const tipoFormula = Formula ? 'FORM001' : '';
    
    const dataToSave = {
        CostoIni: CostoIni,
        Formula: Formula,
        Precio: Precio, 
        CostoFin: CostoFin, 
        IdPresentaOK: idPresentaOK,
        IdListaOK: idListaOK, 
        SKUID: skuid, 
        ACTIVED: true, 
        
        IdTipoFormulaOK: tipoFormula,
        REGUSER: loggedUser, 
    };

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
    else {
      try {
        const generatedIdPrecioOK = `PRECIOS-${Date.now()}`;

        const dataToCreate = {
            ...dataToSave,
            IdPrecioOK: generatedIdPrecioOK,
        };

        const newPrice = await preciosItemsService.createPrice(dataToCreate);
        
        setCurrentPrice(newPrice); 
        setError('✅ Precio añadido correctamente.');
        setTimeout(() => handlePriceActionCompleted(), 1000); 

      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Error desconocido en el servidor.';
        setError(`❌ Error al añadir precio: ${errorMessage}`);
      } finally {
        setIsSaving(false);
      }
    }
};

  if (loading) {
    return <BusyIndicator active size="Small" style={{ margin: '1rem' }} />;
  }

  return (
    <FlexBox direction="Column" style={{ width: '100%', padding: '0.5rem' }}>
      
      {error && (
          <MessageStrip 
            type={error.startsWith('✅') ? 'Positive' : 'Negative'} 
            style={{ marginBottom: '0.5rem' }}
          >
            {error}
          </MessageStrip>
      )}

      <FlexBox direction="Row" alignItems="End" style={{ gap: '0.5rem' }}>
        
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

        <FlexBox direction="Column" style={{ flex: 1, minWidth: '80px' }}>
          <Label style={{ fontSize: '0.75rem', color: '#666' }}>Precio de Venta</Label>
          
          <Text 
            style={{ 
              fontWeight: 'bold', 
              color: '#0A6ED1',
              fontSize: '1rem',
              padding: '0.5625rem 0.625rem',
              border: '1px solid #959595',
              borderRadius: '0.25rem',
              backgroundColor: '#f5f5f5',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {formatCurrency(editingValues.Precio)}
          </Text>


        </FlexBox>
        
        <FlexBox style={{ alignSelf: 'flex-end', gap: '0.2rem' }}>
          {isChanged && (
            <>
              <Button
                design="Emphasized"
                icon={hasPrice ? "edit" : "add"} 
                onClick={handleSave}
                title={hasPrice ? "Guardar Edición" : "Añadir Precio"}
                disabled={isSaving}
              >
                {isSaving ? <BusyIndicator active size="Small" /> : (hasPrice ? 'Editar' : 'Añadir')}
              </Button>

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