class InterfazBalance {
  token;
  tipoUsuario;
  constructor() {
    this.asignarEventosBase();
    this.colocarFechaActual();
    this.mostrarComboUsuario();
  }
  mostrarPestana(token, tipoUsuario){
    this.token = token;
    this.tipoUsuario = tipoUsuario;
  }
  colocarFechaActual(){
    const inputFecha = document.getElementById('fecha');
    if (!inputFecha) return;
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
  }
  mostrarComboUsuario(){
    const lista = [
      { value: 'yo', label: 'Yo' },
      { value: 'padre', label: 'Padre' },
      { value: 'madre', label: 'Madre' },
      { value: 'hijo', label: 'Hijo' },
      { value: 'hija', label: 'Hija' },
      { value: 'esposa', label: 'Esposa' },
    ];
    this.llenarComboUsuarios(lista);
  }
  llenarComboUsuarios(lista){
    const select = document.getElementById('usuario');
    if (!select) return;
    select.innerHTML = '';
    for (const item of lista) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    }
    select.value = 'yo';
  }
  mostrarDatos(lista){
    const ingresosList = document.getElementById('ingresos-list');
    const gastosList = document.getElementById('gastos-list');
    if (!ingresosList || !gastosList) return;
    ingresosList.innerHTML = '';
    gastosList.innerHTML = '';
    if (!lista) return;
    for (const ingreso of (lista.ingresos || [])) {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <span class="col-fecha">${ingreso.fecha || ''}</span>
        <span class="col-concepto">${ingreso.concepto || ''}</span>
        <span class="col-monto">${ingreso.monto || ''}</span>
      `;
      ingresosList.appendChild(row);
    }
    for (const gasto of (lista.gastos || [])) {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <span class="col-fecha">${gasto.fecha || ''}</span>
        <span class="col-concepto">${gasto.concepto || ''}</span>
        <span class="col-monto">${gasto.monto || ''}</span>
      `;
      gastosList.appendChild(row);
    }
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