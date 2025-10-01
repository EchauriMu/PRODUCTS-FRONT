import React from "react";
import { Typography, Divider, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Header = ({ isMobile, onMenuClick }) => {
  return (
    <>
      <header
        style={{
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #f0f0f0",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuClick}
              style={{ fontSize: 20 }}
            />
          )}
          <div>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              Catálogo Maestro
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Sistema de gestión de productos y configuraciones
            </Text>
          </div>
        </div>
      </header>
      <Divider style={{ margin: 0 }} />
    </>
  );
};

export default Header;
