/**
 * ICH001
 * Interfaz - Clase InterfazHistorial
 *
 * Propósito:
 * - Consultar el historial al backend por rango de fechas (fecha-inicio → fecha-fin).
 * - Guardar la data “cruda” (listaBase) y generar una “vista” (listaVista) aplicando filtros locales.
 * - Renderizar tabla, contador de movimientos y total neto (Ingresos - Gastos).
 * - Permitir exportación CSV local desde lo que se está viendo.
 *
 * Convención de IDs:
 * - ICH0xx: Identificadores de documentación por bloque/método para trazabilidad.
 */
class InterfazHistorial {
  token;       // Token de autenticación
  tipoUsuario; // Rol del usuario (si aplica para permisos/visibilidad)
  usuario;     // Usuario objetivo (usuario actual o seleccionado)

  /**
   * ICH002
   * Constructor
   * - Inicializa estructuras base para el flujo:
   *   listaBase : data cruda traída del backend (sin filtros locales).
   *   listaVista: data luego de aplicar filtros UI (lo que el usuario ve).
   * - Registra listeners globales (click/input/change).
   */
  constructor() {
    this.listaBase = [];
    this.listaVista = [];
    this.asignarEventosBase();
  }

  /**
   * ICH003
   * mostrarPestana(usuario, token, tipoUsuario)
   * - Inicializa el estado para operar la pestaña de Historial.
   * - Setea fechas por defecto (inicio del mes → hoy).
   * - Ejecuta la primera consulta al backend.
   */
  mostrarPestana(usuario, token, tipoUsuario) {
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;

    this.colocarFechaActual();
    this.traerHistorial();
  }

  /**
   * ICH004
   * colocarFechaActual()
   * - Llena #fecha-inicio con el primer día del mes actual.
   * - Llena #fecha-fin con la fecha actual (hoy).
   * - Formato requerido por <input type="date">: YYYY-MM-DD
   */
  colocarFechaActual() {
    const inputInicio = document.getElementById("fecha-inicio");
    const inputFin = document.getElementById("fecha-fin");
    if (!inputInicio || !inputFin) return;

    const hoy = new Date();

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const hoyFormateado = hoy.toISOString().split("T")[0];

    inputInicio.value = primerDiaMes;
    inputFin.value = hoyFormateado;
  }

  /**
   * ICH005
   * traerHistorial()
   * - Consulta al backend usando:
   *   token, usuarioID, fechainicio (#fecha-inicio) y fechafin (#fecha-fin).
   * - Guarda resultados en listaBase.
   * - Actualiza filtros dinámicos (concepto/usuario) en base a listaBase.
   * - Aplica filtros UI actuales y renderiza.
   */
  async traerHistorial() {
    const ofechainicio = document.getElementById("fecha-inicio");
    const ofechafin = document.getElementById("fecha-fin");

    const fechainicio = ofechainicio?.value || "";
    const fechafin = ofechafin?.value || "";

    const url =
      endpoint +
      `api/gbalance/traerHistorial/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(
        this.usuario
      )}&fechainicio=${encodeURIComponent(fechainicio)}&fechafin=${encodeURIComponent(fechafin)}`;

    try {
      const resp = await fetch(url);

      // ICH006: Validación para evitar errores de JSON cuando el server devuelve HTML o error.
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 140)}`);
      }

      const data = await resp.json();

      // ICH007: Compatibilidad con backend:
      // - { lista: [...] }  o  [...]
      const lista = Array.isArray(data?.lista) ? data.lista : Array.isArray(data) ? data : [];

      this.listaBase = lista;

      this.actualizarFiltrosDinamicos();
      this.aplicarFiltrosUI();
    } catch (error) {
      console.error("Error al traer historial:", error);
      alert("No se pudo obtener el historial. Revisa consola (F12) y el endpoint.");
    }
  }

  // =========================
  // FILTROS UI (Frontend)
  // =========================

  /**
   * ICH008
   * aplicarFiltrosUI()
   * - Lee valores actuales del panel de filtros.
   * - Filtra, busca, aplica rango de montos y orden.
   * - Actualiza listaVista y luego manda a renderTabla().
   *
   * Importante:
   * - Estos filtros NO vuelven a consultar al backend.
   * - La consulta al backend solo ocurre con "Filtrar" (btn-filter) y con "Limpiar" (reinicio).
   */
  aplicarFiltrosUI() {
    const tipo = document.getElementById("tipo-filtro")?.value || "todo";
    const concepto = document.getElementById("concepto-filtro")?.value || "todo";
    const usuario = document.getElementById("usuario-filtro")?.value || "todo";
    const q = (document.getElementById("q")?.value || "").trim().toLowerCase();

    const montoMinRaw = document.getElementById("monto-min")?.value;
    const montoMaxRaw = document.getElementById("monto-max")?.value;
    const montoMin = montoMinRaw === "" || montoMinRaw == null ? NaN : Number(montoMinRaw);
    const montoMax = montoMaxRaw === "" || montoMaxRaw == null ? NaN : Number(montoMaxRaw);

    const orden = document.getElementById("orden")?.value || "fecha_desc";

    let lista = [...this.listaBase];

    // ICH009: Filtro por tipo (Ingreso/Gasto) en base a tipoconconcepto del backend.
    if (tipo !== "todo") {
      const wantIngreso = tipo === "ingresos";
      lista = lista.filter((it) => this.esIngreso(it.tipoconconcepto) === wantIngreso);
    }

    // ICH010: Filtro exacto por concepto (select).
    if (concepto !== "todo") {
      lista = lista.filter((it) => String(it.concepto ?? "") === concepto);
    }

    // ICH011: Filtro exacto por usuario (select).
    if (usuario !== "todo") {
      lista = lista.filter((it) => String(it.usuario ?? "") === usuario);
    }

    // ICH012: Búsqueda libre (id / concepto / usuario).
    if (q) {
      lista = lista.filter((it) => {
        const id = String(it.id ?? "").toLowerCase();
        const con = String(it.concepto ?? "").toLowerCase();
        const usu = String(it.usuario ?? "").toLowerCase();
        return id.includes(q) || con.includes(q) || usu.includes(q);
      });
    }

    // ICH013: Filtros por monto min/max (monto del registro, no neto).
    if (!Number.isNaN(montoMin)) {
      lista = lista.filter((it) => this.toNumber(it.monto) >= montoMin);
    }
    if (!Number.isNaN(montoMax)) {
      lista = lista.filter((it) => this.toNumber(it.monto) <= montoMax);
    }

    // ICH014: Ordenamiento (fecha/monto asc/desc).
    const toTime = (f) => {
      const s = String(f ?? "");
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d.getTime();

      // fallback para YYYY-MM-DD
      const p = s.split("-");
      if (p.length === 3) return new Date(`${p[0]}-${p[1]}-${p[2]}T00:00:00`).getTime();
      return 0;
    };

    const toMonto = (m) => this.toNumber(m);

    switch (orden) {
      case "fecha_asc":
        lista.sort((a, b) => toTime(a.fecha) - toTime(b.fecha));
        break;
      case "fecha_desc":
        lista.sort((a, b) => toTime(b.fecha) - toTime(a.fecha));
        break;
      case "monto_asc":
        lista.sort((a, b) => toMonto(a.monto) - toMonto(b.monto));
        break;
      case "monto_desc":
        lista.sort((a, b) => toMonto(b.monto) - toMonto(a.monto));
        break;
    }

    this.listaVista = lista;
    this.renderTabla(lista);
  }

  // =========================
  // RENDER
  // =========================

  /**
   * ICH015
   * renderTabla(lista)
   * - Inserta filas (<tr>) en .history-table tbody.
   * - Calcula el total neto (Ingresos - Gastos) basado en tipoconconcepto.
   * - Si no hay datos, muestra "Sin resultados" y total = 0.
   */
  renderTabla(lista) {
    const tbody = document.querySelector(".history-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Sin resultados</td></tr>`;
      this.actualizarResumen(0, 0);
      return;
    }

    let totalNeto = 0;

    for (const item of lista) {
      const fecha = this.formatearFecha(item.fecha);
      const tipoTexto = this.convertirTipo(item.tipoconconcepto);
      const monto = this.toNumber(item.monto);

      // ICH016: Neto: ingreso suma, gasto resta (factorTipo -> +1 o -1).
      totalNeto += this.factorTipo(item.tipoconconcepto) * monto;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${this.escapeHtml(item.id ?? "")}</td>
        <td>${this.escapeHtml(fecha)}</td>
        <td>${this.escapeHtml(item.concepto ?? "")}</td>
        <td>${this.escapeHtml(tipoTexto)}</td>
        <td>${this.escapeHtml(item.usuario ?? "")}</td>
        <td>${monto.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }

    this.actualizarResumen(totalNeto, lista.length);
  }

  /**
   * ICH017
   * actualizarResumen(totalNeto, cantidad)
   * - Actualiza el input #text-total con el total neto.
   * - Actualiza #title-movimientos con la cantidad de movimientos renderizados.
   */
  actualizarResumen(totalNeto, cantidad) {
    const oTotal = document.getElementById("text-total");
    if (oTotal) oTotal.value = Number(totalNeto).toFixed(2);

    const oMov = document.getElementById("title-movimientos");
    if (oMov) oMov.textContent = `${cantidad} MOVIMIENTOS`;
  }

  // =========================
  // SELECTS DINÁMICOS (Concepto / Usuario)
  // =========================

  /**
   * ICH018
   * actualizarFiltrosDinamicos()
   * - Lee listaBase y obtiene:
   *   * conceptos únicos -> pobla #concepto-filtro
   *   * usuarios únicos  -> pobla #usuario-filtro
   * - Mantiene selección anterior si el valor sigue existiendo.
   * - Se ejecuta cada vez que se traeHistorial() del backend.
   */
  actualizarFiltrosDinamicos() {
    const selConcepto = document.getElementById("concepto-filtro");
    const selUsuario = document.getElementById("usuario-filtro");

    if (selConcepto) {
      const prev = selConcepto.value || "todo";
      const conceptos = Array.from(
        new Set(this.listaBase.map((x) => String(x.concepto ?? "")).filter((x) => x.trim() !== ""))
      ).sort((a, b) => a.localeCompare(b, "es"));

      selConcepto.innerHTML =
        `<option value="todo">Todos</option>` +
        conceptos.map((c) => `<option value="${this.escapeAttr(c)}">${this.escapeHtml(c)}</option>`).join("");

      selConcepto.value = conceptos.includes(prev) ? prev : "todo";
    }

    if (selUsuario) {
      const prev = selUsuario.value || "todo";
      const usuarios = Array.from(
        new Set(this.listaBase.map((x) => String(x.usuario ?? "")).filter((x) => x.trim() !== ""))
      ).sort((a, b) => a.localeCompare(b, "es"));

      selUsuario.innerHTML =
        `<option value="todo">Todos</option>` +
        usuarios.map((u) => `<option value="${this.escapeAttr(u)}">${this.escapeHtml(u)}</option>`).join("");

      selUsuario.value = usuarios.includes(prev) ? prev : "todo";
    }
  }

  // =========================
  // EVENTOS
  // =========================

  /**
   * ICH019
   * asignarEventosBase()
   * - Click:
   *   * .btn-filter  => recarga desde backend (solo afecta las fechas)
   *   * #btn-limpiar => resetea UI + reconsulta backend
   *   * #btn-export  => exporta CSV (desde vista filtrada si existe)
   * - Input:
   *   * q, monto-min, monto-max => aplica filtros UI en tiempo real
   * - Change:
   *   * tipo-filtro, concepto-filtro, usuario-filtro, orden => aplica filtros UI en tiempo real
   *
   * Nota:
   * - Las fechas NO están auto-reconsultando por change (lo dejaste como opcional comentado).
   */
  asignarEventosBase() {
    document.addEventListener("click", (event) => {
      if (event.target.closest(".btn-filter")) {
        this.traerHistorial();
        return;
      }

      if (event.target.closest("#btn-limpiar")) {
        const setVal = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.value = v;
        };

        setVal("tipo-filtro", "todo");
        setVal("concepto-filtro", "todo");
        setVal("usuario-filtro", "todo");
        setVal("q", "");
        setVal("monto-min", "");
        setVal("monto-max", "");
        setVal("orden", "fecha_desc");

        this.colocarFechaActual();
        this.traerHistorial();
        return;
      }

      if (event.target.closest("#btn-export")) {
        this.exportarCSV?.();
        return;
      }
    });

    // ICH020: Reacción inmediata a campos de texto/número.
    document.addEventListener("input", (event) => {
      const ids = ["q", "monto-min", "monto-max"];
      if (ids.includes(event.target.id)) this.aplicarFiltrosUI();
    });

    // ICH021: Reacción inmediata a selects.
    document.addEventListener("change", (event) => {
      const ids = ["tipo-filtro", "concepto-filtro", "usuario-filtro", "orden"];
      if (ids.includes(event.target.id)) this.aplicarFiltrosUI();

      // Opción: si quieres reconsultar al cambiar fechas, descomenta:
      // if (event.target.id === "fecha-inicio" || event.target.id === "fecha-fin") this.traerHistorial();
    });
  }

  // =========================
  // UTILIDADES
  // =========================

  /**
   * ICH022
   * toNumber(v)
   * - Convierte a número asegurando:
   *   * "12,50" => 12.50
   *   * valores inválidos => 0
   */
  toNumber(v) {
    const n = Number(String(v ?? "0").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * ICH023
   * esIngreso(v)
   * - Determina si tipoconconcepto representa Ingreso.
   * - En tu backend: ingreso suele venir como "1".
   */
  esIngreso(v) {
    return String(v) === "1";
  }

  /**
   * ICH024
   * factorTipo(v)
   * - Devuelve +1 si es ingreso, -1 si es gasto.
   * - Nota: algunos backends pueden traer "2" para gasto -> también se trata como gasto (-1).
   */
  factorTipo(v) {
    return this.esIngreso(v) ? 1 : -1;
  }

  /**
   * ICH025
   * convertirTipo(v)
   * - Convierte tipoconconcepto a texto para la tabla.
   */
  convertirTipo(v) {
    const s = String(v);
    if (s === "1") return "Ingreso";
    if (s === "-1" || s === "2") return "Gasto";
    return "Sin definir";
  }

  /**
   * ICH026
   * formatearFecha(f)
   * - Convierte:
   *   * "YYYY-MM-DD"              => "DD/MM/YYYY"
   *   * "YYYY-MM-DDTHH:mm:ss..."  => "DD/MM/YYYY"
   * - Si no reconoce el formato, devuelve el string original.
   */
  formatearFecha(f) {
    const s = String(f ?? "");
    const base = s.split("T")[0];
    const partes = base.split("-");
    if (partes.length !== 3) return s;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /**
   * ICH027
   * escapeHtml(str)
   * - Sanitiza texto para evitar inyección HTML (XSS) en innerHTML.
   */
  escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /**
   * ICH028
   * escapeAttr(str)
   * - Sanitiza para atributos (value="...") en options.
   */
  escapeAttr(str) {
    return this.escapeHtml(str).replaceAll("`", "&#096;");
  }

  /**
   * ICH029
   * exportarCSV()
   * - Exporta un CSV usando:
   *   * listaVista (si hay filtros aplicados)
   *   * listaBase (si no hay filtros en uso)
   * - Se descarga como: historial_YYYY-MM-DD.csv
   */
  exportarCSV() {
    const rows = this.listaVista?.length ? this.listaVista : this.listaBase;

    const header = ["ID", "Fecha", "Concepto", "Tipo", "Usuario", "Monto"];
    const csv = [header.join(",")];

    for (const it of rows) {
      const line = [
        this.csvCell(it.id),
        this.csvCell(this.formatearFecha(it.fecha)),
        this.csvCell(it.concepto),
        this.csvCell(this.convertirTipo(it.tipoconconcepto)),
        this.csvCell(it.usuario),
        this.csvCell(this.toNumber(it.monto).toFixed(2)),
      ].join(",");
      csv.push(line);
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `historial_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /**
   * ICH030
   * csvCell(v)
   * - Escapa comillas y envuelve el valor en comillas dobles para un CSV válido.
   */
  csvCell(v) {
    const s = String(v ?? "");
    const escaped = s.replaceAll('"', '""');
    return `"${escaped}"`;
  }
}
