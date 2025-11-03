import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  List,
  BusyIndicator,
  MessageStrip,
  FlexBox,
  Button,
  Icon,
  ResponsivePopover,
  Bar,
  Title,
  Text
} from '@ui5/webcomponents-react';
import { ListItemStandard as StandardListItem } from '@ui5/webcomponents-react';
import productPresentacionesService from '../../api/productPresentacionesService';

const SelectPresentationToEditPage = () => {
  const { skuid } = useParams();
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Para el popover de eliminación
  const [presentationToDelete, setPresentationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePopoverRef = useRef(null);

  useEffect(() => {
    const fetchPresentations = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productPresentacionesService.getPresentacionesBySKUID(skuid, 'EECHAURIM');
        setPresentations(data);
      } catch (err) {
        setError('Error al cargar las presentaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, [skuid]);

  const handleSelectPresentation = (presentaId) => {
    navigate(`/products/${skuid}/presentations/edit/${presentaId}`);
  };

  const openDeletePopover = (e, presentation) => {
    e.stopPropagation(); // Evita que se active el onClick del list item
    setPresentationToDelete(presentation);
    deletePopoverRef.current?.showAt(e.target);
  };

  const handleDelete = async () => {
    if (!presentationToDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      await productPresentacionesService.deletePresentacion(presentationToDelete.IdPresentaOK, 'EECHAURIM');
      // Actualizar la lista de presentaciones en el estado
      setPresentations(prev => prev.filter(p => p.IdPresentaOK !== presentationToDelete.IdPresentaOK));
    } catch (err) {
      setError('Error al eliminar la presentación.');
    } finally {
      setIsDeleting(false);
      setPresentationToDelete(null);
      deletePopoverRef.current?.close();
    }
  };

  const closeDeletePopover = () => {
    if (isDeleting) return;
    setPresentationToDelete(null);
    deletePopoverRef.current?.close();
  };

  return (
    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
      <Card
        header={
          <CardHeader
            titleText="Seleccionar Presentación para Editar"
            subtitleText={`Para producto SKU: ${skuid}`}
            action={
              <Button design="Transparent" onClick={() => navigate(-1)}>
                Volver
              </Button>
            }
          />
        }
        style={{ width: '100%', maxWidth: '800px' }}
      >
        {loading && <BusyIndicator active style={{ margin: '2rem' }} />}
        {error && <MessageStrip design="Negative" style={{ margin: '1rem' }}>{error}</MessageStrip>}
        {!loading && !error && (
          <List>
            {presentations.length > 0 ? (
              presentations.map((p) => (
                <StandardListItem
                  key={p.IdPresentaOK}
                  icon={<Icon name="product" />}
                  type="Active"
                  onClick={() => handleSelectPresentation(p.IdPresentaOK)}
                >
                  <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ width: '100%' }}>
                    <FlexBox direction="Column">
                      <Text style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {p.NombrePresentacion || p.Descripcion}
                      </Text>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        Costo Final: ${p.CostoFinal || p.Precio} - Stock: {p.Stock}
                      </Text>
                    </FlexBox>

                    <Button
                      icon="delete"
                      design="Transparent"
                      onClick={(e) => openDeletePopover(e, p)}
                      aria-label={`Eliminar ${p.NombrePresentacion || p.Descripcion}`}
                    />
                  </FlexBox>
                </StandardListItem>
              ))
            ) : (<StandardListItem>No hay presentaciones para este producto.</StandardListItem>)}
          </List>
        )}
        <ResponsivePopover ref={deletePopoverRef} placementType="Bottom">
          <Bar startContent={<Title level="H6">Confirmar Eliminación</Title>} />
          <div style={{ padding: '1rem', maxWidth: 360 }}>
            <p>¿Estás seguro de que deseas eliminar la presentación <b>{presentationToDelete?.NombrePresentacion || presentationToDelete?.Descripcion}</b>?</p>
          </div>
          <Bar endContent={
            <>
              <Button design="Transparent" onClick={closeDeletePopover} disabled={isDeleting}>No, cancelar</Button>
              <Button design="Negative" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</Button>
            </>
          } />
        </ResponsivePopover>
      </Card>
    </FlexBox>
  );
};

export default SelectPresentationToEditPage;