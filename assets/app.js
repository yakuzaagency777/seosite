/* Balanza — comportamiento común a todas las páginas.
   Todo el contenido está en el HTML: este archivo solo agrega interacción. */
(function () {
  "use strict";

  var store = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var load  = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  /* ── Menú móvil ── */
  var burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", function () {
    var nav = document.getElementById("nav");
    var open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });

  /* ── Tema claro / oscuro ── */
  var saved = load("bz-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  var themeBtn = document.getElementById("theme");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store("bz-theme", next);
  });

  /* ── Verificación de edad ── */
  var gate = document.getElementById("gate");
  if (gate) {
    if (load("bz-age") !== "ok") gate.hidden = false;
    var yes = document.getElementById("gate-yes");
    var no  = document.getElementById("gate-no");
    if (yes) yes.addEventListener("click", function () { store("bz-age", "ok"); gate.hidden = true; });
    if (no) no.addEventListener("click", function () {
      document.getElementById("gate-h").textContent = "Acceso no disponible";
      document.getElementById("gate-text").innerHTML = "Los juegos de azar están permitidos solo para mayores de edad. Si necesitas apoyo o te preocupa alguien cercano, la sección de juego responsable está abierta para todos.";
      document.getElementById("gate-actions").innerHTML =
        '<a class="btn btn-outline btn-block" href="/juego-responsable.html">Ir a juego responsable</a>';
    });
  }

  /* ── Filtros y orden en la página de reseñas ── */
  var list = document.getElementById("reviewList");
  if (list) {
    var cards = Array.prototype.slice.call(list.querySelectorAll(".review"));
    var chips = Array.prototype.slice.call(document.querySelectorAll(".filters .chip"));
    var vacio = document.getElementById("sinResultados");
    var activo = null;

    function aplicar() {
      var visibles = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute("data-tags") || "").split("|");
        var ok = !activo || tags.indexOf(activo) !== -1;
        c.hidden = !ok;
        if (ok) visibles++;
      });
      if (vacio) vacio.hidden = visibles > 0;
      chips.forEach(function (b) {
        b.setAttribute("aria-pressed", String((b.getAttribute("data-tag") || null) === activo));
      });
    }

    function filtrar(tag) {
      activo = tag || null;
      aplicar();
      var url = new URL(window.location.href);
      if (activo) url.searchParams.set("tag", activo); else url.searchParams.delete("tag");
      history.replaceState(null, "", url.pathname + url.search);
    }

    chips.forEach(function (b) {
      b.addEventListener("click", function () { filtrar(b.getAttribute("data-tag")); });
    });

    var inicial = new URLSearchParams(window.location.search).get("tag");
    if (inicial) filtrar(inicial);

    var sort = document.getElementById("sort");
    if (sort) sort.addEventListener("change", function () {
      var k = sort.value;
      var orden = cards.slice().sort(function (a, b) {
        if (k === "payout") return +a.dataset.payout - +b.dataset.payout;
        if (k === "new")    return +b.dataset.founded - +a.dataset.founded;
        return +b.dataset.score - +a.dataset.score;
      });
      orden.forEach(function (c) { list.insertBefore(c, vacio); });
    });
  }

  /* ── Autoevaluación ── */
  var quizBtn = document.getElementById("quizBtn");
  if (quizBtn) quizBtn.addEventListener("click", function () {
    var total = document.querySelectorAll("#quiz .q").length, n = 0;
    for (var i = 0; i < total; i++) {
      var sel = document.querySelector('input[name="q' + i + '"]:checked');
      if (sel && sel.value === "1") n++;
    }
    var box = document.getElementById("quizResult");
    var cls, title, text;
    if (n === 0) {
      cls = "r0";
      title = "No marcaste señales de alerta";
      text = "Es un buen resultado y no cambia lo básico: mantén un presupuesto definido de antemano, configura límites en tu perfil y vuelve a esta autoevaluación cada algunos meses.";
    } else if (n <= 2) {
      cls = "r1";
      title = "Marcaste " + n + " señal" + (n > 1 ? "es" : "") + ". Hay algo a lo que prestarle atención";
      text = "Estas respuestas suelen aparecer bastante antes de que el problema se vuelva grave, y justamente por eso ahora es cuando resulta más fácil corregir el hábito. Fija un límite de depósito firme, tómate una pausa de un par de semanas y conversa la situación con alguien de confianza.";
    } else {
      cls = "r2";
      title = "Marcaste " + n + " señales. Conviene buscar ayuda";
      text = "Esa cantidad de señales indica que el juego ya está afectando tu vida de forma perceptible. No es una condena ni un tema de fuerza de voluntad: es una condición tratable, y mientras antes empieces, más simple resulta. Considera autoexcluirte de las plataformas y pedir una hora con un psicólogo o psiquiatra.";
    }
    box.className = "result show " + cls;
    box.textContent = "";
    var h = document.createElement("h4"); h.textContent = title;
    var p = document.createElement("p"); p.textContent = text;
    box.appendChild(h); box.appendChild(p);
    box.scrollIntoView({ block: "nearest" });
  });

  /* ── Calculadora de presupuesto ── */
  var calc = document.getElementById("calc");
  if (calc) calc.addEventListener("click", function () {
    var libre = Math.max(0, Number(document.getElementById("p1").value) || 0);
    var ses   = Math.max(1, Number(document.getElementById("p2").value) || 1);
    var out   = document.getElementById("planout");
    out.style.display = "block";
    if (libre === 0) {
      out.innerHTML = "<b>$0</b><br>Si no hay dinero libre, no existe un límite seguro. Jugar con plata que necesitas para otra cosa ya dejó de ser entretención.";
    } else {
      out.innerHTML = "<b>$" + Math.floor(libre / ses).toLocaleString("es-CL") + "</b> por sesión<br>" +
        "Es un techo de pérdida, no una meta. Cuando lo alcances, la sesión terminó, aunque sientas que está por darse. " +
        "Configura ese mismo monto como límite de depósito en el operador: una decisión tomada en frío funciona mejor que una promesa.";
    }
  });
  /* ── Formulario de contacto (sin servidor: compone un mailto) ── */
  var form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nombre  = document.getElementById("f-nombre").value.trim();
    var asunto  = document.getElementById("f-asunto").value;
    var mensaje = document.getElementById("f-mensaje").value.trim();
    var error   = document.getElementById("formError");
    if (!nombre || !mensaje) { error.hidden = false; return; }
    error.hidden = true;
    var cuerpo = mensaje + "\n\n— " + nombre;
    window.location.href = "mailto:" + form.dataset.email +
      "?subject=" + encodeURIComponent(asunto) +
      "&body=" + encodeURIComponent(cuerpo);
  });

})();
