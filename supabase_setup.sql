-- ==============================================================================
-- SCRIPT DE AJUSTE Y DATOS SEMILLA PARA SUPABASE
-- Proyecto: YourSelf Music 2.0 (Durango, Dgo.)
-- Mapeo 100% fiel al esquema relacional existente con tipos INT4 / INTEGER
-- ==============================================================================

-- 1. TABLA: roles
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR NOT NULL UNIQUE
);

-- 2. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(role_id) ON DELETE SET NULL,
    nombre VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    telefono VARCHAR
);

-- 3. TABLA: salas (4 salas físicas del estudio)
CREATE TABLE IF NOT EXISTS salas (
    sala_id INTEGER PRIMARY KEY CHECK (sala_id BETWEEN 1 AND 4),
    nombre_sala VARCHAR NOT NULL,
    descripcion VARCHAR,
    precio_por_hora NUMERIC NOT NULL,
    capacidad INTEGER NOT NULL,
    estado VARCHAR NOT NULL DEFAULT 'active'
);

-- 4. TABLA: horarios_disponibles
CREATE TABLE IF NOT EXISTS horarios_disponibles (
    horario_id SERIAL PRIMARY KEY,
    sala_id INTEGER NOT NULL REFERENCES salas(sala_id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL
);

-- 5. TABLA: reservaciones (ID int4 y usuario_id int4)
CREATE TABLE IF NOT EXISTS reservaciones (
    reservacion_id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE RESTRICT,
    sala_id INTEGER NOT NULL REFERENCES salas(sala_id) ON DELETE RESTRICT,
    fecha_reservacion DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    monto_total NUMERIC NOT NULL,
    estado_reservacion VARCHAR NOT NULL DEFAULT 'pending',
    CONSTRAINT check_rango_horas CHECK (hora_fin > hora_inicio)
);

-- 6. TABLA: pagos (ID int4 y reservacion_id int4)
CREATE TABLE IF NOT EXISTS pagos (
    pago_id SERIAL PRIMARY KEY,
    reservacion_id INTEGER NOT NULL REFERENCES reservaciones(reservacion_id) ON DELETE CASCADE,
    monto NUMERIC NOT NULL,
    concepto_pago VARCHAR,
    metodo_pago VARCHAR NOT NULL,
    transaccion_id VARCHAR,
    fecha_pago TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA: cancelaciones (ID int4 y reservacion_id int4)
CREATE TABLE IF NOT EXISTS cancelaciones (
    cancelacion_id SERIAL PRIMARY KEY,
    reservacion_id INTEGER NOT NULL REFERENCES reservaciones(reservacion_id) ON DELETE CASCADE,
    fecha_cancelacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    tarifa_multa NUMERIC DEFAULT 0,
    es_mismo_dia BOOLEAN DEFAULT FALSE,
    monto_reembolsado NUMERIC DEFAULT 0
);

-- 8. TABLA: auditoria (ID int4 y usuario_id int4)
CREATE TABLE IF NOT EXISTS auditoria (
    auditoria_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    accion VARCHAR NOT NULL,
    tabla_afectada VARCHAR,
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO Y ANTI-SOLAPAMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_reservaciones_sala_fecha ON reservaciones(sala_id, fecha_reservacion, estado_reservacion);
CREATE INDEX IF NOT EXISTS idx_reservaciones_usuario ON reservaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_reservacion ON pagos(reservacion_id);
CREATE INDEX IF NOT EXISTS idx_horarios_sala ON horarios_disponibles(sala_id, dia_semana);

-- ==============================================================================
-- DATOS SEMILLA (SEEDS) COMPATIBLES CON INT4
-- Si ya existen las tablas, esto asegura que tengan los datos mínimos requeridos
-- ==============================================================================

-- 1. Roles: 1=admin, 2=client
INSERT INTO roles (role_id, nombre_rol) VALUES
    (1, 'admin'),
    (2, 'client')
ON CONFLICT (role_id) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol;

-- 2. Usuarios Base: usuario_id 1 (Admin) y usuario_id 2 (Cliente General)
INSERT INTO usuarios (usuario_id, role_id, nombre, email, password_hash, telefono) VALUES
    (1, 1, 'Administrador Yourself Music', 'admin@yourselfmusic.com', '$2a$10$wN1FvMvK8FhP0Wv6Sg6xquhZc5yWqJ7h1e7N5wN1FvMvK8FhP0Wv6', '618 123 4567'),
    (2, 2, 'Cliente General Web', 'cliente@web.com', '$2a$10$wN1FvMvK8FhP0Wv6Sg6xquhZc5yWqJ7h1e7N5wN1FvMvK8FhP0Wv6', '618 000 0000')
ON CONFLICT (usuario_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email;

-- Ajustar la secuencia de usuarios si se usa SERIAL
SELECT setval('usuarios_usuario_id_seq', (SELECT GREATEST(MAX(usuario_id), 2) FROM usuarios));

-- 3. Las 4 Salas Físicas de Ensayo
INSERT INTO salas (sala_id, nombre_sala, descripcion, precio_por_hora, capacidad, estado) VALUES
    (1, 'Sala 1 - Master Stage', 'Batería Pearl Masters, Amplificadores Marshall JCM800 y Fender Twin Reverb, PA Yamaha 2000W.', 250.00, 8, 'active'),
    (2, 'Sala 2 - Rocker Studio', 'Batería Tama Superstar, Amplis Vox AC30 y Ampeg Bass, Microfonía Shure SM58.', 200.00, 6, 'active'),
    (3, 'Sala 3 - Acoustic & Jazz', 'Piano acústico vertical Yamaha, Batería Gretsch Catalina Jazz, Monitoreo de precisión.', 220.00, 5, 'active'),
    (4, 'Sala 4 - Indie Rehearsal', 'Batería Mapex, Amplis Orange y Fender Rumble Bass, ideal para ensambles compactos.', 180.00, 4, 'active')
ON CONFLICT (sala_id) DO UPDATE SET
    nombre_sala = EXCLUDED.nombre_sala,
    descripcion = EXCLUDED.descripcion,
    precio_por_hora = EXCLUDED.precio_por_hora,
    capacidad = EXCLUDED.capacidad,
    estado = EXCLUDED.estado;

-- 4. Horarios Operativos (10:00 a 22:00 todos los días de la semana para salas 1..4)
INSERT INTO horarios_disponibles (sala_id, dia_semana, hora_apertura, hora_cierre)
SELECT s.sala_id, d.dia, '10:00:00'::TIME, '22:00:00'::TIME
FROM salas s
CROSS JOIN (SELECT generate_series(0, 6) AS dia) d
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_disponibles h 
    WHERE h.sala_id = s.sala_id AND h.dia_semana = d.dia
);

-- ==============================================================================
-- POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
-- Permite que tu backend y frontend lean y escriban sin ser bloqueados por RLS
-- ==============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancelaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Salas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Salas') THEN
        CREATE POLICY "Public Read Salas" ON salas FOR SELECT USING (true);
    END IF;

    -- Horarios Disponibles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Horarios') THEN
        CREATE POLICY "Public Read Horarios" ON horarios_disponibles FOR SELECT USING (true);
    END IF;

    -- Reservaciones
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Reservaciones') THEN
        CREATE POLICY "Public Read Reservaciones" ON reservaciones FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Reservaciones') THEN
        CREATE POLICY "Public Insert Reservaciones" ON reservaciones FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update Reservaciones') THEN
        CREATE POLICY "Public Update Reservaciones" ON reservaciones FOR UPDATE USING (true);
    END IF;

    -- Pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Pagos') THEN
        CREATE POLICY "Public Read Pagos" ON pagos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Pagos') THEN
        CREATE POLICY "Public Insert Pagos" ON pagos FOR INSERT WITH CHECK (true);
    END IF;

    -- Usuarios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Usuarios') THEN
        CREATE POLICY "Public Read Usuarios" ON usuarios FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Usuarios') THEN
        CREATE POLICY "Public Insert Usuarios" ON usuarios FOR INSERT WITH CHECK (true);
    END IF;

    -- Cancelaciones y Auditoria
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public All Cancelaciones') THEN
        CREATE POLICY "Public All Cancelaciones" ON cancelaciones FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public All Auditoria') THEN
        CREATE POLICY "Public All Auditoria" ON auditoria FOR ALL USING (true);
    END IF;
END $$;
