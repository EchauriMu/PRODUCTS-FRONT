import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de productos
 * Configurado para tu API específica con query parameters
 */
const productService = {
  
  // Parámetros comunes para todas las peticiones
  commonParams: {
    DBServer: 'MongoDB',
    LoggedUser: 'SPARDOP' // Puedes cambiar esto según el usuario logueado
  },

  /**
   * Obtener todos los productos
   * @returns {Promise} Lista de productos
   */
  async getAllProducts() {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'GetAll',
          ...this.commonParams
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Obtener un producto por SKUID
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Producto encontrado
   */
  async getProductById(skuid) {
    try {
      const response = await axiosInstance.get('/ztproducts/crudProducts', {
        params: {
          ProcessType: 'GetOne',
          skuid: skuid,
          ...this.commonParams
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo producto
   * @param {Object} productData - Datos del producto
   * @returns {Promise} Producto creado
   */
  async createProduct(productData) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'AddOne',
          ...this.commonParams
        }), productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Actualizar un producto existente
   * @param {string} skuid - ID del producto (SKU)
   * @param {Object} productData - Datos actualizados del producto
   * @returns {Promise} Producto actualizado
   */
  async updateProduct(skuid, productData) {
    try {
      const response = await axiosInstance.put('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'UpdateOne',
          skuid: skuid,
          ...this.commonParams
        }), productData);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Eliminar un producto (eliminación lógica)
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteProduct(skuid) {
    try {
      const response = await axiosInstance.delete('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'DeleteLogic',
          skuid: skuid,
          ...this.commonParams
        }));
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Eliminar un producto permanentemente
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteProductHard(skuid) {
    try {
      const response = await axiosInstance.delete('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'DeleteHard',
          skuid: skuid,
          ...this.commonParams
        }));
      return response.data;
    } catch (error) {
      console.error('Error hard deleting product:', error);
      throw error;
    }
  },

  /**
   * Activar un producto
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de activación
   */
  async activateProduct(skuid) {
    try {
      const response = await axiosInstance.put('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'ActivateOne',
          skuid: skuid,
          ...this.commonParams
        }));
      return response.data;
    } catch (error) {
      console.error('Error activating product:', error);
      throw error;
    }
  }
};

export default productService;