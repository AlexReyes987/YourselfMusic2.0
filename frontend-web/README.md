# Frontend Web - YourSelf Music (Cliente)

Portal web de autoservicio para músicos y bandas que desean reservar salas de ensayo en **YourSelf Music** (Durango, Dgo.).

## Tecnologías

- **React 18**
- **Vite**
- **TypeScript**
- **TailwindCSS**
- **Lucide Icons**
- **React Router 7**

## Estructura de Carpetas

```
frontend-web/
├── public/                 # Recursos estáticos
├── src/
│   ├── assets/             # Imágenes y multimedia
│   ├── components/         # Componentes reutilizables
│   │   ├── auth/           # Modales de Login y Registro
│   │   ├── booking/        # Tarjeta de sala, selector de bloques horarios, resumen de reserva
│   │   └── common/         # Navbar, Footer, Modales genéricos, botones
│   ├── context/            # Estados globales (AuthContext, BookingContext)
│   ├── hooks/              # Custom React Hooks
│   ├── pages/              # Vistas completas de la aplicación (Home, Booking, Payment, Confirmation)
│   ├── services/           # Clientes HTTP (Axios) para la API del backend
│   ├── types/              # Definición de tipos de salas, horarios y reservas
│   ├── utils/              # Funciones auxiliares y formateadores de moneda/hora
│   ├── App.tsx             # Rutas principales de la aplicación
│   ├── index.css           # Directivas Tailwind y estilos base
│   └── main.tsx            # Punto de montaje React
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Funcionalidades del Módulo

- **Exploración de Salas:** Información técnica y equipamiento de las Salas 1, 2, 3 y 4.
- **Selector de Disponibilidad:** Selección de fecha y bloques horarios cerrados sin solapamientos.
- **Flujo de Pago:** Pasarela de pago o registro de transferencia con comprobante.
- **Confirmación Inmediata:** Resumen de la reserva con código de seguimiento.

