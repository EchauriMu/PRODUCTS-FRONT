import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar la creación de productos completos con la nueva estructura de API.
 */
const addProductApi = {
  /**
   * Crea un producto completo con sus presentaciones.
   * @param {object} payload - El cuerpo de la solicitud, que debe contener { product, presentations }.
   * @returns {Promise<any>} - La respuesta de la creación.
   */
  async createCompleteProduct(payload) {
    try {
      // La baseURL de axiosInstance es 'http://localhost:3033/api', por lo que la ruta debe ser relativa a eso.
      const response = await axiosInstance.post(`/add-product/createCompleteProduct`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear el producto completo:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Error al crear el producto completo.');
    }
  },

  /**
   * Obtiene todas las categorías de productos.
   * @returns {Promise<Array>} - La lista de categorías.
   */
  async getAllCategories() {
    try {
      // La baseURL de axiosInstance es 'http://localhost:3033/api', por lo que la ruta es relativa.
      const response = await axiosInstance.post(`/ztcategorias/categoriasCRUD?ProcessType=GetAll`, {});
      // La data viene en una estructura anidada, la extraemos.
      if (response.data?.success && response.data.data[0]?.dataRes) {
        return response.data.data[0].dataRes;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener las categorías:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Error al obtener las categorías.');
    }
  }
};

export default addProductApi;