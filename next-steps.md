# 🎰 Raspadita VETTA — Próximos pasos

## Estado actual del proyecto

| Archivo | Estado | Descripción |
|---|---|---|
| `index.html` | ✅ Listo | Cartón del usuario, carga Firebase opcionalmente |
| `card.js` | ✅ Listo | Raspado, shuffle visual, anti-cheat por localStorage |
| `dashboard.html` | ✅ Listo | Panel admin con 4 pestañas |
| `dashboard.js` | ✅ Listo | CRUD premios, generador, copiar links |
| `style.css` | ✅ Listo | Diseño dark/gold premium |
| `firebase-config.js` | 🟡 Template | Completar con tus datos cuando quieras activar el anti-cheat global |
| `assets/logo.png` | ⏳ Pendiente | Reemplazar con tu logo real |
| `README.md` | ✅ Listo | Instrucciones de deploy |

---

## 🚀 Paso 1 — Deploy en GitHub Pages (prioridad)

```
1. Creá un repositorio en github.com (puede ser privado)
2. Subí todos los archivos al repositorio
   ├── index.html
   ├── dashboard.html
   ├── card.js
   ├── dashboard.js
   ├── style.css
   ├── firebase-config.js
   ├── README.md
   └── assets/
       └── logo.png     ← tu logo acá
3. Settings → Pages → Branch: main / root → Save
4. En 2-3 minutos tu URL será:
   https://TU-USUARIO.github.io/TU-REPO
```

> [!IMPORTANT]
> Una vez que tengas la URL de GitHub Pages, configurala en el dashboard:
> **⚙️ Configuración → URL base → Guardá**
> Así los links que generás apuntan a la URL pública, no a localhost.

---

## 🖼️ Paso 2 — Logo

Tenés dos opciones:

**Opción A (recomendada para producción):** Colocá tu archivo `logo.png` en la carpeta `assets/` del repositorio. El logo carga automáticamente en todos los cartones.

**Opción B (solo para el admin):** Dashboard → ⚙️ Configuración → subí el archivo. Queda guardado en el navegador del admin únicamente.

---

## 🔒 Paso 3 — Firebase (opcional, para cuando escales)

Sin Firebase, el control de uso es **por dispositivo + por sesión**. Suficiente para empezar.

Con Firebase, el control es **global** — si alguien usó el cartón en cualquier dispositivo del mundo, queda bloqueado para siempre.

> Instrucciones completas dentro de `firebase-config.js` (5 pasos, ~5 minutos).

---

## 🎮 Workflow operativo diario

```
1. Abrís dashboard en tu computadora
2. Generás N cartones (ej: 20)
3. Los links se guardan en "Mis cartones"
4. Copiás cada link y lo enviás por WhatsApp/email al cliente
5. El cliente raspa, ve su premio, te manda captura de pantalla
6. Vos verificás: número de cartón + premio coincide con el link generado
7. Si el cliente cumple con la compra → entregás el premio
```

---

## 💡 Mejoras futuras posibles

### Corto plazo
- [ ] **Activar Firebase** para control de uso global (incógnito/otro dispositivo)
- [ ] **Exportar cartones a CSV** — links + premios en una planilla
- [ ] **Cartones por lote con nombre de cliente** — generar link personalizado
- [ ] **Vista previa del cartón** antes de enviarlo

### Mediano plazo
- [ ] **QR por cartón** — en vez de link largo, generá un QR para imprimir/compartir
- [ ] **Historial de canjes** — marcar qué cartones ya fueron canjeados físicamente
- [ ] **Múltiples campañas** — distintos conjuntos de premios activos a la vez
- [ ] **Fecha de expiración personalizable** por cartón (hoy es fijo 30 días)

### Largo plazo
- [ ] **Backend completo** (Firebase + autenticación) para estadísticas reales
- [ ] **Notificación automática** al admin cuando un cartón es usado
- [ ] **Versión imprimible** del cartón con QR para eventos presenciales

---

## 🐛 Bugs conocidos / limitaciones actuales

| Limitación | Impacto | Solución |
|---|---|---|
| Anti-cheat solo por localStorage | Usuario puede raspar de nuevo en incógnito o desde otro dispositivo | Activar Firebase |
| Logo del admin no viaja con el link | El cliente ve el logo solo si `assets/logo.png` está en el repo | Subir logo al repo |
| Los premios están codificados en el link | Un usuario técnico puede decodificar el base64 del URL y ver todos sus premios | Aceptable para el caso de uso; Firebase agrega una capa extra |
| No hay panel de estadísticas | No sabés cuántos cartones fueron usados en total sin Firebase | Activar Firebase |

---

## 📞 Soporte técnico

Para continuar el desarrollo, abrí una nueva conversación con Antigravity con el contexto:
> *"Soy el proyecto Raspadita VETTA, el repo está en [URL de GitHub]. Quiero agregar [feature]."*
