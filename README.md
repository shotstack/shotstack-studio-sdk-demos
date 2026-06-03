# create-video-editor

Scaffold a [Shotstack Studio SDK](https://github.com/shotstack/shotstack-studio-sdk) video editor in seconds.

```sh
npm create video-editor@latest
# or
npx create-video-editor
```

You'll be asked for a project name and a framework, then:

```sh
cd my-video-editor
npm install
npm run dev
```

`npm run dev` opens a **live, editable video editor in your browser** — the Studio SDK embedded in your own app, pre-loaded with a starter Edit. It's your codebase to customise and ship.

## Frameworks

| Choose | Stack |
|---|---|
| `react` | React 19 + Vite |
| `vue` | Vue 3 + Vite |
| `nextjs` | Next.js |
| `angular` | Angular |
| `typescript` | Vanilla TypeScript + Vite |

Non-interactive:

```sh
npx create-video-editor my-editor --template react --yes
```

## What you get

- An app embedding [`@shotstack/shotstack-studio`](https://www.npmjs.com/package/@shotstack/shotstack-studio) — canvas, timeline, and controls.
- A starter **Edit** in `src/template.json` (the same JSON the [Shotstack Edit API](https://shotstack.io/docs/guide/) renders). Edit it in code or in the editor.
- A clean path to production: preview locally, then render a final MP4 from the cloud with the CLI — `npx shotstack render src/template.json --watch`.

## How this fits the rest of Shotstack

The **Edit JSON** is the shared format across the whole platform — the embedded editor here, the `shotstack` CLI, the render API, and the Shotstack agent skill all speak it. A video you design in the scaffolded editor renders identically through the API.

## Templates / demos

The framework starters live in [`templates/`](templates/) and double as standalone Studio SDK demos — loading and displaying Edits, timeline controls, keyboard shortcuts, and custom theming. Browse them directly, or scaffold a fresh copy with the command above.

## Learn more

- [Shotstack Studio SDK](https://github.com/shotstack/shotstack-studio-sdk)
- [Shotstack Edit API documentation](https://shotstack.io/docs/guide/)
- [Shotstack API reference](https://shotstack.io/docs/api/)

## Licence

MIT.
