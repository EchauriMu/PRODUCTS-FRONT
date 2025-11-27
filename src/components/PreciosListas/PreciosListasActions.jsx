import preciosListasService from '../../api/preciosListasService';

/**
 * ================================================================================
 * MANEJADORES DE ACCIONES PARA PRECIOS LISTAS - PreciosListasActions.jsx
 * ================================================================================
 */
export const createActionHandlers = (setEditingLista, setIsModalOpen, setError, setLoading, setSelectedListas, setMessageStrip, fetchListas, listas, selectedListas) => {
  
  // === CREAR LISTA ===
  const handleAdd = () => {
    setEditingLista(null);
    setIsModalOpen(true);
  };

  // === EDITAR LISTA ===
  const handleEdit = (record) => {
    setEditingLista(record);
    setIsModalOpen(true);
  };

  /**
   * ELIMINAR LISTA INDIVIDUAL
   */
  const handleDelete = async (lista) => {
    if (!lista.IDLISTAOK) {
      setError('ID de lista no válido');
      return;
    }

    if (window.confirm(`¿Está seguro que desea eliminar permanentemente la lista "${lista.DESLISTA}"? Esta acción no se puede deshacer.`)) {
      setLoading(true);
      try {
        console.log('Iniciando eliminación de lista:', lista.IDLISTAOK);
        
        // Llamar al servicio para eliminar
        await preciosListasService.delete(lista.IDLISTAOK);
        
        console.log('Lista eliminada exitosamente');
        
        // Recargar la tabla
        await fetchListas();
        setError('');
        
        // Mostrar mensaje de éxito
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

  /**
   * GUARDAR LISTA (CREAR O ACTUALIZAR)
   */
  const handleSave = async (listaData) => { //AQUI SIGUE EL GUARDADO YA SEA DE LISTA NUEVA O UPDATE
    setLoading(true);
    try {
      // Aqui decision clase. Verificar si estamos editando una lista existente o creando una nueva
      if (setEditingLista && typeof setEditingLista === 'object' && setEditingLista.IDLISTAOK) {
        // MODO EDICIÓN: Ya existe una lista

        // Si cambió el estado ACTIVED
        if (typeof listaData.ACTIVED !== 'undefined' && setEditingLista.ACTIVED !== listaData.ACTIVED) {
          // El estado cambió
          if (listaData.ACTIVED) {
            // Cambió de false a true: ACTIVAR 
            await preciosListasService.activate(setEditingLista.IDLISTAOK);
          } else {
            // Cambió de true a false: DESACTIVAR 
            await preciosListasService.deleteLogic(setEditingLista.IDLISTAOK);
          }
        } else {
          // Estado NO cambió: ACTUALIZAR DATOS 
          await preciosListasService.update(setEditingLista.IDLISTAOK, listaData);
        }
      } else {
        // MODO CREACIÓN: Es una lista nueva
        // Ejecutar create() 
        await preciosListasService.create(listaData); //AQUI SE GUARDA
      }
      
      // Recargar la tabla desde el servidor (fetchListas)
      await fetchListas();
      
      // Cerrar el modal
      setIsModalOpen(false);
      
      // Limpiar errores
      setError('');
    } catch (err) {
      // Mostrar mensaje de error
      setError('Error al guardar la lista de precios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * ACTIVAR/DESACTIVAR (TOGGLE STATUS)
   
   */
  const handleToggleStatus = async () => { //se activan o desactivan varias listas
    // Salir si no hay listas seleccionadas
    if (selectedListas.size === 0) return;
    
    // Convertir Set a Array y buscar las listas en el estado
    const listasArray = Array.from(selectedListas).map(id => listas.find(l => l.IDLISTAOK === id));
    
    // Contar cuántas están activas y cuántas inactivas
    const activasCount = listasArray.filter(l => l && l.ACTIVED === true).length;
    const inactivasCount = listasArray.filter(l => l && (l.ACTIVED === false || l.DELETED === true)).length;
    
    // Determinar acción según mayoría
    const shouldActivate = inactivasCount > activasCount;
    const action = shouldActivate ? 'activar' : 'desactivar';
    
    // Pedir confirmación al usuario
    if (!window.confirm(`¿Está seguro que desea ${action} ${selectedListas.size} lista(s)?`)) return;

    setLoading(true);
    try {
      // Ejecutar la acción en cada lista seleccionada
      for (const listaId of selectedListas) {
        if (shouldActivate) {
          // ACTIVAR: ejecuta activate
          await preciosListasService.activate(listaId);
        } else {
          // DESACTIVAR: ejecuta deleteLogic
          await preciosListasService.deleteLogic(listaId);
        }
      }
      
      // Recargar tabla
      await fetchListas();
      
      // Limpiar selecciones
      setSelectedListas(new Set());
      
      // Limpiar errores
      setError('');
    } catch (err) {
      setError(`Error al ${action} listas: ` + (err.response?.data?.messageUSR || err.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * ELIMINAR LISTAS SELECCIONADAS
   */
  const handleDeleteSelected = async () => { //se ejecuta aqui para eliminar
    // Salir si no hay listas seleccionadas
    if (selectedListas.size === 0) return;

    // Pedir confirmación al usuario
    if (!window.confirm(`¿Está seguro que desea eliminar permanentemente ${selectedListas.size} lista(s)? Esta acción no se puede deshacer.`)) return;

    setLoading(true);
    try {
      // Ejecutar delete() para cada lista seleccionada
      for (const listaId of selectedListas) {
        // Eliminar permanentemente 
        await preciosListasService.delete(listaId); //cada lista seleccionada llama aqui
      }
      
      // Recargar tabla
      await fetchListas();
      
      // Limpiar selecciones
      setSelectedListas(new Set());
      
      // Limpiar errores
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


