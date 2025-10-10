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