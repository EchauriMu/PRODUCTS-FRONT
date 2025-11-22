import preciosListasService from '../../api/preciosListasService';

/**
 * ================================================================================
 * MANEJADORES DE ACCIONES PARA PRECIOS LISTAS - PreciosListasActions.jsx
 * ================================================================================
 * 
 * Este módulo contiene todas las funciones que manejan las acciones CRUD
 * para las listas de precios:
 * 
 * - handleAdd: Abre el modal para crear una nueva lista
 * - handleSave: Guarda (crear o actualizar) una lista
 * - handleToggleStatus: Activa/desactiva listas seleccionadas
 * - handleDeleteSelected: Elimina permanentemente listas seleccionadas
 * 
 * Cada función coordina la lógica del negocio y llama al servicio correspondiente
 * 
 * ================================================================================
 */

/**
 * Crea todos los manejadores de acciones para CRUD de Precios Listas
 * 
 * Parámetros que recibe (setters del componente PreciosListasTable):
 * - setEditingLista: Para guardar la lista que se está editando
 * - setIsModalOpen: Para abrir/cerrar el modal
 * - setError: Para mostrar mensajes de error
 * - setLoading: Para mostrar indicador de carga
 * - setSelectedListas: Para guardar listas seleccionadas
 * - setMessageStrip: Para mostrar mensajes de éxito
 * - fetchListas: Función para recargar la tabla desde el servidor
 * - listas: Array actual de listas
 * - selectedListas: Set de IDs de listas seleccionadas
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
   * 🔹 ELIMINAR LISTA INDIVIDUAL
   * 
   * ¿QUÉ SUCEDE?
   * - Solicita confirmación del usuario
   * - Elimina permanentemente la lista usando preciosListasService.delete()
   * - Recarga la tabla
   * - Muestra mensaje de éxito
   * 
   * PARÁMETROS:
   * - lista: Objeto con los datos de la lista a eliminar
   * 
   * FLUJO:
   * 1. Usuario hace clic en botón "Eliminar" (que desencadena handleDeleteSelected)
   * 2. O click directo en una fila con opción de eliminar
   * 3. Se abre un MessageBox pidiendo confirmación
   * 4. Si confirma, se ejecuta esta función
   * 5. Llama preciosListasService.delete(lista.IDLISTAOK) ← ⭐ ESTA LÍNEA
   * 6. Backend elimina permanentemente el registro
   * 7. Se llama fetchListas() para recargar datos
   * 8. Se muestra MessageStrip con confirmación
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
   * 🔹💾 GUARDAR LISTA (CREAR O ACTUALIZAR)
   * 
   * ¿QUÉ SUCEDE?
   * - Determina si es un CREATE (nueva lista) o UPDATE (editar existente)
   * - Si cambió el estado ACTIVED, ejecuta activate() o deleteLogic()
   * - Si no cambió estado pero hay editingLista, ejecuta update()
   * - Si es una lista nueva (sin editingLista), ejecuta create()
   * - Recarga la tabla
   * - Cierra el modal
   * 
   * PARÁMETROS:
   * - listaData: Objeto con todos los datos de la lista a guardar
   *   {
   *     IDLISTAOK, DESLISTA, SKUSIDS, IDINSTITUTOOK,
   *     IDTIPOLISTAOK, IDTIPOFORMULAOK, FECHAEXPIRAINI,
   *     FECHAEXPIRAFIN, IDTIPOGENERALISTAOK, ACTIVED
   *   }
   * 
   * FLUJO PARA CREAR NUEVA LISTA:
   * 1. Usuario hace clic en "Crear Lista"
   * 2. Se abre modal vacío (editingLista=null)
   * 3. Usuario completa los datos
   * 4. Hace clic en "Guardar"
   * 5. PreciosListasModal.handleSaveClick() valida datos (línea 170-187)
   * 6. Llama onSave(dataToSave)
   * 7. Se ejecuta handleSave(dataToSave) ← ESTA FUNCIÓN
   * 8. Detecta que NO hay editingLista.IDLISTAOK (línea 57)
   * 9. Ejecuta: await preciosListasService.create(listaData) ← ⭐ LÍNEA 70-71\n   * 10. Backend inserta nueva lista
   * 11. Se recarga tabla con fetchListas() (línea 73)
   * 12. Modal se cierra (línea 74)
   * 13. Se limpia error (línea 75)
   * \n   * FLUJO PARA ACTUALIZAR LISTA EXISTENTE:\n   * 1. Usuario selecciona una lista en la tabla
   * 2. Usuario hace clic en "Editar"
   * 3. Se abre modal con datos cargados (editingLista=lista)
   * 4. Usuario modifica campos
   * 5. Hace clic en "Guardar"
   * 6. PreciosListasModal.handleSaveClick() valida datos
   * 7. Llama onSave(dataToSave)
   * 8. Se ejecuta handleSave(dataToSave) ← ESTA FUNCIÓN
   * 9. Detecta que SÍ hay editingLista.IDLISTAOK (línea 57)
   * 10. Si NO cambió ACTIVED (línea 58), ejecuta update() ← ⭐ LÍNEA 68\n   * 11. Si SÍ cambió ACTIVED:
   *     - Si cambió a TRUE: ejecuta activate() ← ⭐ LÍNEA 61-62
   *     - Si cambió a FALSE: ejecuta deleteLogic() ← ⭐ LÍNEA 64-67
   * 12. Backend actualiza el registro
   * 13. Se recarga tabla con fetchListas() (línea 73)
   * 14. Modal se cierra (línea 74)
   * 15. Se limpia error (línea 75)
   * 
   * IMPORTANTE:\n   * - Este es el HUB central de operaciones de guardado
   * - Detecta automáticamente si es CREATE o UPDATE
   * - Detecta cambios de estado y ejecuta operación diferente
   * - Maneja errores y muestra mensaje al usuario
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
        // 🆕 MODO CREACIÓN: Es una lista nueva
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
   * 🔹✅❌ ACTIVAR/DESACTIVAR (TOGGLE STATUS)
   * 
   * ¿QUÉ SUCEDE?
   * - Permite activar o desactivar múltiples listas a la vez
   * - Determina automáticamente qué acción hacer según el estado actual
   * - Si hay más activas que inactivas → desactiva todas
   * - Si hay más inactivas que activas → activa todas
   * - Solicita confirmación antes de ejecutar
   * 
   * PARÁMETROS:
   * - (usa selectedListas del contexto)
   * 
   * LÓGICA:\n   * 1. Si tienes 3 listas seleccionadas:
   *    - 2 activas (ACTIVED=true)
   *    - 1 inactiva (ACTIVED=false)
   * 2. shouldActivate será TRUE (hay más inactivas que activas)
   * 3. Se activan todas
   * 
   * FLUJO PARA ACTIVAR:\n   * 1. Usuario selecciona listas inactivas en la tabla
   * 2. Usuario hace clic en botón "Activar"
   * 3. Se calcula shouldActivate = true (línea 85-89)
   * 4. Se pide confirmación (línea 91)
   * 5. Si confirma, ejecuta un loop (línea 93-95):
   *    await preciosListasService.activate(listaId) ← ⭐ ESTA LÍNEA\n   * 6. Para cada lista seleccionada se ejecuta activate()
   * 7. Se recarga tabla (fetchListas)
   * 8. Se limpian selecciones
   * 
   * FLUJO PARA DESACTIVAR:\n   * 1. Usuario selecciona listas activas en la tabla
   * 2. Usuario hace clic en botón "Desactivar" (es el mismo botón, cambia de nombre)
   * 3. Se calcula shouldActivate = false (línea 85-89)
   * 4. Se pide confirmación (línea 91)
   * 5. Si confirma, ejecuta un loop (línea 96-99):
   *    await preciosListasService.deleteLogic(listaId) ← ⭐ ESTA LÍNEA\n   * 6. Para cada lista seleccionada se ejecuta deleteLogic()
   * 7. Se recarga tabla (fetchListas)
   * 8. Se limpian selecciones
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
          // ACTIVAR: ejecuta activate() ← ⭐ LÍNEA 93-95
          await preciosListasService.activate(listaId);
        } else {
          // DESACTIVAR: ejecuta deleteLogic() ← ⭐ LÍNEA 96-99
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
   * 🔹🗑️ ELIMINAR LISTAS SELECCIONADAS
   * 
   * ¿QUÉ SUCEDE?
   * - Permite eliminar múltiples listas a la vez
   * - Solicita confirmación del usuario
   * - Ejecuta delete() para cada lista seleccionada
   * - Una vez eliminadas, recarga la tabla
   * - Limpia las selecciones
   * 
   * PARÁMETROS:
   * - (usa selectedListas del contexto)
   * 
   * FLUJO:\n   * 1. Usuario selecciona una o más listas en la tabla
   * 2. Usuario hace clic en botón "Eliminar"
   * 3. Se pide confirmación (línea 111-112)
   * 4. Muestra: "¿Está seguro que desea eliminar permanentemente X lista(s)? Esta acción no se puede deshacer."
   * 5. Si confirma, inicia un loop (línea 116):
   *    para cada listaId en selectedListas
   * 6. Ejecuta: await preciosListasService.delete(listaId) ← ⭐ ESTA LÍNEA\n   * 7. Cada lista se elimina permanentemente del servidor (DeleteHard)
   * 8. Después del loop, se recarga tabla (fetchListas) (línea 118)
   * 9. Se limpian selecciones (línea 119)
   * 10. Se limpian errores (línea 120)
   * 
   * DIFERENCIA CON deleteLogic():\n   * - deleteLogic() = Eliminación LÓGICA (marca como inactiva)
   * - delete() = Eliminación DURA (borra permanentemente) ← ESTA FUNCIÓN\n   * LLAMADO DESDE:\n   * - Click en botón "Eliminar" en PreciosListasTable (línea 178)
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

/**
 * ================================================================================
 * RESUMEN DE OPERACIONES EN ACTIONS
 * ================================================================================
 * 
 * handleAdd (CREAR):
 *   - Abre modal vacío (editingLista=null)
 *   - Usuario completa formulario
 *   - Llama handleSave() → preciosListasService.create()
 *   - Línea: 24-26
 * 
 * handleSave (GUARDAR - CREATE O UPDATE):
 *   - HUB central de guardado
 *   - Detecta si es CREATE o UPDATE
 *   - Detecta si cambió ACTIVED y ejecuta activate() o deleteLogic()
 *   - Llamadas a servicios: create(), update(), activate(), deleteLogic()
 *   - Línea: 53-102
 * 
 * handleToggleStatus (ACTIVAR/DESACTIVAR):
 *   - Permite activar o desactivar múltiples listas
 *   - Determina acción según mayoría de estados
 *   - Ejecuta activate() o deleteLogic() en loop
 *   - Línea: 103-145
 * 
 * handleDeleteSelected (ELIMINAR):
 *   - Elimina permanentemente múltiples listas
 *   - Ejecuta delete() en loop para cada lista
 *   - NO recuperable después de eliminar
 *   - Línea: 146-176
 * 
 * ================================================================================
 */
