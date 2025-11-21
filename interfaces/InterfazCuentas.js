/**
 * Clase InterfazCuentas
 * Maneja la visualización, navegación y lógica de negocio de la sección Cuentas.
 */
class InterfazCuentas {
  usuarioID;
  token;

  constructor() {}

  /**
   * FIC-001: Inicialización
   * Se ejecuta al cargar la pestaña. Guarda credenciales y carga la lista inicial.
   */
  mostrarPestana(usuarioID, token) {
    this.usuarioID = usuarioID;
    this.token = token;
    this.traerUsuarios();
  }

  /**
   * FIC-002: Traer Usuarios
   * Realiza la petición FETCH al backend para obtener el listado de usuarios.
   */
  traerUsuarios() {
    var url = endpoint + `api/gusuario/mostrarUsuarios/?token=${encodeURIComponent(this.token)}`;
    
    fetch(url)
      .then(resp => resp.json())
      .then(data => {
        this.renderizarLista(data);
      })
      .catch(err => {
        console.error("Error cargando usuarios:", err);
        // Si falla, renderizamos lista vacía para evitar errores visuales
        this.renderizarLista([]); 
      });
  }

  /**
   * FIC-003: Renderizar Lista
   * Genera el HTML dinámico de las tarjetas de usuario basándose en los datos recibidos.
   * @param {Array} usuarios - Lista de objetos usuario.
   */
  renderizarLista(usuarios) {
    const container = document.getElementById('lista-usuarios-container');
    if(container) container.innerHTML = ''; // Limpiar contenedor

    // Validación: Si la lista está vacía o es nula
    if (!usuarios || usuarios.length === 0) {
        if(container) container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">No hay usuarios registrados.</div>';
        return;
    }

    // Recorrer y dibujar cada usuario
    usuarios.forEach(u => {
        if(container) {
            // Determinar estado visual (Activo/Inactivo)
            const isActive = (u.estado == 1);
            
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
            container.appendChild(card);
        }
    });
  }

  /**
   * FIC-004: Cambiar Vista
   * Alterna la visibilidad entre la lista de usuarios y el formulario de creación.
   * @param {string} vista - 'formulario' o 'lista'.
   */
  cambiarVista(vista) {
    const viewList = document.getElementById('view-list');
    const viewForm = document.getElementById('view-form');
    const form = document.getElementById('form-nuevo-usuario');

    if (vista === 'formulario') {
        viewList.style.display = 'none';
        viewForm.style.display = 'block';
        // Limpiamos los inputs al abrir el formulario
        if(form) form.reset();
    } else {
        viewForm.style.display = 'none';
        viewList.style.display = 'block';
    }
  }

  /**
   * FIC-005: Guardar Usuario
   * Recoge datos del formulario, valida y envía la petición de inserción al backend.
   */
  guardarUsuario() {
    // 1. Obtener valores del DOM
    const nombre = document.getElementById('txt-nombre').value;
    const usuario = document.getElementById('txt-usuario').value;
    const perfil = document.getElementById('sel-perfil').value;
    const pass = document.getElementById('txt-pass').value;
    const passRep = document.getElementById('txt-pass-rep').value;

    // 2. Validaciones básicas
    if (!nombre || !usuario || !pass) {
        alert("Por favor llena todos los campos");
        return;
    }
    if (pass !== passRep) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // 3. Preparar parámetros URL
    const params = new URLSearchParams({
        nombre: nombre,
        usuario: usuario,
        contrasena: pass,
        perfil: perfil,
        usuarioID: this.usuarioID,
        token: this.token
    });

    // 4. Ejecutar petición AJAX (Fetch)
    var url = endpoint + `controller/init.php?${params.toString()}`;    
    console.log("Enviando datos a:", url); 

    fetch(url)
        .then(r => r.json())
        .then(data => {
            console.log("Respuesta:", data);
            if(data.success) {
                alert("¡Usuario guardado con éxito!");
                this.cambiarVista('lista'); // Volver a la lista
                this.traerUsuarios();       // Recargar datos para ver el nuevo registro
            } else {
                alert("Error al guardar: " + (data.msg || "Error desconocido"));
            }
        })
        .catch(err => {
            console.error("Error Fetch:", err);
            alert("Error de conexión con el servidor");
        });
  }
}