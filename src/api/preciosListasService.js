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
   * 🔹 Obtener todas las listas de precios (ProcessType=GetAll)
   */
  async getAllListas() {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll',
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      // Garantiza un arreglo
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
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
        idListaOK,
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
        ProcessType: 'AddOne',
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        payload
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
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        idListaOK,
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        payload
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
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
      const params = new URLSearchParams({
        ProcessType: 'DeleteLogic',
        idListaOK,
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`❌ Error al eliminar la lista de precios con ID ${idListaOK}:`, error);
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
        idListaOK,
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
