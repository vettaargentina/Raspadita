/*
  ================================================================
  firebase-config.js — Raspadita VETTA
  ================================================================
  Este archivo es OPCIONAL.

  Si lo configurás, los cartones usados se registran en Firebase
  Realtime Database, bloqueando el reuso en cualquier dispositivo
  o navegador (incluyendo incógnito).

  Sin este archivo, el control de uso solo funciona por localStorage
  (por dispositivo / por navegador).

  ─────────────────────────────────────────────────────────────────
  PASO 1: Creá tu proyecto Firebase
  ─────────────────────────────────────────────────────────────────
  1. Entrá a https://console.firebase.google.com/
  2. "Agregar proyecto" → dale un nombre (ej: raspadita-vetta)
  3. Desactivar Google Analytics (no es necesario) → Crear proyecto

  ─────────────────────────────────────────────────────────────────
  PASO 2: Activar Realtime Database
  ─────────────────────────────────────────────────────────────────
  1. En el panel: Build → Realtime Database → Create Database
  2. Elegí la región más cercana (ej: us-central1)
  3. Modo: "Start in test mode" (lo restringimos en el paso 4)

  ─────────────────────────────────────────────────────────────────
  PASO 3: Obtener la configuración
  ─────────────────────────────────────────────────────────────────
  1. Project Settings (ícono ⚙️) → General
  2. Scroll down → "Your apps" → Add app → Web (</>)
  3. Nombre: raspadita → Register app
  4. Copiá el objeto firebaseConfig y pegalo abajo

  ─────────────────────────────────────────────────────────────────
  PASO 4: Configurar reglas de seguridad (IMPORTANTE)
  ─────────────────────────────────────────────────────────────────
  En Realtime Database → Rules, pegá estas reglas:

  {
    "rules": {
      "used_cards": {
        "$cardId": {
          ".read":  true,
          ".write": "!data.exists()"
        }
      }
    }
  }

  ↑ Esto permite marcar un cartón como usado UNA SOLA VEZ.
    Una vez marcado, NADIE puede sobreescribirlo ni borrarlo.

  ─────────────────────────────────────────────────────────────────
  PASO 5: Reemplazá los valores de abajo
  ─────────────────────────────────────────────────────────────────
*/

window.FIREBASE_CONFIG = {
  apiKey:            "REEMPLAZÁ-CON-TU-API-KEY",
  authDomain:        "TU-PROYECTO.firebaseapp.com",
  databaseURL:       "https://TU-PROYECTO-default-rtdb.firebaseio.com",
  projectId:         "TU-PROYECTO",
  storageBucket:     "TU-PROYECTO.appspot.com",
  messagingSenderId: "TU-SENDER-ID",
  appId:             "TU-APP-ID",
};
