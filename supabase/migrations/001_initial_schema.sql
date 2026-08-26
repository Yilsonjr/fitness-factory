-- ============================================================
-- GYM MANAGEMENT SYSTEM - Schema Inicial
-- Preparado para multi-tenant (gimnasio_id) sin construir SaaS
-- ============================================================

-- 1. GIMNASIO (base para futuro multi-tenant)
CREATE TABLE gimnasios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  rnc VARCHAR(20),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USUARIOS DEL SISTEMA (admin, recepcionista)
CREATE TYPE rol_usuario AS ENUM ('admin', 'recepcionista');

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'recepcionista',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CLIENTES (miembros del gimnasio)
CREATE TYPE sexo_tipo AS ENUM ('M', 'F');

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  cedula VARCHAR(20),
  nombre VARCHAR(200) NOT NULL,
  apellido VARCHAR(200) NOT NULL,
  sexo sexo_tipo,
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  email VARCHAR(200),
  direccion TEXT,
  foto_url TEXT,
  huella_template BYTEA, -- template biométrico del lector
  contacto_emergencia VARCHAR(200),
  telefono_emergencia VARCHAR(20),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_clientes_cedula_gimnasio 
  ON clientes(gimnasio_id, cedula) WHERE cedula IS NOT NULL;

-- 4. PLANES DE MEMBRESÍA (los tipos disponibles)
CREATE TYPE periodo_plan AS ENUM ('diario', 'semanal', 'quincenal', 'mensual');

CREATE TABLE planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  nombre VARCHAR(200) NOT NULL,
  periodo periodo_plan NOT NULL,
  duracion_dias INT NOT NULL, -- 1, 7, 15, 30
  precio DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MEMBRESÍAS (asignación de plan a cliente)
CREATE TYPE estado_membresia AS ENUM ('activa', 'vencida', 'congelada', 'cancelada');

CREATE TABLE membresias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  plan_id UUID NOT NULL REFERENCES planes(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado estado_membresia DEFAULT 'activa',
  precio_pagado DECIMAL(10,2) NOT NULL, -- snapshot del precio al momento
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membresias_cliente ON membresias(cliente_id);
CREATE INDEX idx_membresias_estado ON membresias(gimnasio_id, estado);
CREATE INDEX idx_membresias_vencimiento ON membresias(fecha_fin) WHERE estado = 'activa';

-- 6. TURNOS DE CAJA (apertura/cierre)
CREATE TYPE estado_turno AS ENUM ('abierto', 'cerrado');

CREATE TABLE turnos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  monto_apertura DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_cierre DECIMAL(10,2),
  estado estado_turno DEFAULT 'abierto',
  fecha_apertura TIMESTAMPTZ DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  notas_cierre TEXT
);

CREATE INDEX idx_turnos_abiertos ON turnos_caja(gimnasio_id, estado) 
  WHERE estado = 'abierto';

-- 7. PAGOS
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia');

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  membresia_id UUID REFERENCES membresias(id),
  turno_id UUID REFERENCES turnos_caja(id),
  monto DECIMAL(10,2) NOT NULL,
  metodo metodo_pago NOT NULL DEFAULT 'efectivo',
  concepto VARCHAR(300) NOT NULL, -- "Membresía mensual - Julio 2026"
  recibido_por UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT now(),
  anulado BOOLEAN DEFAULT false,
  motivo_anulacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_turno ON pagos(turno_id);
CREATE INDEX idx_pagos_fecha ON pagos(gimnasio_id, fecha);

-- 8. GASTOS (salidas de caja)
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  turno_id UUID REFERENCES turnos_caja(id),
  monto DECIMAL(10,2) NOT NULL,
  concepto VARCHAR(300) NOT NULL,
  registrado_por UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ASISTENCIAS (registro de acceso)
CREATE TYPE metodo_acceso AS ENUM ('huella', 'manual', 'tarjeta');

CREATE TABLE asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  metodo metodo_acceso NOT NULL DEFAULT 'manual',
  fecha_entrada TIMESTAMPTZ DEFAULT now(),
  autorizado BOOLEAN DEFAULT true, -- false si membresía vencida pero se registró intento
  notas TEXT
);

CREATE INDEX idx_asistencias_fecha ON asistencias(gimnasio_id, fecha_entrada);
CREATE INDEX idx_asistencias_cliente ON asistencias(cliente_id);

-- 10. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE config_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID UNIQUE NOT NULL REFERENCES gimnasios(id),
  nombre_comercial VARCHAR(200),
  moneda VARCHAR(5) DEFAULT 'DOP',
  dias_gracia INT DEFAULT 0, -- días extra después del vencimiento
  horario_apertura TIME,
  horario_cierre TIME,
  impresora_config JSONB, -- configuración de impresora térmica
  tema_color VARCHAR(7) DEFAULT '#2563EB',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Actualizar membresías vencidas automáticamente
CREATE OR REPLACE FUNCTION actualizar_membresias_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE membresias 
  SET estado = 'vencida', updated_at = now()
  WHERE estado = 'activa' 
    AND fecha_fin < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si cliente tiene membresía activa (para control de acceso)
CREATE OR REPLACE FUNCTION verificar_acceso(p_cliente_id UUID, p_gimnasio_id UUID)
RETURNS TABLE(permitido BOOLEAN, mensaje TEXT, membresia_id UUID) AS $$
DECLARE
  v_membresia RECORD;
  v_dias_gracia INT;
BEGIN
  SELECT dias_gracia INTO v_dias_gracia 
  FROM config_sistema WHERE gimnasio_id = p_gimnasio_id;
  
  v_dias_gracia := COALESCE(v_dias_gracia, 0);

  SELECT m.id, m.fecha_fin, m.estado INTO v_membresia
  FROM membresias m
  WHERE m.cliente_id = p_cliente_id 
    AND m.gimnasio_id = p_gimnasio_id
    AND m.estado IN ('activa')
  ORDER BY m.fecha_fin DESC
  LIMIT 1;

  IF v_membresia.id IS NULL THEN
    RETURN QUERY SELECT false, 'Sin membresía activa'::TEXT, NULL::UUID;
  ELSIF v_membresia.fecha_fin < (CURRENT_DATE - v_dias_gracia) THEN
    RETURN QUERY SELECT false, 'Membresía vencida'::TEXT, v_membresia.id;
  ELSE
    RETURN QUERY SELECT true, 'Acceso permitido'::TEXT, v_membresia.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_gimnasios_updated BEFORE UPDATE ON gimnasios FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER tr_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER tr_clientes_updated BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER tr_planes_updated BEFORE UPDATE ON planes FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER tr_membresias_updated BEFORE UPDATE ON membresias FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER tr_config_updated BEFORE UPDATE ON config_sistema FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (preparado para multi-tenant)
-- ============================================================

ALTER TABLE gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_sistema ENABLE ROW LEVEL SECURITY;

-- Política base: usuario solo ve data de su gimnasio
CREATE POLICY gimnasio_isolation ON usuarios
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON clientes
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON planes
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON membresias
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON turnos_caja
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON pagos
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON gastos
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON asistencias
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY gimnasio_isolation ON config_sistema
  FOR ALL USING (
    gimnasio_id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );

-- Admin ve su gimnasio en tabla gimnasios
CREATE POLICY gimnasio_own ON gimnasios
  FOR ALL USING (
    id = (
      SELECT u.gimnasio_id FROM usuarios u 
      WHERE u.auth_id = auth.uid()
    )
  );
