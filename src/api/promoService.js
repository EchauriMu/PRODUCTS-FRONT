import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de promociones
 * Configurado para tu API específica con query parameters
 */
const promoService = {
  /**
   * Obtener todas las promociones
   * @param {string} loggedUser - Usuario que solicita la información (opcional, se usa el del interceptor)
   * @returns {Promise} Lista de promociones
   */
  async getAllPromotions(loggedUser = null) {
    try {
      const params = {
        ProcessType: 'GetAll'
      };
      
      // Solo añadir LoggedUser si se proporciona explícitamente y no hay uno en sessionStorage
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), {});
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching promotions:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error al obtener promociones';
      if (error.response?.status === 405) {
        errorMessage = 'Método no permitido (405). Verifica la configuración del servidor.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint de promociones no encontrado (404).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  /**
   * Obtener una promoción por IdPromoOK
   * @param {string} idPromoOK - ID de la promoción
   * @param {string} loggedUser - Usuario que solicita la información (opcional, se usa el del interceptor)
   * @returns {Promise} Promoción encontrada
   */
  async getPromotionById(idPromoOK, loggedUser = null) {
    try {
      const params = {
        ProcessType: 'GetOne',
        IdPromoOK: idPromoOK
      };
      
      // Solo añadir LoggedUser si se proporciona explícitamente y no hay uno en sessionStorage
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), {});
      return response.data;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva promoción con múltiples presentaciones
   * @param {Object} promotionData - Datos de la promoción
   * @param {Array} selectedPresentaciones - Array de presentaciones seleccionadas
   * @param {Object} filters - Filtros aplicados
   * @param {string} loggedUser - Usuario que crea la promoción (opcional, se usa el del interceptor)
   * @returns {Promise} Promoción creada
   */
  async createPromotionWithProducts(promotionData, selectedPresentaciones = [], filters = {}, loggedUser = null) {
    try {
      // Generar ID único y simple para la promoción
      const timestamp = Date.now();
      const shortId = timestamp.toString().slice(-6); // Últimos 6 dígitos del timestamp
      const idPromoOK = `PROMO-${shortId}`;
      
      // Preparar presentaciones aplicables con el schema actualizado del backend
      const presentacionesAplicables = selectedPresentaciones
        .filter(presentacion => presentacion && presentacion.IdPresentaOK) // Filtrar presentaciones válidas
        .map(presentacion => ({
          IdPresentaOK: presentacion.IdPresentaOK,
          SKUID: presentacion.producto?.SKUID || presentacion.SKUID || '',
          NombreProducto: presentacion.producto?.PRODUCTNAME || '',
          NombrePresentacion: presentacion.NOMBREPRESENTACION || '',
          PrecioOriginal: presentacion.Precio || 0
        }));
      
      console.log('📋 Presentaciones a enviar:', presentacionesAplicables);
      
      // Validar que haya al menos una presentación válida
      if (presentacionesAplicables.length === 0) {
        throw new Error('No hay presentaciones válidas seleccionadas');
      }
      
      // Preparar payload
      const promoPayload = {
        IdPromoOK: idPromoOK,
        Titulo: promotionData.titulo || 'Nueva Promoción',
        Descripcion: promotionData.descripcion || '',
        FechaIni: new Date(promotionData.fechaInicio).toISOString(),
        FechaFin: new Date(promotionData.fechaFin).toISOString(),
        ProductosAplicables: presentacionesAplicables, // Backend espera ProductosAplicables, pero enviamos presentaciones
        TipoDescuento: promotionData.tipoDescuento || 'PORCENTAJE',
        DescuentoPorcentaje: promotionData.tipoDescuento === 'PORCENTAJE' ? promotionData.descuentoPorcentaje : 0,
        DescuentoMonto: promotionData.tipoDescuento === 'MONTO_FIJO' ? promotionData.descuentoMonto : 0,
        PermiteAcumulacion: promotionData.permiteAcumulacion || false,
        LimiteUsos: promotionData.limiteUsos || null,
        ACTIVED: true,
        DELETED: false
      };
      
      console.log('📤 Payload a enviar:', promoPayload);
      
      const params = {
        ProcessType: 'AddOne',
      };
      
      // Solo añadir LoggedUser si se proporciona explícitamente y no hay uno en sessionStorage
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), promoPayload);
      
      console.log('✅ Promoción creada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating promotion with products:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error desconocido';
      if (error.response?.status === 405) {
        errorMessage = 'Método no permitido (405). Verifica que el servidor esté corriendo y las rutas configuradas.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado (404). Verifica la URL de la API.';
      } else if (error.response?.status === 400) {
        console.log('🔍 Detalles del error 400:', error.response?.data);
        console.log('🔍 Error completo:', JSON.stringify(error.response?.data, null, 2));
        errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.response?.data?.error || 'Datos de promoción no válidos (400).';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Revisa los logs del backend.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
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
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'UpdateOne',
          IdPromoOK: idPromoOK
          // LoggedUser se añade automáticamente por el interceptor
        }), promoData);
      return response.data;
    } catch (error) {
      console.error('Error updating promotion:', error);
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
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'DeleteHard',
          IdPromoOK: idPromoOK
          // LoggedUser se añade automáticamente por el interceptor
        }), {});
      return response.data;
    } catch (error) {
      console.error('Error hard deleting promotion:', error);
      throw error;
    }
  }

  // ========================================
  // FUNCIONES DEPRECADAS (Ya no se usan en la UI)
  // ========================================
  // Se mantienen comentadas por si se necesitan en el futuro
  // Ahora se usa updatePromotion para activar/desactivar promociones

  /**
   * @deprecated - Usar updatePromotion(id, { ACTIVED: false }) en su lugar
   * Eliminar una promoción (eliminación lógica - marca DELETED: true)
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Confirmación de eliminación
   */
  // async deletePromotion(idPromoOK) {
  //   try {
  //     const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
  //       new URLSearchParams({
  //         ProcessType: 'DeleteLogic',
  //         IdPromoOK: idPromoOK,
  //         DBServer: 'MongoDB'
  //       }), {});
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error deleting promotion:', error);
  //     throw error;
  //   }
  // },

  /**
   * @deprecated - Usar updatePromotion(id, { ACTIVED: true }) en su lugar
   * Activar una promoción (marca ACTIVED: true y DELETED: false)
   * @param {string} idPromoOK - ID de la promoción
   * @returns {Promise} Confirmación de activación
   */
  // async activatePromotion(idPromoOK) {
  //   try {
  //     const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
  //       new URLSearchParams({
  //         ProcessType: 'ActivateOne',
  //         IdPromoOK: idPromoOK,
  //         DBServer: 'MongoDB'
  //       }), {});
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error activating promotion:', error);
  //     throw error;
  //   }
  // }
};

export default promoService;