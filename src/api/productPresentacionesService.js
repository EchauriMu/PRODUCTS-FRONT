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

      // 1. Obtener los datos base de las presentaciones (incluyendo el estado ACTIVED)
      const presentationsRes = await axiosInstance.post(
        `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`
      );
      const presentations = unwrapCAP(presentationsRes);

      if (!Array.isArray(presentations) || presentations.length === 0) {
        return [];
      }

      // 2. Obtener todos los archivos para el SKUID
      const filesRes = await axiosInstance.post(
        `/ztproducts-files/productsFilesCRUD?${params}`
      );
      const files = unwrapCAP(filesRes);
      if (!Array.isArray(files)) {
        // Si no hay archivos, devolvemos las presentaciones sin ellos.
        return presentations.map(p => ({ ...p, files: [] }));
      }

      // 3. Agrupar archivos por IdPresentaOK
      const filesByPresentaId = new Map();
      files.forEach(file => {
        if (!filesByPresentaId.has(file.IdPresentaOK)) {
          filesByPresentaId.set(file.IdPresentaOK, []);
        }
        filesByPresentaId.get(file.IdPresentaOK).push(file);
      });

      // 4. Combinar presentaciones con sus archivos
      return presentations.map(p => ({
        ...p,
        files: filesByPresentaId.get(p.IdPresentaOK) || []
      }));
    } catch (error) {
      console.error('Error fetching product presentaciones:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva Presentación (ProcessType=AddOne)
   * payload: { IdPresentaOK, SKUID, NOMBREPRESENTACION, Descripcion, CostoIni, CostoFin, ACTIVED }
   */
  async addPresentacion(payload) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'AddOne'
      }).toString();

    const res = await axiosInstance.post(
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`,
      payload,
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

    const res = await axiosInstance.post( // Se cambia a POST, ya que la API parece usarlo para todas las operaciones
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
      idpresentaok
    }).toString();
    const res = await axiosInstance.post(
      `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`,
      null // Se envía null para que Axios no incluya un cuerpo ni la cabecera Content-Type
    );
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
  },

  // Helper para obtener los archivos de una presentación
  async getFilesByPresentacionId(idpresentaok, loggedUser = 'SPARDOP') {
    const params = new URLSearchParams({
      ProcessType: 'GetByIdPresentaOK', // Mantenemos LoggedUser aquí porque es un helper específico
      idpresentaok,                     // y no queremos depender de la sesión si no es necesario.
      LoggedUser: loggedUser            // Además, el interceptor no lo duplicará si ya existe.
    }).toString();
    const res = await axiosInstance.post(
      `/ztproducts-files/productsFilesCRUD?${params}` // Apuntando al servicio de archivos
    );
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
  },

  // Cambia el estado ACTIVED de una presentación
  async togglePresentacionStatus(idpresentaok, newStatus) {
    console.log(`Simulando cambio de estado para ${idpresentaok}: ${newStatus}`);
    try {
      // En un futuro, esto llamaría al endpoint de actualización real

      const result = await this.updatePresentacion(idpresentaok, { ACTIVED: newStatus });
      return result;
    } catch (error) {
      console.error('Error simulado al cambiar estado:', error);
      throw new Error('No se pudo cambiar el estado de la presentación.');
    }
  }
};

export default productPresentacionesService;