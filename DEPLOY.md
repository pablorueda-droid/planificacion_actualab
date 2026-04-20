# Despliegue en Render — Planificación ActuaLab

## Credenciales configuradas
- **Usuario:** pablo
- **Contraseña:** actuaria2026

---

## Opción A: Despliegue desde GitHub (recomendado)

### 1. Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `planificacion-actualab` (puede ser privado)
3. Crea el repositorio

### 2. Subir archivos
Abre terminal en la carpeta `deploy-render` y ejecuta:
```bash
git init
git add -A
git commit -m "Initial deploy: Planificación Área Digital TI 2026"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/planificacion-actualab.git
git push -u origin main
```

### 3. Desplegar en Render
1. Ve a https://render.com y crea una cuenta (puedes usar GitHub)
2. Click **New** → **Web Service**
3. Conecta tu repositorio `planificacion-actualab`
4. Render detectará automáticamente la configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Selecciona plan **Free**
6. Click **Deploy**

Tu aplicativo estará disponible en: `https://planificacion-actualab.onrender.com`

---

## Opción B: Despliegue directo sin GitHub

1. Ve a https://render.com → **New** → **Web Service**
2. Selecciona **Deploy from a public Git repository** o usa **Upload**
3. Configura manualmente:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

---

## Cambiar credenciales

Edita `server.js`, línea de users:
```js
users: {
  'pablo': 'actuaria2026',
  'lenin': 'otraContraseña'  // agregar más usuarios
}
```

## Estructura del proyecto
```
deploy-render/
├── server.js          ← Servidor Express + autenticación
├── package.json       ← Dependencias
├── render.yaml        ← Configuración de Render
├── public/
│   └── index.html     ← Aplicativo HTML (planificación + bonos)
└── .gitignore
```
