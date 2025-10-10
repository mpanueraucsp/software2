 class InterfazPrincipal {
   usuarioID;
   token;
   tipoUsuario;
    constructor() {
       this.configurarEventos();
     }

   configurarEventos() {
      console.debug("inicio");
      this.token = localStorage.getItem("token");
      this.tipoUsuario = localStorage.getItem("tipoUsuario");
      this.usuarioID = localStorage.getItem("usuarioID");

    const enlaces = document.querySelectorAll('.nav-item');
    enlaces.forEach(enlace => {
      enlace.addEventListener('click', (e) => {
        e.preventDefault(); // evita redirección
        const page = enlace.getAttribute('data-page');
        this.navegar(page);
      });
    });
   }
   navegar(page) {
    switch (page) {
      case 'ingreso-diario':
        this.mostrarIngresoDiario();
        break;
      case 'balance':
        this.mostrarBalance();
        break;
      case 'configuracion':
        this.seleccionarConfiguracion();
        break;
      default:
        console.log("Página no reconocida:", page);
    }
   }
   seleccionarConfiguracion(){
      //console.debug("entro aqio");
      fetch('../pages/configuracion.html')
      .then(r => r.text())
      .then(html => {
         //console.debug(html);
         //console.debug(document.querySelector('main'));
        document.querySelector('main').innerHTML = html;
        window.uiConfiguracion = new InterfazConfiguracion();
        console.debug(this.usuarioID, this.token);
        window.uiConfiguracion.mostrarPestana(this.usuarioID, this.token);
        //window.uiIngreso.usuarioID = 
      })
      .catch(err => console.error('Error al cargar configuracion:', err));
      
   }
   mostrarIngresoDiario(){
      //console.debug("entro aqio");
      fetch('../pages/ingreso_diario.html')
      .then(r => r.text())
      .then(html => {
         //console.debug(html);
         //console.debug(document.querySelector('main'));
        document.querySelector('main').innerHTML = html;
        window.uiIngreso = new InterfazIngreso();
        console.debug(this.usuarioID, this.token);
        window.uiIngreso.mostrarPestana(this.usuarioID, this.token);
        //window.uiIngreso.usuarioID = 
      })
      .catch(err => console.error('Error al cargar ingreso_diario:', err));
      
   }
    mostrarPantallaPrincipal(token, tipoUsuario, usuarioID){
        localStorage.setItem('token', "token");
        localStorage.setItem('tipoUsuario', tipoUsuario);
        localStorage.setItem('usuarioID', usuarioID);
        window.location.href = '../pages/inicio.html';
        console.debug(token, tipoUsuario, usuarioID);
        this.usuarioID = usuarioID;
        this.token = token;
        this.tipoUsuario = tipoUsuario;
    }

  }