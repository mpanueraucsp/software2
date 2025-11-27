/**
 * ICU001
 * Interfaz - Clase InterfazCuentas.
 * Propósito: manejar la vista "Cuentas":
 * - Listar usuarios (tarjetas)
 * - Cambiar entre vista lista y formulario
 * - Crear nuevo usuario desde el formulario
 */
class InterfazCuentas {
  usuarioID; // ID del usuario en sesión (quien opera la interfaz)
  token;     // Token de autenticación

  /**
   * ICU002
   * Constructor: actualmente no inicializa eventos (se deja vacío según tu código).
   */
  constructor() {}

  /**
   * ICU003
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
    this.traerUsuarios();       // Carga usuarios para renderizar tarjetas
  }

  /**
   * ICU004
   * traerUsuarios: petición al backend para obtener el listado de usuarios (API gusuario/mostrarUsuarios).
   * - Si falla, renderiza una lista vacía para evitar errores visuales.
   */
  traerUsuarios() {
    // Endpoint para listar usuarios (requiere token)
    var url = endpoint + `api/gusuario/mostrarUsuarios/?token=${encodeURIComponent(this.token)}`;

    fetch(url)
      .then(resp => resp.json())
      .then(data => {
        this.renderizarLista(data); // Dibuja tarjetas con los usuarios
      })
      .catch(err => {
        console.error("Error cargando usuarios:", err);
        this.renderizarLista([]);   // Fallback: lista vacía
      });
  }

  /**
   * ICU005
   * renderizarLista: genera el HTML dinámico de las tarjetas de usuario en el contenedor.
   *
   * Flujo:
   * 1) Limpia el contenedor
   * 2) Si no hay usuarios, muestra un mensaje
   * 3) Si hay usuarios, crea tarjetas con nombre/perfil y estado (activar/desactivar solo visual)
   *
   * @param {Array} usuarios Lista de objetos usuario devueltos por el backend.
   */
  renderizarLista(usuarios) {
    const container = document.getElementById('lista-usuarios-container');

    // Limpia el contenedor antes de renderizar
    if(container) container.innerHTML = '';

    // Si no hay datos, mostrar mensaje
    if (!usuarios || usuarios.length === 0) {
        if(container) container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">No hay usuarios registrados.</div>';
        return;
    }

    // Recorrer usuarios y dibujar cada tarjeta
    usuarios.forEach(u => {
        if(container) {
            // Determinar estado visual (Activo/Inactivo)
            const isActive = (u.estado == 1);

            // Crear tarjeta (card)
            const card = document.createElement('div');
            card.className = 'account-card';
            card.innerHTML = `
                <div class="account-info">
                    <div class="mini-avatar">👤</div>
                    <span class="account-name">${u.nombre} (${u.perfil})</span>
                </div>
                <div class="toggle-group">
                    <div class="toggle-option ${isActive ? 'active' : ''}"> <span class="radio-circle"></span> Activar </div>
                    <div class="toggle-option ${!isActive ? 'active' : ''}"> <span class="radio-circle"></span> Desactivar </div>
                </div>
            `;

            // Agregar tarjeta al contenedor
            container.appendChild(card);
        }
    });
  }

  /**
   * ICU006
   * cambiarVista: alterna la visibilidad entre:
   * - Vista lista de usuarios (view-list)
   * - Vista formulario de creación (view-form)
   *
   * @param {string} vista 'formulario' para mostrar formulario, cualquier otro valor para mostrar lista.
   */
  cambiarVista(vista) {
    const viewList = document.getElementById('view-list');
    const viewForm = document.getElementById('view-form');
    const form = document.getElementById('form-nuevo-usuario');

    // Mostrar formulario y ocultar lista
    if (vista === 'formulario') {
        viewList.style.display = 'none';
        viewForm.style.display = 'block';

        // Limpia inputs al abrir el formulario
        if(form) form.reset();
    } else {
        // Mostrar lista y ocultar formulario
        viewForm.style.display = 'none';
        viewList.style.display = 'block';
    }
  }

  /**
   * ICU007
   * guardarUsuario: recoge datos del formulario, valida y envía la solicitud al backend para crear usuario.
   *
   * Validaciones:
   * - Campos obligatorios (nombre/usuario/pass)
   * - Contraseñas iguales
   *
   * Flujo:
   * 1) Construye URLSearchParams
   * 2) Llama a api/gusuario/crearUsuario
   * 3) Si success=true, vuelve a lista y recarga usuarios
   *
   * Nota:
   * - La contraseña se envía en texto plano al backend; el controlador aplica md5 antes de guardar (según tu PHP).
   */
  guardarUsuario() {
    // 1) Obtener valores del DOM
    const nombre = document.getElementById('txt-nombre').value;
    const usuario = document.getElementById('txt-usuario').value;
    const perfil = document.getElementById('sel-perfil').value;
    const pass = document.getElementById('txt-pass').value;
    const passRep = document.getElementById('txt-pass-rep').value;

    // 2) Validaciones básicas
    if (!nombre || !usuario || !pass) {
        alert("Por favor llena todos los campos");
        return;
    }
    if (pass !== passRep) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // 3) Preparar parámetros para el endpoint
    const params = new URLSearchParams({
        nombre: nombre,
        usuario: usuario,
        contrasena: pass,
        perfil: perfil,
        usuarioID: this.usuarioID, // usuario que crea (admin)
        token: this.token
    });

    // 4) Ejecutar petición al backend para crear usuario
    var url = endpoint + `api/gusuario/crearUsuario/?${params.toString()}`;
    console.log("Enviando datos a:", url);

    fetch(url)
        .then(r => r.json())
        .then(data => {
            console.log("Respuesta:", data);

            // Si se creó correctamente, volver a lista y recargar
            if(data.success) {
                alert("¡Usuario guardado con éxito!");
                this.cambiarVista('lista');
                this.traerUsuarios();
            } else {
                // Error retornado por backend
                alert("Error al guardar: " + (data.msg || "Error desconocido"));
            }
        })
        .catch(err => {
            console.error("Error Fetch:", err);
            alert("Error de conexión con el servidor");
        });
  }
}
