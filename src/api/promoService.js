/*
 * Módulo de Servicios de Promociones
 * Autores: LAURA PANIAGUA, ALBERTO PARDO
 * Descripción: Servicio para manejar operaciones CRUD de promociones
 */

import axiosInstance from './axiosInstance';

/* ========================================================================================
 * SERVICIO DE PROMOCIONES
 * ======================================================================================== */
const promoService = {

  /* ==================================================================================
   * getAllPromotions - Obtener todas las promociones
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async getAllPromotions(loggedUser = null) {
    try {
      const params = {
        ProcessType: 'GetAll'
      };
      
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), {});
      return response.data;
    } catch (error) {
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

  /* ==================================================================================
   * getPromotionById - Obtener una promoción por ID
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async getPromotionById(idPromoOK, loggedUser = null) {
    try {
      const params = {
        ProcessType: 'GetOne',
        IdPromoOK: idPromoOK
      };
      
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /* ==================================================================================
   * createPromotionWithProducts - Crear nueva promoción con presentaciones
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async createPromotionWithProducts(promotionData, selectedPresentaciones = [], filters = {}, loggedUser = null) {
    try {
      const timestamp = Date.now();
      const shortId = timestamp.toString().slice(-6);
      const idPromoOK = `PROMO-${shortId}`;
      
      const presentacionesAplicables = selectedPresentaciones
        .filter(presentacion => presentacion && presentacion.IdPresentaOK)
        .map(presentacion => ({
          IdPresentaOK: presentacion.IdPresentaOK,
          SKUID: presentacion.producto?.SKUID || presentacion.SKUID || '',
          NombreProducto: presentacion.producto?.PRODUCTNAME || '',
          NombrePresentacion: presentacion.NOMBREPRESENTACION || '',
          PrecioOriginal: presentacion.Precio || 0
        }));
      
      if (presentacionesAplicables.length === 0) {
        throw new Error('No hay presentaciones válidas seleccionadas');
      }
      
      const promoPayload = {
        IdPromoOK: idPromoOK,
        Titulo: promotionData.titulo || 'Nueva Promoción',
        Descripcion: promotionData.descripcion || '',
        FechaIni: new Date(promotionData.fechaInicio).toISOString(),
        FechaFin: new Date(promotionData.fechaFin).toISOString(),
        ProductosAplicables: presentacionesAplicables,
        TipoDescuento: promotionData.tipoDescuento || 'PORCENTAJE',
        DescuentoPorcentaje: promotionData.tipoDescuento === 'PORCENTAJE' ? promotionData.descuentoPorcentaje : 0,
        DescuentoMonto: promotionData.tipoDescuento === 'MONTO_FIJO' ? promotionData.descuentoMonto : 0,
        PermiteAcumulacion: promotionData.permiteAcumulacion || false,
        LimiteUsos: promotionData.limiteUsos || null,
        ACTIVED: true,
        DELETED: false
      };
      
      const params = {
        ProcessType: 'AddOne',
      };
      
      if (loggedUser && !sessionStorage.getItem('LoggedUser')) {
        params.LoggedUser = loggedUser;
      }
      
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams(params), promoPayload);
      
      return response.data;
    } catch (error) {
      let errorMessage = 'Error desconocido';
      if (error.response?.status === 405) {
        errorMessage = 'Método no permitido (405). Verifica que el servidor esté corriendo y las rutas configuradas.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado (404). Verifica la URL de la API.';
      } else if (error.response?.status === 400) {
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

  /* ==================================================================================
   * updatePromotion - Actualizar una promoción existente
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async updatePromotion(idPromoOK, promoData) {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'UpdateOne',
          IdPromoOK: idPromoOK
        }), promoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /* ==================================================================================
   * deletePromotionHard - Eliminar una promoción permanentemente
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async deletePromotionHard(idPromoOK) {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'DeleteHard',
          IdPromoOK: idPromoOK
        }), {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /* ==================================================================================
   * deletePromotionLogic - Eliminar lógicamente una promoción
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async deletePromotionLogic(idPromoOK) {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'DeleteLogic',
          IdPromoOK: idPromoOK
        }), {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /* ==================================================================================
   * activatePromotion - Activar una promoción
   * Autores: LAURA PANIAGUA, ALBERTO PARDO
   * ================================================================================== */
  async activatePromotion(idPromoOK) {
    try {
      const response = await axiosInstance.post('/ztpromociones/crudPromociones?' + 
        new URLSearchParams({
          ProcessType: 'ActivateOne',
          IdPromoOK: idPromoOK
        }), {});
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default promoService;