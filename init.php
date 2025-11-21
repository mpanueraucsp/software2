<?php
    // Configuración de cabeceras para permitir respuestas JSON y CORS
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");

	$headers = apache_request_headers();
    if (array_key_exists('Authorization', $headers)) {
        $token = str_replace("Bearer ", "", $headers['Authorization']);
    }
    
    $path = "./"; 

    // Verificamos que lleguen el Controlador (c) y la Función (f)
    if (array_key_exists("c", $_REQUEST) && array_key_exists("f", $_REQUEST)){
        $controlador = $_REQUEST["c"];
        $funcion = $_REQUEST["f"];
        $file = $controlador.".php"; 
        
        if (file_exists($file)){
            include_once($file);
            $class = new $controlador();

            // ====================================================
            // BLOQUE G-001: Gestión de Usuarios (GUsuario)
            // ====================================================
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
            
            // ====================================================
            // Otros Controladores (Conceptos, Cuentas, etc.)
            // ====================================================
            // ... (Aquí irían los demás bloques if) ...
            
            // Respuesta final en formato JSON
            if (isset($result)){
                echo json_encode($result);
            }
        } else {
            echo json_encode(["error" => "No existe el archivo del controlador"]);
        }
    } else {
        echo json_encode(["error" => "Faltan parámetros c y f"]);
    }
?>