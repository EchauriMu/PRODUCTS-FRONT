import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  BusyIndicator,
  MessageStrip,
  FlexBox,
  Button,
  Icon,
  ResponsivePopover,
  Bar,
  Title,
  Text,
} from '@ui5/webcomponents-react';
import productPresentacionesService from '../../api/productPresentacionesService';
import PresentationStatus from './PresentationStatus';

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
        // SOLUCIÓN: Simplificar la carga. La función `getPresentacionesBySKUID` debería
        // devolver toda la información necesaria, incluyendo los archivos de cada
        // presentación, tal como funciona en la página de detalles del producto.
        // Se elimina el `fetch` manual que causaba los errores.
        const basePresentations = await productPresentacionesService.getPresentacionesBySKUID(skuid);
        setPresentations(basePresentations);
      } catch (err) {
        setError('Error al cargar las presentaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, [skuid]);

  const handleSelectPresentation = (presentaId) => {
    // CORRECCIÓN: Navegar a la ruta de edición correcta definida en Layout.jsx
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
      await productPresentacionesService.deletePresentacion(presentationToDelete.IdPresentaOK);
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

  // Componente de Tarjeta individual para el Grid
  const PresentationCard = ({ presentation }) => {
    const [isHovered, setIsHovered] = useState(false);
    const imageToShow = presentation.files?.find(f => f.PRINCIPAL === true) || presentation.files?.find(f => f.fileBase64 || f.FILE);

    const cardStyle = {
      width: '280px',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
      boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      position: 'relative',
    };

    return (
      <Card
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleSelectPresentation(presentation.IdPresentaOK)}
      >
        <Button icon="delete" design="Transparent" onClick={(e) => openDeletePopover(e, presentation)} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }} />
        {imageToShow ? (
          <img src={imageToShow.fileBase64 || imageToShow.FILE} alt={presentation.NombrePresentacion} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
        ) : (
          <FlexBox justifyContent="Center" alignItems="Center" style={{ width: '100%', height: '220px', backgroundColor: '#fafafa' }}>
            <Icon name="product" style={{ fontSize: '4rem', color: '#ccc' }} />
          </FlexBox>
        )}
        <div style={{ padding: '1rem' }}>
          <Title level="H5" wrappingType="Normal" style={{ minHeight: '44px', lineHeight: '1.3' }}>
            {presentation.NombrePresentacion || presentation.IdPresentaOK}
          </Title>
          <FlexBox direction="Column" style={{ marginTop: '0.5rem' }}>
            <Text style={{ fontSize: '0.875rem' }}>Costo Final: <b>${presentation.CostoFinal || presentation.Precio || 'N/A'}</b></Text>
            <Text style={{ fontSize: '0.875rem' }}>Stock: <b>{presentation.Stock ?? 'N/A'}</b></Text>
          </FlexBox>
          <div style={{ marginTop: '1rem' }}>
            <PresentationStatus presentation={presentation} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
      <Card
        header={
          <CardHeader
            titleText="Seleccionar Presentación para Editar"
            subtitleText={`Para producto SKU: ${skuid}`}
            action={
              <Button design="Transparent" onClick={() => navigate('/')}>
                Volver
              </Button>
            }
          />
        }
        style={{ width: '100%', maxWidth: '1400px', background: '#f9f9f9' }}
      >
        {loading && <BusyIndicator active style={{ margin: '2rem' }} />}
        {error && <MessageStrip design="Negative" style={{ margin: '1rem' }}>{error}</MessageStrip>}
        {!loading && !error && (
          <div style={{ padding: '1.5rem' }}>
            {presentations.length > 0 ? (
              <FlexBox justifyContent="Center" wrap="Wrap" style={{ gap: '1.5rem' }}>
                {presentations.map((p) => <PresentationCard key={p.IdPresentaOK} presentation={p} />)}
              </FlexBox>
            ) : (
              <MessageStrip design="Information" hideCloseButton>No hay presentaciones para este producto.</MessageStrip>
            )}
          </div>
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