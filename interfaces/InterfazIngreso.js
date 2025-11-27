/**
 * ICI001
 * Interfaz - Clase InterfazIngreso.
 * Propósito: gestionar la vista de "Ingreso diario":
 * - Cargar conceptos según periodicidad y fecha
 * - Separar conceptos en ingresos y gastos
 * - Mostrar inputs para registrar montos por concepto
 * - Enviar datos a backend (guardarDatos)
 * - Consultar datos guardados (cargarDatosUsuario) para editar
 * - Calcular totales (ingresos, gastos y balance del día)
 * - Mostrar balance mensual/total desde backend
 */
class InterfazIngreso {
  usuarioID; // ID del usuario en sesión
  token;     // Token de autenticación
  fecha;     // Fecha seleccionada para trabajar registros diarios

  /**
   * ICI002
   * Constructor: coloca fecha actual e inicializa eventos de la vista.
   */
  constructor() {
    this.colocarFechaActual();
    this.asignarEventos();
  }

  // ICI003
  // mostrarPestana: inicializa la pestaña "Ingreso diario" con usuario y token.
  // - Carga conceptos disponibles por periodicidad
  // - Carga balance para mostrar resumen
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;
    this.token = token;
    this.fecha = "";
    console.debug(usuarioID, token);

    this.traerConceptos(); // Carga conceptos por fecha/periodicidad
    this.traerBalance();   // Carga balance (resumen)
  }

  ingresos = []; // Lista de conceptos tipo ingreso (tipoconconcepto = 1)
  gastos = [];   // Lista de conceptos tipo gasto (tipoconconcepto != 1)

  // ICI004
  // traerConceptos: consume el endpoint que retorna conceptos válidos para la fecha (periodicidad).
  // Usa api/gconcepto/traerConceptoPorPeriodicidad con usuarioID, token y fecha.
  traerConceptos(){
    console.debug(this.usuarioID, this.token);

    var url = endpoint+`api/gconcepto/traerConceptoPorPeriodicidad/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}&fecha=${encodeURIComponent(this.fecha)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        console.debug(data);
        scope.mostrarConceptos(data); // Separa conceptos y renderiza inputs
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  // ICI005
  // mostrarConceptos: separa los conceptos recibidos en ingresos y gastos y actualiza la UI.
  // - Luego renderiza inputs y calcula totales.
  mostrarConceptos(data){
    this.ingresos = [];
    this.gastos = [];

    for (const item of data) {
      console.debug(item.tipoconcepto);

      // Tipo 1 => ingreso; cualquier otro => gasto (según tu lógica)
      if (item.tipoconconcepto=="1"){
        console.debug("ingresos");
        this.ingresos.push(item);
      } else {
        this.gastos.push(item);
      }
    }

    console.debug(this.ingresos);
    console.debug(this.gastos);

    this.renderIngresos();    // Dibuja lista de ingresos
    this.renderGastos();      // Dibuja lista de gastos
    this.calcularTotales();   // Totaliza valores actuales en inputs
  }

  // ICI006
  // colocarFechaActual: inicializa el input de fecha con hoy y guarda this.fecha.
  colocarFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    this.fecha = today;
  }

  // ICI007
  // clickActualizar: recolecta los montos ingresados y envía el payload hacia el backend (guardarDatos).
  // - Lee todos los inputs numéricos (ingresos y gastos)
  // - Construye payload { datos: [...] }
  // - Envía por POST a api/gcuenta/enviarDatos con parámetro "datos" en querystring
  // - Si success: muestra mensaje y refresca balance
  clickActualizar(e){
    const usuarioID = this.usuarioID;
    const fecha = document.getElementById('fecha').value;

    // Obtener todos los inputs number (ingresos y gastos)
    const inputs = document.querySelectorAll('input[type="number"]');

    // Construir arreglo de registros (solo los que tengan monto != 0)
    const datos = Array.from(inputs).map(input => {
      console.debug(input);
      const concepto_id = input.name;                      // conceptoid en el atributo name
      const monto = parseFloat(input.value) || 0;          // monto numérico
      return {
        fecha: fecha,
        usuario_id: usuarioID,
        concepto_id: concepto_id,
        monto: monto
      };
    }).filter(item => item.monto !== 0);

    // Payload final esperado por la función guardarDatos (jsonb)
    const payload = { datos: datos };

    console.log('Enviando:', payload);

    var base = endpoint+`api/gcuenta/enviarDatos/`;
    const qs = new URLSearchParams();
    qs.set('datos', JSON.stringify(payload)); // Encodifica el JSON en querystring

    fetch(`${base}?${qs.toString()}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    })
    .then(resp => resp.json())
    .then(data => {
        console.debug(data.success)
        if (data.success){
          this.mostrarMensaje("Los datos se guardaron satisfactoriamente");
          this.traerBalance(); // Refresca balance para reflejar cambios
        }
      })
    .catch(err => console.error('Error al enviar datos:', err));
  }

  // ICI008
  // mostrarMensaje: muestra un mensaje simple al usuario (alert).
  mostrarMensaje(mensaje){
    alert(mensaje);
  }

  // ICI009
  // traerBalance: consulta el balance del usuario al backend y actualiza la UI con mostrarBalance().
  traerBalance(){
    var url = endpoint+`api/gbalance/traerBalance/?usuarioID=${encodeURIComponent(this.usuarioID)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        console.debug(data);
        this.mostrarBalance(data.lista); // Pinta los totales en pantalla
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  // ICI010
  // mostrarBalance: muestra el total mensual/total general en el componente #total-general.
  // Nota: el código usa lista.total_mensual (según tu implementación).
  mostrarBalance(lista){
    const totalGeneral = document.getElementById('total-general');
    totalGeneral.innerText = lista.total_mensual;
  }

  // ICI011
  // asignarEventos: asigna eventos principales de la vista:
  // - .btn-update => guardar/actualizar datos (clickActualizar)
  // - .btn-edit   => cargar datos guardados del día (clickEditarRegistro)
  asignarEventos() {
    const btn = document.querySelector('.btn-update');
    if (btn) {
      btn.addEventListener('click', (e) => this.clickActualizar(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }

    const btn1 = document.querySelector('.btn-edit');
    console.debug("entro a asignar eventos", btn1);
    if (btn1) {
      btn1.addEventListener('click', (e) => this.clickEditarRegistro(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }
  }

  // ICI012
  // setupIngresoListener: listener alternativo (no usado por el flujo actual de inputs dinámicos).
  // - Escucha cambios en #ingreso-monto para agregar a una lista "ingresos" (variables globales en este bloque).
  setupIngresoListener() {
    document.getElementById('ingreso-monto').addEventListener('change', function() {
      const concepto = document.getElementById('ingreso-concepto').value;
      const monto = parseFloat(this.value);

      if (concepto && monto > 0) {
        const conceptoTexto = document.getElementById('ingreso-concepto').selectedOptions[0].text;

        if (conceptoTexto !== 'Nuevo') {
          ingresos.push({ concepto: conceptoTexto, monto: monto });

          // Limpiar campos
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

  // ICI013
  // setupGastoListener: listener alternativo (no usado por el flujo actual de inputs dinámicos).
  setupGastoListener() {
    document.getElementById('gasto-monto').addEventListener('change', function() {
      const concepto = document.getElementById('gasto-concepto').value;
      const monto = parseFloat(this.value);

      if (concepto && monto > 0) {
        const conceptoTexto = document.getElementById('gasto-concepto').selectedOptions[0].text;

        if (conceptoTexto !== 'Nuevo') {
          gastos.push({ concepto: conceptoTexto, monto: monto });

          // Limpiar campos
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

  // ICI014
  // renderIngresos: renderiza la lista de ingresos como inputs numéricos y agrega listeners de totalización.
  renderIngresos() {
    const list = document.getElementById('ingresos-list');

    // Genera HTML con inputs; name = conceptoid
    list.innerHTML = this.ingresos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount">
          <input 
            type="number" 
            name="${item.conceptoid}" 
            value="${item.monto || ''}" 
            class="input-ingreso"
            min="0"
            step="0.01"
          />
        </span>
      </div>
    `).join('');

    // Agregar eventos input para recalcular totales en tiempo real
    const inputs = list.querySelectorAll('.input-ingreso');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }

  // ICI015
  // renderGastos: renderiza la lista de gastos como inputs numéricos y agrega listeners de totalización.
  renderGastos() {
    const list = document.getElementById('gastos-list');

    list.innerHTML = this.gastos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount">
          <input 
            type="number" 
            name="${item.conceptoid}" 
            value="${item.monto || ''}" 
            class="input-gastos"
            min="0"
            step="0.01"
          />
        </span>
      </div>
    `).join('');

    // Agregar eventos input para recalcular totales en tiempo real
    const inputs = list.querySelectorAll('.input-gastos');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }

  // ICI016
  // calcularTotales: suma ingresos y gastos desde los inputs actuales y actualiza la UI.
  // - totalIngresos = suma de .input-ingreso
  // - totalGastos   = suma de .input-gastos
  // - totalGeneral  = ingresos - gastos
  // Actualiza: #total-ingresos, #total-gastos y #gasto-hoy
  calcularTotales() {
    const inputs = document.querySelectorAll('.input-ingreso');
    var total = 0;
    var totalGastos = 0;

    inputs.forEach(inp => {
      const val = parseFloat(inp.value);
      if (!isNaN(val)) total += val;
    });

    const gastos = document.querySelectorAll('.input-gastos');
    gastos.forEach(inp => {
      const val = parseFloat(inp.value);
      if (!isNaN(val)) totalGastos += val;
    });

    const totalIngresos = total;
    const totalGeneral = totalIngresos - totalGastos;

    document.getElementById('total-ingresos').textContent = totalIngresos.toFixed(2);
    document.getElementById('total-gastos').textContent = totalGastos.toFixed(2);
    document.getElementById('gasto-hoy').textContent = totalGeneral.toFixed(2)||0.00;
  }

  // ICI017
  // clickEditarRegistro: consulta los montos guardados del usuario para la fecha seleccionada
  // y vuelve a renderizar la vista con mostrarCuenta().
  clickEditarRegistro() {
    const fecha = document.getElementById('fecha').value;
    console.debug(this.usuarioID, this.token);

    // Endpoint que retorna conceptos con monto cargado (obtenerCuentaUsuario)
    var url = endpoint+`api/gcuenta/cargarDatosUsuario/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}&fecha=${encodeURIComponent(fecha)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        console.debug(data);
        scope.mostrarCuenta(data); // Renderiza conceptos con montos existentes
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  // ICI018
  // mostrarCuenta: reutiliza mostrarConceptos() para pintar conceptos con montos devueltos.
  mostrarCuenta(lista){
    this.mostrarConceptos(lista)
  }

  // ICI019
  // actualizarDatos: función placeholder (no integrada al flujo actual).
  actualizarDatos() {
    const fecha = document.getElementById('fecha').value;
    const datos = {
      fecha: fecha,
      ingresos: ingresos,
      gastos: gastos
    };

    alert('Guardar datos en la base de datos');
    console.log('Datos a guardar:', datos);
  }

  // ICI020
  // cargarConceptos: función placeholder (no integrada al flujo actual).
  cargarConceptos() {
    console.log('Cargar conceptos desde BD');
  }

  // ICI021
  // init: función placeholder; referencia funciones globales (no métodos this.*).
  init() {
    inicializarFecha();
    setupIngresoListener();
    setupGastoListener();
    cargarConceptos();
  }

}
