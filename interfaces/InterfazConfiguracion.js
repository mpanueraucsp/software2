class InterfazConfiguracion {
  usuarioID;
  token;
  fecha;
  constructor() {
    this.asignarEventos();

  }
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;
    this.token = token;
    this.fecha = "";
    console.debug(usuarioID, token);
    
  }
  // Inicializar la página
  init() {
    
  }
  clickGuardar(){
    const nombre = document.getElementById("concepto-text").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "";
    const periodo = document.querySelector('input[name="periodo"]:checked')?.value || "";
    const dia = document.getElementById("dia-input").value.trim();

    // convertir valores de texto a los códigos esperados
    const tipoID = tipo === "ingreso" ? 1 : -1; // ejemplo
    let periodoID = 0;
    switch (periodo) {
      case "unico": periodoID = 0; break;
      case "diario": periodoID = 1; break;
      case "semanal": periodoID = 2; break;
      case "quincenal": periodoID = 3; break;
      case "mensual": periodoID = 4; break;
    }

    // construir URL con parámetros
    const baseURL = "http://localhost/software2/software2/api/gconcepto/validarParametros/";
    const params = new URLSearchParams({
      nombre: nombre,
      tipo: tipoID,
      periodo: periodoID,
      dia: dia || "",
      usuarioID: this.usuarioID,
      token: this.token
    });

    const url = `${baseURL}?${params.toString()}`;
    console.log("📡 Enviando GET:", url);

    // ejecutar la solicitud GET
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("✅ Respuesta del servidor:", data);
        //alert("Datos enviados correctamente");
        if (data.valido){
          if (data.guardarOk){
            this.mostrarMensaje("Concepto creado satisfactoriamente");
          }
        }else{
          this.mostrarMensaje("Concepto ya existe");
        }
      })
      .catch(error => {
        console.error("❌ Error al enviar:", error);
        //alert("Error al enviar los datos");
      });
  }
  mostrarMensaje(mensaje){
    alert(mensaje)
  }
  asignarEventos(){
    const btn = document.querySelector('.btn-update');
    if (btn) {
      // Usa función flecha para mantener el contexto del "this"
      btn.addEventListener('click', (e) => this.clickGuardar(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }
  }
}