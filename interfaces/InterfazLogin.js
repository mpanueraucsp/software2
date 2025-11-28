/**
 * UI-001
 * Interfaz - Clase InterfazLogin.
 * Propósito: gestionar la pantalla de Login:
 * - Capturar submit del formulario
 * - Validar campos (usuario/contraseña)
 * - Consultar al backend si las credenciales son correctas
 * - Si es correcto, redirigir/cargar la pantalla principal
 */
class InterfazLogin {
  /**
   * ICL002
   * Constructor:
   * - Obtiene el formulario #formLogin
   * - Asigna el evento submit para ejecutar el login sin recargar la página
   */
  constructor() {
    this.form = document.getElementById('formLogin'); // Referencia al formulario de login
    this.form.addEventListener('submit', (e) => this.seleccionarIniciarSesion(e)); // Evento submit
  }

  /**
   * ICL003
   * mostrarMensaje: muestra mensajes al usuario (alert).
   *
   * @param {string} mensaje Texto a mostrar.
   */
  mostrarMensaje(mensaje){
    alert(mensaje);
  }

  /**
   * ICL004
   * seleccionarIniciarSesion: flujo principal de autenticación.
   * - Evita recarga de página
   * - Lee usuario y contraseña del formulario
   * - Valida campos obligatorios
   * - Llama al endpoint api/gusuario/validarParametros
   * - Si cuentaExiste=true => instancia InterfazPrincipal y muestra pantalla principal
   * - Caso contrario => muestra mensaje de credenciales incorrectas
   *
   * @param {Event} e Evento submit del formulario
   */
  seleccionarIniciarSesion(e) {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Leer valores de inputs
    const usuario = document.getElementById('user').value.trim();
    const contrasena = document.getElementById('pass').value.trim();

    // Validación básica: no permitir campos vacíos
    if (!usuario || !contrasena) {
      alert('Por favor, ingrese usuario y contraseña.');
      return;
    }

    // Endpoint de autenticación (valida usuario y contraseña en backend)
    const url = endpoint+`api/gusuario/validarParametros/?usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`;

    try {
      fetch(url)
      .then(resp => {
        console.log("Respuesta bruta:", resp); // Response (HTTP) antes de parsear JSON
        return resp.json();
      })
      .then(data => {
        console.log("Respuesta del servidor:", data);

        // Si el backend valida credenciales, se ingresa al sistema
        if (data.cuentaExiste){
          var uiPrincipal = new InterfazPrincipal(); // Control de pantalla principal
          uiPrincipal.mostrarPantallaPrincipal(data.token, data.tipoUsuario, data.usuarioID);
        } else {
          // Caso credenciales inválidas
          this.mostrarMensaje("Credenciales incorrectas");
        }
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
}
