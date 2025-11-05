import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Input,
  Icon,
  Button,
  MessageStrip,
  MultiComboBox,
  MultiComboBoxItem,
  Option,
  Text,
  Select,
  Tag
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import addProductApi from '../../api/addProductApi';

const ComponenteUno = ({ productData, setProductData }) => {
  const [errors, setErrors] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const skuSuffixRef = useRef(null); // Para almacenar el sufijo único del SKU
  const barcodeRef = useRef(null); // Para almacenar el código de barras único

  const generateSku = (productName) => {
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      skuSuffixRef.current = null; // Reiniciar sufijo si no hay nombre de producto
      return '';
    }
 
    if (!skuSuffixRef.current) {
      // Generar y guardar el sufijo solo la primera vez que se escribe el nombre
      skuSuffixRef.current = Date.now().toString(36).toUpperCase();
    }
    const base = productName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '') // Quitar caracteres especiales
      .trim()
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones

    return `${base.slice(0, 40)}-${skuSuffixRef.current}`;
  };

  const generateBarcode = (productName) => {
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      barcodeRef.current = null; // Reiniciar si no hay nombre
      return '';
    }

    if (!barcodeRef.current) {
      // Generar un código numérico de 13 dígitos basado en el tiempo
      barcodeRef.current = Date.now().toString().slice(0, 13);
    }
    return barcodeRef.current;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const field = name || e.target.id;
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectChange = (e) => {
    const selectedOption = e.detail.selectedOption;
    setProductData(prev => ({
      ...prev,
      IDUNIDADMEDIDA: selectedOption.dataset.value
    }));
    if (errors.IDUNIDADMEDIDA) {
      setErrors(prev => ({ ...prev, IDUNIDADMEDIDA: null }));
    }
  };
  // Efecto para autogenerar el SKUID cuando PRODUCTNAME cambia
  useEffect(() => {
    setProductData(prev => ({
      ...prev,
      SKUID: generateSku(prev.PRODUCTNAME),
      BARCODE: generateBarcode(prev.PRODUCTNAME)
    }));
  }, [productData.PRODUCTNAME]);

  // Efecto para cargar las categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await addProductApi.getAllCategories();
        setAllCategories(categories);
      } catch (error) {
        console.error("Error al cargar categorías", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (event) => {
    const selectedItems = event.detail.items;
    const selectedCategoryIds = selectedItems.map(item => item.dataset.catid);
    setProductData(prev => ({
      ...prev,
      CATEGORIAS: selectedCategoryIds
    }));
  };

  const getCategoryNameById = (catId) => {
    const category = allCategories.find(cat => cat.CATID === catId);
    return category ? category.Nombre : catId;
  };

  return (
    <Card style={{ width: '100%', marginTop: '20px' }}
      header={
        <CardHeader
          titleText="Paso 1: Información del Producto Padre"
          subtitleText="Complete los datos básicos del producto"
        />
      }
    >
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Nombre del Producto */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Nombre del Producto</Label>
            <Input
              id="PRODUCTNAME"
              value={productData.PRODUCTNAME || ''}
              onInput={(e) => handleInputChange(e)}
              placeholder="Ej: Taladro Inalámbrico 20V"
              valueState={errors.PRODUCTNAME ? 'Error' : 'None'}
              style={{ width: '100%' }}
            />
          </div>

          {/* SKU ID */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>SKU ID (Autogenerado)</Label>
            <Input
              id="SKUID"
              value={productData.SKUID || ''}
              readOnly
              placeholder="Ej: LAPTOP-PRO-X15"
              valueState={errors.SKUID ? 'Error' : 'None'}
              style={{ width: '100%' }}
            />
          </div>

          {/* Marca */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Marca</Label>
            <Input
              id="MARCA"
              value={productData.MARCA || ''}
              onInput={(e) => handleInputChange(e)}
              placeholder="Ej: TechNova"
              valueState={errors.MARCA ? 'Error' : 'None'}
              style={{ width: '100%' }}
            />
          </div>

          {/* Descripción - ocupa 2 columnas */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Descripción</Label>
            <Input
              id="DESSKU"
              value={productData.DESSKU || ''}
              onInput={(e) => handleInputChange(e)}
              placeholder="Descripción completa del producto"
              valueState={errors.DESSKU ? 'Error' : 'None'}
              style={{ width: '100%' }}
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Unidad de Medida</Label>
            <Select
              valueState={errors.IDUNIDADMEDIDA ? 'Error' : 'None'}
              style={{ width: '100%' }}
              onChange={handleSelectChange}
            >
              <Option selected={!productData.IDUNIDADMEDIDA} disabled>Seleccione una unidad</Option>
              <Option data-value="PZA" selected={productData.IDUNIDADMEDIDA === 'PZA'}>PZA - Pieza</Option>
              <Option data-value="KG" selected={productData.IDUNIDADMEDIDA === 'KG'}>KG - Kilogramo</Option>
              <Option data-value="G" selected={productData.IDUNIDADMEDIDA === 'G'}>G - Gramo</Option>
              <Option data-value="L" selected={productData.IDUNIDADMEDIDA === 'L'}>L - Litro</Option>
              <Option data-value="ML" selected={productData.IDUNIDADMEDIDA === 'ML'}>ML - Mililitro</Option>
              <Option data-value="M" selected={productData.IDUNIDADMEDIDA === 'M'}>M - Metro</Option>
              <Option data-value="M2" selected={productData.IDUNIDADMEDIDA === 'M2'}>M2 - Metro Cuadrado</Option>
              <Option data-value="CM" selected={productData.IDUNIDADMEDIDA === 'CM'}>CM - Centímetro</Option>
              <Option data-value="CJ" selected={productData.IDUNIDADMEDIDA === 'CJ'}>CJ - Caja</Option>
              <Option data-value="KIT" selected={productData.IDUNIDADMEDIDA === 'KIT'}>KIT - Kit</Option>
              <Option data-value="JGO" selected={productData.IDUNIDADMEDIDA === 'JGO'}>JGO - Juego</Option>
              <Option data-value="PAR" selected={productData.IDUNIDADMEDIDA === 'PAR'}>PAR - Par</Option>
              <Option data-value="ROLLO" selected={productData.IDUNIDADMEDIDA === 'ROLLO'}>ROLLO - Rollo</Option>
              <Option data-value="GAL" selected={productData.IDUNIDADMEDIDA === 'GAL'}>GAL - Galón</Option>
            </Select>
          </div>

          {/* Código de Barras */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Código de Barras (Autogenerado)</Label>
            <Input
              id="BARCODE"
              value={productData.BARCODE || ''}
              readOnly
              placeholder="Ej: 7501234567890"
              style={{ width: '100%' }}
            />
          </div>

          {/* Información Adicional */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Información Adicional (Opcional)</Label>
            <Input
              id="INFOAD"
              value={productData.INFOAD || ''}
              onInput={(e) => handleInputChange(e)}
              placeholder="Información extra sobre el producto"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Categorías */}
        <div style={{ marginTop: '2rem' }}>
          <Label>Categorías</Label>
          <MultiComboBox
            style={{ width: '100%', marginTop: '0.5rem' }}
            placeholder={loadingCategories ? "Cargando categorías..." : "Seleccione categorías"}
            disabled={loadingCategories}
            // El componente MultiComboBox ya incluye un buscador/filtro por defecto.
            onSelectionChange={handleCategoryChange}
          >
            {allCategories.map((cat) => (
              <MultiComboBoxItem key={cat.CATID} text={cat.Nombre} data-catid={cat.CATID} />
            ))}
          </MultiComboBox>

          <FlexBox wrap="Wrap" style={{ gap: '0.5rem' }}>
            {productData.CATEGORIAS?.length > 0 ? (
              productData.CATEGORIAS.map((catId, index) => (
                <Tag
                  key={index}
                  colorScheme="8"
                >
                  {getCategoryNameById(catId)}
                </Tag>
              ))
            ) : (
              <Text style={{ color: '#6a6d70', fontStyle: 'italic' }}>
                No hay categorías agregadas
              </Text>
            )}
          </FlexBox>
        </div>

        {Object.keys(errors).length > 0 && (
          <MessageStrip
            design="Error"
            hideCloseButton
            style={{ marginTop: '1rem' }}
          >
            Por favor complete todos los campos requeridos
          </MessageStrip>
        )}
      </div>
    </Card>
  );
};

export default ComponenteUno;