/**
 * UI-008
 * Interfaz - Clase InterfazIngreso.
 * Propósito: gestionar la vista de "Ingreso diario":
 * - Cargar conceptos según periodicidad y fecha
 * - Separar conceptos en ingresos y gastos
 * - Mostrar inputs para registrar montos por concepto
 * - Enviar datos a backend (guardarDatos)
 * - Consultar datos guardados (cargarDatosUsuario) para editar
 * - Calcular totales (ingresos, gastos y balance del día)
 * - Mostrar balance mensual/total desde backend
 *
 * Mejoras aplicadas:
 * - Usa la fecha real del input (#fecha) al consultar conceptos.
 * - Evita enviar inputs "maqueta" (ingreso-monto/gasto-monto) al guardar: toma solo .input-ingreso y .input-gastos
 * - Maneja tipoconcepto vs tipoconconcepto (robusto)
 * - Valida resp.ok para evitar error de JSON cuando el server devuelve HTML (404/500)
 */
class InterfazIngreso {
  usuarioID; // ID del usuario en sesión
  token;     // Token de autenticación
  fecha;     // Fecha seleccionada para trabajar registros diarios

  ingresos = []; // Lista de conceptos tipo ingreso
  gastos   = []; // Lista de conceptos tipo gasto

  /**
   * FII002
   * Constructor: coloca fecha actual e inicializa eventos de la vista.
   */
  constructor() {
    this.colocarFechaActual();
    this.asignarEventos();
  }

  /**
   * FII003
   * mostrarPestana: inicializa la pestaña "Ingreso diario" con usuario y token.
   * - Carga conceptos disponibles por periodicidad (según fecha)
   * - Carga balance para mostrar resumen
   */
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;
    this.token = token;

    // ICI003A: importante -> usar la fecha real del input
    this.fecha = document.getElementById('fecha')?.value || "";

    console.debug("mostrarPestana:", usuarioID, token, "fecha:", this.fecha);

    this.traerConceptos();
    this.traerBalance();
  }

  /**
   * FII004
   * traerConceptos: consume el endpoint que retorna conceptos válidos para la fecha (periodicidad).
   * Usa api/gconcepto/traerConceptoPorPeriodicidad con usuarioID, token y fecha.
   */
  traerConceptos(){
    // ICI004A: sincroniza fecha desde el input antes de consultar
    this.fecha = document.getElementById('fecha')?.value || this.fecha || "";

    console.debug("traerConceptos:", this.usuarioID, this.token, "fecha:", this.fecha);

    const url = endpoint +
      `api/gconcepto/traerConceptoPorPeriodicidad/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}&fecha=${encodeURIComponent(this.fecha)}`;

    try {
      fetch(url)
        .then(async (resp) => {
          // ICI004B: evita fallar al parsear JSON si la respuesta es HTML por error
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 140)}`);
          }
          return resp.json();
        })
        .then(data => {
          console.debug("conceptos:", data);
          this.mostrarConceptos(data);
        })
        .catch(err => console.error("Error traerConceptos:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /**
   * FII005
   * mostrarConceptos: separa los conceptos recibidos en ingresos y gastos y actualiza la UI.
   * - Luego renderiza inputs y calcula totales.
   */
  mostrarConceptos(data){
    this.ingresos = [];
    this.gastos = [];

    const lista = Array.isArray(data) ? data : [];

    for (const item of lista) {
      // ICI005A: robusto: puede venir tipoconcepto o tipoconconcepto
      const tipo = String(item.tipoconconcepto ?? item.tipoconcepto ?? "");

      if (tipo === "1") {
        this.ingresos.push(item);
      } else {
        this.gastos.push(item);
      }
    }

    console.debug("ingresos:", this.ingresos);
    console.debug("gastos:", this.gastos);

    this.renderIngresos();
    this.renderGastos();
    this.calcularTotales();
  }

  /**
   * FII006
   * colocarFechaActual: inicializa el input de fecha con hoy y guarda this.fecha.
   */
  colocarFechaActual() {
    const input = document.getElementById('fecha');
    const today = new Date().toISOString().split('T')[0];

    if (input) input.value = today;
    this.fecha = today;
  }

  /**
   * FII007
   * clickActualizar: recolecta los montos ingresados y envía el payload hacia el backend (guardarDatos).
   * - Lee solo inputs dinámicos (.input-ingreso y .input-gastos)
   * - Construye payload { datos: [...] }
   * - Envía por POST a api/gcuenta/enviarDatos con parámetro "datos" en querystring
   * - Si success: muestra mensaje y refresca balance
   */
  clickActualizar(e){
    const usuarioID = this.usuarioID;
    const fecha = document.getElementById('fecha')?.value || this.fecha || "";

    // ICI007A: IMPORTANTE -> solo inputs dinámicos (no maqueta)
    const inputs = document.querySelectorAll('.input-ingreso, .input-gastos');

    // Construir arreglo de registros (solo los que tengan monto != 0)
    const datos = Array.from(inputs).map(input => {
      const concepto_id = input.name;             // conceptoid en el atributo name
      const monto = parseFloat(input.value) || 0; // monto numérico
      return {
        fecha: fecha,
        usuario_id: usuarioID,
        concepto_id: concepto_id,
        monto: monto
      };
    }).filter(item => item.monto !== 0);

    const payload = { datos };

    console.log('Enviando:', payload);

    const base = endpoint + `api/gcuenta/enviarDatos/`;
    const qs = new URLSearchParams();
    qs.set('datos', JSON.stringify(payload));

    fetch(`${base}?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 140)}`);
        }
        return resp.json();
      })
      .then(data => {
        console.debug("respuesta enviarDatos:", data);

        if (data?.success){
          this.mostrarMensaje("Los datos se guardaron satisfactoriamente");

          // Refrescos (balance y conceptos por si cambian montos/estado)
          this.traerBalance();
          // opcional: si quieres recargar conceptos también:
          // this.traerConceptos();
        } else {
          this.mostrarMensaje("No se pudo guardar. Revisa la consola / backend.");
        }
      })
      .catch(err => console.error('Error al enviar datos:', err));
  }

  /**
   * FII008
   * mostrarMensaje: muestra un mensaje simple al usuario (alert).
   */
  mostrarMensaje(mensaje){
    alert(mensaje);
  }

  /**
   * FII009
   * traerBalance: consulta el balance del usuario al backend y actualiza la UI con mostrarBalance().
   */
  traerBalance(){
    const url = endpoint + `api/gbalance/traerBalance/?usuarioID=${encodeURIComponent(this.usuarioID)}`;

    try {
      fetch(url)
        .then(async (resp) => {
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 140)}`);
          }
          return resp.json();
        })
        .then(data => {
          console.debug("balance:", data);
          this.mostrarBalance(data.lista);
        })
        .catch(err => console.error("Error traerBalance:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /**
   * FII010
   * mostrarBalance: muestra el total mensual/total general en #total-general.
   * Nota: el código usa lista.total_mensual (según tu implementación).
   */
  mostrarBalance(lista){
    const totalGeneral = document.getElementById('total-general');
    if (!totalGeneral) return;

    // ICI010A: fallback por si cambia el nombre del campo
    const valor = (lista?.total_mensual ?? lista?.total_general ?? lista?.total ?? 0);
    totalGeneral.innerText = valor;
  }

  /**
   * FII011
   * asignarEventos:
   * - .btn-update => clickActualizar
   * - .btn-edit   => clickEditarRegistro
   *
   * Nota:
   * - Si tu página se inyecta dinámicamente (SPA), este constructor debe ejecutarse
   *   después de que el HTML esté en el DOM, o los querySelector pueden dar null.
   */
  asignarEventos() {
    const btnUpdate = document.querySelector('.btn-update');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', (e) => this.clickActualizar(e));
    } else {
      console.warn("No se encontró el botón .btn-update en el DOM");
    }

    const btnEdit = document.querySelector('.btn-edit');
    if (btnEdit) {
      btnEdit.addEventListener('click', (e) => this.clickEditarRegistro(e));
    } else {
      console.warn("No se encontró el botón .btn-edit en el DOM");
    }

    // ICI011A: si el usuario cambia la fecha, recalcular conceptos y limpiar montos si quieres
    const inputFecha = document.getElementById('fecha');
    if (inputFecha) {
      inputFecha.addEventListener('change', () => {
        this.fecha = inputFecha.value;
        this.traerConceptos();
        // opcional: recalcula totales (si hay valores ya escritos)
        this.calcularTotales();
      });
    }
  }

  /**
   * FII012
   * setupIngresoListener: listener alternativo (no usado por el flujo actual).
   * Nota: Este bloque usa variables globales (ingresos/renderIngresos/calcularTotales) y
   * no métodos this.*. Se deja como legado/no recomendado.
   */
  setupIngresoListener() {
    const el = document.getElementById('ingreso-monto');
    if (!el) return;

    el.addEventListener('change', function() {
      const concepto = document.getElementById('ingreso-concepto').value;
      const monto = parseFloat(this.value);

      if (concepto && monto > 0) {
        const conceptoTexto = document.getElementById('ingreso-concepto').selectedOptions[0].text;

        if (conceptoTexto !== 'Nuevo') {
          ingresos.push({ concepto: conceptoTexto, monto: monto });

          document.getElementById('ingreso-concepto').value = '';
          this.value = '';

          renderIngresos();
          calcularTotales();
        } else {
          alert('Funcionalidad de agregar concepto nuevo');
          this.value = '';
        }
      }
    });
  }

  /**
   * FII013
   * setupGastoListener: listener alternativo (no usado por el flujo actual).
   */
  setupGastoListener() {
    const el = document.getElementById('gasto-monto');
    if (!el) return;

    el.addEventListener('change', function() {
      const concepto = document.getElementById('gasto-concepto').value;
      const monto = parseFloat(this.value);

      if (concepto && monto > 0) {
        const conceptoTexto = document.getElementById('gasto-concepto').selectedOptions[0].text;

        if (conceptoTexto !== 'Nuevo') {
          gastos.push({ concepto: conceptoTexto, monto: monto });

          document.getElementById('gasto-concepto').value = '';
          this.value = '';

          renderGastos();
          calcularTotales();
        } else {
          alert('Funcionalidad de agregar concepto nuevo');
          this.value = '';
        }
      }
    });
  }

  /**
   * FII014
   * renderIngresos: renderiza la lista de ingresos como inputs numéricos
   * y agrega listeners para recalcular totales en tiempo real.
   */
  renderIngresos() {
    const list = document.getElementById('ingresos-list');
    if (!list) return;

    list.innerHTML = this.ingresos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount">
          <input
            type="number"
            name="${item.conceptoid}"
            value="${item.monto ?? ''}"
            class="input-ingreso"
            min="0"
            step="0.01"
          />
        </span>
      </div>
    `).join('');

    const inputs = list.querySelectorAll('.input-ingreso');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }

  /**
   * FII015
   * renderGastos: renderiza la lista de gastos como inputs numéricos
   * y agrega listeners para recalcular totales en tiempo real.
   */
  renderGastos() {
    const list = document.getElementById('gastos-list');
    if (!list) return;

    list.innerHTML = this.gastos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount">
          <input
            type="number"
            name="${item.conceptoid}"
            value="${item.monto ?? ''}"
            class="input-gastos"
            min="0"
            step="0.01"
          />
        </span>
      </div>
    `).join('');

    const inputs = list.querySelectorAll('.input-gastos');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }

  /**
   * FII016
   * calcularTotales:
   * - totalIngresos = suma de .input-ingreso
   * - totalGastos   = suma de .input-gastos
   * - balanceDia    = ingresos - gastos
   *
   * Actualiza:
   * - #total-ingresos
   * - #total-gastos
   * - #gasto-hoy (balance del día)
   */
  calcularTotales() {
    const inputsIng = document.querySelectorAll('.input-ingreso');
    const inputsGas = document.querySelectorAll('.input-gastos');

    let totalIngresos = 0;
    let totalGastos = 0;

    inputsIng.forEach(inp => {
      const val = parseFloat(inp.value);
      if (!isNaN(val)) totalIngresos += val;
    });

    inputsGas.forEach(inp => {
      const val = parseFloat(inp.value);
      if (!isNaN(val)) totalGastos += val;
    });

    const balanceDia = totalIngresos - totalGastos;

    const elIng = document.getElementById('total-ingresos');
    const elGas = document.getElementById('total-gastos');
    const elBal = document.getElementById('gasto-hoy');

    if (elIng) elIng.textContent = totalIngresos.toFixed(2);
    if (elGas) elGas.textContent = totalGastos.toFixed(2);
    if (elBal) elBal.textContent = balanceDia.toFixed(2);
  }

  /**
   * FII017
   * clickEditarRegistro:
   * - Consulta montos guardados del usuario para la fecha seleccionada
   * - Endpoint: api/gcuenta/cargarDatosUsuario
   * - Luego reutiliza mostrarCuenta() -> mostrarConceptos()
   */
  clickEditarRegistro() {
    const fecha = document.getElementById('fecha')?.value || this.fecha || "";

    console.debug("editarRegistro:", this.usuarioID, this.token, "fecha:", fecha);

    const url = endpoint +
      `api/gcuenta/cargarDatosUsuario/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}&fecha=${encodeURIComponent(fecha)}`;

    try {
      fetch(url)
        .then(async (resp) => {
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 140)}`);
          }
          return resp.json();
        })
        .then(data => {
          console.debug("datos usuario:", data);
          this.mostrarCuenta(data);
        })
        .catch(err => console.error("Error clickEditarRegistro:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /**
   * FII018
   * mostrarCuenta: reutiliza mostrarConceptos() para pintar conceptos con montos devueltos.
   */
  mostrarCuenta(lista){
    this.mostrarConceptos(lista);
  }

  /**
   * FII019
   * actualizarDatos: placeholder (no integrado al flujo actual).
   */
  actualizarDatos() {
    const fecha = document.getElementById('fecha').value;
    const datos = { fecha, ingresos, gastos };

    alert('Guardar datos en la base de datos');
    console.log('Datos a guardar:', datos);
  }

  /**
   * FII020
   * cargarConceptos: placeholder (no integrado al flujo actual).
   */
  cargarConceptos() {
    console.log('Cargar conceptos desde BD');
  }

  /**
   * FII021
   * init: placeholder; referencia funciones globales (no métodos this.*).
   */
  init() {
    inicializarFecha();
    setupIngresoListener();
    setupGastoListener();
    cargarConceptos();
  }
}
