/**
 * UI-010
 * Interfaz - Clase InterfazCambiarClave.
 * Propósito: cambiar la contraseña del usuario":
 * - actualizar la contraseña
 */
class InterfazCambiarClave {
  usuarioID; // ID del usuario en sesión (quien opera la interfaz)
  token;     // Token de autenticación

  /**
   * FIC-002
   * Constructor: actualmente no inicializa eventos (se deja vacío según tu código).
   */
  constructor() {}

  /**
   * FIC-003
   * mostrarPestana: inicializa la pestaña "Cuentas".
   * - Guarda credenciales (usuarioID/token)
   * - Carga la lista inicial de usuarios desde el backend
   *
   * @param {number|string} usuarioID ID del usuario logueado.
   * @param {string} token Token de autenticación.
   */
  mostrarPestana(usuarioID, token) {
    this.usuarioID = usuarioID; // Guarda usuario logueado
    this.token = token;         // Guarda token
    this.asignarEventos();
  }

  /**
   * FIC004
   * traerUsuarios: petición al backend para obtener el listado de usuarios (API gusuario/mostrarUsuarios).
   * - Si falla, renderiza una lista vacía para evitar errores visuales.
   */
  actualizarContrasena() {
    // Endpoint para listar usuarios (requiere token)
    if (this.validarCambios()){
        const np = document.getElementById('newpass'); //nueva contraseña
        const op = document.getElementById('oldpass'); // contraseña anterior
        const rp = document.getElementById('repeatpass'); // contraseña anterior
        var url = endpoint + `api/gusuario/actualizarcontrasena/?usuarioID=${encodeURIComponent(this.usuarioID)}&anterior=${encodeURIComponent(op.value)}&nueva=${encodeURIComponent(np.value)}`;

        fetch(url)
        .then(resp => resp.json())
        .then(data => {
            if (data.cambiosOK){
                this.mostrarMensaje("contraseña fue actualizada");
                np.value="";
                op.value="";
                rp.value="";
            }
            else
                this.mostrarMensaje("contraseña anterior no coincide");
        })
        .catch(err => {
            console.error("Error actualizando contraseña:", err);
        });
    }else{
        this.mostrarMensaje("las contraseñas no coinciden");
    }
    
    
  }

 /**
   * ICC005
   * mostrarMensaje: muestra el mensaje
   * - Si falla, renderiza una lista vacía para evitar errores visuales.
   */
 mostrarMensaje(mensaje) {
    alert(mensaje);
  }


  /**
   * ICC006
   * validarcambios: validar los datos
   */
  validarCambios() {
    const np = document.getElementById('newpass');
    const rp = document.getElementById('repeatpass');
    return (np.value!="" && np.value==rp.value);
  }
    /**
     * ICC006
     * Asignar eventos
     */
    asignarEventos() {
        const btn = document.querySelector('.btn-cambiarclave');
        if (btn) {
        btn.addEventListener('click', (e) => this.actualizarContrasena(e));
        } else {
        console.warn("No se encontró el botón .btn-update en el DOM");
        }
    }

}
