-- Table: public.conceptos

-- DROP TABLE IF EXISTS public.conceptos;

CREATE TABLE IF NOT EXISTS public.conceptos
(
    conceptoid integer NOT NULL DEFAULT 'nextval('conceptos_concepto_id_seq'::regclass)',
    nombre character varying(100) COLLATE pg_catalog."default",
    tipoconconcepto integer,
    periodo integer,
    dias character varying(60) COLLATE pg_catalog."default",
    usuarioid integer,
    estado integer DEFAULT 1,
    CONSTRAINT conceptos_pkey PRIMARY KEY (conceptoid),
    CONSTRAINT fk_conceptos_usuarioid FOREIGN KEY (usuarioid)
        REFERENCES public.usuarios (usuarioid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.conceptos
    OWNER to postgres;
-- Index: fki_conc

-- DROP INDEX IF EXISTS public.fki_conc;

CREATE INDEX IF NOT EXISTS fki_conc
    ON public.conceptos USING btree
    (usuarioid ASC NULLS LAST)
    TABLESPACE pg_default;
    
    -- Table: public.movimientos

-- DROP TABLE IF EXISTS public.movimientos;

CREATE TABLE IF NOT EXISTS public.movimientos
(
    movimientoid integer NOT NULL DEFAULT 'nextval('cuentas_cuenta_id_seq'::regclass)',
    fecha date,
    usuarioid integer,
    creado_en timestamp with time zone,
    CONSTRAINT movimientos_pkey PRIMARY KEY (movimientoid),
    CONSTRAINT fk_movimientos_usuarioid FOREIGN KEY (usuarioid)
        REFERENCES public.usuarios (usuarioid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.movimientos
    OWNER to postgres;
-- Index: fki_fk_movimientos_usuarioid

-- DROP INDEX IF EXISTS public.fki_fk_movimientos_usuarioid;

CREATE INDEX IF NOT EXISTS fki_fk_movimientos_usuarioid
    ON public.movimientos USING btree
    (usuarioid ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: ux_cuentas_fecha_usuario

-- DROP INDEX IF EXISTS public.ux_cuentas_fecha_usuario;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cuentas_fecha_usuario
    ON public.movimientos USING btree
    (fecha ASC NULLS LAST, usuarioid ASC NULLS LAST)
    TABLESPACE pg_default;
    
    -- Table: public.movimientos_detalles

-- DROP TABLE IF EXISTS public.movimientos_detalles;

CREATE TABLE IF NOT EXISTS public.movimientos_detalles
(
    movimiento_detalleid integer NOT NULL DEFAULT 'nextval('cuentas_detalles_cuenta_detalle_id_seq'::regclass)',
    conceptoid integer,
    monto numeric(14,2) DEFAULT '0.00',
    movimientoid integer,
    creado_en timestamp with time zone,
    CONSTRAINT movimientos_detalles_pkey PRIMARY KEY (movimiento_detalleid),
    CONSTRAINT fk_movimientos_detalles_concepto_id FOREIGN KEY (conceptoid)
        REFERENCES public.conceptos (conceptoid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT movimientos_detalles_movimientos_id_fkey FOREIGN KEY (movimientoid)
        REFERENCES public.movimientos (movimientoid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.movimientos_detalles
    OWNER to postgres;
-- Index: fki_fk_movimientos_detalles_concepto_id

-- DROP INDEX IF EXISTS public.fki_fk_movimientos_detalles_concepto_id;

CREATE INDEX IF NOT EXISTS fki_fk_movimientos_detalles_concepto_id
    ON public.movimientos_detalles USING btree
    (conceptoid ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: ux_cdd_cuenta_concepto

-- DROP INDEX IF EXISTS public.ux_cdd_cuenta_concepto;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cdd_cuenta_concepto
    ON public.movimientos_detalles USING btree
    (movimientoid ASC NULLS LAST, conceptoid ASC NULLS LAST)
    TABLESPACE pg_default;
    
    
    -- Table: public.perfil

-- DROP TABLE IF EXISTS public.perfil;

CREATE TABLE IF NOT EXISTS public.perfil
(
    perfilid integer NOT NULL DEFAULT 'nextval('tipousuarios_tipousuario_id_seq'::regclass)',
    nombre text COLLATE pg_catalog."default",
    CONSTRAINT tipousuarios_pkey PRIMARY KEY (perfilid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.perfil
    OWNER to postgres;
    
    
    -- Table: public.sesion

-- DROP TABLE IF EXISTS public.sesion;

CREATE TABLE IF NOT EXISTS public.sesion
(
    sesionid integer NOT NULL DEFAULT 'nextval('sesion_sesionid_seq'::regclass)',
    usuarioid integer,
    token character varying(256) COLLATE pg_catalog."default",
    estado integer DEFAULT 1,
    creado_en timestamp with time zone,
    actualizado_en timestamp with time zone,
    CONSTRAINT sesion_pkey PRIMARY KEY (sesionid),
    CONSTRAINT fk_sesion_usuarioid FOREIGN KEY (usuarioid)
        REFERENCES public.usuarios (usuarioid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sesion
    OWNER to postgres;
-- Index: fki_fk_sesion_usuarioid

-- DROP INDEX IF EXISTS public.fki_fk_sesion_usuarioid;

CREATE INDEX IF NOT EXISTS fki_fk_sesion_usuarioid
    ON public.sesion USING btree
    (usuarioid ASC NULLS LAST)
    TABLESPACE pg_default;
    
    -- Table: public.usuarios

-- DROP TABLE IF EXISTS public.usuarios;

CREATE TABLE IF NOT EXISTS public.usuarios
(
    usuarioid integer NOT NULL DEFAULT 'nextval('usuarios_usuario_id_seq'::regclass)',
    nombre character varying(60) COLLATE pg_catalog."default",
    perfilid integer,
    nombre_de_usuario character varying(60) COLLATE pg_catalog."default",
    contrasena character varying(200) COLLATE pg_catalog."default",
    estado integer DEFAULT 1,
    creado_en timestamp with time zone,
    actualizado_en timestamp with time zone,
    CONSTRAINT usuarios_pkey PRIMARY KEY (usuarioid),
    CONSTRAINT fk_usuarios_perfil_id FOREIGN KEY (perfilid)
        REFERENCES public.perfil (perfilid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.usuarios
    OWNER to postgres;
-- Index: fki_fk_usuarios_perfil_id

-- DROP INDEX IF EXISTS public.fki_fk_usuarios_perfil_id;

CREATE INDEX IF NOT EXISTS fki_fk_usuarios_perfil_id
    ON public.usuarios USING btree
    (perfilid ASC NULLS LAST)
    TABLESPACE pg_default;
