class InterfazIngreso {
  usuarioID;
  token;
  fecha;
  constructor() {
    this.colocarFechaActual();
    this.asignarEventos();
  }
  //FIC001
  //Funcion que se encarga de mostrar la pestaña de configuracion
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;
    this.token = token;
    this.fecha = "";
    console.debug(usuarioID, token);
    this.traerConceptos();
  }
  ingresos = [];
  gastos = [];
  //FIC002
  //Funcion que se encarga de traer los conceptos
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
        scope.mostrarConceptos(data);
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
  //FIC003
  //Funcion que se encarga de mostrar los conceptos
  mostrarConceptos(data){
    for (const item of data) {
      console.debug(item.tipoconcepto);
      if (item.tipoconconcepto=="1"){
        console.debug("ingresos");
        this.ingresos.push(item);
      }else{
        this.gastos.push(item);
      }
    }
    console.debug(this.ingresos);
    console.debug(this.gastos);
    this.renderIngresos();
    this.renderGastos();
    this.calcularTotales();
  }
  //FIC004
  //Funcion que se encarga de 
  // Inicializar fecha actual
  colocarFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    this.fecha = today;
  }
  //FIC005
  //Funcion que se encarga de actualizar
  clickActualizar(e){
    const usuarioID = this.usuarioID; // asumimos que estás dentro de una clase y tienes usuarioID definido
    const fecha = document.getElementById('fecha').value; // obtiene la fecha del input date
    
    // buscar todos los inputs dentro de span.item-amount
    const inputs = document.querySelectorAll('input[type="number"]');
    //const inputs = document.querySelectorAll('span.item-amount input[type="text"]');
    
    // construir el arreglo de datos
    const datos = Array.from(inputs).map(input => {
      console.debug(input);
      const concepto_id = input.name; // el name del input
      const monto = parseFloat(input.value) || 0; // convertir a número, o 0 si está vacío
      return {
        fecha: fecha,
        usuario_id: usuarioID,
        concepto_id: concepto_id,
        monto: monto
      };
    }).filter(item => item.monto !== 0); // opcional: solo enviar los que tengan monto distinto de 0

    // armar el cuerpo JSON
    const payload = { datos: datos };

    console.log('Enviando:', payload);

    //const base = 'http://localhost/software2/software2/api/gcuenta/enviarDatos/';
    var base = endpoint+`api/gcuenta/enviarDatos/`;
    const qs = new URLSearchParams();
    qs.set('datos', JSON.stringify(payload)); // encodifica seguro

    fetch(`${base}?${qs.toString()}`, {
      method: 'POST',                // POST con parámetros en la URL
      headers: { 'Accept': 'application/json' } // Content-Type no es necesario si no mandas body
    })
    .then(resp => resp.json())
    .then(data => {
        console.debug(data.success)
        if (data.success){
          this.mostrarMensaje("Los datos se guardaron satisfactoriamente");
          this.traerBalance();
        }
      })
    .catch(err => console.error('Error al enviar datos:', err));
  }
  //FIC006
  //Funcion que se encarga de mostrar mensajes
  mostrarMensaje(mensaje){
    alert(mensaje);
  }
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
        this.mostrarBalance(data.lista);
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
  //FIC007
  //Funcion que se encarga de mostrar el balance
  mostrarBalance(lista){
    //console.debug(lista);
    const totalGeneral = document.getElementById('total-general'); // obtiene el elemento total general
    totalGeneral.innerText = lista.total_general;
    //console.debug(totalGeneral);
  }
  //FIC008
  //Funcion que se encarga de asignar eventos
  asignarEventos() {

    const btn = document.querySelector('.btn-update');
    if (btn) {
      // Usa función flecha para mantener el contexto del "this"
      btn.addEventListener('click', (e) => this.clickActualizar(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }
    const btn1 = document.querySelector('.btn-edit');
    if (btn1) {
      // Usa función flecha para mantener el contexto del "this"
      btn.addEventListener('click', (e) => this.clickEditarRegistro(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }
  }
  //FIC009
  // Agregar ingreso cuando se ingresa un monto
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
          // Aquí iría la lógica para agregar un concepto nuevo
          alert('Funcionalidad de agregar concepto nuevo');
          this.value = '';
        }
      }
    });
  }
  //FIC010
  // Agregar ingreso cuando se ingresa un monto
  // Agregar gasto cuando se ingresa un monto
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
          // Aquí iría la lógica para agregar un concepto nuevo
          alert('Funcionalidad de agregar concepto nuevo');
          this.value = '';
        }
      }
    });
  }
  //FIC012
  // Renderizar lista de ingresos
  renderIngresos() {
    const list = document.getElementById('ingresos-list');

    // Renderizar los inputs
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

    // 🔹 Después de crear los inputs, agregar eventos para totalizar
    const inputs = list.querySelectorAll('.input-ingreso');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }
  //FIC013
  // Renderizar lista de gastos
  renderGastos() {
    const list = document.getElementById('gastos-list');

    // Renderizar los inputs
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

    // 🔹 Después de crear los inputs, agregar eventos para totalizar
    const inputs = list.querySelectorAll('.input-gastos');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calcularTotales());
    });
  }
  //FIC014
  // Calcular todos los totales
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

    // Mostrar el total con dos decimales
    //document.getElementById('total-ingresos').textContent = total.toFixed(2);
    const totalIngresos = total;
    //const totalGastos = this.gastos.reduce((sum, item) => sum + item.monto, 0);
    //const totalGastos = totalGastos;
    const totalGeneral = totalIngresos - totalGastos;
    //console.debug(document.getElementById('total-ingresos'), totalIngresos.toFixed(2));
    document.getElementById('total-ingresos').textContent = totalIngresos.toFixed(2);
    document.getElementById('total-gastos').textContent = totalGastos.toFixed(2);
    //document.getElementById('total-ingresos').textContent = "";
    //document.getElementById('total-gastos').textContent = "";
    document.getElementById('gasto-hoy').textContent = totalGeneral.toFixed(2)||0.00;
    //document.getElementById('total-general').textContent = totalGeneral.toFixed(2);
    //document.getElementById('gasto-hoy').textContent = "0.00";
    //document.getElementById('total-general').textContent = "0.00";
  }
  //FIC015
  // Editar
  clickEditarRegistro() {
    const fecha = document.getElementById('fecha').value;
    console.debug(this.usuarioID, this.token);
    var url = endpoint+`api/gcuenta/cargarDatosUsuario/?usuarioID=${encodeURIComponent(this.usuarioID)}&token=${encodeURIComponent(this.token)}&fecha=${encodeURIComponent(this.fecha)}`;
    var scope = this;
    try {
      fetch(url)
      .then(resp => {
        return resp.json(); 
      })
      .then(data => {
        console.debug(data);
        scope.mostrarCuenta(data);
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }

  }
  mostrarCuenta(lista){

  }

  // Guardar/Actualizar datos
  actualizarDatos() {
    const fecha = document.getElementById('fecha').value;
    const datos = {
      fecha: fecha,
      ingresos: ingresos,
      gastos: gastos
    };
    
    // Aquí irá la llamada a tu API PHP
    // fetch('../api/guardar-datos.php', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(datos)
    // })
    //   .then(response => response.json())
    //   .then(result => {
    //     alert('Datos guardados correctamente');
    //   });
    
    alert('Guardar datos en la base de datos');
    console.log('Datos a guardar:', datos);
  }

  // Cargar conceptos desde la base de datos
  cargarConceptos() {
    // Aquí irá la llamada a tu API PHP para obtener los conceptos
    // fetch('../api/obtener-conceptos.php')
    //   .then(response => response.json())
    //   .then(conceptos => {
    //     const selectIngresos = document.getElementById('ingreso-concepto');
    //     const selectGastos = document.getElementById('gasto-concepto');
    //     
    //     conceptos.forEach(concepto => {
    //       const option = `<option value="${concepto.id}">${concepto.nombre}</option>`;
    //       selectIngresos.innerHTML += option;
    //       selectGastos.innerHTML += option;
    //     });
    //   });
    
    console.log('Cargar conceptos desde BD');
  }

  // Inicializar la página
  init() {
    inicializarFecha();
    setupIngresoListener();
    setupGastoListener();
    cargarConceptos();
  }
    
}