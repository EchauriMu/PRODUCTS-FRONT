import React, { useEffect, useState } from "react";
import {
  Dialog,
  Bar,
  Button,
  Title,
  Label,
  Text,
  FlexBox,
  FlexBoxDirection,
  Input,
  MessageStrip,
  BusyIndicator,
  MultiComboBox,
  MultiComboBoxItem,
  Tag
} from "@ui5/webcomponents-react";
import categoriasService from "../../api/categoriasService";

const CategoriaDetailModal = ({ category, open, onClose }) => {
  const isEdit = !!category?.CATID;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);

  const generateCATID = (nombre) =>
    !nombre ? "" : `CAT_${nombre.trim().toUpperCase().replace(/\s+/g, "_")}`;

  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      
      try {
        // Cargar categorías disponibles
        const response = await categoriasService.GetAllZTCategorias();
        // Extraer el array de categorías de la respuesta
        const todasLasCategorias = response?.data?.[0]?.dataRes || [];
        
        if (!Array.isArray(todasLasCategorias)) {
          setAvailableCategories([]);
          return;
        }

        // Encontrar las categorías que son padres (tienen hijos)
        const categoriasConHijos = new Set(
          todasLasCategorias
            .filter(cat => cat.PadreCATID) // Filtrar las que tienen padre
            .map(cat => cat.PadreCATID) // Obtener los IDs de los padres
        );

        // Filtrar las categorías que pueden ser padre:
        // 1. O bien ya son padres de otras categorías
        // 2. O bien no tienen padre (son categorías raíz)
        // 3. Y no son la categoría actual que estamos editando
        const categoriasDisponibles = todasLasCategorias.filter(cat => 
          // No mostrar la categoría actual si estamos en modo edición
          (!isEdit || cat.CATID !== category.CATID) &&
          // Mostrar solo si es una categoría raíz o ya es padre de otra categoría
          (!cat.PadreCATID || categoriasConHijos.has(cat.CATID))
        );
        
        setAvailableCategories(categoriasDisponibles);

        if (isEdit) {
          setFormData(category);
        } else {
          setFormData({
            CATID: "",
            Nombre: "",
            PadreCATID: "",
            ACTIVED: true,
          });
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setError('Error al cargar las categorías disponibles');
      }
    };

    loadData();
  }, [open, isEdit, category]);

  const handleChange = (key, value) => {
    setFormData((prev) => {
      const draft = { ...prev, [key]: value };
      if (key === "Nombre") draft.CATID = generateCATID(value);
      return draft;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        // 💡 FIX: Construir un payload solo con los campos que han cambiado.
        const cambios = {};
        Object.keys(formData).forEach(key => {
          // Comparamos el valor actual con el original.
          // Se normaliza `null` y `undefined` para la comparación.
          const originalValue = category[key] ?? null;
          const currentValue = formData[key] ?? null;

          if (originalValue !== currentValue) {
            cambios[key] = formData[key];
          }
        });

        // Si no hay cambios, no hacemos la llamada a la API.
        if (Object.keys(cambios).length === 0) {
          onClose(); // Cierra el modal si no hay nada que guardar.
          return;
        }
        // 💡 FIX: Usar el CATID original para buscar el documento a actualizar.
        await categoriasService.UpdateOneZTCategoria(category.CATID, cambios);
      } else {
        await categoriasService.AddOneZTCategoria(formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const next = !formData.ACTIVED;
      await categoriasService.UpdateOneZTCategoria(formData.CATID, {
        ACTIVED: next,
      });
      setFormData((p) => ({ ...p, ACTIVED: next }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm("¿Eliminar permanentemente esta categoría?")) return;
    setLoading(true);
    try {
      await categoriasService.DeleteHardZTCategoria(formData.CATID);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      style={{
        width: "540px",
        borderRadius: 12,
        overflow: "visible",
      }}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button design="Transparent" icon="decline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                design="Emphasized"
                icon="save"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <BusyIndicator active size="Small" /> : "Guardar"}
              </Button>
            </>
          }
        />
      }
    >
      {/* 🔹 Encabezado tipo SAP Fiori */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          padding: "0.5rem 0 1rem 0",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Title level="H4" style={{ fontWeight: "600", color: "#0a6ed1" }}>
          {isEdit ? "Detalle de Categoría" : "Nueva Categoría"}
        </Title>
      </div>

      {/* 🔹 Contenedor del formulario */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem",
          backgroundColor: "#f9fafb",
          borderRadius: "10px",
          marginTop: "1rem",
          marginBottom: "1rem",
        }}
      >
        {error && (
          <MessageStrip
            type="Negative"
            style={{ width: "92%", marginBottom: 12 }}
          >
            {error}
          </MessageStrip>
        )}

        {/* Campos */}
        <div style={{ width: "85%", marginBottom: 18 }}>
          <Label>Identificador (CATID)</Label>
          <Input
            value={formData.CATID || ""}
            disabled
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>

        {(
          <div style={{ width: "85%", marginBottom: 18 }}>
            <Label>Nombre de la Categoría</Label>
            <Input
              value={formData.Nombre || ""}
              onInput={(e) => handleChange("Nombre", e.target.value)}
              placeholder="Ej: Electrónica"
              style={{ width: "100%", marginTop: 6 }}
            />
          </div>
        )}

        <div style={{ width: "85%" }}>
          <Label>Categoría Padre</Label>
          <MultiComboBox
            value={formData.PadreCATID || ""}
            onSelectionChange={(e) => {
              const selectedItems = e.detail.items;
              // Tomamos solo el primer item ya que solo queremos una categoría padre
              const selectedCatId = selectedItems.length > 0 ? selectedItems[0].dataset.catid : "";
              handleChange("PadreCATID", selectedCatId);
            }}
            placeholder="Selecciona una categoría padre"
            style={{ width: "100%", marginTop: 6 }}
          >
            {availableCategories.map((cat) => (
              <MultiComboBoxItem
                key={cat.CATID}
                text={`${cat.Nombre} (${cat.CATID})`}
                data-catid={cat.CATID}
                selected={formData.PadreCATID === cat.CATID}
              />
            ))}
          </MultiComboBox>

          {formData.PadreCATID && (
            <FlexBox wrap="Wrap" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
              <Tag colorScheme="3">
                {availableCategories.find(cat => cat.CATID === formData.PadreCATID)?.Nombre || formData.PadreCATID}
              </Tag>
            </FlexBox>
          )}
        </div>

        {/* === Sección de Auditoría === */}
        {isEdit && (
          <div style={{ width: "85%", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #ddd" }}>
            <Title level="H6" style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem" }}>
              Información de Auditoría
            </Title>
            
            {/* Creado Por */}
            <div style={{ marginBottom: "1.5rem" }}>
              <Label style={{ fontSize: "0.75rem", color: "#666" }}>Creado Por</Label>
              <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "0.25rem", marginTop: "0.5rem" }}>
                <Text style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                  {formData.REGUSER || 'N/A'}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#999" }}>
                  {formatDate(formData.REGDATE)}
                </Text>
              </FlexBox>
            </div>

            {/* Modificado Por */}
            <div>
              <Label style={{ fontSize: "0.75rem", color: "#666" }}>Modificado Por</Label>
              <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "0.25rem", marginTop: "0.5rem" }}>
                <Text style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                  {formData.MODUSER || 'N/A'}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#999" }}>
                  {formatDate(formData.MODDATE)}
                </Text>
              </FlexBox>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default CategoriaDetailModal;
