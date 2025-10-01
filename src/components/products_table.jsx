import React, { useState } from "react";
import { Table, Button, Input, Space, Tag, Typography, Badge } from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ProductosTable = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Datos ejemplo con solo los campos de tu modelo
  const productos = [
    {
      key: 0,
      _id: "68d898c972a248a745b6d8b8",
      SKUID: "SKU12345",
      DESSKU: "Cámara Digital",
      IDUNIDADMEDIDA: "PZA",
      BARCODE: "7501234567890",
      INFOAD: "Resolución 24MP, pantalla táctil",
      REGUSER: "admin",
      REGDATE: "2025-01-15T12:00:00.000Z",
      MODUSER: "editor",
      MODDATE: "2025-01-22T15:30:00.000Z",
      ACTIVED: true,
    },
    {
      key: 1,
      _id: "68d898c972a248a745b6d8b9",
      SKUID: "SKU54321",
      DESSKU: "Audífonos Inalámbricos",
      IDUNIDADMEDIDA: "PZA",
      BARCODE: "7509876543210",
      INFOAD: "Bluetooth 5.2, cancelación de ruido",
      REGUSER: "admin",
      REGDATE: "2025-01-18T10:00:00.000Z",
      MODUSER: null,
      MODDATE: "2025-01-20T11:15:00.000Z",
      ACTIVED: true,
    },
    {
      key: 2,
      _id: "68d898c972a248a745b6d8c0",
      SKUID: "SKU67890",
      DESSKU: "Smartwatch Pro",
      IDUNIDADMEDIDA: "PZA",
      BARCODE: "7501112223334",
      INFOAD: "Pantalla AMOLED, resistencia al agua",
      REGUSER: "user01",
      REGDATE: "2025-02-02T09:45:00.000Z",
      MODUSER: "admin",
      MODDATE: "2025-02-10T13:00:00.000Z",
      ACTIVED: false,
    },
  ];

  const columns = [
    {
      title: () => (
        <Space>
          SKU
          <DownOutlined style={{ fontSize: 10 }} />
        </Space>
      ),
      dataIndex: "SKUID",
      key: "SKUID",
    },
    {
      title: "Nombre",
      dataIndex: "DESSKU",
      key: "DESSKU",
    },
    {
      title: "Unidad",
      dataIndex: "IDUNIDADMEDIDA",
      key: "IDUNIDADMEDIDA",
    },
    {
      title: "Código de barras",
      dataIndex: "BARCODE",
      key: "BARCODE",
    },
    {
      title: "Información",
      dataIndex: "INFOAD",
      key: "INFOAD",
    },
    {
      title: "Registrado por",
      dataIndex: "REGUSER",
      key: "REGUSER",
    },
    {
      title: "Fecha registro",
      dataIndex: "REGDATE",
      key: "REGDATE",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("es-MX") : "-",
    },
    {
      title: "Modificado por",
      dataIndex: "MODUSER",
      key: "MODUSER",
      render: (user) => user || "-",
    },
    {
      title: "Fecha mod.",
      dataIndex: "MODDATE",
      key: "MODDATE",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("es-MX") : "-",
    },
   {
  title: "Estado",
  dataIndex: "ACTIVED",
  key: "ACTIVED",
  render: (actived) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* Puntito del Badge */}
      <Badge status={actived ? "success" : "default"} />
      
      {/* Texto separado */}
      <span
        style={{
          backgroundColor: actived ? "#ECFDF5" : "#F3F4F6",
          color: actived ? "#059669" : "#6B7280",
          padding: "2px 12px",
          borderRadius: "16px",
          fontWeight: 500,
          fontSize: 12,
          marginLeft: 8, // separación del puntito
          lineHeight: "20px",
          display: "inline-block",
        }}
      >
        {actived ? "Activo" : "Eliminado"}
      </span>
    </div>
  ),
}

  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
  };

  return (
    <div style={{ padding: "24px", backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: 12,
          padding: "24px",
          border: "1px solid #E5E7EB",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <Space size={8}>
              <Title level={4} style={{ margin: 0 }}>
                Productos
              </Title>
              <Tag color="purple" style={{ borderRadius: 12 }}>
                {productos.length} +
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Gestiona los productos
            </Text>
          </div>
          <Space>
            <Button icon={<UploadOutlined />}>Importar</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" }}
            >
              Añadir
            </Button>
          </Space>
        </div>

        {/* Search and Filters */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: "16px 0",
            borderTop: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <Input
            placeholder="Buscar"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Space>
            <Button icon={<FilterOutlined />}>Filtros</Button>
            {selectedRowKeys.length > 0 && (
              <>
                <Button>Editar</Button>
                <Button>Eliminar</Button>
              </>
            )}
          </Space>
        </div>

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={productos}
          pagination={{
            position: ["bottomCenter"],
            showSizeChanger: false,
            current: 1,
            total: productos.length,
            pageSize: 10,
          }}
        />
      </div>
    </div>
  );
};

export default ProductosTable;
