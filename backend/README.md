# Backend - YourSelf Music API REST

API construida con **Node.js**, **Express**, **TypeScript** y **PostgreSQL**.

## Estructura de Carpetas

```
backend/
├── src/
│   ├── config/             # Configuración de base de datos y variables de entorno
│   ├── controllers/        # Controladores HTTP (Auth, Rooms, Reservations, Payments)
│   ├── middlewares/        # Middlewares (Auth JWT, validaciones Zod, manejo global de errores)
│   ├── models/             # Esquemas y modelos de persistencia relacional
│   ├── routes/             # Enrutamiento modular Express
│   ├── services/           # Lógica de negocio (validación de solapamiento, precios, cupos)
│   ├── types/              # Definiciones e interfaces de TypeScript
│   ├── utils/              # Funciones auxiliares y formateadores
│   ├── app.ts              # Configuración de la aplicación Express
│   └── server.ts           # Inicialización y arranque del servidor HTTP
├── .env.example            # Plantilla de variables de entorno
├── package.json            # Scripts y dependencias
└── tsconfig.json           # Configuración de compilador TypeScript
```

## Reglas de Negocio Implementadas en Backend

1. **Prevención estricta de solapamiento:** Verificación en base de datos de reservas concurrentes por `room_id`, `date`, `start_time` y `end_time`.
2. **Capacidad cerrada a 4 salas:** Validación de catálogo con 4 salas físicas predeterminadas.
3. **Bloques por horas cerradas:** Intervalos de reserva de 1 hora o múltiplos completos.
4. **Estados de pago:** Control de estado `pending`, `confirmed`, `cancelled`.

