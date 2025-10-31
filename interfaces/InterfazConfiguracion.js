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
    this.traerConceptos(usuarioID);
    //this.asignarEventos();
    console.debug("envetos");
  }
  traerConceptos(usuarioID){
    console.debug("traerconceptos", this.usuarioID, this.token);
    //var url = endpoint+`api/gconcepto/traerConceptos/`;
    var url = endpoint+`api/gconcepto/traerConceptos/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}`;
    var scope = this;
    try {
      fetch(url)
      .then(resp => {
        return resp.json(); 
      })
      .then(data => {
        console.debug(data);
        scope.llenarComboConcepto(data);
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
  seleccionarConcepto(){
    const select = document.getElementById("concepto-select");
    const conceptoid = select.value; 
    console.debug(select);
    var url = endpoint+`api/gconcepto/traerDatos/?conceptoID=${encodeURIComponent(conceptoid)}`;
    var scope = this;
    try {
      fetch(url)
      .then(resp => {
        return resp.json(); 
      })
      .then(data => {
        console.debug(data);
        scope.llenarDatosConcepto(data);
      })
      .catch(err => console.error("Error:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
  llenarDatosConcepto(data){
    var c = data[0];
    const select = document.getElementById("concepto-select");
    const conceptoText = document.getElementById("concepto-text");
    const diaInput = document.getElementById("dia-input");

    // Radios
    const tipoRadios = document.getElementsByName("tipo");
    const periodoRadios = document.getElementsByName("periodo");
    const estadoRadios = document.getElementsByName("estado");
    
    const conceptoid = document.getElementById("conceptoid");
    conceptoid.value = c.conceptoid;

    conceptoText.value = c.nombre || "";
    diaInput.value = c.dias || "";

    // Tipo (1 = ingreso, otro = gasto)
    tipoRadios.forEach(r => {
      r.checked = (c.tipoconconcepto === "1" && r.value === "ingreso") ||
                  (c.tipoconconcepto !== "1" && r.value === "gasto");
    });

    // Periodo (1 = diario, 2 = semanal, etc. ajusta según tu lógica)
    periodoRadios.forEach(r => {
      // compara el texto (unico, diario, semanal, quincenal, mensual)
      const mapPeriodo = {
        "1": "diario",
        "2": "semanal",
        "3": "quincenal",
        "4": "mensual",
        "5": "unico"
      };
      r.checked = (r.value === mapPeriodo[c.periodo]);
    });

    // Estado
    estadoRadios.forEach(r => {
      r.checked = (c.estado === "1" && r.value === "habilitado") ||
                  (c.estado !== "1" && r.value === "deshabilitado");
    });
  }
  llenarComboConcepto(data){
    const select = document.getElementById("concepto-select");
    select.innerHTML = '<option value="">Seleccione...</option>'; // limpiar primero

    data.forEach(item => {
      const option = document.createElement("option");
      option.value = item.conceptoid; // el id
      option.textContent = item.nombre; // el nombre que se muestra
      select.appendChild(option);
    });
  }
  // Inicializar la página
  init() {
    
  }
  clickModificar(){
    const nombre = document.getElementById("concepto-text").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "";
    const periodo = document.querySelector('input[name="periodo"]:checked')?.value || "";
    const dia = document.getElementById("dia-input").value.trim();
    console.debug(document.getElementById("conceptoid"));
    const conceptoID = document.getElementById("conceptoid").value;


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
    //const baseURL = "http://localhost/software2/software2/api/gconcepto/validarParametros/";
    var baseURL = endpoint+`api/gconcepto/validarDatos/`;
    const params = new URLSearchParams({
      conceptoid: conceptoID,
      nombre: nombre,
      tipo: tipoID,
      periodo: periodoID,
      dia: dia || "",
      usuarioID: this.usuarioID,
      token: this.token
    });

    const url = `${baseURL}?${params.toString()}`;
    console.log("Enviando GET:", url);

    // ejecutar la solicitud GET
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("Respuesta del servidor:", data);
        //alert("Datos enviados correctamente");
        if (data.valido){
          if (data.conceptoModificado){
            this.mostrarMensaje("Se realizaron todos los cambios");
            this.limpiarDatos();
          }
        }else{
          this.mostrarMensaje("No se modifico el concepto");
        }
      })
      .catch(error => {
        console.error("Error al enviar:", error);
        //alert("Error al enviar los datos");
      });
  }
  limpiarDatos(){
     const select = document.getElementById("concepto-select");
      select.value = "";  // deja sin selección

      // 🔹 Campos de texto
      document.getElementById("conceptoid").value = "";
      document.getElementById("concepto-text").value = "";
      document.getElementById("dia-input").value = "";

      // 🔹 Radios: desmarcar todos (o dejar el valor por defecto)
      const tipoRadios = document.getElementsByName("tipo");
      const periodoRadios = document.getElementsByName("periodo");
      const estadoRadios = document.getElementsByName("estado");

      tipoRadios.forEach(r => r.checked = false);
      periodoRadios.forEach(r => r.checked = false);
      estadoRadios.forEach(r => r.checked = false);
  }
  clicOpcionDeshabilitar() {
    const conceptoID = document.getElementById("conceptoid").value;
    const estado = document.querySelector('input[name="estado"]:checked')?.value || "";
    let estadoID=0;
    switch (estado) {
      case "deshabilitado": estadoID = 0; break;
      case "habilitado": estadoID = 1; break;
    }

    console.debug(conceptoID, estado);

    var baseURL = endpoint+`api/gconcepto/actualizarEstado/`;
    const params = new URLSearchParams({
      conceptoid: conceptoID,
      estado: estadoID
    });
    
    const url = `${baseURL}?${params.toString()}`;
    console.log("📡 Enviando GET:", url);

    // ejecutar la solicitud GET
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("✅ Respuesta del servidor:", data);
        //alert("Datos enviados correctamente");
        if (data.estado){
          if (data.nuevoEstado){
            this.mostrarMensaje("Concepto fue actualizado");
          }
        }else{
          this.mostrarMensaje("Concepto no fue actualizado");
        }
      })
      .catch(error => {
        console.error("❌ Error al enviar:", error);
        //alert("Error al enviar los datos");
      });
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
    var baseURL = endpoint+`api/gconcepto/validarParametros/`;
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
  actualizarCampoDia(periodo){
    const diaInput = document.getElementById("dia-input");
    const periodoRadios = document.getElementsByName("periodo");
    diaInput.value = ""; // limpiar campo

    switch (periodo) {
      case "semanal":
        diaInput.disabled = false;
        diaInput.placeholder = "¿Qué día de la semana? (L,M,X,J,V,S,D)";
        diaInput.oninput = () => {
          diaInput.value = diaInput.value
            .toUpperCase()
            .replace(/[^LMXJVS D]/g, "")  // solo letras válidas
            .slice(0, 1);                  // solo una letra
        };
        break;

      case "quincenal":
        diaInput.disabled = false;
        diaInput.placeholder = "¿Día de la quincena? (1–15)";
        diaInput.oninput = () => {
          let val = diaInput.value.replace(/\D/g, ""); // quitar letras
          let num = parseInt(val || 0);
          if (num < 1) num = "";
          if (num > 15) num = 15;
          diaInput.value = num;
        };
        break;

      case "mensual":
        diaInput.disabled = false;
        diaInput.placeholder = "¿Día del mes? (1–31)";
        diaInput.oninput = () => {
          let val = diaInput.value.replace(/\D/g, "");
          let num = parseInt(val || 0);
          if (num < 1) num = "";
          if (num > 31) num = 31;
          diaInput.value = num;
        };
        break;

      default:
        diaInput.disabled = true;
        diaInput.placeholder = "¿Qué día de la semana?";
        diaInput.oninput = null;
    }
  }
  asignarEventos(){
    //document.addEventListener("DOMContentLoaded", () => {
      var btn = document.getElementById('btn-guardar');
      if (btn) {
        // Usa función flecha para mantener el contexto del "this"
        btn.addEventListener('click', (e) => this.clickGuardar(e));
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM");
      }
      //var btn1 = document.querySelector('.btn-modificar');
      var btn1 = document.getElementById('btn-modificar');
      if (btn1) {
        // Usa función flecha para mantener el contexto del "this"
        console.warn("asigno eventos");
        btn1.addEventListener('click', (e) => this.clickModificar(e));
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM***");
      }
      const select = document.getElementById("concepto-select");
      select.addEventListener("change", (e) => {
        const idSeleccionado = e.target.value;
        if (idSeleccionado) {
          this.seleccionarConcepto();
        }
      });
      var btn1 = document.getElementById('btn-nuevo');
      if (btn1) {
        // Usa función flecha para mantener el contexto del "this"
        console.warn("asigno eventos");
        btn1.addEventListener('click', (e) => this.limpiarDatos(e));
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM***");
      }
      const radioDeshabilitado = document.querySelector('input[name="estado"][value="deshabilitado"]');
      // Asignar evento click
      radioDeshabilitado.addEventListener('click', (e) => this.clicOpcionDeshabilitar(e));
      const radiohabilitado = document.querySelector('input[name="estado"][value="habilitado"]');
      // Asignar evento click
      radiohabilitado.addEventListener('click', (e) => this.clicOpcionDeshabilitar(e));

      const diaInput = document.getElementById("dia-input");
      const periodoRadios = document.getElementsByName("periodo");

      // 🔹 Escuchar cambios en los radios de periodo
      periodoRadios.forEach(radio => {
        radio.addEventListener("change", () => {
          this.actualizarCampoDia(radio.value);
        });
      });
  }
}