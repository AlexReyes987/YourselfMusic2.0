# YourSelf Music 2.0 - Sistema de Reservaciones

Sistema integral para la automatización de reservaciones de 4 salas de ensayo musicales de **YourSelf Music** (Durango, Dgo.).

## Arquitectura del Proyecto

El proyecto está organizado como un monorepo modular desacoplado en tres aplicaciones principales:

```
YourSelf Music 2.0/
├── backend/            # API REST en Node.js + Express con TypeScript y PostgreSQL
├── frontend-web/       # Portal cliente en React (Vite) + TailwindCSS con TypeScript
├── admin-app/          # Panel administrativo de escritorio en React + Electron + TailwindCSS
├── PROJECT_CONTEXT.md  # Especificación de negocio y reglas de dominio
├── package.json        # Orquestador de monorepo (npm workspaces)
└── README.md
```

## Estructura de Módulos

- **`backend/`**: Servidor API REST con validación estricta de solapamiento de horarios, gestión de las 4 salas, control de estados de pago (tarjeta/transferencia) y autenticación JWT.
- **`frontend-web/`**: Interfaz de cara al músico/cliente para consultar disponibilidad en tiempo real, agendar bloques por hora y pagar en línea.
- **`admin-app/`**: Aplicación de escritorio multiplataforma (Electron) para administradores del estudio, con vista de calendario de ocupación, gestión CRUD y validación de transferencias.

## Comandos Globales

Desde la raíz del proyecto se pueden ejecutar las tareas de cada workspace:

```bash
# Instalar dependencias de todos los workspaces
npm install

# Modo desarrollo
npm run dev:backend   # Inicia el backend en modo desarrollo
npm run dev:web       # Inicia la web del cliente en Vite
npm run dev:admin     # Inicia la app administrativa en Electron

# Compilar todos los proyectos
npm run build
```

