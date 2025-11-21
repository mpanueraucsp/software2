 class InterfazLogin {
    constructor() {
      this.form = document.getElementById('formLogin');
      this.form.addEventListener('submit', (e) => this.seleccionarIniciarSesion(e));
    }
    mostrarMensaje(mensaje){
      alert(mensaje);
    }
    seleccionarIniciarSesion(e) {
      e.preventDefault(); // evita que se recargue la página

      const usuario = document.getElementById('user').value.trim();
      const contrasena = document.getElementById('pass').value.trim();

      if (!usuario || !contrasena) {
        alert('Por favor, ingrese usuario y contraseña.');
        return;
      }

      const url = endpoint+`api/gusuario/validarParametros/?usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`;

      try {
        fetch(url)
        .then(resp => {
          console.log("Respuesta bruta:", resp); // objeto Response (no los datos todavía)
          return resp.json(); 
        })
        .then(data => {
          console.log("Respuesta del servidor:", data);
          if (data.cuentaExiste){
            var uiPrincipal = new InterfazPrincipal();
            uiPrincipal.mostrarPantallaPrincipal(data.token, data.tipoUsuario, data.usuarioID);
          }else{
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