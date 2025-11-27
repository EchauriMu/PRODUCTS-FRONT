// Autor: Lucia López
import axiosInstance from './axiosInstance';

/**
 * @author Lucia López
 * Helper para desenvolver posibles respuestas CAP/OData */
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
   * @author Lucia López
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
      throw error;
    }
  },

  /**
   * Obtener todos los precios de una lista de precios específica.
   * @author Lucia López
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
        IdListaOK: idListaOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar el precio de una presentación.
   * @author Lucia López
   * @param {string} idPrecioOK - El ID del precio a actualizar.
   * @param {object} cambios - Los cambios a aplicar (ej: { Precio: 1500 }).
   * @returns {Promise<Object>} - El precio actualizado.
   */
  async updatePrice(idPrecioOK, nuevoPrecio) {
    if (!idPrecioOK) {
      throw new Error('idPrecioOK es requerido');
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne', // Asumo que este es el ProcessType correcto
        IdPrecioOK: idPrecioOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`,
        nuevoPrecio // El objeto 'cambios' se pasa como body
      );

      const dataRes = unwrapCAP(res);
      return dataRes;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear un nuevo precio para una presentación usando ProcessType=AddOne.
   * @author Lucia López
   * @param {object} priceData - Los datos del nuevo precio.
   * @returns {Promise<Object>} - El precio creado.
   */
  async createPrice(priceData) {
    if (!priceData.IdListaOK || !priceData.IdPresentaOK) {
      throw new Error('IdListaOK e IdPresentaOK son requeridos');
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'AddOne'
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-items/preciosItemsCRUD?${params}`,
        priceData
      );

      const dataRes = unwrapCAP(res);
      return dataRes;
    } catch (error) {
      throw error;
    }
  }
};

export default preciosItemsService;
