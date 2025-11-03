import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones de archivos de productos
 */
const productFilesService = {
  /**
   * Obtener archivos por SKUID
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Archivos encontrados
   */
  async getFilesBySKUID(skuid) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid
      }).toString();
      const response = await axiosInstance.post(`/ztproducts-files/productsFilesCRUD?${params}`);
      // Navega hasta dataRes dentro de la respuesta
      const dataRes = response?.data?.value?.[0]?.data?.[0]?.dataRes || [];
      return dataRes;
    } catch (error) {
      console.error('Error fetching product files:', error);
      throw error;
    }
  },

  /**
   * Obtener archivos por IdPresentaOK
   * @param {string} idPresentaOK - ID de la presentación
   * @returns {Promise} Archivos encontrados
   */
  async getFilesByIdPresentaOK(idPresentaOK) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetByIdPresentaOK',
        idPresentaOK
      }).toString();
      const response = await axiosInstance.post(`/ztproducts-files/productsFilesCRUD?${params}`);
      // Navega hasta dataRes dentro de la respuesta
      const dataRes = response?.data?.value?.[0]?.data?.[0]?.dataRes || [];
      return dataRes;
    } catch (error) {
      console.error('Error fetching product files by IdPresentaOK:', error);
      throw error;
    }
  }
};

export default productFilesService;
