# NutriIA 🌱

PWA de nutrición y actividad, en español, responsive y **sin servicios externos ni facturación**. Edición inicial 1.0.

## Qué funciona

- **Inicio**: resumen diario de energía, proteínas, carbohidratos y grasas, acceso a recetas y actividad.
- **Diario**: desayuno, comida, merienda y cena; entradas con cantidades por gramos, kilogramos, mililitros, litros, unidades y raciones; edición, borrado, cambio de fecha, totales y datos desconocidos señalados.
- **Alimentos**: búsqueda, favoritos, alimentos personalizados y productos de marca aportados por la persona usuaria, modificación y borrado. Los alimentos de ejemplo son **aproximados y no verificados**.
- **Micronutrientes**: desglose de azúcares, fibra, grasas saturadas, sodio, calcio, hierro, potasio, magnesio, fósforo, zinc, vitaminas A, C, D, E, B6, B12 y folato, cuando la información se conozca. Se muestran como desconocidos cuando no hay datos. Es una selección, no una base exhaustiva de micronutrientes.
- **Recetas**: sugerencias sencillas, filtros, favoritas, recetas propias, ingredientes, tiempo, preparación, raciones escalables y cómputos por ración y receta; añadir una receta como entrada única, sin duplicar ingredientes.
- **Comidas guardadas**: guardar desde el diario, editar sus ingredientes y cantidades, duplicar, reutilizar y borrar.
- **Objetivos**: perfil local con nombre opcional, edad, peso, altura, sexo para fórmula, actividad y objetivo editable; estimaciones adultas de energía y ejemplo de distribución de macros y porcentajes editables. **No se sugieren déficits ni superávits a menores**.
- **Actividad**: pasos manuales por día, entrenamientos con fecha, duración y notas; edición/borrado; registro e historial de peso.
- **Texto**: estimador local de comidas mediante patrones explícitos, como `150 g arroz blanco cocido; 100 g pechuga de pollo cocida`. No reconoce lenguaje libre arbitrario.
- **Foto**: permite seleccionar o capturar una imagen como referencia visual **sin subirla ni guardarla**; NO analiza automáticamente la imagen.
- **Privacidad**: datos en `localStorage` por navegador y perfil del navegador; descarga JSON, importa copia y borrado.
- **PWA**: manifiesto, iconos y Service Worker de caché para acceso sin conexión tras la primera carga exitosa en un sitio HTTPS compatible.

## Limitaciones conocidas

1. **No hay cuentas reales** ni sincronización ni separación entre varias personas que utilicen el mismo perfil de navegador. Cada dispositivo/navegador guarda datos distintos. Si se borra la información del navegador, se puede perder el historial: **exportar copias**.
2. **No cuenta pasos automáticamente**: por limitaciones de las PWA para leer sensores de salud y registrar actividad persistente entre plataformas; introduce pasos manualmente.
3. **No hay IA visual de comidas**: para ello hará falta evaluar más adelante modelos locales o una API (previo consentimiento y presupuesto). La foto no puede conocer directamente aceite, ingredientes ocultos ni micronutrientes.
4. Las recetas y alimentos de ejemplo son orientativos, sin una fuente verificada. Los campos nutricionales desconocidos no se deben interpretar como cero. Calorías indicadas son los datos declarados por alimento, no una inferencia precisa a partir de los macronutrientes.
5. No se han verificado todas las posibles variantes de navegadores o lectores de pantalla. El test de interfaz corre sobre Chromium con documento aislado y almacenamiento simulado; no equivale a una prueba de la publicación real en GitHub Pages ni del funcionamiento offline.
6. Al usar `localStorage`, el almacenamiento es pequeño, no está cifrado y no conviene en equipos compartidos. No sirve para datos de múltiples usuarios autenticados.

## Ejecutar en ordenador

No hay que instalar dependencias del proyecto. Necesitas un servidor local para permitir módulos JavaScript y Service Worker:

```bash
cd NutriIA
python -m http.server 8765
```

Abre **http://localhost:8765** en el navegador. No abras `index.html` directamente como `file://` (los módulos y el modo offline pueden fallar). En un móvil, es más sencillo instalarla desde un alojamiento HTTPS.

## Ejecutar las pruebas

Con Node.js 20 o superior:

```bash
npm test
```

Pruebas de interfaz opcionales con Python, Playwright y Chromium instalados:

```bash
python tests/browser-smoke.py
```

Esta última prueba usa documento aislado con simulación de `localStorage`; no realiza pruebas de GitHub Pages ni de Service Workers reales.

## Publicar con GitHub Pages sin pagar

1. Crea en GitHub un repositorio público nuevo, por ejemplo `nutriia`. No subas datos personales exportados (archivos `NutriIA-copia-*.json`).
2. Sube **todos los archivos del proyecto** a la raíz del repositorio, incluida la carpeta `js`, `assets`, `tests`, `index.html`, `sw.js` y `manifest.webmanifest`. También puedes hacer `git init`, `git add .`, `git commit -m "Primera versión de NutriIA"`, `git branch -M main`, añadir tu remoto con `git remote add origin URL` y `git push -u origin main`.
3. En el repositorio abre **Settings → Pages**. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/(root)`. Guarda.
4. Después de la publicación, la dirección habitualmente tendrá la forma `https://TU-USUARIO.github.io/nutriia/`. GitHub puede necesitar unos minutos para publicar. No se ha creado ni verificado un enlace real desde esta entrega.
5. Abre la web desde Android/Chrome y selecciona «Añadir a pantalla de inicio» o «Instalar aplicación», si el navegador ofrece la opción. En iPhone/Safari, compartir → «Añadir a pantalla de inicio», según versión.

**Importante**: GitHub Pages ofrece alojamiento estático gratuito para repositorios públicos bajo las condiciones de GitHub. El código del repositorio público queda visible para cualquier persona, pero los datos del diario **no se suben al repositorio**. Las cuotas y condiciones de GitHub pueden cambiar. No se ha habilitado facturación.

## Evolución futura: cuentas reales

Si se solicitan perfiles sincronizados entre móviles, no crear un formulario falso de registro. Una opción es **Supabase Auth + Postgres** con tablas de diarios, recetas, actividad y perfil y políticas RLS por `auth.uid()`, siempre probadas con dos cuentas aisladas. La versión gratuita puede tener límites o suspensiones; revisar las condiciones antes de activarla. No se ha integrado, no se han usado claves ni se han creado recursos externos.

## Estructura

```text
NutriIA/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── styles.css
│   ├── icon-192.png
│   └── icon-512.png
├── js/
│   ├── app.mjs     # vistas y eventos
│   ├── core.mjs    # fórmulas, unidades y validaciones
│   ├── seed.mjs    # ejemplos orientativos
│   └── store.mjs   # lectura, validación, importación y migración
└── tests/
    ├── core.test.mjs
    └── browser-smoke.py
```

## Uso responsable

Esta es una herramienta de registro educativo, no una herramienta diagnóstica. Los valores estimados de mantenimiento y macros son orientativos, no objetivos obligatorios. Para menores, embarazo o situaciones médicas, no emplear recomendaciones automáticas de cambio de peso; consultar a profesionales cualificados.
