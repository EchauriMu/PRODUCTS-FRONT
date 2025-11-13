// src/api/productPresentacionesService.js
import axiosInstance from './axiosInstance';

/** Desempaqueta respuestas CAP/OData con distintos envoltorios */
function unwrapCAP(res) {
  return (
    res?.data?.value?.[0]?.data?.[0]?.dataRes ??
    res?.data?.dataRes ??
    res?.data ??
    []
  );
}

/** Construye querystring sin undefined/null */
function qs(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  return p.toString();
}

const BASE_PRESENT = '/ztproducts-presentaciones/productsPresentacionesCRUD';
const BASE_FILES   = '/ztproducts-files/productsFilesCRUD';

const productPresentacionesService = {
  /**
   * Obtener presentaciones por SKUID (ProcessType=GetBySKUID) + merge de archivos
   */
  async getPresentacionesBySKUID(skuid) {
    const params = qs({ ProcessType: 'GetBySKUID', skuid });

    // Presentaciones
    const presRes = await axiosInstance.post(`${BASE_PRESENT}?${params}`);
    const presentaciones = unwrapCAP(presRes);
    if (!Array.isArray(presentaciones) || presentaciones.length === 0) return [];

    // Archivos por SKUID
    const filesRes = await axiosInstance.post(`${BASE_FILES}?${params}`);
    const files = unwrapCAP(filesRes);
    if (!Array.isArray(files)) {
      return presentaciones.map(p => ({ ...p, files: [] }));
    }

    const byPresenta = new Map();
    for (const f of files) {
      if (!byPresenta.has(f.IdPresentaOK)) byPresenta.set(f.IdPresentaOK, []);
      byPresenta.get(f.IdPresentaOK).push(f);
    }

    return presentaciones.map(p => ({
      ...p,
      files: byPresenta.get(p.IdPresentaOK) || []
    }));
  },

  // ALIAS para compatibilidad
  async getBySKUID(skuid) { return this.getPresentacionesBySKUID(skuid); },
  async getBySKU(skuid)   { return this.getPresentacionesBySKUID(skuid); },

  /** Crear */
  async addPresentacion(payload) {
    const params = qs({ ProcessType: 'AddOne' });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : (dataRes ?? null);
  },

  /** Actualizar */
  async updatePresentacion(idpresentaok, cambios) {
    const params = qs({ ProcessType: 'UpdateOne', idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, cambios);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : dataRes;
  },

  /** Eliminar (Hard por defecto) / lógica con { hard:false } */
  async deletePresentacion(idpresentaok, { hard = true } = {}) {
    const ProcessType = hard ? 'DeleteHard' : 'DeleteLogic';
    const params = qs({ ProcessType, idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : dataRes;
  },

  /** ✅ Desactivar: solo cambia estado. NO usa DeleteLogic (no oculta). */
  async deactivatePresentacion(idpresentaok) {
    return this.updatePresentacion(idpresentaok, { ACTIVED: false, DELETED: false });
  },

  /** ✅ Activar: asegura visible */
  async activatePresentacion(idpresentaok) {
    return this.updatePresentacion(idpresentaok, { ACTIVED: true, DELETED: false });
  },

  /** Borrado masivo (N llamadas) */
  async deletePresentacionesBulk(ids = [], { hard = true, concurrency = 5 } = {}) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const results = [];
    const queue = [...ids];

    const worker = async () => {
      while (queue.length) {
        const id = queue.shift();
        try {
          await this.deletePresentacion(id, { hard });
          results.push({ idpresentaok: id, ok: true });
        } catch (err) {
          results.push({
            idpresentaok: id,
            ok: false,
            error: err?.response?.data?.messageUSR || err?.message || 'Error'
          });
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, ids.length) }, worker);
    await Promise.all(workers);
    return results;
  },

  /** GetOne */
  async getPresentacionById(idpresentaok) {
    const params = qs({ ProcessType: 'GetOne', idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, {});
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : (dataRes ?? null);
  },

  /** Archivos por IdPresentaOK */
  async getFilesByPresentacionId(idpresentaok) {
    const params = qs({ ProcessType: 'GetByIdPresentaOK', idpresentaok });
    const res = await axiosInstance.post(`${BASE_FILES}?${params}`);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
  },

  /** ✅ Toggle real: nunca pone DELETED=true */
  async togglePresentacionStatus(idpresentaok, newStatus) {
    return newStatus
      ? this.activatePresentacion(idpresentaok)
      : this.deactivatePresentacion(idpresentaok);
  }
};

export default productPresentacionesService;
