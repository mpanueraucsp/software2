/**
 * ICG001
 * Interfaz - Clase InterfazGrafico.
 * Propósito: gestionar la vista de Gráficos:
 * - Consultar al backend el resumen de ingresos y gastos por concepto
 * - Renderizar gráficos (pie y barras) usando Chart.js
 */
class InterfazGrafico {
  token;       // Token de autenticación
  tipoUsuario; // Rol/perfil del usuario
  usuario;     // Usuario seleccionado / usuario actual

  /**
   * ICG002
   * Constructor: inicializa la interfaz y asigna eventos base.
   */
  constructor() {
    this.asignarEventosBase();
  }

  /*
    ICG003
    mostrarPestana: inicializa la pestaña de Gráficos con usuario/token/tipoUsuario
    y dispara la consulta al backend para traer resumen de ingresos/gastos.
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;             // Guarda token
    this.tipoUsuario = tipoUsuario; // Guarda rol
    this.usuario = usuario;         // Guarda usuario objetivo
    this.traerGraficoIngreso(this.token, this.usuario); // Carga data del gráfico
  }

  /*
    ICG004
    traerGraficoIngreso: consulta al backend el resumen (ingresos y gastos) para graficar.
    - Llama a api/gbalance/traerGraficoIngresos con token y usuarioID
    - Al recibir respuesta, llama a mostrarImagen() para renderizar
  */
  traerGraficoIngreso(token, usuario){
    // Endpoint que retorna: { ingresos: [...], gastos: [...] }
    var url = endpoint+`api/gbalance/traerGraficoIngresos/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}`;
    var scope = this;

    try {
      fetch(url)
      .then(resp => {
        return resp.json();
      })
      .then(lista => {
        console.debug(lista);
        scope.mostrarImagen(lista); // Renderiza los gráficos con la data recibida
      })
      .catch(err => console.error("Error:", err));

    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /*
    ICG005
    mostrarImagen: procesa la data (ingresos/gastos) y construye:
    - Gráfico pie de ingresos y barras de ingresos
    - Gráfico pie de gastos y barras de gastos
    Solo dibuja si hay datos en cada grupo.
  */
  mostrarImagen(lista){
    var scope = this;

    // Data esperada desde backend
    const ingresos = lista.ingresos;
    const gastos = lista.gastos;

    // Etiquetas y valores de ingresos
    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => i.total_monto);

    // Etiquetas y valores de gastos
    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => g.total_monto);

    // --- INGRESOS ---
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

    // --- GASTOS ---
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

  /*
    ICG006
    generarColores: genera una paleta de colores reutilizable para gráficos (n elementos).
    - Usa una lista base y repite si n supera el tamaño base.
    *
    * @param {number} n Cantidad de colores requeridos.
    * @return {Array<string>} Lista de strings rgba para backgroundColor.
  */
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
        colores.push(base[i % base.length]); // Repite colores si faltan
    }
    return colores;
  }

  /*
    ICG007
    asignarEventosBase: asigna listeners globales.
    - Actualmente el click handler está vacío (placeholder).
    - En change, detecta cambios del select #usuario para ejecutar seleccionarUsuario().
  */
  asignarEventosBase() {
    // Clicks en toda la página; filtramos por clases
    document.addEventListener('click', (event) => {
      // placeholder: no hay acciones definidas
    });

    // Cambios en el combo de usuario
    document.addEventListener('change', (event) => {
      if (event.target.id === 'usuario') {
        this.seleccionarUsuario(); // Nota: este método no está definido en este archivo
      }
    });
  }

}
