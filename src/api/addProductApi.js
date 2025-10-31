import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar la creación de productos completos.
 */
const addProductApi = {
  /**
   * Crea un producto completo con sus presentaciones.
   * @param {object} payload - El cuerpo de la solicitud con el producto y las presentaciones.
   * @param {string} loggedUser - El usuario que realiza la solicitud.
   * @returns {Promise<any>} - La respuesta de la creación.
   */
  async createCompleteProduct(payload, loggedUser) {
    try {
      const response = await axiosInstance.post(`/add-product/createCompleteProduct?LoggedUser=${loggedUser}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear el producto completo:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Error al crear el producto.');
    }
  }
};

export default addProductApi;