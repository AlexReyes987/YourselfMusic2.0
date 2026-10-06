# Contexto del Proyecto: YourSelf Music - Sistema de Reservaciones

## 1. Visión General del Proyecto

- **Empresa:** YourSelf Music (Estudio de ensayo y taller de instrumentos en Durango, Dgo.).
- **Objetivo del Software:** Automatizar la gestión de reservaciones para 4 salas de ensayo musicales mediante una plataforma web para clientes y un panel administrativo multiplataforma (móvil/escritorio).
- **Delimitación:** Este sistema es EXCLUSIVAMENTE para la reserva de salas de ensayo. El taller de reparación de instrumentos QUEDA FUERA del alcance del software.

---

## 2. Roles de Usuario y Módulos

### A. Cliente (Plataforma Web Frontend)

- **Autogestión:** Consulta la disponibilidad en tiempo real de las 4 salas de ensayo.
- **Reserva:** Selecciona fecha, sala (1, 2, 3 o 4) y bloques de tiempo (ej. 1, 2 o más horas).
- **Pago:** Realiza el pago en línea mediante integración con pasarela (Tarjeta de crédito/débito o registro de Transferencia bancaria).
- **Confirmación:** Recibe la confirmación directa de su cita agendada.

### B. Administrador (Aplicación Multiplataforma Backend)

- **Control CRUD:** Operaciones de Crear, Leer, Actualizar y Eliminar sobre las reservaciones, catálogo de salas, horarios operativos y lista de usuarios.
- **Gestión de Cancelaciones:** Capacidad de eliminar o reprogramar reservaciones a petición directa del cliente.
- **Visualización:** Vista de calendario/tablas con el estado de ocupación de las salas por día y rango de horas.

---

## 3. Reglas de Negocio Críticas (Business Logic)

1. **Prevención de Solapamiento:** Bajo ninguna circunstancia dos reservaciones pueden ocupar la misma sala en el mismo rango de fecha y hora (Validación estricta en Backend/Base de datos).
2. **Capacidad:** El catálogo de salas está limitado estrictamente a **4 salas físicas** con configuraciones de equipamiento específicas.
3. **Bloques de Reserva:** Las reservas se manejan en intervalos por horas cerradas.
4. **Estado de Pago:** Una reserva solo se marca como "Confirmada" si la pasarela valida el pago o si el administrador aprueba la transferencia.

---

## 4. Arquitectura y Stack Tecnológico

- **Frontend Web (Cliente):** React / Next.js / Vue.js con TypeScript y CSS/Tailwind.
- **Backend (API REST):** Node.js (Express / NestJS) o Python (FastAPI) con TypeScript/Python.
- **App Administración (Multiplataforma):** Flutter (Dart) o React Native / Electron.
- **Base de Datos:** PostgreSQL o MySQL (Modelo relacional estricto con propiedades ACID).

---

## 5. Esquema Preliminar de Base de Datos (Entidades)

- `users`: (id, name, email, phone, role [client/admin], password_hash)
- `rooms`: (id, name [Sala 1..4], equipment_description, hourly_rate, status)
- `reservations`: (id, user_id, room_id, date, start_time, end_time, total_price, status [pending/confirmed/cancelled])
- `payments`: (id, reservation_id, payment_method [card/transfer], transaction_id, status, created_at)

---

## 6. Instrucciones para la Generación de Código

- Priorizar código limpio, modular y tipado (TypeScript/Dart).
- Aplicar manejo explícito de errores e instrucciones claras en controladores REST.
- Mantener la separación de responsabilidades (Frontend desacoplado del Backend mediante API REST).
