# Admin App - YourSelf Music (Panel Administrativo)

Aplicación de escritorio multiplataforma (Windows / macOS / Linux) construida con **Electron**, **React**, **TypeScript** y **TailwindCSS**.

## Estructura de Carpetas

```
admin-app/
├── electron/               # Proceso principal de Electron y contextBridge
│   ├── main.ts             # Creación y ciclo de vida de la ventana de escritorio
│   ├── preload.ts          # Puente seguro IPC entre Electron y React
│   └── tsconfig.json       # Configuración TypeScript del proceso principal
├── src/                    # Proceso de renderizado (React UI)
│   ├── assets/             # Recursos visuales e íconos
│   ├── components/         # Componentes modulares
│   │   ├── calendar/       # Calendario y matriz horaria de ocupación
│   │   ├── common/         # Sidebar, Header y tablas de datos
│   │   ├── reservations/   # Modales de reprogramación y detalle
│   │   └── rooms/          # Edición y estado de las 4 salas
│   ├── pages/              # Vistas administrativas (Dashboard, Calendario, Reservaciones, Pagos)
│   ├── services/           # Clientes HTTP (Axios) para la API REST del backend
│   ├── types/              # Tipos compartidos
│   ├── App.tsx             # Enrutamiento del panel
│   ├── index.css           # Estilos Tailwind para tema oscuro
│   └── main.tsx            # Punto de entrada de React
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Capacidades Administrativas

- **Control CRUD:** Gestión integral sobre reservaciones, las 4 salas físicas, horarios y clientes.
- **Gestión de Cancelaciones y Reprogramación:** Cancelar o mover citas directamente.
- **Matriz de Ocupación Diaria/Semanal:** Visualización del estado de ocupación por sala (1..4) y bloque de horas.
- **Aprobación de Transferencias:** Validación y confirmación manual de depósitos bancarios.

