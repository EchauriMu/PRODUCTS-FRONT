
import axiosInstance from './axiosInstance';

/**
 * ================================================================================
 * SERVICIO DE LISTAS DE PRECIOS - preciosListasService
 * ================================================================================
 * 
 * Este servicio maneja todas las operaciones CRUD para las Listas de Precios
 * Realiza peticiones HTTP POST al endpoint: /ztprecios-listas/preciosListasCRUD
 * 
 * Operaciones disponibles:
 * - create() : Crear una nueva lista (ProcessType=AddOne)
 * - update() : Actualizar una lista existente (ProcessType=UpdateOne)
 * - getListaById() : Obtener una lista por ID (ProcessType=GetOne)
 * - getAllListas() : Obtener todas las listas (ProcessType=GetAll)
 * - delete() : Eliminar permanentemente una lista (ProcessType=DeleteHard)
 * - deleteLogic() : Desactivar lógicamente una lista (ProcessType=DeleteLogic)
 * - activate() : Activar una lista (ProcessType=ActivateOne)
 * - getListasBySKUID() : Obtener listas que contienen un SKU específico
 * 
 * ================================================================================
 */

/** Helper para desenvolver posibles respuestas CAP/OData */
function unwrapCAP(res) {
  return (
    res?.data?.value?.[0]?.data?.[0]?.dataRes ??
    res?.data?.dataRes ??
    res?.data ??
    []
  );
}

/**
 * Servicio CRUD para Listas de Precios — HANNIAALIDELUNA
 */
const preciosListasService = {
  commonParams: {},

/**
 * 🔹 DESACTIVAR LÓGICAMENTE UNA LISTA (ProcessType=DeleteLogic)
 * 
 * ¿QUÉ SUCEDE?
 * - Marca la lista como "desactivada" sin eliminar sus datos del servidor
 * - La lista seguirá existiendo en la BD pero NO se mostrará como activa
 * - Es una "eliminación lógica" = el registro se mantiene pero se marca como inactivo
 * 
 * PARÁMETROS:
 * - idListaOK: ID único de la lista a desactivar (ej: "LIS-001")
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=DeleteLogic&IDLISTAOK=<id>
 * 
 * RESPUESTA:
 * - status 200 = Operación exitosa
 * - true = Lista desactivada correctamente
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando haces clic en "Desactivar" en la tabla (handleToggleStatus)
 * - Cuando cambias el estado ACTIVED de true a false en el modal (handleSave)
 * 
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx (línea 64-67: handleToggleStatus)
 * - PreciosListasActions.jsx (línea 58-60: handleSave - si cambia estado)
 */
  async deleteLogic(idListaOK) { //aqui iniicia la funcion desactivar logic
    try {
      const params = new URLSearchParams({
        ProcessType: 'DeleteLogic',
        IDLISTAOK: idListaOK
      }).toString();
      
      // POST al backend con parámetro ProcessType=DeleteLogic
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );
      
      if (res.status !== 200) {
        throw new Error(`Error del servidor: ${res.status}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Error al desactivar la lista:', error);
      throw error;
    }
  },

/**
 * 🔹 OBTENER TODAS LAS LISTAS DE PRECIOS (ProcessType=GetAll)
 * 
 * ¿QUÉ SUCEDE?
 * - Trae todos los registros de listas de precios desde el servidor
 * - Incluye tanto listas activas como inactivas (ShowInactive=true)
 * - Se ejecuta al cargar la página o cuando se actualiza la tabla
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=GetAll&ShowInactive=true
 * 
 * RESPUESTA:
 * - Array con todas las listas: [{IDLISTAOK, DESLISTA, ...}, ...]
 * - Si hay error, retorna array vacío []
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando se monta el componente PreciosListasTable (useEffect, línea 39)
 * - Después de crear/actualizar/eliminar una lista (fetchListas)
 * 
 * LLAMADO DESDE:
 * - PreciosListasTable.jsx (línea 39-42: useEffect - fetchListas)
 * - PreciosListasActions.jsx (línea 50,73,74,110): Después de operaciones CRUD
 */
  async getAllListas() {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll',
        ShowInactive: 'true'  // Incluir registros inactivos
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      // Garantiza un arreglo y no filtra por estado
      const listas = Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
      return listas;
    } catch (error) {
      console.error('❌ Error al obtener las listas de precios:', error);
      throw error;
    }
  },

/**
 * 🔹 OBTENER UNA LISTA POR ID (ProcessType=GetOne)
 * 
 * ¿QUÉ SUCEDE?
 * - Trae los datos completos de una lista específica por su ID
 * - Se usa cuando necesitas cargar una lista para editarla
 * 
 * PARÁMETROS:
 * - idListaOK: ID único de la lista (ej: "LIS-001")
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=GetOne&IDLISTAOK=<id>
 * 
 * RESPUESTA:
 * - Objeto con los datos de la lista o null si no existe
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando abres una lista para editarla (setEditingLista)
 * - Cuando necesitas cargar los detalles completos
 */
  async getListaById(idListaOK) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetOne',
        IDLISTAOK: idListaOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`❌ Error al obtener la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 * 🔹🆕 CREAR UNA NUEVA LISTA (ProcessType=AddOne)
 * 
 * ¿QUÉ SUCEDE?
 * - Inserta un nuevo registro de lista en la base de datos
 * - Genera un ID único o usa el proporcionado
 * - Valida que la descripción sea obligatoria
 * - Almacena los SKUs en formato JSON
 * 
 * PARÁMETROS (payload):
 * - IDLISTAOK: ID único (se genera automáticamente si no se proporciona)
 * - DESLISTA: Descripción de la lista (OBLIGATORIO) ⭐
 * - SKUSIDS: Array de IDs de productos (convertido a JSON) ⭐
 * - IDINSTITUTOOK: ID del Instituto (OBLIGATORIO) ⭐
 * - IDTIPOLISTAOK: Tipo de lista (BASE, MAYORISTA, etc) (OBLIGATORIO) ⭐
 * - IDTIPOFORMULAOK: Tipo de fórmula (FIJO, PORCENTAJE, etc) (OBLIGATORIO) ⭐
 * - FECHAEXPIRAINI: Fecha inicio vigencia (opcional)
 * - FECHAEXPIRAFIN: Fecha fin vigencia (opcional)
 * - IDTIPOGENERALISTAOK: Tipo general (ESPECIFICA, GENERAL) (opcional)
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=AddOne
 * 
 * FLUJO COMPLETO:
 * 1. Usuario hace clic en "Crear Lista" en PreciosListasTable
 * 2. Se abre PreciosListasModal (vacío, editingLista=null)
 * 3. Usuario completa formulario y hace clic en "Guardar"
 * 4. handleSaveClick() valida datos con Yup (línea 156-187 en Modal)
 * 5. Llama onSave(dataToSave) que es handleSave()
 * 6. handleSave() en PreciosListasActions (línea 70-71) detecta que NO hay editingLista.IDLISTAOK
 * 7. Ejecuta: await preciosListasService.create(listaData) ← ⭐ ESTA LÍNEA
 * 8. El servicio envía POST al backend con ProcessType=AddOne
 * 9. Backend inserta el registro y retorna los datos creados
 * 10. Se actualiza la tabla con fetchListas()
 * 11. Modal se cierra y se muestra mensaje de éxito
 * 
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx (línea 70-71: handleSave - si es nuevo registro)
 */
  async create(payload) { //inicio funcion para guardar
    try {
      // PASO 1: Crear parámetros de URL para indicar al backend que es AddOne
      const params = new URLSearchParams({
        ProcessType: 'AddOne'
      }).toString();

      // PASO 2: Preparar payload limpio con solo campos necesarios
      const cleanPayload = {
        IDLISTAOK: payload.IDLISTAOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // PASO 3: Agregar campos opcionales solo si están presentes en el payload
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      // PASO 4: Enviar POST al backend
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=AddOne
      // Body: cleanPayload con todos los datos de la nueva lista
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload
      );

      // PASO 5: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      
      // PASO 6: Retornar el primer elemento del array o null
      // El backend retorna los datos creados
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error('❌ Error al crear la lista de precios:', error);
      throw error;
    }
  },

/**
 * 🔹✏️ ACTUALIZAR UNA LISTA EXISTENTE (ProcessType=UpdateOne)
 * 
 * ¿QUÉ SUCEDE?
 * - Modifica los datos de una lista que ya existe
 * - El ID de la lista NO se puede cambiar (se usa como identificador)
 * - Actualiza descripción, productos, fechas, tipos, etc.
 * - Guarda los cambios en la base de datos
 * 
 * PARÁMETROS:
 * - idListaOK: ID único de la lista a actualizar (ej: "LIS-001")
 * - payload: Objeto con los campos a actualizar (DESLISTA, SKUSIDS, etc)
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=UpdateOne&IDLISTAOK=<id>
 * 
 * FLUJO COMPLETO:
 * 1. Usuario hace clic en el botón "Editar" después de seleccionar una lista
 * 2. Se abre PreciosListasModal con los datos cargados de esa lista
 * 3. Usuario modifica los campos (descripción, productos, fechas, etc)
 * 4. Usuario hace clic en "Guardar"
 * 5. handleSaveClick() valida datos con Yup (línea 156-187 en Modal)
 * 6. Llama onSave(dataToSave) que es handleSave()
 * 7. handleSave() en PreciosListasActions (línea 68) detecta que SÍ hay editingLista.IDLISTAOK
 * 8. Si NO cambió el estado ACTIVED, ejecuta: await preciosListasService.update() ← ⭐ ESTA LÍNEA
 * 9. El servicio envía POST al backend con ProcessType=UpdateOne
 * 10. Backend actualiza el registro en la BD
 * 11. Se actualiza la tabla con fetchListas()
 * 12. Modal se cierra y se muestra mensaje de éxito
 * 
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx (línea 68: handleSave - si hay editingLista y ACTIVED no cambió)
 */
  async update(idListaOK, payload) { //aqui inicia el update 
    try {
      // PASO 1: Log para debugging (puedes verlo en Console del navegador)
      console.log('📝 Actualizando lista de precios:', { idListaOK, payload });
      
      // PASO 2: Preparar payload limpio con solo los campos necesarios
      const cleanPayload = {
        IDLISTAOK: idListaOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // PASO 3: Agregar campos opcionales solo si están presentes en el payload
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      // PASO 4: Crear parámetros de URL para indicar ProcessType=UpdateOne
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        IDLISTAOK: idListaOK  // ID de la lista a actualizar
      }).toString();

      // PASO 5: Log para debugging en Console
      console.log('Enviando petición de actualización:', {
        url: `/ztprecios-listas/preciosListasCRUD?${params}`,
        payload: cleanPayload
      });

      // PASO 6: Realizar la petición POST al backend
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=UpdateOne&IDLISTAOK=<id>
      // Body: cleanPayload con los datos actualizados
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload
      ); //aqui termina el update 

      // PASO 7: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      if (!dataRes) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // PASO 8: Log de éxito
      console.log('✅ Lista de precios actualizada exitosamente:', dataRes);
      return dataRes;
    } catch (error) {
      console.error(`❌ Error al actualizar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 * 🔹🗑️ ELIMINAR PERMANENTEMENTE UNA LISTA (ProcessType=DeleteHard)
 * 
 * ¿QUÉ SUCEDE?
 * - Elimina PERMANENTEMENTE un registro de lista de la base de datos
 * - NO es una eliminación lógica, se borra completamente
 * - Los datos NO pueden recuperarse después
 * - Se solicita confirmación al usuario antes de ejecutar
 * 
 * PARÁMETROS:
 * - idListaOK: ID único de la lista a eliminar (ej: "LIS-001")
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=DeleteHard&IDLISTAOK=<id>
 * 
 * FLUJO COMPLETO:
 * 1. Usuario selecciona una lista en la tabla
 * 2. Usuario hace clic en botón "Eliminar"
 * 3. handleDeleteSelected() en PreciosListasActions (línea 104) solicita confirmación
 * 4. Si confirma, ejecuta: await preciosListasService.delete(listaId) ← ⭐ ESTA LÍNEA
 * 5. El servicio envía POST al backend con ProcessType=DeleteHard
 * 6. Backend elimina el registro permanentemente de la BD
 * 7. Respuesta status 200 = éxito
 * 8. Se actualiza la tabla con fetchListas()
 * 9. Se muestra mensaje de éxito
 * 
 * DIFERENCIA:
 * - delete() = Eliminación DURA (DeleteHard) - borra permanentemente ← ESTA FUNCIÓN
 * - deleteLogic() = Eliminación LÓGICA (DeleteLogic) - solo desactiva, mantiene datos
 * 
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx (línea 102-110: handleDeleteSelected - cuando usuario confirma)
 * - PreciosListasActions.jsx (línea 36-51: handleDelete - también llama a delete())
 */
  async delete(idListaOK) { //aqui inicia el delete del serv
    try {
      // PASO 1: Log para debugging
      console.log('🗑️ Eliminando lista de precios:', idListaOK);
      
      // PASO 2: Crear parámetros de URL para indicar ProcessType=DeleteHard
      const params = new URLSearchParams({
        ProcessType: 'DeleteHard',  // aqui el processtype
        IDLISTAOK: idListaOK
      }).toString();

      // PASO 3: Para DeleteHard NO se envía payload (body vacío)
      console.log('Enviando petición de eliminación...');

      // PASO 4: Realizar POST sin body
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=DeleteHard&IDLISTAOK=<id>
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // PASO 5: Log de respuesta
      console.log('Respuesta del servidor:', res);

      // PASO 6: Verificar si la petición fue exitosa (status 200)
      if (res.status !== 200) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

      // PASO 7: Log de éxito
      console.log('✅ Lista de precios eliminada correctamente');
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar la lista de precios con ID ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

/**
 * 🔹✅ ACTIVAR UNA LISTA (ProcessType=ActivateOne)
 * 
 * ¿QUÉ SUCEDE?
 * - Marca una lista como "activa" después de haber sido desactivada
 * - Solo activa listas que estaban inactivas/desactivadas
 * - La lista vuelve a estar disponible y visible
 * 
 * PARÁMETROS:
 * - idListaOK: ID único de la lista a activar (ej: "LIS-001")
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=ActivateOne&IDLISTAOK=<id>
 * 
 * FLUJO COMPLETO:
 * 1. Usuario selecciona una lista INACTIVA en la tabla
 * 2. Usuario hace clic en botón "Activar"
 * 3. handleToggleStatus() en PreciosListasActions (línea 79-100) solicita confirmación
 * 4. Si hay listas inactivas, shouldActivate = true
 * 5. Si confirma, ejecuta: await preciosListasService.activate(listaId) ← ⭐ ESTA LÍNEA
 * 6. El servicio envía POST al backend con ProcessType=ActivateOne
 * 7. Backend marca el registro como ACTIVED=true en la BD
 * 8. Se actualiza la tabla con fetchListas()
 * 9. La lista aparece con estado "Activo" en verde
 * 
 * TAMBIÉN SE EJECUTA CUANDO:
 * - En el modal, cambias estado de false a true (ACTIVED=true)
 * - Luego handleSave() en PreciosListasActions (línea 61-62) llama activate()
 * 
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx (línea 93-95: handleToggleStatus - cuando shouldActivate=true)
 * - PreciosListasActions.jsx (línea 61-62: handleSave - si cambió ACTIVED a true)
 */
  async activate(idListaOK) { //aqui inicia la funcion de activar
    try {
      // PASO 1: Crear parámetros de URL para indicar ProcessType=ActivateOne
      const params = new URLSearchParams({
        ProcessType: 'ActivateOne',
        IDLISTAOK: idListaOK,  // ID de la lista a activar
      }).toString();

      // PASO 2: Enviar POST al backend
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=ActivateOne&IDLISTAOK=<id>
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // PASO 3: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`❌ Error al activar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 * 🔹 OBTENER LISTAS POR SKUID (ProcessType=GetBySKUID)
 * 
 * ¿QUÉ SUCEDE?
 * - Trae todas las listas de precios donde aparece un producto específico (SKUID)
 * - Se usa cuando necesitas saber en qué listas está un producto
 * 
 * PARÁMETROS:
 * - skuid: ID del producto/SKU (ej: "SKU-12345")
 * 
 * ENDPOINT:
 * - POST /ztprecios-listas/preciosListasCRUD?ProcessType=GetBySKUID&skuid=<id>
 * 
 * RESPUESTA:
 * - Array con todas las listas que contienen ese SKU
 * - Si el SKU no existe o no está en ninguna lista, retorna array vacío []
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando necesitas buscar listas por producto
 * - En búsquedas avanzadas
 */
  async getListasBySKUID(skuid) {
    // Si no hay SKU, retornar array vacío
    if (!skuid) {
      return [];
    }
    try {
      // Crear parámetros de URL para búsqueda por SKU
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid,
      }).toString();

      // Enviar POST al backend
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=GetBySKUID&skuid=<id>
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // Procesar respuesta
      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error(`❌ Error al obtener listas por SKUID ${skuid}:`, error);
      throw error;
    }
  }
};

export default preciosListasService;
