
import axiosInstance from './axiosInstance';

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
   * 🔹 Desactivar lógicamente una lista (ProcessType=DeleteLogic)
   */
  async deleteLogic(idListaOK) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'DeleteLogic',
        IDLISTAOK: idListaOK
      }).toString();
      
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
   * 🔹 Obtener todas las listas de precios (ProcessType=GetAll)
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
   * 🔹 Obtener una lista por ID (ProcessType=GetOne)
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
   * 🔹 Crear una nueva lista (ProcessType=AddOne)
   */
  async create(payload) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'AddOne'
      }).toString();

      // Asegurar que el payload tenga solo los campos necesarios
      const cleanPayload = {
        IDLISTAOK: payload.IDLISTAOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // Agregar campos opcionales solo si están presentes
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error('❌ Error al crear la lista de precios:', error);
      throw error;
    }
  },

  /**
   * 🔹 Actualizar una lista existente (ProcessType=UpdateOne)
   */
  async update(idListaOK, payload) {
    try {
      console.log('📝 Actualizando lista de precios:', { idListaOK, payload });
      
      // Crear payload con solo los campos necesarios, como en Postman
      const cleanPayload = {
        IDLISTAOK: idListaOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // Agregar campos opcionales solo si están presentes en el payload
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        IDLISTAOK: idListaOK
      }).toString();

      console.log('Enviando petición de actualización:', {
        url: `/ztprecios-listas/preciosListasCRUD?${params}`,
        payload: cleanPayload
      });

      // Realizar la petición como en Postman
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload
      );

      // Verificar la respuesta
      const dataRes = unwrapCAP(res);
      if (!dataRes) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('✅ Lista de precios actualizada exitosamente:', dataRes);
      return dataRes;
    } catch (error) {
      console.error(`❌ Error al actualizar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

  /**
   * 🔹 Eliminar (lógicamente) una lista (ProcessType=DeleteLogic)
   */
  async delete(idListaOK) {
    try {
      console.log('🗑️ Eliminando lista de precios:', idListaOK);
      
      // Usar los parámetros exactos como en Postman
      const params = new URLSearchParams({
        ProcessType: 'DeleteHard',
        IDLISTAOK: idListaOK
      }).toString();

      // Para DeleteHard no necesitamos payload
      console.log('Enviando petición de eliminación...');

      // Hacer la petición POST sin payload
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      console.log('Respuesta del servidor:', res);

      // Verificar si la petición fue exitosa
      if (res.status !== 200) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

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
   * 🔹 Activar una lista (ProcessType=ActivateOne)
   */
  async activate(idListaOK) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'ActivateOne',
        IDLISTAOK: idListaOK,  // ✅ Corregido: IDLISTAOK en mayúsculas
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`❌ Error al activar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

  /**
   * 🔹 Obtener todas las listas donde aparece un SKUID (ProcessType=GetBySKUID)
   */
  async getListasBySKUID(skuid) {
    if (!skuid) {
      return [];
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid,
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error(`❌ Error al obtener listas por SKUID ${skuid}:`, error);
      throw error;
    }
  }
};

export default preciosListasService;
