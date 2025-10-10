--login, crear concepto, ingreso diario

create table tipousuarios(
	tipousuario_id serial primary key,
	nombre text,
	estado integer default 1
);

create table menus(

);

create table usuarios(
	usuario_id serial primary key,
	nombre varchar(60), 
	tipousuario_id integer,
	usuario varchar(60), 
	contrasena varchar(200),
	estado integer default 1
);


create table conceptos(
	concepto_id serial primary key,
	nombre varchar(100),
	tipoconconcepto integer,
	periodo integer,
	dias varchar(60),
	usuario_id integer,
	estado integer default 1
);

create table cuentas(
	cuenta_id serial primary key,
	fecha date,
	usuario_id integer
);

create table cuentas_detalles(
	cuenta_detalle_id serial primary key,
	cuenta_id integer,
	concepto_id integer,
	monto numeric(14,2) default 0.00
);


select * from conceptos

CREATE OR REPLACE FUNCTION validarConcepto(nombre_concepto VARCHAR,usuarioID INTEGER
)
RETURNS BOOLEAN AS
$$
DECLARE
    existe INTEGER;
BEGIN
    SELECT COUNT(*) INTO existe
    FROM conceptos
    WHERE LOWER(nombre) = LOWER(nombre_concepto)
      AND usuario_id = usuarioID
      AND estado = 1;

    IF existe > 0 THEN
        RETURN false;  -- Ya existe un concepto igual
    ELSE
        RETURN true; -- No existe, se puede registrar
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guardarConcepto(
    p_nombre VARCHAR,
    p_tipo INTEGER,
    p_periodo INTEGER,
    p_dias VARCHAR,
    p_usuario_id INTEGER,
    p_token TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_concepto_id INTEGER;
BEGIN
    INSERT INTO conceptos(nombre, tipoconconcepto, periodo, dias, usuario_id, estado)
    VALUES (p_nombre, p_tipo, p_periodo, p_dias, p_usuario_id, 1)
    RETURNING concepto_id INTO v_concepto_id;

    RETURN v_concepto_id;
END;
$$;


CREATE OR REPLACE FUNCTION traerConceptos(
    p_usuario_id INTEGER,
    p_fecha DATE
)
RETURNS SETOF conceptos
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM conceptos c
  WHERE c.estado = 1
    AND c.usuario_id = p_usuario_id
    AND (
      -- 1 = ÚNICA: asumimos que c.dias guarda la fecha 'YYYY-MM-DD'
      (c.periodo = 1)

      -- 2 = DIARIA: todos los días
      OR (c.periodo = 2)

      -- 3 = SEMANAL: c.dias es una letra (L,M,X,J,V,S,D)
      OR (
        c.periodo = 3
        AND upper(btrim(c.dias)) = (ARRAY['D','L','M','X','J','V','S'])
                                    [extract(dow FROM p_fecha)::int + 1]
      )

      -- 4 = QUINCENAL: '1' => día 1; '2' => día 16
      OR (
        c.periodo = 4
        AND (
          (btrim(c.dias) = '1' AND extract(day FROM p_fecha) = 1)
          OR
          (btrim(c.dias) = '2' AND extract(day FROM p_fecha) = 16)
        )
      )

      -- 5 = MENSUAL: c.dias = número de día del mes (1..31)
      OR (
        c.periodo = 5
        AND c.dias ~ '^[0-9]{1,2}$'
        AND (c.dias::int BETWEEN 1 AND 31)
        AND extract(day FROM p_fecha) = c.dias::int
      )
    );
END;
$$;

CREATE UNIQUE INDEX CONCURRENTLY ux_cuentas_fecha_usuario
  ON cuentas (fecha, usuario_id);

CREATE UNIQUE INDEX CONCURRENTLY ux_cdd_cuenta_concepto
  ON cuentas_detalles (cuenta_id, concepto_id);
  
CREATE OR REPLACE FUNCTION guardarDatos(p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    item                 JSONB;
    arr_items            JSONB;
    v_fecha              DATE;
    v_usuario_id         INTEGER;
    v_concepto_id        INTEGER;
    v_monto              NUMERIC(14,2);

    v_cuenta_id          INTEGER;
    v_cuenta_detalle_id  INTEGER;

    results              JSONB := '[]'::jsonb;
BEGIN
    -- Soporta {datos:[...]} o un único objeto {...}
    IF p_datos ? 'datos' THEN
        arr_items := p_datos->'datos';
    ELSE
        arr_items := jsonb_build_array(p_datos);
    END IF;

    -- Recorre cada elemento
    FOR item IN SELECT jsonb_array_elements(arr_items)
    LOOP
        v_fecha       := (item->>'fecha')::date;
        v_usuario_id  := (item->>'usuario_id')::int;
        v_concepto_id := (item->>'concepto_id')::int;
        v_monto       := COALESCE((item->>'monto')::numeric, 0.00);

        -- UPSERT cuenta (única por fecha+usuario)
        INSERT INTO cuentas (fecha, usuario_id)
        VALUES (v_fecha, v_usuario_id)
        ON CONFLICT (fecha, usuario_id)
        DO UPDATE SET fecha = EXCLUDED.fecha
        RETURNING cuenta_id INTO v_cuenta_id;

        -- UPSERT detalle (único por cuenta+concepto)
        INSERT INTO cuentas_detalles (cuenta_id, concepto_id, monto)
        VALUES (v_cuenta_id, v_concepto_id, v_monto)
        ON CONFLICT (cuenta_id, concepto_id)
        DO UPDATE SET monto = EXCLUDED.monto
        RETURNING cuenta_detalle_id INTO v_cuenta_detalle_id;

        -- Acumula resultado por ítem
        results := results || jsonb_build_array(
            jsonb_build_object(
                'fecha', v_fecha,
                'usuario_id', v_usuario_id,
                'concepto_id', v_concepto_id,
                'cuenta_id', v_cuenta_id,
                'cuenta_detalle_id', v_cuenta_detalle_id
            )
        );
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'items', results);
END;
$$;

CREATE OR REPLACE FUNCTION traerBalance(
    p_usuario_id INTEGER,
    p_token      TEXT,
    p_fecha      DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_dia NUMERIC(14,2);
    v_total_mes NUMERIC(14,2);
BEGIN
    -- Balance del día (ingresos - egresos)
    SELECT
        COALESCE(SUM(cd.monto * cpto.tipoconconcepto), 0.00)
    INTO v_total_dia
    FROM cuentas c
    JOIN cuentas_detalles cd ON cd.cuenta_id = c.cuenta_id
    JOIN conceptos cpto       ON cpto.concepto_id = cd.concepto_id
    WHERE c.usuario_id = p_usuario_id
      AND c.fecha = p_fecha;

    -- Balance mensual acumulado (desde inicio de mes hasta fecha)
    SELECT
        COALESCE(SUM(cd.monto * cpto.tipoconconcepto), 0.00)
    INTO v_total_mes
    FROM cuentas c
    JOIN cuentas_detalles cd ON cd.cuenta_id = c.cuenta_id
    JOIN conceptos cpto       ON cpto.concepto_id = cd.concepto_id
    WHERE c.usuario_id = p_usuario_id
      AND c.fecha BETWEEN date_trunc('month', p_fecha)::date AND p_fecha;

    RETURN jsonb_build_object(
        'total_general', v_total_dia,
        'total_mensual', v_total_mes
    );
END;
$$;