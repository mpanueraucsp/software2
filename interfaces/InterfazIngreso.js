class InterfazIngreso {
  usuarioID;
  token;
  fecha;
  constructor() {
    this.colocarFechaActual();
    this.asignarEventos();
  }
  mostrarPestana(usuarioID, token){
    this.usuarioID = usuarioID;
    this.token = token;
    this.fecha = "";
    console.debug(usuarioID, token);
    this.traerConceptos();
  }
  ingresos = [];
  gastos = [];
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
  // Inicializar fecha actual
  colocarFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    this.fecha = today;
  }
  clickActualizar(e){
    const usuarioID = this.usuarioID; // asumimos que estás dentro de una clase y tienes usuarioID definido
    const fecha = document.getElementById('fecha').value; // obtiene la fecha del input date
    
    // buscar todos los inputs dentro de span.item-amount
    const inputs = document.querySelectorAll('span.item-amount input[type="text"]');
    
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
  mostrarBalance(lista){
    //console.debug(lista);
    const totalGeneral = document.getElementById('total-general'); // obtiene el elemento total general
    totalGeneral.innerText = lista.total_general;
    //console.debug(totalGeneral);
  }
  asignarEventos() {

    const btn = document.querySelector('.btn-update');
    if (btn) {
      // Usa función flecha para mantener el contexto del "this"
      btn.addEventListener('click', (e) => this.clickActualizar(e));
    } else {
      console.warn(" No se encontró el botón .btn-update en el DOM");
    }
  }
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

  // Renderizar lista de ingresos
  renderIngresos() {
    const list = document.getElementById('ingresos-list');
    list.innerHTML = this.ingresos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount"><input type="text" name='${item.conceptoid}'></input></span>
      </div>
    `).join('');
  }

  // Renderizar lista de gastos
  renderGastos() {
    const list = document.getElementById('gastos-list');
    list.innerHTML = this.gastos.map(item => `
      <div class="item">
        <span class="item-name">${item.nombre}</span>
        <span class="item-amount"><input type="text" name='${item.conceptoid}'></input></span>
      </div>
    `).join('');
  }

  // Calcular todos los totales
  calcularTotales() {
    const totalIngresos = this.ingresos.reduce((sum, item) => sum + item.monto, 0);
    const totalGastos = this.gastos.reduce((sum, item) => sum + item.monto, 0);
    const totalGeneral = totalIngresos - totalGastos;

    document.getElementById('total-ingresos').textContent = totalIngresos.toFixed(2);
    document.getElementById('total-gastos').textContent = totalGastos.toFixed(2);
    document.getElementById('total-ingresos').textContent = "";
    document.getElementById('total-gastos').textContent = "";
    //document.getElementById('gasto-hoy').textContent = totalGastos.toFixed(2)||0.00;
    //document.getElementById('total-general').textContent = totalGeneral.toFixed(2);
    document.getElementById('gasto-hoy').textContent = "0.00";
    document.getElementById('total-general').textContent = "0.00";
  }

  // Buscar datos por fecha
  buscarPorFecha() {
    const fecha = document.getElementById('fecha').value;
    
    // Aquí irá la llamada a tu API PHP
    // fetch(`../api/buscar-por-fecha.php?fecha=${fecha}`)
    //   .then(response => response.json())
    //   .then(data => {
    //     ingresos = data.ingresos;
    //     gastos = data.gastos;
    //     renderIngresos();
    //     renderGastos();
    //     calcularTotales();
    //   });
    
    alert('Buscar datos para fecha: ' + fecha);
    console.log('Fecha seleccionada:', fecha);
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