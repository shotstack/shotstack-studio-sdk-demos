#!/usr/bin/env node
// create-video-editor — scaffold a Shotstack Studio SDK video editor.
//
// Zero runtime dependencies (Node built-ins only) so `npx create-video-editor`
// starts instantly. The scaffold templates live in ../templates and are the
// Studio SDK demo apps (react/vue/nextjs/angular/typescript), each pre-loaded
// with a starter Edit JSON.

import { readdir, mkdir, cp, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve, basename, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stdin, stdout, cwd, exit, argv } from "node:process";
import { createInterface } from "node:readline/promises";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(HERE, "..", "templates");

const LABEL = {
  react: "React",
  vue: "Vue",
  nextjs: "Next.js",
  angular: "Angular",
  typescript: "Vanilla TypeScript",
};

const HELP = `
create-video-editor — scaffold a Shotstack Studio SDK video editor.

Usage
  npm create video-editor@latest [dir]
  npx create-video-editor [dir] [--template <name>] [--yes]

Options
  -t, --template <name>   react | vue | nextjs | angular | typescript
  -y, --yes               skip prompts (use the provided/default values)
  -h, --help              show this help

After scaffolding
  cd <dir> && npm install && npm run dev    # a live, editable editor in the browser
`;

function parseArgs(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--yes" || a === "-y") out.yes = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--template" || a === "-t") out.template = args[++i];
    else if (a.startsWith("--template=")) out.template = a.slice("--template=".length);
    else if (!a.startsWith("-")) out._.push(a);
  }
  return out;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function listTemplates() {
  const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function sanitiseName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-~.]+/g, "-").replace(/^-+|-+$/g, "") || "video-editor";
}

async function main() {
  const args = parseArgs(argv.slice(2));
  if (args.help) {
    stdout.write(HELP);
    return;
  }

  const templates = await listTemplates();
  const interactive = Boolean(stdin.isTTY) && !args.yes;
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;

  // 1. Project directory
  let dir = args._[0];
  if (!dir) {
    dir = rl ? (await rl.question("Project directory (my-video-editor): ")).trim() : "";
    if (!dir) dir = "my-video-editor";
  }
  const target = resolve(cwd(), dir);
  if (await exists(target)) {
    rl?.close();
    console.error(`\n✗ "${dir}" already exists — choose a different directory.`);
    exit(1);
  }

  // 2. Framework
  let template = args.template;
  if (!template) {
    if (rl) {
      stdout.write("\nFramework:\n");
      templates.forEach((t, i) => stdout.write(`  ${i + 1}) ${LABEL[t] ?? t}\n`));
      const ans = (await rl.question(`Choose 1-${templates.length} (default 1): `)).trim();
      const idx = ans ? Number.parseInt(ans, 10) - 1 : 0;
      template = templates[idx] ?? templates[0];
    } else {
      template = templates.includes("react") ? "react" : templates[0];
    }
  }
  rl?.close();
  if (!templates.includes(template)) {
    console.error(`\n✗ Unknown template "${template}". Available: ${templates.join(", ")}`);
    exit(1);
  }

  // 3. Copy the template (skip node_modules/dist/build/.git).
  // Filter on the path RELATIVE to the template root: the absolute source path
  // contains "node_modules" when the package runs via npx (it lives under
  // ~/.npm/_npx/.../node_modules/create-video-editor/), which would otherwise
  // exclude the entire template tree.
  const source = join(TEMPLATES_DIR, template);
  await mkdir(target, { recursive: true });
  await cp(source, target, {
    recursive: true,
    filter: (src) => {
      const rel = relative(source, src);
      return !/(^|[\\/])(node_modules|dist|build|\.git|\.next)([\\/]|$)/.test(rel);
    },
  });

  // 4. Personalise package.json
  const pkgPath = join(target, "package.json");
  if (await exists(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    pkg.name = sanitiseName(basename(target));
    pkg.version = "0.1.0";
    pkg.private = true;
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  // 5. Next steps
  const dev = template === "angular" ? "npm start" : "npm run dev";
  stdout.write(
    `\n✔ Scaffolded a ${LABEL[template] ?? template} video editor in ${dir}/\n\n` +
      `  cd ${dir}\n  npm install\n  ${dev}\n\n` +
      `Then open the local URL — a live, editable Shotstack editor loaded with a starter Edit.\n` +
      `• Edit the video in src/template.json (or in the editor itself).\n` +
      `• Render a final MP4 from the cloud with the CLI: npx shotstack render src/template.json --watch\n\n`,
  );
}

main().catch((err) => {
  console.error(err?.message ?? err);
  exit(1);
});
