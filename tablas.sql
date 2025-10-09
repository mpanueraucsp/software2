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

