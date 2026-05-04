# Mechanical STL/DXF Generator

Svelte/Vite app for building mechanical part STL/DXF files and checking pulley, gear, and tractor drive ratios.

## Local Development

```sh
npm install
npm run dev
```

The main app runs at `/`, with calculators at `/#rpm-calculator` and `/#tractor`.

## Production

```sh
npm run build
npm run start
```

`server.js` serves the built `dist` folder and listens on `process.env.PORT`, which is required for Railway.

## Railway

Railway uses `railway.json`:

- Builder: `RAILPACK`
- Build command: `npm run build`
- Start command: `npm run start`
- Healthcheck path: `/`

Deploy from the repository root.
