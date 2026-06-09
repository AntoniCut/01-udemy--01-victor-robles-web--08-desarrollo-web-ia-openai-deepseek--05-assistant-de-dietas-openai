# 05 - Assistant de Dietas Semanales con OpenAI

Asistente conversacional de dietas semanales personalizadas implementado con **JavaScript**, **Node.js**, **Express** y la **API de Chat Completions de OpenAI**. El frontend es un chat estático servido por el propio backend, y el backend expone un endpoint `POST /api/nutri-chatbot` que recopila los datos del usuario (peso, altura, objetivo, alergias, alimentos que no le gustan y comidas diarias) y genera una dieta semanal personalizada en formato tabla markdown, renderizada en el frontend con `markdown-it`.

Repositorio: https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--05-assistant-de-dietas-openai

---

## Tabla de contenidos

1. [Stack tecnologico](#stack-tecnologico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Variables de entorno](#variables-de-entorno)
4. [Despliegue en local](#despliegue-en-local)
5. [Despliegue en produccion (VPS + Nginx)](#despliegue-en-produccion-vps--nginx)
6. [Endpoint API](#endpoint-api)
7. [Flujo conversacional](#flujo-conversacional)
8. [Build de produccion con Gulp](#build-de-produccion-con-gulp)
9. [Licencia](#licencia)

---

## Stack tecnologico

- **Backend:** Node.js (ES Modules), Express 5, OpenAI Node SDK 6 (Chat Completions API).
- **Frontend:** HTML + CSS + JS estaticos servidos desde `public/`. `main.js` como modulo ES con importacion local de `markdown-it` para renderizar tablas markdown.
- **Build:** Gulp 5 (terser, clean-css, htmlmin) para generar `dist/`.
- **Dev server:** Nodemon.
- **Despliegue:** Nginx como reverse proxy + PM2 como process manager.

Dependencias principales (`package.json`):

| Paquete     | Version  | Uso                                              |
|-------------|----------|--------------------------------------------------|
| express     | ^5.2.1   | Servidor HTTP y middleware                       |
| openai      | ^6.16.0  | SDK de OpenAI (Chat Completions API)             |
| dotenv      | ^17.2.3  | Carga de variables de entorno                    |
| axios       | 1.8.1    | Cliente HTTP (utilidades internas)               |
| markdown-it | ^14.2.0  | Renderizado de tablas markdown en el frontend    |

---

## Estructura del proyecto

```
05-assistant-de-dietas-openai/
├── app.js                  # Servidor Express + endpoint /api/nutri-chatbot
├── gulpfile.js             # Tareas de build (minificacion, copia a dist/)
├── package.json
├── pnpm-lock.yaml
├── .env                    # Variables de entorno (NO subir al repo)
├── .gitignore
├── jsconfig.json
├── public/                 # Frontend estatico
│   ├── index.html
│   └── assets/
│       ├── css/
│       ├── img/
│       └── js/
│           ├── main.js             # Modulo ES principal del chat
│           └── vendor/             # Dependencias frontend locales
│               ├── markdown-it.min.js
│               └── markdown-it.esm.js
└── types/                  # Tipos JSDoc
```

---

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
# Puerto del servidor (en produccion, > 1024 para no necesitar root)
PORT=1115

# API key de OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

Notas:

- `OPENAI_API_KEY` es **obligatoria**. Sin ella, el endpoint devolvera `500`.
- A diferencia del proyecto 03, este proyecto **no usa Assistants API**, por lo que no se necesita `OPENAI_ASSISTANT_ID`.
- El archivo `.env` esta incluido en `.gitignore`. **No lo subas al repositorio**.

---

## Despliegue en local

### Requisitos

- Node.js >= 18 (recomendado 20 LTS o superior).
- npm (incluido con Node) o pnpm.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--05-assistant-de-dietas-openai.git
cd 05-assistant-de-dietas-openai

# 2. Instalar dependencias
npm install
# o, si prefieres pnpm:
pnpm install

# 3. Crear el archivo .env
nano .env
#   PORT=1115
#   OPENAI_API_KEY=sk-proj-...

# 4. Arrancar en modo desarrollo (con nodemon)
npm run start
# o en modo produccion simple:
npm run serve
```

La aplicacion estara disponible en:

```
http://localhost:1115/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai/
```

> El puerto por defecto del codigo es `3000`, pero este proyecto usa `1115` para evitar conflicto con otros proyectos del portfolio. Puedes cambiar `PORT` en `.env`.

---

## Despliegue en produccion (VPS + Nginx)

Arquitectura: **Nginx** (reverse proxy + SSL con Let's Encrypt) -> **Node.js** gestionado con **PM2** en el mismo VPS.

### 1. Subir el codigo al VPS

Con FileZilla, sube todo el contenido del proyecto (excepto `node_modules`, `.env` y `dist/`) a:

```
/var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai
```

### 2. Instalar dependencias en el VPS (sin devDependencies)

Conecta por SSH y ejecuta:

```bash
cd /var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai

# Crear el .env de produccion (con tus claves reales)
nano .env
#   PORT=1115
#   OPENAI_API_KEY=sk-proj-...

# Instalar solo dependencias de produccion
npm install --omit=dev
```

> Importante: en Linux, los puertos < 1024 requieren root. Usa `PORT=1115` o cualquier puerto >= 1024 para no necesitar privilegios.

### 3. Arrancar con PM2 (persiste al cerrar SSH)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Arrancar la app
pm2 start app.js --name dietas-openai

# Configurar arranque automatico tras reinicio del servidor
pm2 startup
pm2 save
```

Comandos utiles de PM2:

```bash
pm2 status                    # Ver estado
pm2 logs dietas-openai        # Ver logs en tiempo real
pm2 restart dietas-openai     # Reiniciar
pm2 stop dietas-openai        # Detener
pm2 delete dietas-openai      # Eliminar del registro
```

### 4. Configurar Nginx como reverse proxy

Edita el bloque `server` de tu vhost (`/etc/nginx/sites-available/udemy.antonydev.tech` o donde lo tengas) y añade una `location`:

```nginx
location ^~ /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai {
    proxy_pass http://localhost:1115;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> Usa `^~` para que Nginx no intente servir archivos estaticos directamente desde `root` antes de hacer proxy.

Recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Verificar

```
https://udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai/
```

---

## Endpoint API

### `POST /api/nutri-chatbot`

Recibe un mensaje del usuario y gestiona el flujo conversacional para recopilar los datos necesarios para generar la dieta semanal personalizada. Una vez completados todos los datos, genera la dieta usando la Chat Completions API de OpenAI.

**Request body:**

```json
{
  "message": "75",
  "userId": 1718345678901
}
```

**Respuesta 200 (exito - siguiente pregunta):**

```json
{
  "reply": "¿Cuanto mides (cm)?"
}
```

**Respuesta 200 (exito - dieta generada):**

```json
{
  "reply": "¡Aqui tienes tu dieta! \n\n | Dia | Comida | Alimentos | Nombre del plato | Calorias |\n|---|---|---|---|---|\n| Lunes | Desayuno | ..."
}
```

**Respuesta 400 (solicitud invalida):**

```json
{
  "reply": "Solicitud invalida. Se requieren los campos \"userId\" de tipo number y \"message\" de tipo string."
}
```

**Respuesta 500 (error interno / fallo de OpenAI):**

```json
{
  "reply": "Error al generar la dieta. Por favor, intentalo de nuevo mas tarde."
}
```

Tambien accesible en la ruta con prefijo:

```
POST /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai/api/nutri-chatbot
```

---

## Flujo conversacional

El asistente realiza las siguientes preguntas en orden, almacenando cada respuesta por `userId`:

| Paso | Pregunta del asistente                        | Dato recopilado        |
|------|-----------------------------------------------|------------------------|
| 1    | Mensaje de bienvenida + ¿Cual es tu peso (kg)? | `peso`                 |
| 2    | ¿Cuanto mides (cm)?                            | `altura`               |
| 3    | ¿Cual es tu objetivo?                          | `objetivo`             |
| 4    | ¿Tienes alguna alergia?                        | `alergias`             |
| 5    | ¿Que alimentos no te gustan?                   | `alimentosNoGustan`    |
| 6    | ¿Cuantas comidas diarias haces?                | `comidasDiarias`       |

Tras recopilar los 6 datos, se envia la peticion a OpenAI con un prompt de nutricionista experto. La respuesta (tabla markdown con la dieta semanal) se renderiza en el frontend como tabla HTML usando `markdown-it`.

Una vez generada la dieta, los datos del usuario se resetean para permitir una nueva consulta.

---

## Build de produccion con Gulp

El proyecto incluye un `gulpfile.js` que genera una version minificada del frontend y copia el backend a `dist/`:

```bash
npm run build
```

Salida: carpeta `dist/` con HTML/CSS/JS minificados, `app.js`, `vendor/` con `markdown-it` y un `package.json` minimo.

Para ejecutar el build:

```bash
npm run start:prod
```

---

## Licencia

ISC © AntonyDev
