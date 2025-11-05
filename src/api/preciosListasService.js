// 📦 src/api/preciosListasService.js
import axiosInstance from './axiosInstance';

/**
 * Servicio CRUD para Listas de Precios — HANNIAALIDELUNA
 * Versión corregida y simplificada (igual a ZTCategorias)
 */
const preciosListasService = {
  // Parámetros comunes
  commonParams: {
    DBServer: 'MongoDB',
  },

  /**
   * 🔹 Limpieza del payload antes de enviar al backend
   */
  cleanPayload(data) {
    if (!data || typeof data !== 'object') return data;
    const cleaned = { ...data };
    const internalFields = [
      '_id',
      '__v',
      'HISTORY',
      'REGDATE',
      'MODDATE',
      'MODUSER',
      'createdAt',
      'updatedAt',
    ];
    internalFields.forEach((f) => delete cleaned[f]);
    return cleaned;
  },

  /**
   * 🔹 Obtener todas las listas de precios (sin filtrar activas/inactivas)
   */
  async getAllListas() {
    try {
      console.log('📦 Solicitando todas las listas de precios...');
      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'GetAll', ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Extraer correctamente los datos desde CAP u OData
      const dataRes =
        response.data?.value?.[0]?.data?.[0]?.dataRes ||
        response.data?.dataRes ||
        response.data ||
        [];

      const listas = Array.isArray(dataRes) ? dataRes : [dataRes];
      console.log('✅ Listas de precios obtenidas correctamente:', listas.length);
      return listas;
    } catch (error) {
      console.error('❌ Error getAllListas:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Obtener una lista por ID
   */
  async getListaById(idListaOK) {
    try {
      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'GetOne', IDLISTAOK: idListaOK, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const dataRes =
        response.data?.value?.[0]?.data?.[0]?.dataRes ||
        response.data?.dataRes ||
        response.data ||
        null;
      return Array.isArray(dataRes) ? dataRes[0] || null : dataRes;
    } catch (error) {
      console.error(`❌ Error getListaById(${idListaOK}):`, error);
      throw error;
    }
  },

  /**
   * 🔹 Crear una nueva lista de precios
   */
  async create(payload) {
    try {
      const cleanData = this.cleanPayload(payload);
      console.log('🆕 Creando lista de precios (payload limpio):', cleanData);

      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        cleanData,
        {
          params: { ProcessType: 'AddOne', ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Lista de precios creada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error create lista de precios:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Actualizar una lista existente
   */
  async update(idListaOK, payload) {
    try {
      const cleanData = this.cleanPayload(payload);
      console.log('✏️ Actualizando lista de precios:', idListaOK, cleanData);

      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        cleanData,
        {
          params: { ProcessType: 'UpdateOne', IDLISTAOK: idListaOK, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Lista actualizada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error update lista ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Desactivar (borrado lógico)
   */
  async deleteLogic(idListaOK) {
    try {
      console.log('🟠 Desactivando lista (borrado lógico):', idListaOK);

      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'DeleteLogic', IDLISTAOK: idListaOK, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Lista desactivada lógicamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleteLogic lista ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Eliminar definitivamente (borrado físico)
   */
  async delete(idListaOK) { // 💡 RENOMBRADO: de deleteHard a delete para coincidir con el llamado
    try {
      console.log('🧨 Eliminando definitivamente lista:', idListaOK);

      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'DeleteHard', IDLISTAOK: idListaOK, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Lista eliminada definitivamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error delete lista ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Activar una lista desactivada
   */
  async activate(idListaOK) {
    try {
      console.log('🟢 Activando lista de precios:', idListaOK);

      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'ActivateOne', IDLISTAOK: idListaOK, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Lista activada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error activate lista ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * 🔹 Obtener todas las listas donde aparece un SKUID
   */
  async getListasBySKUID(skuid) {
    if (!skuid) return [];
    try {
      console.log(`📦 Buscando listas por SKUID: ${skuid}`);
      const response = await axiosInstance.post(
        '/ztprecios-listas/preciosListasCRUD',
        {},
        {
          params: { ProcessType: 'GetBySKUID', SKUID: skuid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const dataRes =
        response.data?.value?.[0]?.data?.[0]?.dataRes ||
        response.data?.dataRes ||
        response.data ||
        [];
      return Array.isArray(dataRes) ? dataRes : [dataRes];
    } catch (error) {
      console.error(`❌ Error getListasBySKUID(${skuid}):`, error);
      throw error;
    }
  },
};

export default preciosListasService;
