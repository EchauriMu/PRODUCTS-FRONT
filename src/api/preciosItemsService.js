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

const preciosItemsService = {
  /**
   * Obtener todos los precios de una presentación específica.
   * @param {string} idPresentaOK - El ID de la presentación.
   * @returns {Promise<Array>} - Una lista de precios para esa presentación.
   */
  async getPricesByIdPresentaOK(idPresentaOK) {
    if (!idPresentaOK) {
      return [];
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetByIdPresentaOK',
        idPresentaOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error(`❌ Error al obtener precios para la presentación ${idPresentaOK}:`, error);
      throw error;
    }
  },

  /**
   * Obtener todos los precios de una lista de precios específica.
   * @param {string} idListaOK - El ID de la lista de precios.
   * @returns {Promise<Array>} - Una lista de precios para esa lista.
   */
  async getPricesByIdListaOK(idListaOK) {
    if (!idListaOK) {
      return [];
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetByIdListaOK',
        idListaOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error(`❌ Error al obtener precios para la lista ${idListaOK}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar el precio de un item
   * @param {string} idPrecioOK - El ID del precio a actualizar
   * @param {number} nuevoPrecio - El nuevo precio
   * @returns {Promise} - Resultado de la actualización
   */
  async updatePrice(idPrecioOK, nuevoPrecio) {
    if (!idPrecioOK) {
      throw new Error('idPrecioOK es requerido');
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        idPrecioOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`,
        { Precio: nuevoPrecio }
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] : dataRes;
    } catch (error) {
      console.error(`❌ Error al actualizar precio ${idPrecioOK}:`, error);
      throw error;
    }
  }
};

export default preciosItemsService;