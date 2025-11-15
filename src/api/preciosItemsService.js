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
  },

  /**
   * Actualizar el precio de una presentación.
   * @param {string} idPrecioOK - El ID del precio a actualizar.
   * @param {object} cambios - Los cambios a aplicar (ej: { Precio: 1500 }).
   * @returns {Promise<Object>} - El precio actualizado.
   */
  async updatePrice(idPrecioOK, cambios) {
    if (!idPrecioOK) {
      throw new Error('idPrecioOK es requerido');
    }
    try {
      console.log(`📝 Actualizando precio ${idPrecioOK}:`, cambios);

      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        IdPrecioOK: idPrecioOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`,
        cambios
      );

      const dataRes = unwrapCAP(res);
      console.log('✅ Precio actualizado:', dataRes);
      return dataRes;
    } catch (error) {
      console.error(`❌ Error al actualizar precio ${idPrecioOK}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo precio para una presentación.
   * @param {object} priceData - Los datos del nuevo precio.
   * @returns {Promise<Object>} - El precio creado.
   */
  async createPrice(priceData) {
    if (!priceData.IdListaOK || !priceData.IdPresentaOK) {
      throw new Error('IdListaOK e IdPresentaOK son requeridos');
    }
    try {
      console.log('➕ Creando nuevo precio:', priceData);

      const params = new URLSearchParams({
        ProcessType: 'Create'
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`,
        priceData
      );

      const dataRes = unwrapCAP(res);
      console.log('✅ Precio creado:', dataRes);
      return dataRes;
    } catch (error) {
      console.error('❌ Error al crear precio:', error);
      throw error;
    }
  }
};

export default preciosItemsService;