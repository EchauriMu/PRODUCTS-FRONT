import axiosInstance from './axiosInstance';

/** Helper para desenvolver posibles respuestas CAP/OData */
function unwrapCAP(res) {
  return (
    res?.data?.value?.[0]?.data?.[0]?.dataRes ??
    res?.data?.dataRes ??
    res?.data ??
    []
  );
}

const productPresentacionesService = {
  /**
   * Obtener presentaciones por SKUID (ProcessType=GetBySKUID)
   */
  async getPresentacionesBySKUID(skuid) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid
      }).toString();

      const res = await axiosInstance.post(
        `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      // Garantiza siempre un arreglo
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error('Error fetching product presentaciones:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva Presentación (ProcessType=AddOne)
   * payload: { IdPresentaOK, SKUID, NOMBREPRESENTACION, Descripcion, CostoIni, CostoFin, ACTIVED }
   */
  async addPresentacion(payload, loggedUser = 'SPARDOP') {
    try {
      const params = new URLSearchParams({
        ProcessType: 'AddOne',
        LoggedUser: loggedUser
      }).toString();

    const res = await axiosInstance.post(
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`,
      cleanBody,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
  } catch (error) {
    console.error('Error adding presentacion:', error.response?.data || error);
    throw error;
  }
},


  /**
   * Actualizar una Presentación (ProcessType=UpdateOne)
   */
  async updatePresentacion(idpresentaok, cambios) {
    const params = new URLSearchParams({
      ProcessType: 'UpdateOne',
      idpresentaok
    }).toString();

    const res = await axiosInstance.put( // Usualmente las actualizaciones usan PUT
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`,
      cambios
    );

    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] || null : dataRes;
  },

  /**
   * Eliminar (lógico) una Presentación (ProcessType=DeleteLogic)
   */
  async deletePresentacion(idpresentaok) {
    const params = new URLSearchParams({
      ProcessType: 'DeleteLogic',
      idpresentaok
    }).toString();

    const res = await axiosInstance.post(
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`
    );

    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] || null : dataRes;
  },

  /**
   * Helper: Eliminar varias presentaciones (llama DeleteLogic en paralelo)
   * Devuelve un arreglo con los resultados en el mismo orden que los IDs.
   */
  async deletePresentacionesBulk(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const results = await Promise.all(
      ids.map((id) => this.deletePresentacion(id))
    );
    return results;
  },

  // (Opcional) Si tu back expone ProcessType=GetById, esto refresca una presentación tras editar.
  async getPresentacionById(idpresentaok) {
    const params = new URLSearchParams({
      ProcessType: 'GetById',
      idpresentaok,
      LoggedUser: loggedUser
    }).toString();
    const res = await axiosInstance.post(
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`
    );
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
  },

  // Helper para obtener los archivos de una presentación
  async getFilesByPresentacionId(idpresentaok, loggedUser = 'SPARDOP') {
    const params = new URLSearchParams({
      ProcessType: 'GetByIdPresentaOK',
      idpresentaok,
      LoggedUser: loggedUser
    }).toString();
    const res = await axiosInstance.post(
      `/ztproducts-files/productsFilesCRUD?${params}` // Apuntando al servicio de archivos
    );
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
  }
};

export default productPresentacionesService;
