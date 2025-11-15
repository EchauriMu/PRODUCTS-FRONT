import preciosListasService from '../../api/preciosListasService';

/**
 * Handlers para acciones CRUD de Precios Listas
 * Extraídos de PreciosListasTable para mantener el código limpio
 */

export const createActionHandlers = (setEditingLista, setIsModalOpen, setError, setLoading, setSelectedListas, setMessageStrip, fetchListas, listas, selectedListas) => {
  
  // === Crear Lista ===
  const handleAdd = () => {
    setEditingLista(null);
    setIsModalOpen(true);
  };

  // === Editar Lista ===
  const handleEdit = (record) => {
    setEditingLista(record);
    setIsModalOpen(true);
  };

  // === Eliminar Lista ===
  const handleDelete = async (lista) => {
    if (!lista.IDLISTAOK) {
      setError('ID de lista no válido');
      return;
    }

    if (window.confirm(`¿Está seguro que desea eliminar permanentemente la lista "${lista.DESLISTA}"? Esta acción no se puede deshacer.`)) {
      setLoading(true);
      try {
        console.log('Iniciando eliminación de lista:', lista.IDLISTAOK);
        
        await preciosListasService.delete(lista.IDLISTAOK);
        
        console.log('Lista eliminada exitosamente');
        
        await fetchListas();
        setError('');
        
        setMessageStrip({
          message: `Lista "${lista.DESLISTA}" eliminada exitosamente`,
          type: 'Success'
        });
        setTimeout(() => setMessageStrip(null), 3000);
        
      } catch (err) {
        console.error('Error al eliminar:', err);
        
        let errorMessage;
        if (err.response?.data?.messageUSR) {
          errorMessage = err.response.data.messageUSR;
        } else if (err.response?.status === 400) {
          errorMessage = 'Error en la solicitud. Verifique los datos.';
        } else if (err.response?.status === 404) {
          errorMessage = 'La lista no existe o ya fue eliminada.';
        } else {
          errorMessage = err.message || 'Error desconocido al eliminar la lista de precios';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // === Guardar Lista (Crear o Actualizar) ===
  const handleSave = async (listaData) => {
    setLoading(true);
    try {
      if (setEditingLista && typeof setEditingLista === 'object' && setEditingLista.IDLISTAOK) {
        // Si cambia el estado ACTIVED
        if (typeof listaData.ACTIVED !== 'undefined' && setEditingLista.ACTIVED !== listaData.ACTIVED) {
          if (listaData.ACTIVED) {
            await preciosListasService.activate(setEditingLista.IDLISTAOK);
          } else {
            await preciosListasService.deleteLogic(setEditingLista.IDLISTAOK);
          }
        } else {
          await preciosListasService.update(setEditingLista.IDLISTAOK, listaData);
        }
      } else {
        await preciosListasService.create(listaData);
      }
      await fetchListas();
      setIsModalOpen(false);
      setError('');
    } catch (err) {
      setError('Error al guardar la lista de precios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // === Activar/Desactivar (Toggle Status) ===
  const handleToggleStatus = async () => {
    if (selectedListas.size === 0) return;
    
    const listasArray = Array.from(selectedListas).map(id => listas.find(l => l.IDLISTAOK === id));
    const activasCount = listasArray.filter(l => l && l.ACTIVED === true).length;
    const inactivasCount = listasArray.filter(l => l && (l.ACTIVED === false || l.DELETED === true)).length;
    
    const shouldActivate = inactivasCount > activasCount;
    const action = shouldActivate ? 'activar' : 'desactivar';
    
    if (!window.confirm(`¿Está seguro que desea ${action} ${selectedListas.size} lista(s)?`)) return;

    setLoading(true);
    try {
      for (const listaId of selectedListas) {
        if (shouldActivate) {
          await preciosListasService.activate(listaId);
        } else {
          await preciosListasService.deleteLogic(listaId);
        }
      }
      await fetchListas();
      setSelectedListas(new Set());
      setError('');
    } catch (err) {
      setError(`Error al ${action} listas: ` + (err.response?.data?.messageUSR || err.message));
    } finally {
      setLoading(false);
    }
  };

  // === Eliminar Seleccionadas ===
  const handleDeleteSelected = async () => {
    if (selectedListas.size === 0) return;

    if (!window.confirm(`¿Está seguro que desea eliminar permanentemente ${selectedListas.size} lista(s)? Esta acción no se puede deshacer.`)) return;

    setLoading(true);
    try {
      for (const listaId of selectedListas) {
        await preciosListasService.delete(listaId);
      }
      await fetchListas();
      setSelectedListas(new Set());
      setError('');
    } catch (err) {
      setError('Error al eliminar listas: ' + (err.response?.data?.messageUSR || err.message));
    } finally {
      setLoading(false);
    }
  };

  return {
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
    handleToggleStatus,
    handleDeleteSelected
  };
};
