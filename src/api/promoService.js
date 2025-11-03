import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de promociones
 * Configurado para tu API específica con query parameters
 */
const promoService = {
  /**
   * Obtener todas las promociones
   * @returns {Promise} Lista de promociones
   */
  async getAllPromotions() {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones', {}, {
        params: {
          ProcessType: 'GetAll'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },

  /**
   * Obtener una promoción por IdPromoOK
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Promoción encontrada
   */
  async getPromotionById(idPromoOK) {
    try {
      const response = await axiosInstance.get('/ztpromociones/crudPromociones', {
        params: {
          ProcessType: 'GetOne',
          idPromoOK: idPromoOK
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva promoción
   * @param {Object} promoData - Datos de la promoción
   * @returns {Promise} Promoción creada
   */
  async createPromotion(promoData) {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'AddOne'
        }), promoData);
      return response.data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  /**
   * Actualizar una promoción existente
   * @param {string} idPromoOK - ID de la promoción
   * @param {Object} promoData - Datos actualizados de la promoción
   * @returns {Promise} Promoción actualizada
   */
  async updatePromotion(idPromoOK, promoData) {
    try {
      const response = await axiosInstance.put('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'UpdateOne',
          idPromoOK: idPromoOK
        }), promoData);
      return response.data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  /**
   * Eliminar una promoción (eliminación lógica)
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Confirmación de eliminación
   */
  async deletePromotion(idPromoOK) {
    try {
      const response = await axiosInstance.delete('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'DeleteLogic',
          idPromoOK: idPromoOK
        }));
      return response.data;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  },

  /**
   * Eliminar una promoción permanentemente
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Confirmación de eliminación
   */
  async deletePromotionHard(idPromoOK) {
    try {
      const response = await axiosInstance.delete('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'DeleteHard',
          idPromoOK: idPromoOK
        }));
      return response.data;
    } catch (error) {
      console.error('Error hard deleting promotion:', error);
      throw error;
    }
  },

  /**
   * Activar una promoción
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Confirmación de activación
   */
  async activatePromotion(idPromoOK) {
    try {
      const response = await axiosInstance.put('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'ActivateOne',
          idPromoOK: idPromoOK
        }));
      return response.data;
    } catch (error) {
      console.error('Error activating promotion:', error);
      throw error;
    }
  }
};

export default promoService;