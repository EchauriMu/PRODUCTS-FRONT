import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de productos
 * Configurado para tu API específica con query parameters
 */
const productService = {
  /**
   * Obtener todos los productos
   * @returns {Promise} Lista de productos
   */
  async getAllProducts() {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'GetAll'
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
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'GetOne',
          skuid: skuid
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
          ProcessType: 'AddOne'
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
      const response = await axiosInstance.post('/ztproducts/crudProducts', productData, {
        params: {
          ProcessType: 'UpdateOne',
          skuid: skuid
        }
      });
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
      // Cambiado a POST según el requisito
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'DeleteLogic',
          skuid: skuid
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Desactivar múltiples productos (eliminación lógica en lote)
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async deactivateProducts(skuids) {
    // Llama a la API de desactivación individual para cada producto seleccionado
    return Promise.all(skuids.map(skuid => this.deleteProduct(skuid)));
  },

  /**
   * Eliminar múltiples productos permanentemente (en lote)
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async deleteProducts(skuids) {
    // Para el borrado físico, mantenemos las llamadas individuales por seguridad,
    // ya que no implementamos un 'DeleteHardMany' para evitar borrados masivos accidentales.
    // Si se necesita, se puede implementar de forma similar a 'DeleteLogicMany'.
    return Promise.all(skuids.map(skuid => this.deleteProductHard(skuid)));
  },
  /**
   * Eliminar un producto permanentemente
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteProductHard(skuid) {
    try {
      // Cambiado a POST según el requisito
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'DeleteHard',
          skuid: skuid
        }
      });
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
      // Cambiado a POST sin body, solo con params
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'ActivateOne',
          skuid: skuid
        }});
      return response.data;
    } catch (error) {
      console.error('Error activating product:', error);
      throw error;
    }
  },

  /**
   * Activar múltiples productos (en lote)
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async activateProducts(skuids) {
    // Llama a la API de activación individual para cada producto seleccionado
    return Promise.all(skuids.map(skuid => this.activateProduct(skuid)));
  }
};

export default productService;