-- Inicialización de Esquema de Base de Datos para YourSelf Music 2.0
-- Compatible con PostgreSQL

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Salas (rooms) - Estrictamente 4 salas físicas
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 4),
    name VARCHAR(100) NOT NULL,
    equipment_description TEXT NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance'))
);

-- 3. Tabla de Reservaciones (reservations)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_start_before_end CHECK (end_time > start_time)
);

-- Índices para optimizar búsquedas y prevención de solapamiento
CREATE INDEX IF NOT EXISTS idx_reservations_room_date ON reservations(room_id, date, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);

-- 4. Tabla de Pagos (payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'transfer')),
    transaction_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);

-- Seed: Catálogo predeterminado de las 4 salas físicas
INSERT INTO rooms (id, name, equipment_description, hourly_rate, status)
VALUES
    (1, 'Sala 1 - Master Stage', 'Batería Pearl Masters, Amplificadores Marshall JCM800 y Fender Twin Reverb, PA Yamaha 2000W.', 250.00, 'active'),
    (2, 'Sala 2 - Rocker Studio', 'Batería Tama Superstar, Amplis Vox AC30 y Ampeg Bass, Microfonía Shure SM58.', 200.00, 'active'),
    (3, 'Sala 3 - Acoustic & Jazz', 'Piano acústico vertical Yamaha, Batería Gretsch Catalina Jazz, Monitoreo de precisión.', 220.00, 'active'),
    (4, 'Sala 4 - Indie Rehearsal', 'Batería Mapex, Amplis Orange y Fender Rumble Bass, ideal para ensambles compactos.', 180.00, 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    equipment_description = EXCLUDED.equipment_description,
    hourly_rate = EXCLUDED.hourly_rate,
    status = EXCLUDED.status;

