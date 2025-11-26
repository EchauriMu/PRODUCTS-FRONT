import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Title,
  Text,
  FlexBox,
  Icon,
  Link,
  ResponsivePopover,
  Bar,
  MessageStrip,
  CheckBox,
  Switch
} from '@ui5/webcomponents-react';

import productPresentacionesService from '../../api/productPresentacionesService';
import PresentationStatus from './PresentationStatus';

const SelectPresentationToEditPage = () => {
  const navigate = useNavigate();
  const { skuid } = useParams();
  const location = useLocation();

  const [presentaciones, setPresentaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [multiMode, setMultiMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const delPopoverRef = useRef(null);
  const bulkPopoverRef = useRef(null);
  const bulkBtnRef = useRef(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        if (location.state?.updatedPresentation) {
          if (mounted) {
            setPresentaciones(prev =>
              prev.map(p =>
                p.IdPresentaOK === location.state.updatedPresentation.IdPresentaOK
                  ? location.state.updatedPresentation
                  : p
              )
            );
          }
        }
        const list = await productPresentacionesService.getBySKUID(skuid);
        if (mounted) setPresentaciones(Array.isArray(list) ? list : []);
      } catch (err) {
        if (mounted) setError(err?.message || 'Error al cargar presentaciones');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [skuid, location.state?.updatedPresentation]);

  const handlePresentationUpdate = (updatedPresentation) => {
    setPresentaciones(prev =>
      prev.map(p =>
        p.IdPresentaOK === updatedPresentation.IdPresentaOK
          ? { ...p, ...updatedPresentation }
          : p
      )
    );
  };

  const nothingSelected = useMemo(() => selectedIds.size === 0, [selectedIds]);

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? new Set(presentaciones.map(p => p.IdPresentaOK)) : new Set());
  };

  const openConfirmSingle = (e, presenta) => {
    e.stopPropagation();
    setPendingDelete(presenta);
    setDeleteError('');
    const pop = delPopoverRef.current;
    const opener = e.currentTarget;
    if (!pop || !opener) return;
    if (typeof pop.showAt === 'function') pop.showAt(opener);
    else { pop.opener = opener; pop.open = true; }
  };

  const handleDeleteSingle = async () => {
    if (!pendingDelete?.IdPresentaOK) return;
    setDeleting(true); setDeleteError('');
    let ok = false;
    try {
      await productPresentacionesService.deletePresentacion(pendingDelete.IdPresentaOK);
      ok = true;
      setPresentaciones(prev => prev.filter(p => p.IdPresentaOK !== pendingDelete.IdPresentaOK));
    } catch (err) {
      setDeleteError(err?.response?.data?.messageUSR || err?.message || 'No se pudo eliminar.');
    } finally {
      setDeleting(false);
      if (ok) delPopoverRef.current?.close();
      setPendingDelete(null);
    }
  };

  const openConfirmBulk = () => {
    setDeleteError('');
    const pop = bulkPopoverRef.current;
    const opener = bulkBtnRef.current;
    if (!pop || !opener) return;
    if (typeof pop.showAt === 'function') pop.showAt(opener);
    else { pop.opener = opener; pop.open = true; }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true); setDeleteError('');
    try {
      const ids = Array.from(selectedIds);
      const res = await productPresentacionesService.deletePresentacionesBulk(ids, { hard: true, concurrency: 5 });
      const okIds = res.filter(r => r.ok).map(r => r.idpresentaok);
      const fail  = res.filter(r => !r.ok);

      setPresentaciones(prev => prev.filter(p => !okIds.includes(p.IdPresentaOK)));
      setSelectedIds(new Set());
      setMultiMode(false);

      if (fail.length) {
        setDeleteError(`No se pudieron eliminar ${fail.length}: ${fail.map(f => f.idpresentaok).join(', ')}`);
      } else {
        bulkPopoverRef.current?.close();
      }
    } catch (err) {
      setDeleteError(err?.response?.data?.messageUSR || err?.message || 'No se pudieron eliminar todas.');
    } finally {
      setDeleting(false);
    }
  };

  const getThumbSrc = (p) => {
    if (Array.isArray(p.files)) {
      const img = p.files.find(f => f?.FILETYPE === 'IMG' && f?.FILE);
      if (img?.FILE) return img.FILE;
    }
    return p?.IMGURL || null;
  };

  const CardItem = ({ p }) => {
    const src = getThumbSrc(p);
    const checked = selectedIds.has(p.IdPresentaOK);
    const isClickable = !multiMode;

    return (
      <Card
        style={{ width: 300, position: 'relative', paddingBottom: '0.5rem', cursor: 'pointer' }}
        onClick={() => navigate(`/products/${skuid}/presentations/edit/${p.IdPresentaOK}`)}
        header={
          <FlexBox
            justifyContent="SpaceBetween"
            alignItems="Center"
            style={{ padding: '0.5rem 0.75rem', gap: 8 }}
          > 
            <FlexBox alignItems="Center" style={{ gap: 8, minWidth: 0 }}>
              {multiMode && (
                <CheckBox
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); toggleOne(p.IdPresentaOK); }}
                /> 
              )}
              <Title
                level="H6"
                style={{
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 200
                }}
                title={p.IdPresentaOK}
              >
                {p.IdPresentaOK}
              </Title>
            </FlexBox>

            <FlexBox style={{ gap: 4 }}>
              <Button
                design="Transparent"
                icon="edit"
                onClick={(e) => { e.stopPropagation(); navigate(`/products/${skuid}/presentations/edit/${p.IdPresentaOK}`); }}
              />
              <Button
                design="Transparent"
                icon="delete"
                onClick={(e) => { e.stopPropagation(); openConfirmSingle(e, p); }}
              />
            </FlexBox>
          </FlexBox>
        }
      >
        {src ? (
          <img
            src={src}
            alt={p.NOMBREPRESENTACION || p.Descripcion || p.IdPresentaOK}
            style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, background: '#fafafa' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <FlexBox
            alignItems="Center"
            justifyContent="Center"
            style={{ height: 200, borderRadius: 8, background: '#fafafa' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="image" style={{ fontSize: '2rem', color: '#c6c6c6' }} />
          </FlexBox>
        )}

        <div style={{ padding: '0.75rem' }}>
          <Title level="H6" style={{ margin: 0 }}>
            {p.NOMBREPRESENTACION || p.IdPresentaOK}
          </Title>
          {p.Descripcion && <Text style={{ color: '#5f6a7d' }}>{p.Descripcion}</Text>}
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '0.75rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
            <PresentationStatus
              presentation={p}
              onStatusChange={handlePresentationUpdate}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '1rem 1.25rem' }}>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: '1rem' }}>
        <div>
          <Title level="H4">Seleccionar Presentación para Editar</Title>
          <Text>Para producto <b>SKU: {skuid}</b></Text>
        </div>

        <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
          <Link onClick={() => navigate(-1)}>Volver</Link>

          <FlexBox alignItems="Center" style={{ gap: 4 }}>
            <Text>Selección múltiple</Text>
            <Switch
              checked={multiMode}
              onChange={e => { setMultiMode(e.target.checked); if (!e.target.checked) setSelectedIds(new Set()); }}
            />
          </FlexBox>

          {multiMode && (
            <>
              <FlexBox alignItems="Center" style={{ gap: 4 }}>
                <CheckBox
                  onChange={(e) => toggleAll(e.target.checked)}
                  checked={selectedIds.size > 0 && selectedIds.size === presentaciones.length}
                />
                <Text>Todos</Text>
              </FlexBox>

              <Button
                ref={bulkBtnRef}
                design="Negative"
                icon="delete"
                disabled={nothingSelected}
                onClick={openConfirmBulk}
              >
                Eliminar seleccionados {selectedIds.size ? `(${selectedIds.size})` : ''}
              </Button>
            </>
          )}
        </FlexBox>
      </FlexBox>

      {loading && <Text>Cargando…</Text>}
      {error && <MessageStrip design="Negative">{error}</MessageStrip>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {presentaciones.map(p => <CardItem key={p.IdPresentaOK} p={p} />)}
        </div>
      )}

      <ResponsivePopover ref={delPopoverRef} placementType="Bottom">
        <Bar startContent={<Title level="H6">Eliminar presentación</Title>} />
        <div style={{ padding: '1rem', maxWidth: 360 }}>
          <Text>
            ¿Seguro que deseas eliminar <b>{pendingDelete?.NOMBREPRESENTACION || pendingDelete?.Descripcion || pendingDelete?.IdPresentaOK}</b>?
          </Text>
          {deleteError && <MessageStrip design="Negative" style={{ marginTop: 8 }}>{deleteError}</MessageStrip>}
        </div>
        <Bar endContent={
          <>
            <Button design="Transparent" onClick={() => delPopoverRef.current?.close()} disabled={deleting}>Cancelar</Button>
            <Button design="Negative" icon="delete" onClick={handleDeleteSingle} disabled={deleting}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        } />
      </ResponsivePopover>

      <ResponsivePopover ref={bulkPopoverRef} placementType="Bottom">
        <Bar startContent={<Title level="H6">Eliminar seleccionados</Title>} />
        <div style={{ padding: '1rem', maxWidth: 380 }}>
          <Text>¿Seguro que deseas eliminar <b>{selectedIds.size}</b> presentaciones?</Text>
          {deleteError && <MessageStrip design="Negative" style={{ marginTop: 8 }}>{deleteError}</MessageStrip>}
        </div>
        <Bar endContent={
          <>
            <Button design="Transparent" onClick={() => bulkPopoverRef.current?.close()} disabled={deleting}>Cancelar</Button>
            <Button design="Negative" icon="delete" onClick={handleDeleteBulk} disabled={deleting || nothingSelected}>
              {deleting ? 'Eliminando…' : 'Eliminar todo'}
            </Button>
          </>
        } />
      </ResponsivePopover>
    </div>
  );
};

export default SelectPresentationToEditPage;
