import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar la creación de productos completos con la nueva estructura de API.
 */
const addProductApi = {
  /**
   * Crea un producto completo con sus presentaciones.
   * @param {object} payload - El cuerpo de la solicitud, que debe contener { product, presentations }.
   * @param {string} loggedUser - El usuario que realiza la solicitud.
   * @returns {Promise<any>} - La respuesta de la creación.
   */
  async createCompleteProduct(payload, loggedUser) {
    try {
      // El payload ya viene con la estructura { product, presentations }
      const response = await axiosInstance.post(`/add-product/createCompleteProduct?LoggedUser=${loggedUser}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear el producto completo:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Error al crear el producto completo.');
    }
  }
};

export default addProductApi;