# Neon Runner 3D

A small 3D platform runner built with Next.js, React, and Three.js. Move the neon player across floating platforms, collect coins, avoid moving enemies, and reach the finish flag.

## Features

- Real-time Three.js scene with lighting, shadows, fog, and animated stars
- Platform collision and jumping physics
- Collectible coins and score tracking
- Three lives with automatic respawn after a fall or enemy collision
- Moving enemies and a finish flag
- Win and game-over states with keyboard or click-to-restart behavior
- Responsive full-screen canvas with a compact HUD

## Controls

| Action | Keys |
| --- | --- |
| Move left | `A` or `Left Arrow` |
| Move right | `D` or `Right Arrow` |
| Jump | `W`, `Up Arrow`, or `Space` |
| Restart after winning or losing | Any key or click the message |

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Production

Create an optimized build and start it locally:

```bash
npm run build
npm start
```

Run the linter with:

```bash
npm run lint
```

## Project Structure

- `app/page.tsx` contains the client-side game scene, animation loop, controls, physics, and HUD state.
- `app/globals.css` contains the full-screen canvas, HUD, and game-over/win overlay styles.
- `app/layout.tsx` provides the root layout and Geist fonts.

## Implementation Notes

The game is initialized inside a React `useEffect` because Three.js requires browser APIs. The effect also removes keyboard and resize listeners, cancels the animation frame, disposes the renderer, and removes the canvas during cleanup.