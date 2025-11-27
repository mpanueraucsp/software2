/**
 * ICO001
 * Interfaz - Componente/Clase InterfazConfiguracion.
 * Propósito: gestionar la vista de Configuración (Conceptos):
 * - Listar conceptos del usuario
 * - Cargar datos de un concepto para modificar
 * - Guardar un nuevo concepto
 * - Modificar concepto existente
 * - Habilitar/Deshabilitar concepto
 * - Manejar validaciones básicas del campo "día" según periodicidad
 */
class InterfazConfiguracion {
  usuarioID; // ID del usuario en sesión
  token;     // Token de autenticación
  fecha;     // Fecha (si se usa para filtros futuros)

  /**
   * ICO002
   * Constructor: inicializa la interfaz y asigna los eventos de la vista.
   */
  constructor() {
    this.asignarEventos();
  }

  // ICO003
  // mostrarPestana: muestra la pestaña de configuración e inicia la carga de conceptos del usuario.
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;  // Guarda usuario en sesión
    this.token = token;          // Guarda token en sesión
    this.fecha = "";             // Inicializa fecha (no usada aquí)
    console.debug(usuarioID, token);

    // Carga los conceptos creados por el usuario
    this.traerConceptos(usuarioID);

    console.debug("envetos");
  }

  // ICO004
  // traerConceptos: trae los conceptos creados por el usuario desde el backend y llena el combo.
  traerConceptos(usuarioID){
    console.debug("traerconceptos", this.usuarioID, this.token);

    // Endpoint que retorna los conceptos asociados al usuario
    var url = endpoint+`api/gconcepto/traerConceptos/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        console.debug(data);
        scope.llenarComboConcepto(data); // Llenar el select con los conceptos
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  // ICO005
  // seleccionarConcepto: obtiene el conceptoid del combo y trae la información del concepto seleccionado.
  seleccionarConcepto(){
    const select = document.getElementById("concepto-select");
    const conceptoid = select.value;

    console.debug(select);

    // Endpoint que retorna los datos de un concepto por ID
    var url = endpoint+`api/gconcepto/traerDatos/?conceptoID=${encodeURIComponent(conceptoid)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        console.debug(data);
        scope.llenarDatosConcepto(data); // Llenar formulario con los datos del concepto
      })
      .catch(err => console.error("Error:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  // ICO006
  // llenarDatosConcepto: llena el formulario de configuración con los datos del concepto para modificación.
  llenarDatosConcepto(data){
    // Se asume que el backend devuelve una lista y el concepto está en la posición 0
    var c = data[0];

    // Controles del formulario
    const select = document.getElementById("concepto-select");
    const conceptoText = document.getElementById("concepto-text");
    const diaInput = document.getElementById("dia-input");

    // Radios del formulario
    const tipoRadios = document.getElementsByName("tipo");
    const periodoRadios = document.getElementsByName("periodo");
    const estadoRadios = document.getElementsByName("estado");

    // Campo oculto/ID del concepto
    const conceptoid = document.getElementById("conceptoid");
    conceptoid.value = c.conceptoid;

    // Textos principales
    conceptoText.value = c.nombre || "";
    diaInput.value = c.dias || "";

    // Tipo (1 = ingreso, otro = gasto)
    tipoRadios.forEach(r => {
      r.checked = (c.tipoconconcepto === "1" && r.value === "ingreso") ||
                  (c.tipoconconcepto !== "1" && r.value === "gasto");
    });

    // Periodo: mapea el código del backend hacia el valor de los radios
    // (Se mantiene la lógica original del código)
    periodoRadios.forEach(r => {
      const mapPeriodo = {
        "1": "diario",
        "2": "semanal",
        "3": "quincenal",
        "4": "mensual",
        "5": "unico"
      };
      r.checked = (r.value === mapPeriodo[c.periodo]);
    });

    // Estado: 1 = habilitado, otro = deshabilitado
    estadoRadios.forEach(r => {
      r.checked = (c.estado === "1" && r.value === "habilitado") ||
                  (c.estado !== "1" && r.value === "deshabilitado");
    });
  }

  // ICO007
  // llenarComboConcepto: llena el combo de conceptos (para seleccionar y modificar) con los datos obtenidos.
  llenarComboConcepto(data){
    const select = document.getElementById("concepto-select");

    // Opción por defecto + limpieza de opciones anteriores
    select.innerHTML = '<option value="">Seleccione...</option>';

    // Agrega cada concepto como <option>
    data.forEach(item => {
      const option = document.createElement("option");
      option.value = item.conceptoid;       // ID del concepto
      option.textContent = item.nombre;     // Nombre visible
      select.appendChild(option);
    });
  }

  // ICO008
  // init: función placeholder de inicialización (sin implementación).
  init() {
  }

  // ICO009
  // clickModificar: se activa al dar click en "Modificar" y envía los datos editados al backend.
  clickModificar(){
    // Leer datos del formulario
    const nombre = document.getElementById("concepto-text").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "";
    const periodo = document.querySelector('input[name="periodo"]:checked')?.value || "";
    const dia = document.getElementById("dia-input").value.trim();

    console.debug(document.getElementById("conceptoid"));
    const conceptoID = document.getElementById("conceptoid").value;

    // Convertir tipo a código esperado por backend
    const tipoID = tipo === "ingreso" ? 1 : -1;

    // Convertir periodo a código usado en backend (según lógica original)
    let periodoID = 0;
    switch (periodo) {
      case "unico": periodoID = 0; break;
      case "diario": periodoID = 1; break;
      case "semanal": periodoID = 2; break;
      case "quincenal": periodoID = 3; break;
      case "mensual": periodoID = 4; break;
    }

    // Construir URL con parámetros para validarDatos
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

    // Ejecutar solicitud y manejar respuesta
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("Respuesta del servidor:", data);

        if (data.valido){
          if (data.conceptoModificado){
            this.mostrarMensaje("Se realizaron todos los cambios");
            this.limpiarDatos(); // Limpia formulario y selección
          }
        }else{
          this.mostrarMensaje("No se modifico el concepto");
        }
      })
      .catch(error => {
        console.error("Error al enviar:", error);
      });
  }

  // ICO010
  // limpiarDatos: limpia todos los campos del formulario (select, inputs y radios).
  limpiarDatos(){
     const select = document.getElementById("concepto-select");
      select.value = "";  // Deja sin selección

      // Campos de texto
      document.getElementById("conceptoid").value = "";
      document.getElementById("concepto-text").value = "";
      document.getElementById("dia-input").value = "";

      // Radios: desmarcar todos
      const tipoRadios = document.getElementsByName("tipo");
      const periodoRadios = document.getElementsByName("periodo");
      const estadoRadios = document.getElementsByName("estado");

      tipoRadios.forEach(r => r.checked = false);
      periodoRadios.forEach(r => r.checked = false);
      estadoRadios.forEach(r => r.checked = false);
  }

  // ICO011
  // clicOpcionDeshabilitar: se activa al elegir habilitar/deshabilitar y envía el cambio de estado al backend.
  clicOpcionDeshabilitar() {
    const conceptoID = document.getElementById("conceptoid").value;
    const estado = document.querySelector('input[name="estado"]:checked')?.value || "";

    // Convertir estado a código esperado por backend
    let estadoID=0;
    switch (estado) {
      case "deshabilitado": estadoID = 0; break;
      case "habilitado": estadoID = 1; break;
    }

    console.debug(conceptoID, estado);

    // Endpoint para actualizar estado del concepto
    var baseURL = endpoint+`api/gconcepto/actualizarEstado/`;
    const params = new URLSearchParams({
      conceptoid: conceptoID,
      estado: estadoID
    });

    const url = `${baseURL}?${params.toString()}`;
    console.log("📡 Enviando GET:", url);

    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("✅ Respuesta del servidor:", data);

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
      });
  }

  // ICO012
  // clickGuardar: envía al backend la creación de un nuevo concepto (validarParametros + guardar).
  clickGuardar(){
    // Leer datos del formulario
    const nombre = document.getElementById("concepto-text").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "";
    const periodo = document.querySelector('input[name="periodo"]:checked')?.value || "";
    const dia = document.getElementById("dia-input").value.trim();

    // Convertir tipo a código backend
    const tipoID = tipo === "ingreso" ? 1 : -1;

    // Convertir periodo a código backend (según lógica original)
    let periodoID = 0;
    switch (periodo) {
      case "unico": periodoID = 0; break;
      case "diario": periodoID = 1; break;
      case "semanal": periodoID = 2; break;
      case "quincenal": periodoID = 3; break;
      case "mensual": periodoID = 4; break;
    }

    // Endpoint para validar y guardar concepto
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

    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("✅ Respuesta del servidor:", data);

        if (data.valido){
          if (data.guardarOk){
            this.mostrarMensaje("Concepto creado satisfactoriamente");
            this.limpiarDatos();
          }
        }else{
          this.mostrarMensaje("Concepto ya existe");
        }
      })
      .catch(error => {
        console.error("❌ Error al enviar:", error);
      });
  }

  // ICO013
  // mostrarMensaje: muestra un mensaje simple al usuario (alert).
  mostrarMensaje(mensaje){
    alert(mensaje)
  }

  // ICO014
  // actualizarCampoDia: habilita/valida el input "día" según el periodo seleccionado.
  // - semanal: 1 letra (L,M,X,J,V,S,D)
  // - quincenal: número (1..15)
  // - mensual: número (1..31)
  // - otros: deshabilita el campo
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

  // ICO015
  // asignarEventos: vincula eventos de UI con acciones (guardar, modificar, seleccionar concepto, nuevo, estado y periodo).
  asignarEventos(){
      // Botón Guardar (crear concepto)
      var btn = document.getElementById('btn-guardar');
      if (btn) {
        btn.addEventListener('click', (e) => this.clickGuardar(e)); // Mantiene contexto this
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM");
      }

      // Botón Modificar (editar concepto)
      var btn1 = document.getElementById('btn-modificar');
      if (btn1) {
        console.warn("asigno eventos");
        btn1.addEventListener('click', (e) => this.clickModificar(e));
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM***");
      }

      // Cambio en el combo de concepto: carga datos del concepto seleccionado
      const select = document.getElementById("concepto-select");
      select.addEventListener("change", (e) => {
        const idSeleccionado = e.target.value;
        if (idSeleccionado) {
          this.seleccionarConcepto();
        }
      });

      // Botón Nuevo: limpia formulario
      var btn1 = document.getElementById('btn-nuevo');
      if (btn1) {
        console.warn("asigno eventos");
        btn1.addEventListener('click', (e) => this.limpiarDatos(e));
      } else {
        console.warn(" No se encontró el botón .btn-update en el DOM***");
      }

      // Radios de estado: al hacer click, envía actualización de estado
      const radioDeshabilitado = document.querySelector('input[name="estado"][value="deshabilitado"]');
      radioDeshabilitado.addEventListener('click', (e) => this.clicOpcionDeshabilitar(e));

      const radiohabilitado = document.querySelector('input[name="estado"][value="habilitado"]');
      radiohabilitado.addEventListener('click', (e) => this.clicOpcionDeshabilitar(e));

      // Radios de periodo: actualiza comportamiento del input "día"
      const diaInput = document.getElementById("dia-input");
      const periodoRadios = document.getElementsByName("periodo");

      periodoRadios.forEach(radio => {
        radio.addEventListener("change", () => {
          this.actualizarCampoDia(radio.value);
        });
      });
  }
}
