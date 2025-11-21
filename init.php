<?php
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
	$headers = apache_request_headers();
    if (array_key_exists('Authorization', $headers)) {
        $token = str_replace("Bearer ", "", $headers['Authorization']);
    
    }
    $path = "controller/";
	//var_dump($_REQUEST);
    if (array_key_exists("c", $_REQUEST) && array_key_exists("f", $_REQUEST)){
        $controlador = $_REQUEST["c"];
        $funcion = $_REQUEST["f"];
        $file = $path.$controlador.".php";
        if (file_exists($file)){
            include_once($file);
            $class = new $controlador();
            if ($controlador == "gusuario"){
                
                // FCU-001: Login
                if ($funcion == "validarParametros"){
                    $result = $class->$funcion($_REQUEST["usuario"], $_REQUEST["contrasena"]);
                }
                
                // FCU-002: Listar Usuarios
                if ($funcion == "mostrarUsuarios"){
                    $result = $class->$funcion();
                }

                // FCU-003: Crear Usuario (Guardar en BD)
                if ($funcion == "crearUsuario"){
                    $result = $class->$funcion(
                        $_REQUEST["nombre"], 
                        $_REQUEST["usuario"], 
                        $_REQUEST["contrasena"], 
                        $_REQUEST["perfil"],     
                        $_REQUEST["usuarioID"]   
                    );
                }
            }
            if ($controlador=="gconcepto"){
                if ($funcion=="validarParametros"){
                    $result = $class->$funcion($_REQUEST["nombre"], $_REQUEST["tipo"], $_REQUEST["periodo"], $_REQUEST["dia"], $_REQUEST["usuarioID"], "");
                }
                if ($funcion=="traerConceptoPorPeriodicidad"){
                    $result = $class->$funcion($_REQUEST["usuarioID"], $_REQUEST["token"], $_REQUEST["fecha"]);
                }
                if ($funcion=="traerConceptos"){
                    $result = $class->$funcion($_REQUEST["usuarioID"], $_REQUEST["token"]);
                }
                if ($funcion=="traerDatos"){
                    $result = $class->$funcion($_REQUEST["conceptoID"]);
                }
                if ($funcion=="validarDatos"){
                    $result = $class->$funcion($_REQUEST["conceptoid"],$_REQUEST["nombre"], $_REQUEST["tipo"], $_REQUEST["periodo"], $_REQUEST["dia"], $_REQUEST["usuarioID"], "");
                }
                if ($funcion=="actualizarEstado"){
                    $result = $class->$funcion($_REQUEST["conceptoid"],$_REQUEST["estado"]);
                }
            }
            if ($controlador=="gcuenta"){
                if ($funcion=="enviarDatos"){
                    $result = $class->$funcion($_REQUEST["datos"]);
                }
                if ($funcion=="cargarDatosUsuario"){
                    $result = $class->$funcion($_REQUEST["usuarioID"], $_REQUEST["token"], $_REQUEST["fecha"]);
                }
            }
            if ($controlador=="gbalance"){
                if ($funcion=="traerGraficoIngresos"){
                    $result = $class->$funcion("", $_REQUEST["usuarioID"]);
                }
                if ($funcion=="traerBalanceLista"){
                    $result = $class->$funcion("", $_REQUEST["usuarioID"], $_REQUEST["tipoUsuario"], $_REQUEST["fecha"]);
                }
                if ($funcion=="traerBalance"){
                    $result = $class->$funcion($_REQUEST["usuarioID"], "");
                }
            }
            
            if (is_array($result)){
                //echo "entro aqui";
                echo json_encode($result);
            }
        }else{
            echo "no existe clase";
        }
    }else{
        echo "No existe controlador o funcion";
    }
?>