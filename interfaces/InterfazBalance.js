class InterfazBalance {
  token;
  tipoUsuario;
  usuario;
  constructor() {
    this.asignarEventosBase();
  }
  /*
    FIB-001
    Mostrar la pestana de balance;
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;
    this.colocarFechaActual();
    this.mostrarCombo();
    this.traerBalance();
  }
  /*
    FIB-002
    coloca la fecha actual en el campo fecha;
  */
  colocarFechaActual(){
    const inputFecha = document.getElementById('fecha');
    if (!inputFecha) return;
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
  }
  /*
    FIB-003
    mostrarCombo: Si el tipo de usuario es administrador, muestra el combo de usuarios
  */
  mostrarCombo(){
    console.debug(this.tipoUsuario);
    if (this.tipoUsuario=="admin"){
      var url = endpoint+`api/gusuario/mostrarUsuarios/?token=${encodeURIComponent(this.token)}`;
      var scope = this;
      try {
        fetch(url)
        .then(resp => {
          return resp.json(); 
        })
        .then(lista => {
          console.debug(lista);
          scope.llenarComboUsuarios(lista);
        })
        .catch(err => console.error("Error:", err));

      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
      }
    }
    
  }
  /*
    FIB-004
    llena el combo con los datos del servidor
  */
  llenarComboUsuarios(lista) {
    const select = document.getElementById('usuario');
    if (!select) return;
  
    // Limpia opciones anteriores
    select.innerHTML = '';
  
    // Recorre la lista JSON y agrega las opciones
    for (const item of lista) {
      const option = document.createElement('option');
      option.value = item.usuarioID;           // valor interno
      option.textContent = item.nombre;        // texto visible
      select.appendChild(option);
    }
  }
   /*
    FIB-005
    TraerBalance, trae el balance del usuario actual
  */
    traerBalance(){
      var scope = this;
      console.debug(this.usuario);
      var ofecha = document.getElementById('fecha');
      var fecha = ofecha.value;
      console.debug(fecha);
      if (this.tipoUsuario=="admin"){
        var url = endpoint+`api/gbalance/traerBalanceLista/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}&tipoUsuario=${encodeURIComponent(this.tipoUsuario)}&fecha=${encodeURIComponent(fecha)}`;
        var scope = this;
        try {
          fetch(url)
          .then(resp => {
            return resp.json(); 
          })
          .then(lista => {
            console.debug(lista);
            scope.mostrarDatos(lista);
            //scope.llenarComboUsuarios(lista);
          })
          .catch(err => console.error("Error:", err));
  
        } catch (error) {
          console.error('Error:', error);
          alert('No se pudo conectar con el servidor.');
        }
      }
      
    }
  mostrarDatos(lista){
    const { listaBalance, listaMovimientos } = lista;

    // --- Actualizar totales ---
    document.getElementById("mensual").textContent = listaBalance?.mensual?.toFixed(2) || "0.00";
    document.getElementById("todos-anos").textContent = listaBalance?.anual?.toFixed(2) || "0.00";

    // --- Dividir movimientos ---
    const ingresos = listaMovimientos.filter(m => m.tipoConcepto === 1);
    const gastos   = listaMovimientos.filter(m => m.tipoConcepto === -1);

    // --- Llenar listas ---
    this.llenarTabla("ingresos-list", ingresos);
    this.llenarTabla("gastos-list", gastos);

    // --- Calcular totales ---
    const totalIngresos = ingresos.reduce((acc, m) => acc + parseFloat(m.monto), 0);
    const totalGastos   = gastos.reduce((acc, m) => acc + parseFloat(m.monto), 0);

    document.getElementById("total-ingresos").textContent = totalIngresos.toFixed(2);
    document.getElementById("total-gastos").textContent   = totalGastos.toFixed(2);
  }
  llenarTabla(idContenedor, movimientos) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";
  
    if (movimientos.length === 0) {
      contenedor.innerHTML = `<div class="table-row" style="opacity:.6;">No hay movimientos</div>`;
      return;
    }
  
    for (const m of movimientos) {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <span class="col-fecha">${this.formatearFecha(m.fecha)}</span>
        <span class="col-concepto">${m.concepto}</span>
        <span class="col-monto">${Number(m.monto).toFixed(2)}</span>
      `;
      contenedor.appendChild(row);
    }
  }
  
  formatearFecha(fechaStr) {
    const [year, month, day] = fechaStr.split('-');
    const f = new Date(year, month - 1, day);
    return f.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  seleccionarHistorial(){
    console.debug('Historial seleccionado');
  }
  seleccionarGraficar(){
    console.debug('Graficar seleccionado');
  }
  Operation1(){
    // método placeholder
  }
  seleccionarUsuario(){
    const select = document.getElementById('usuario');
    if (!select) return;
    console.debug('Usuario seleccionado:', select.value);
  }
  asignarEventosBase(){
    const btnHist = document.querySelector('.btn-history');
    if (btnHist) btnHist.addEventListener('click', () => this.seleccionarHistorial());
    const btnGraph = document.querySelector('.btn-graph');
    if (btnGraph) btnGraph.addEventListener('click', () => this.seleccionarGraficar());
    const usuario = document.getElementById('usuario');
    if (usuario) usuario.addEventListener('change', () => this.seleccionarUsuario());
  }
}