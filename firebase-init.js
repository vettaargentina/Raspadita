/* ============================================================
   firebase-init.js — Raspadita VETTA
   Configuración central de Firebase.
   Incluido via <script> en index.html y dashboard.html.

   ¿Por qué la API Key puede estar en el repo público?
   La clave web de Firebase NO es un secreto: identifica el proyecto
   pero no otorga permisos. La seguridad la dan las Reglas de
   Seguridad de Realtime Database (realtime-db.rules).
   Referencia: https://firebase.google.com/support/guides/security-checklist
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAjmqWanmhiEGR4M0NwP5fbth7hfOBvwqg",
  authDomain:        "studio-3802717013-d03a3.firebaseapp.com",
  databaseURL:       "https://studio-3802717013-d03a3-default-rtdb.firebaseio.com",
  projectId:         "studio-3802717013-d03a3",
  storageBucket:     "studio-3802717013-d03a3.firebasestorage.app",
  messagingSenderId: "850472532831",
  appId:             "1:850472532831:web:f3bbd43cab23456fd0d4ea",
};

/* Inicializa Firebase y expone window.__firebaseDB.
   Se llama automáticamente al cargar este script.
   Si las SDKs fallan (sin internet, bloqueadas), la app
   sigue funcionando solo con localStorage. */
(function () {
  var cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.databaseURL) return;

  function loadScript(src, onload, onerror) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    s.onerror = onerror || function () {
      console.warn('Firebase SDK no pudo cargarse:', src);
    };
    document.head.appendChild(s);
  }

  var CDN = 'https://www.gstatic.com/firebasejs/10.7.1/';
  loadScript(CDN + 'firebase-app-compat.js', function () {
    loadScript(CDN + 'firebase-database-compat.js', function () {
      try {
        // Evitar doble inicialización si el script se incluye dos veces
        var app = firebase.apps.length
          ? firebase.app()
          : firebase.initializeApp(cfg);
        window.__firebaseDB = firebase.database(app);
        console.log('✅ Firebase conectado — Realtime Database activa');
        // Disparar evento para que los módulos que esperan Firebase puedan reaccionar
        document.dispatchEvent(new Event('firebase:ready'));
      } catch (e) {
        console.warn('Firebase init failed:', e.message);
      }
    });
  });
})();
