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
  /**
   * 🔹 Obtener todas las listas de precios (ProcessType=GetAll)
   */
  async getAllListas(loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll',
        ...this.commonParams
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
  async getListaById(idListaOK, loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetOne',
        idListaOK,
        LoggedUser: loggedUser,
        DBServer: this.commonParams.DBServer
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
  async create(payload, loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'AddOne',
        LoggedUser: loggedUser,
        DBServer: this.commonParams.DBServer
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
  async update(idListaOK, payload, loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        idListaOK,
        LoggedUser: loggedUser,
        DBServer: this.commonParams.DBServer
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
  async delete(idListaOK, loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'DeleteLogic',
        idListaOK,
        LoggedUser: loggedUser,
        DBServer: this.commonParams.DBServer
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
  async activate(idListaOK, loggedUser = this.commonParams.LoggedUser) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'ActivateOne',
        idListaOK,
        LoggedUser: loggedUser,
        DBServer: this.commonParams.DBServer
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
  }
};

export default preciosListasService;
