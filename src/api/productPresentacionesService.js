import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones de presentaciones de productos
 */
const productPresentacionesService = {
  /**
   * Obtener presentaciones por SKUID
   * @param {string} skuid - ID del producto (SKU)
   * @param {string} loggedUser - Usuario logueado
   * @returns {Promise} Presentaciones encontradas
   */
  async getPresentacionesBySKUID(skuid, loggedUser = 'SPARDOP') {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid,
        LoggedUser: loggedUser
      }).toString();
      const response = await axiosInstance.post(`/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`);
      // Navega hasta dataRes dentro de la respuesta
      const dataRes = response?.data?.value?.[0]?.data?.[0]?.dataRes || [];
      return dataRes;
    } catch (error) {
      console.error('Error fetching product presentaciones:', error);
      throw error;
    }
  }
};

export default productPresentacionesService;
