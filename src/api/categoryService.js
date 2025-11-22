import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones de categorías
 */
const categoryService = {
  
  // Parámetros comunes para todas las peticiones
  commonParams: {
    LoggedUser: 'EECHAURIM' // Usuario por defecto
  },

  /**
   * Obtener todas las categorías
   * @returns {Promise} Lista de categorías
   */
  async getAllCategories() {
    try {
      const response = await axiosInstance.post('/ztcategorias/categoriasCRUD', {}, {
        params: {
          ProcessType: 'GetAll',
          ...this.commonParams
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Obtener una categoría por CATID
   * @param {string} catid - ID de la categoría
   * @returns {Promise} Categoría encontrada
   */
  async getCategoryById(catid) {
    try {
      const response = await axiosInstance.get('/ztcategorias/categoriasCRUD', {
        params: {
          ProcessType: 'GetOne',
          CATID: catid,
          ...this.commonParams
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }
};

export default categoryService;