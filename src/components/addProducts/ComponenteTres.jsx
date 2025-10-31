import React from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Title,
  Text,
  Button,
  MessageStrip,
  Tag,
  // ❌ Eliminado: List,
  // ❌ Eliminado: StandardListItem
} from "@ui5/webcomponents-react";
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

const ComponenteTres = ({ productData, presentations, onSubmit, isSubmitting }) => {
  return (
    <Card style={{ width: '100%', marginTop: '20px' }}
      header={
        <CardHeader
          titleText="Paso 3: Revisión y Confirmación"
          subtitleText="Verifique toda la información antes de enviar"
        />
      }
    >
      <div style={{ padding: '2rem' }}>
        {/* Información del Producto */}
        <Title level="H4" style={{ marginBottom: '1rem', color: '#0854a0' }}>
          Información del Producto Padre
        </Title>
        <div style={{
          backgroundColor: '#f7f7f7',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'baseline' }}>
            <Text style={{ fontWeight: 'bold' }}>Nombre Producto:</Text>
            <Text>{productData.PRODUCTNAME || '-'}</Text>

            <Text style={{ fontWeight: 'bold' }}>SKU ID:</Text>
            <Text>{productData.SKUID || '-'}</Text>
            
            <Text style={{ fontWeight: 'bold' }}>Descripción:</Text>
            <Text>{productData.DESSKU || '-'}</Text>
            
            <Text style={{ fontWeight: 'bold' }}>Marca:</Text>
            <Text>{productData.MARCA || '-'}</Text>
            
            <Text style={{ fontWeight: 'bold' }}>Unidad de Medida:</Text>
            <Text>{productData.IDUNIDADMEDIDA || '-'}</Text>
            
            <Text style={{ fontWeight: 'bold' }}>Código de Barras:</Text>
            <Text>{productData.BARCODE || '-'}</Text>

            <Text style={{ fontWeight: 'bold' }}>Info Adicional:</Text>
            <Text>{productData.INFOAD || '-'}</Text>

            <Text style={{ fontWeight: 'bold' }}>Categorías:</Text>
            <FlexBox wrap="Wrap" style={{ gap: '0.5rem' }}>
              {productData.CATEGORIAS?.map((cat, i) => (
                <Tag key={i} colorScheme="8">{cat}</Tag>
              ))}
            </FlexBox>
          </div>
        </div>

        {/* Presentaciones */}
        <Title level="H4" style={{ marginBottom: '1rem', color: '#0854a0' }}>
          Presentaciones ({presentations.length})
        </Title>
        
        {presentations.length > 0 ? (
          presentations.map((pres, index) => (
            <Card
              key={index}
              style={{ marginBottom: '1rem', backgroundColor: '#fafafa' }}
            >
              <div style={{ padding: '1rem' }}>
                <FlexBox justifyContent="SpaceBetween" alignItems="Start">
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '0.5rem' }}>
                      {pres.IdPresentaOK}
                    </Text>
                    <Text style={{ marginBottom: '0.5rem' }}>{pres.Descripcion}</Text>
                    <FlexBox style={{ gap: '1rem', marginTop: '0.5rem' }}>
                      <Text><strong>Costo:</strong> ${parseFloat(pres.CostoIni || 0).toFixed(2)}</Text>
                      <Text><strong>Archivos:</strong> {pres.files?.length || 0}</Text>
                    </FlexBox>
                    {pres.PropiedadesExtras && Object.keys(pres.PropiedadesExtras).length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <Label>Propiedades:</Label>
                        <FlexBox wrap="Wrap" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                          {Object.entries(pres.PropiedadesExtras).map(([key, value]) => (
                            <Tag key={key} colorScheme="7">
                              <span style={{ fontWeight: 'bold' }}>{key}:</span>
                              &nbsp;
                              <span>{String(value)}</span>
                            </Tag>
                          ))}
                        </FlexBox>
                      </div>
                    )}
                  </div>
                  <Tag colorScheme="3">#{index + 1}</Tag>
                </FlexBox>
              </div>
            </Card>
          ))
        ) : (
          <MessageStrip design="Warning" hideCloseButton>
            No se han agregado presentaciones. Se recomienda agregar al menos una.
          </MessageStrip>
        )}

      </div>
    </Card>
  );
};

export default ComponenteTres;