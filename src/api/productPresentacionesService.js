import axiosInstance from './axiosInstance';

function unwrapCAP(res) {
  return (
    res?.data?.value?.[0]?.data?.[0]?.dataRes ??
    res?.data?.dataRes ??
    res?.data ??
    []
  );
}

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
  async getAllPresentaciones() {
    const presParams = qs({ ProcessType: 'GetAll' });
    const presRes = await axiosInstance.post(`${BASE_PRESENT}?${presParams}`);
    const presentaciones = unwrapCAP(presRes);

    if (!Array.isArray(presentaciones) || presentaciones.length === 0) {
      return [];
    }
    const filesParams = qs({ ProcessType: 'GetAll' });
    const filesRes = await axiosInstance.post(`${BASE_FILES}?${filesParams}`);
    const allFiles = unwrapCAP(filesRes);

    const filesByPresenta = new Map();
    if (Array.isArray(allFiles)) {
      for (const file of allFiles) {
        if (!filesByPresenta.has(file.IdPresentaOK)) {
          filesByPresenta.set(file.IdPresentaOK, []);
        }
        filesByPresenta.get(file.IdPresentaOK).push(file);
      }
    }

    return presentaciones.map(p => ({ ...p, files: filesByPresenta.get(p.IdPresentaOK) || [] }));
  },

  async getPresentacionesBySKUID(skuid) {
    const params = qs({ ProcessType: 'GetBySKUID', skuid });

    const presRes = await axiosInstance.post(`${BASE_PRESENT}?${params}`);
    const presentaciones = unwrapCAP(presRes);
    if (!Array.isArray(presentaciones) || presentaciones.length === 0) return [];

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

  async getBySKUID(skuid) { return this.getPresentacionesBySKUID(skuid); },
  async getBySKU(skuid)   { return this.getPresentacionesBySKUID(skuid); },

  async addPresentacion(payload) {
    const params = qs({ ProcessType: 'AddOne' });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : (dataRes ?? null);
  },

  async updatePresentacion(idpresentaok, cambios) {
    const params = qs({ ProcessType: 'UpdateOne', idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, cambios);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : dataRes;
  },

  async deletePresentacion(idpresentaok, { hard = true } = {}) {
    const ProcessType = hard ? 'DeleteHard' : 'DeleteLogic';
    const params = qs({ ProcessType, idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : dataRes;
  },

  async deactivatePresentacion(idpresentaok) {
    return this.updatePresentacion(idpresentaok, { ACTIVED: false, DELETED: false });
  },

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

  async getPresentacionById(idpresentaok) {
    const params = qs({ ProcessType: 'GetOne', idpresentaok });
    const res = await axiosInstance.post(`${BASE_PRESENT}?${params}`, {});
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes[0] ?? null : (dataRes ?? null);
  },

  async getFilesByPresentacionId(idpresentaok) {
    const params = qs({ ProcessType: 'GetByIdPresentaOK', idpresentaok });
    const res = await axiosInstance.post(`${BASE_FILES}?${params}`);
    const dataRes = unwrapCAP(res);
    return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
  },

  async togglePresentacionStatus(idpresentaok, newStatus) {
    return newStatus
      ? this.activatePresentacion(idpresentaok)
      : this.deactivatePresentacion(idpresentaok);
  }
};

export default productPresentacionesService;
