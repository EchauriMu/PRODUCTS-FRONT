import axiosInstance from './axiosInstance';

/**
 * Servicio CRUD para Listas de Precios — HANNIAALIDELUNA
 */
const preciosListasService = {
  /**
   * Obtener todas las listas de precios
   * Lee correctamente la estructura del backend:
   * response.data.value[0].data[0].dataRes
   */
  async getAllListas() {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll'
      }).toString();

      const response = await axiosInstance.post(`/ztprecios-listas/preciosListasCRUD?${params}`);

      // ✅ Navegación exacta a tu estructura
      const dataRes = response?.data?.value?.[0]?.data?.[0]?.dataRes || [];

      console.log('✅ Datos obtenidos del backend:', dataRes);
      return dataRes;
    } catch (error) {
      console.error('❌ Error al obtener las listas de precios:', error);
      throw error;
    }
  }
};

export default preciosListasService;
