# SKYCLASH 3D

**SKYCLASH 3D** es un juego de lucha arcade en plataformas flotantes, ejecutado directamente en el navegador. Combina combates en 3D, desplazamiento lateral, daño porcentual, expulsiones de la arena y rivales controlados por inteligencia artificial.

## Características

- **4 luchadores** con estilos y habilidades diferentes: Kael, Vespera, Titán-G y Lyra.
- **3 escenarios**: Templo del Cielo, Santuario de los Pilares y Cumbre del Volcán Dorado.
- **Combate rápido** para elegir luchador, rival, arena y dificultad (5 niveles de IA).
- **Torneo progresivo** de 3 rondas con rivales y dificultades crecientes.
- Ataques ligeros, smash, habilidades especiales, recuperación, salto doble y escudo.
- **3 vidas por combate**; el daño acumulado incrementa la posibilidad de ser expulsado.
- Récords locales (torneos ganados, mejor tiempo y KOs), guardados en `localStorage` del navegador.
- Gráficos 3D con **Three.js/WebGL**, interfaz con React y efectos de sonido.

## Tecnologías

React 19 · TypeScript · Three.js · Vite 8 · Tailwind CSS 4 · Lucide React.

Es una aplicación **frontend**: para jugar localmente no necesitás iniciar una API, una base de datos ni un servidor backend separado.

## Requisitos

- **Git** para clonar el repositorio (o descargar el ZIP desde GitHub).
- **Node.js compatible con Vite 8:** Node 20.19 o superior dentro de la rama 20, **Node 22.12 o superior** dentro de la rama 22, o una versión mayor compatible. **Node 22.11.0 no sirve**.
- **npm** (incluido con Node.js) o **Bun**.
- Un navegador moderno con **WebGL habilitado** y, preferentemente, aceleración gráfica.

Comprobá las versiones desde PowerShell, CMD o una terminal:

```bash
node -v
npm -v
git --version
```

Si usás **nvm-windows**, por ejemplo:

```powershell
nvm install 22.16.0
nvm use 22.16.0
node -v
```

## Levantar el juego localmente (Windows / Linux / macOS)

### Opción A: con npm

1. Cloná el proyecto y entrá en la carpeta:

   ```bash
   git clone https://github.com/DonMAriando/Skyclash-3D.git
   cd Skyclash-3D
   ```

2. Instalá las dependencias:

   ```bash
   npm ci
   ```

3. Iniciá el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abrí **http://localhost:3000** en el navegador.

El comando `dev` de este repositorio usa Vite y escucha en el **puerto 3000**, en todas las interfaces (`0.0.0.0`). Para detenerlo, presioná **Ctrl + C** en la terminal.

El repositorio incluye `package-lock.json`: `npm ci` instala las versiones registradas y permite repetir la instalación. `npm install` también funciona; usalo cuando quieras agregar o actualizar dependencias y guardá los cambios del lockfile junto con `package.json`.

### Opción B: con Bun

El repositorio incluye `bun.lock`. Si ya tenés [Bun](https://bun.sh/), podés usarlo en lugar de npm:

```bash
git clone https://github.com/DonMAriando/Skyclash-3D.git
cd Skyclash-3D
bun install --frozen-lockfile
bun run dev
```

Después entrá a **http://localhost:3000**.

> **Importante:** elegí npm **o** Bun para administrar las dependencias; no hace falta ejecutar ambos métodos.

### Variables de entorno

El repositorio contiene un archivo `.env.example` generado para una integración con Google AI Studio/Gemini. **El juego actual no utiliza la clave `GEMINI_API_KEY` ni `APP_URL` para sus combates**, así que **no hace falta crear un `.env`** para levantar esta versión localmente.

Si más adelante integrás servicios externos, configurá sus variables según corresponda y no subas credenciales reales al repositorio.

## Controles

| Acción | Tecla |
| --- | --- |
| Moverse a la izquierda / derecha | `A` / `D` (o flechas izquierda/derecha) |
| Saltar / doble salto | `W`, `Espacio` o flecha arriba |
| Bajar de una plataforma | `S` o flecha abajo |
| Ataque ligero | `J` o `Z` |
| Ataque smash | `K` o `X` |
| Habilidad especial | `U` o `C` |
| Recuperación hacia arriba | `W` + `U` (o `I`) |
| Escudo | `Shift` (o `L` / `V`) |
| Pausar / reanudar | `Esc` |
| Iniciar torneo desde el menú | `Enter` o `Espacio` |

En pantalla también podés elegir el modo de juego, activar o desactivar el sonido y consultar los controles.

## Compilar para producción

```bash
npm run build
```

Genera los archivos estáticos en `dist/`.

Para probar la compilación en un servidor local:

```bash
npm run preview
```

Abrí la URL indicada en la terminal (generalmente `http://localhost:4173`). No abras directamente `dist/index.html` como archivo local: usá un servidor web.

Con Bun, los comandos equivalentes son `bun run build` y `bun run preview`.

### Comprobación de tipos

```bash
npm run lint
```

**Nota:** en este proyecto el script `lint` ejecuta `tsc --noEmit` (verificación de TypeScript), no ESLint.

## Estructura principal

```text
Skyclash-3D/
├── index.html
├── package.json
├── package-lock.json
├── bun.lock
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx             # Punto de entrada React
    ├── App.tsx              # Navegación, modos y estado del juego
    ├── index.css
    ├── components/          # Menú, selección, HUD y resultados
    └── game/
        ├── engine.ts        # Renderizado, controles, físicas y combate
        ├── data.ts          # Luchadores, escenarios, torneos y récords
        ├── models.ts        # Modelos y escenarios 3D
        ├── textures.ts      # Texturas procedurales
        ├── audio.ts         # Sonido
        └── types.ts         # Tipos del juego
```

## Solución de problemas

- **`ERESOLVE` por esbuild y Vite:** Vite 8.3.8 admite esbuild `^0.27.0 || ^0.28.0`, pero las versiones iniciales de este proyecto pedían `^0.25.0`. La dependencia ahora es `^0.28.2` y los lockfiles están sincronizados. Actualizá tu copia y ejecutá `npm ci`; este comando reemplaza `node_modules` automáticamente. No hace falta usar `--force` ni `--legacy-peer-deps`.
- **`EBADENGINE` o Vite no arranca:** revisá `node -v`. Vite 8 requiere Node 20.19+ / 22.12+ (o una rama posterior compatible). Si usás nvm, cambiá la versión con `nvm use`, cerrá y abrí la terminal y volvé a instalar las dependencias si fuera necesario.
- **El puerto 3000 está ocupado:** cerrá el proceso que lo usa o iniciá temporalmente en otro puerto con `npm run dev -- --port 3001` y visitá `http://localhost:3001`.
- **Pantalla negra o error WebGL:** probá Chrome, Edge o Firefox actualizados, activá la aceleración por hardware y revisá los drivers de video. El motor necesita un contexto WebGL funcional.
- **No se escucha el audio:** interactuá con el menú o el juego y comprobá el botón de sonido; los navegadores suelen bloquear el audio hasta la primera interacción.
- **No aparecen los récords en otro navegador/equipo:** se guardan en `localStorage` de cada navegador; no se sincronizan en la nube.
- **`npm run clean` falla en Windows:** el script actual usa `rm -rf`, un comando de sistemas Unix. No necesitás ejecutarlo para instalar o jugar. Si querés borrar `dist` desde PowerShell, usá `Remove-Item -Recurse -Force dist` cuando exista.

---

Proyecto: [DonMAriando/Skyclash-3D](https://github.com/DonMAriando/Skyclash-3D).
