class InterfazGrafico {
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
    this.traerGraficoIngreso(this.token, this.usuario);
  }
  /*
    FIG002
    coloca la fecha actual en el campo fecha;
  */
  traerGraficoIngreso(token, usuario){
    var url = endpoint+`api/gbalance/traerGraficoIngresos/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}`;
    var scope = this;
    try {
      fetch(url)
      .then(resp => {
        return resp.json(); 
      })
      .then(lista => {
        console.debug(lista);
        scope.mostrarImagen(lista);
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }

  }
  mostrarImagen(lista){
    var scope = this;
    //const ingresos = <?= json_encode($ingresos, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;
    //const gastos   = <?= json_encode($gastos,   JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;
    const ingresos = lista.ingresos;
    const gastos = lista.gastos;

    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => i.total_monto);

    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => g.total_monto);


    // Solo pintar gráficos si hay datos
    if (ingresos.length > 0) {
        const coloresIngresos = this.generarColores(ingresoData.length);
        // Pie INGRESOS
        new Chart(document.getElementById('pieIngresos'), {
            type: 'pie',
            data: {
                labels: ingresoLabels,
                datasets: [{
                    data: ingresoData,
                    backgroundColor: coloresIngresos
                }]
            }
        });

        // Barra INGRESOS
        new Chart(document.getElementById('barIngresos'), {
            type: 'bar',
            data: {
                labels: ingresoLabels,
                datasets: [{
                    data: ingresoData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#4b5563' }
                    },
                    y: {
                        ticks: { color: '#4b5563' }
                    }
                }
            }
        });
    }

    if (gastos.length > 0) {
        const coloresGastos = this.generarColores(gastoData.length);

        // Pie GASTOS
        new Chart(document.getElementById('pieGastos'), {
            type: 'pie',
            data: {
                labels: gastoLabels,
                datasets: [{
                    data: gastoData,
                    backgroundColor: coloresGastos
                }]
            }
        });

        // Barra GASTOS
        new Chart(document.getElementById('barGastos'), {
            type: 'bar',
            data: {
                labels: gastoLabels,
                datasets: [{
                    data: gastoData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#4b5563' }
                    },
                    y: {
                        ticks: { color: '#4b5563' }
                    }
                }
            }
        });
    }
  }
  // Utilidad: genera una paleta básica según cantidad de datos
  generarColores(n) {
    const base = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(234, 179, 8, 0.8)'
    ];
    const colores = [];
    for (let i = 0; i < n; i++) {
        colores.push(base[i % base.length]);
    }
    return colores;
  }
 asignarEventosBase() {
  // Clicks en toda la página; filtramos por clases
  document.addEventListener('click', (event) => {
    
  });

  // Cambios en el combo de usuario
  document.addEventListener('change', (event) => {
    if (event.target.id === 'usuario') {
      this.seleccionarUsuario();
    }
  });
}

}