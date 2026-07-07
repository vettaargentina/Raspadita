# 🎰 Raspadita VETTA

App web de raspadita virtual con premio garantizado. Cada cartón tiene 9 premios ocultos; el usuario raspa **uno** y descubre su premio al instante. 100% frontend — no requiere servidor.

---

## 📁 Estructura

```
raspadita/
├── index.html       ← Cartón (lo abre el usuario)
├── dashboard.html   ← Panel admin (vos)
├── card.js          ← Lógica del cartón
├── dashboard.js     ← Lógica del panel
├── style.css        ← Estilos compartidos
├── assets/
│   └── logo.png     ← Tu logo (reemplazá este archivo)
└── README.md
```

---

## 🚀 Deploy en GitHub Pages

1. **Creá un repo** en GitHub (ej: `raspadita`)
2. **Subí todos los archivos** al repo (incluido tu `logo.png` en la carpeta `assets/`)
3. En el repo → **Settings → Pages → Source: main / root**
4. Tu URL base será: `https://TU_USUARIO.github.io/raspadita`

---

## ⚙️ Configuración inicial (una sola vez)

1. Abrí `dashboard.html` en tu navegador
2. Pestaña **⚙️ Configuración**:
   - Subí tu logo PNG desde "Logo de la marca"
   - Ingresá tu URL de GitHub Pages (ej: `https://miusuario.github.io/raspadita`)
   - Guardá
3. Pestaña **🏆 Premios**: editá los premios por defecto con los tuyos reales

---

## 🎴 Generar y distribuir cartones

1. Pestaña **🎴 Generar cartones**
2. Indicá la cantidad y presioná **Generar**
3. Cada cartón genera un link único (ej: `https://miusuario.github.io/raspadita/index.html?card=VET-AB1234&p=...`)
4. Copiá y compartí el link con cada cliente (WhatsApp, email, etc.)

---

## 🕹️ Experiencia del usuario

1. El cliente abre el link en su celular
2. Ve el cartón con 9 círculos metálicos
3. Raspa **uno solo** con el dedo
4. Al revelar ~45% del círculo, se descubre su premio
5. Los otros 8 círculos se revelan automáticamente
6. Aparece un modal con: ícono del premio, nombre, valor y fecha de vencimiento
7. El cliente toma una **captura de pantalla** y te la manda para canjear

---

## 🔒 Anti-trampa

- El estado "usado" se guarda en el navegador (`localStorage`) del cliente
- Si intenta reabrir el mismo link → ve la pantalla **"CARTÓN USADO"**
- Si abre el link en otro dispositivo, el cartón funciona pero los premios son **fijos** (están en el link), así que no puede cambiar el resultado raspando "de nuevo"
- La captura de pantalla con N° de cartón y fecha sirve como comprobante para el organizador

> **Nota**: Para una validación más robusta en el futuro, se podría agregar un backend sencillo (Firebase / Supabase) para registrar cartones usados a nivel global.

---

## ⏳ Validez de los premios

Cada cartón tiene una validez de **30 días** desde su emisión. La fecha aparece en el cartón y en el modal del premio.

---

## 🖼️ Logo

- Colocá tu logo en `assets/logo.png`
- O desde el dashboard → Configuración → subí el archivo (se guarda en el navegador del admin)
- Para que el logo aparezca en los cartones de los clientes: **el archivo debe estar en el repo** como `assets/logo.png`

---

## 💡 Tips

- Podés editar los premios en cualquier momento, pero los cartones **ya generados** conservan sus premios originales (están codificados en el link)
- Si cambiás los premios, generá nuevos cartones
- Generá cartones de a lotes (ej: 50 a la vez) y guardá los links en una planilla
- Los links funcionan en cualquier dispositivo con internet
