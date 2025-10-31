import React, { useState } from 'react';
import { Card, Input, Button, Title, CardHeader, Icon } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/person-placeholder.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/product.js';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        // Prevenimos el comportamiento por defecto si es un evento de formulario
        e.preventDefault();

        if (username.trim() !== '') {
            sessionStorage.setItem('LoggedUser', username);
            window.location.href = '/';
        }
    };

    const containerStyle = {
        minHeight: '100vh',
        backgroundColor: 'var(--sapShell_Background)', 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
    };

    const cardStyle = {
        width: '90%',
        maxWidth: '450px', // Hacemos la tarjeta un poco más ancha para prominencia
        // Añadimos una sombra sutil para darle elevación
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Sombra ligeramente más marcada
        borderRadius: 'var(--sapCard_BorderRadius)',
    }; 

    const formStyle = {
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    };

    const titleStyle = {
        textAlign: 'center', 
        marginBottom: '1rem',
        color: 'var(--sapTextColor)',
        fontWeight: 'normal',
    };

    return (
        <div style={containerStyle}>
            <Card
                style={cardStyle}
                header={
                    <CardHeader 
                        avatar={
                            <Icon 
                                name="product" 
                                style={{ 
                                    fontSize: '2rem',
                                    color: 'var(--sapBrandColor)',
                                    marginRight: '0.5rem'
                                }} 
                            />
                        }
                        titleText="Product Management Suite"
                        subtitleText="Acceso al Sistema"
                        style={{ 
                            borderBottom: '1px solid var(--sapList_BorderColor)', 
                            padding: '1.25rem 2rem',
                            backgroundColor: 'var(--sapObjectHeaderBackground)' // Fondo ligero para el encabezado
                        }}
                    />
                }
            > 
                <form style={formStyle} onSubmit={handleLogin}> 
                    <Title level="H3" style={titleStyle}>
                        Bienvenido
                    </Title>
                    
                    <Input
                        icon={<Icon name="person-placeholder" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />}
                        value={username}
                        onInput={(e) => setUsername(e.target.value)}
                        placeholder="Nombre de usuario (ej: admin)"
                        required
                        style={{ width: '100%' }}
                    />

                    <Input
                        icon={<Icon name="locked" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />}
                        value={password}
                        onInput={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        type="Password"
                        required
                        style={{ width: '100%' }}
                    />

                    <Button 
                        design="Emphasized" 
                        type="Submit" 
                        style={{ 
                            width: '100%',
                            marginTop: '1rem'
                        }}
                    >
                        Iniciar Sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default LoginPage;
