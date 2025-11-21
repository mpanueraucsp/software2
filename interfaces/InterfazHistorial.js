class InterfazHistorial {
  token;
  tipoUsuario;
  usuario;
  constructor() {
    this.asignarEventosBase();
  }
  /*
    FIG001
    Mostrar la pestana de Grafico;
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;
    this.colocarFechaActual();
    this.traerHistorial();
  }
  /*
    FIG002
    coloca la fecha actual en el campo fecha;
  */
  colocarFechaActual(){
    const inputFechaInicio = document.getElementById('fecha-inicio');
    const inputFechaFin = document.getElementById('fecha-fin');

    if (!inputFechaInicio || !inputFechaFin) return;

    // Obtener fecha actual
    const hoy = new Date();

    // Primer día del mes actual → día 1
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // Fecha de hoy formateada YYYY-MM-DD
    const hoyFormateado = hoy.toISOString().split('T')[0];

    // Asignar valores
    inputFechaInicio.value = primerDiaMes;
    inputFechaFin.value = hoyFormateado;
  }
  /*
    FIH003
    Traer el historial
  */
    traerHistorial(){
      var scope = this;
      console.debug(this.usuario);
      var ofechainicio = document.getElementById('fecha-inicio');
      var ofechafin = document.getElementById('fecha-fin');
      var fechainicio = ofechainicio.value;
      var fechafin = ofechafin.value;
      var url = endpoint+`api/gbalance/traerHistorial/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}&fechainicio=${encodeURIComponent(fechainicio)}&fechafin=${encodeURIComponent(fechafin)}`;
      var scope = this;
      try {
        fetch(url)
        .then(resp => {
          return resp.json(); 
        })
        .then(lista => {
          console.debug(lista);
          scope.mostrarDatosHistorial(lista);
          //scope.llenarComboUsuarios(lista);
        })
        .catch(err => console.error("Error:", err));

      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
      }
    }
  /*
    FIH004
    Traer el historial
  */
    mostrarDatosHistorial(data){
      const tbody = document.querySelector(".history-table tbody");

      // Limpia el contenido actual
      tbody.innerHTML = "";

      // Si no hay datos
      if (!data.lista || data.lista.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;">Sin resultados</td></tr>
        `;
        return;
      }
      var total = 0.00;
      data.lista.forEach(item => {
        
            // Formateo de fecha a DD/MM/YYYY
            const fecha = this.formatearFechaYYYYMMDD(item.fecha);

            // Convertir periodicidad (si en tu BD es 1,2,3…)
            const periodicidadTexto = this.convertirPeriodicidad(item.periodicidad);
            const tipoTexto = this.convertirTipo(item.tipoconconcepto);
            total+=item.tipoconconcepto*item.monto;
            // Crear fila
            const tr = document.createElement("tr");

            tr.innerHTML = `
              <td>${item.id}</td>
              <td>${fecha}</td>
              <td>${item.concepto}</td>
              <td>${tipoTexto}</td>
              <td>${item.usuario}</td>
              <td>${parseFloat(item.monto).toFixed(2)}</td>
        `;

        tbody.appendChild(tr);
      });
      var oTotal = document.getElementById('text-total');
      console.debug(oTotal, total);
      oTotal.value = total;
    }
    formatearFechaYYYYMMDD(f) {
      const partes = f.split("-"); // [YYYY, MM, DD]
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    convertirPeriodicidad(valor) {
      switch (valor) {
        case "1": return "Diario";
        case "2": return "Semanal";
        case "3": return "Mensual";
        case "4": return "Anual";
        default: return "Sin definir";
      }
    }
    convertirTipo(valor) {
      switch (valor) {
        case "1": return "Ingreso";
        case "-1": return "Gasto";
        default: return "Sin definir";
      }
    }
 asignarEventosBase() {
  // Clicks en toda la página; filtramos por clases
  document.addEventListener('click', (event) => {
    const btnHist = event.target.closest('.btn-filter');
    if (btnHist) {
      this.traerHistorial();
      return;
    }
  });

  // Cambios en el combo de usuario
  document.addEventListener('change', (event) => {
    if (event.target.id === 'usuario') {
      this.seleccionarUsuario();
    }
  });
}

}