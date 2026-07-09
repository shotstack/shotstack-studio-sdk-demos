#!/usr/bin/env node
// create-video-editor — scaffold a Shotstack Studio SDK video editor.
//
// Zero runtime dependencies (Node built-ins only) so `npx create-video-editor`
// starts instantly. The scaffold templates live in ../templates and are the
// Studio SDK demo apps (react/vue/nextjs/angular/typescript), each pre-loaded
// with a starter Edit JSON.

import { readdir, mkdir, cp, readFile, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer, connect as netConnect } from "node:net";
import { join, resolve, basename, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stdin, stdout, cwd, exit, argv, env, platform } from "node:process";
import { createInterface } from "node:readline/promises";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(HERE, "..", "templates");
const DEFAULT_TEMPLATE = "typescript";
const CHILD_ENV = { ...env, NG_CLI_ANALYTICS: "false" };

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
  --package-manager <pm>  npm | pnpm | yarn | bun (default: caller/default npm)
  --port <number>         preferred local dev-server port
  --no-install            scaffold only; do not install dependencies
  --no-start              install dependencies, but do not start the dev server
  --no-open               do not open the local URL in a browser
  -y, --yes               skip prompts (use the provided/default values)
  -h, --help              show this help

Default template: typescript (Vanilla TypeScript)

Default behaviour
  Scaffolds the app, installs dependencies, starts the dev server, prints the
  localhost URL, and opens it in your browser when possible.
`;

function parseArgs(args) {
  const out = { _: [], install: true, start: true, open: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--yes" || a === "-y") out.yes = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--no-install") out.install = false;
    else if (a === "--no-start") out.start = false;
    else if (a === "--no-open") out.open = false;
    else if (a === "--port") out.port = Number.parseInt(args[++i], 10);
    else if (a.startsWith("--port=")) out.port = Number.parseInt(a.slice("--port=".length), 10);
    else if (a === "--package-manager" || a === "--pm") out.packageManager = args[++i];
    else if (a.startsWith("--package-manager=")) out.packageManager = a.slice("--package-manager=".length);
    else if (a.startsWith("--pm=")) out.packageManager = a.slice("--pm=".length);
    else if (a === "--template" || a === "-t") out.template = args[++i];
    else if (a.startsWith("--template=")) out.template = a.slice("--template=".length);
    else if (!a.startsWith("-")) out._.push(a);
  }
  if (!out.install) out.start = false;
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
  const templates = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  return templates.includes(DEFAULT_TEMPLATE)
    ? [DEFAULT_TEMPLATE, ...templates.filter((t) => t !== DEFAULT_TEMPLATE)]
    : templates;
}

function sanitiseName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-~.]+/g, "-").replace(/^-+|-+$/g, "") || "video-editor";
}

function detectPackageManager(requested) {
  if (requested) return requested;
  const agent = env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  return "npm";
}

function installCommand(packageManager) {
  if (packageManager === "pnpm") return ["pnpm", ["install"]];
  if (packageManager === "yarn") return ["yarn", ["install"]];
  if (packageManager === "bun") return ["bun", ["install"]];
  return ["npm", ["install"]];
}

function installCommandText(packageManager) {
  if (packageManager === "pnpm") return "pnpm install";
  if (packageManager === "yarn") return "yarn install";
  if (packageManager === "bun") return "bun install";
  return "npm install";
}

function devCommand(packageManager, script, args) {
  if (packageManager === "yarn") return ["yarn", [script, ...args]];
  if (packageManager === "bun") return ["bun", ["run", script, ...args]];
  if (script === "start") return [packageManager, ["start", "--", ...args]];
  return [packageManager, ["run", script, "--", ...args]];
}

function devCommandText(packageManager, template) {
  const script = template === "angular" ? "start" : "dev";
  if (packageManager === "yarn") return `yarn ${script}`;
  if (packageManager === "bun") return `bun run ${script}`;
  if (script === "start") return `${packageManager} start`;
  return `${packageManager} run ${script}`;
}

function defaultPort(template) {
  if (template === "nextjs") return 3000;
  if (template === "angular") return 4200;
  return 5173;
}

function devServerConfig(template, port) {
  if (template === "nextjs") {
    return { script: "dev", args: ["--hostname", "127.0.0.1", "--port", String(port)] };
  }
  if (template === "angular") {
    return { script: "start", args: ["--host", "127.0.0.1", "--port", String(port)] };
  }
  return { script: "dev", args: ["--host", "127.0.0.1", "--port", String(port)] };
}

async function findFreePort(start) {
  for (let port = start; port < start + 100; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free local port found from ${start} to ${start + 99}.`);
}

// A port is free only if nothing accepts on IPv4 or IPv6 localhost *and* we can
// bind both. Checking a single host (e.g. 127.0.0.1 only) misses apps that
// already listen on ::1 / 0.0.0.0 — which is how `localhost:3000` ends up
// opening the wrong process after we "found" a free port.
async function isPortFree(port) {
  for (const host of ["127.0.0.1", "::1"]) {
    if (await canConnect(port, host)) return false;
  }
  for (const host of ["127.0.0.1", "::1"]) {
    if (!(await canBind(port, host))) return false;
  }
  return true;
}

function canConnect(port, host) {
  return new Promise((resolve) => {
    const socket = netConnect({ port, host });
    socket.setTimeout(250);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function canBind(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    // dualStack false keeps IPv6 checks on ::1 only (not IPv4-mapped).
    try {
      server.listen({ port, host, ipv6Only: host.includes(":") });
    } catch {
      resolve(false);
    }
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: CHILD_ENV, shell: platform === "win32", ...options });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status < 500) return true;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function openBrowser(url) {
  if (env.CI) return;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore", shell: platform === "win32" });
  child.once("error", () => {});
  child.unref();
}

function startDevServer({ packageManager, target, template, port, open }) {
  const config = devServerConfig(template, port);
  const [command, args] = devCommand(packageManager, config.script, config.args);
  // Match --hostname 127.0.0.1 so we never open a different process that is
  // already bound to localhost / ::1 on the same port.
  const url = `http://127.0.0.1:${port}`;

  stdout.write(
    `\nStarting the editor on ${url}\n` +
      `${open ? "Opening it in your browser when the server is ready...\n" : ""}\n`,
  );

  const child = spawn(command, args, {
    cwd: target,
    env: CHILD_ENV,
    stdio: ["inherit", "pipe", "pipe"],
    shell: platform === "win32",
  });
  child.stdout?.on("data", (data) => stdout.write(data));
  child.stderr?.on("data", (data) => process.stderr.write(data));
  child.once("error", (error) => {
    console.error(`\n✗ Failed to start dev server: ${error.message}`);
  });
  child.once("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      console.error(`\n✗ Dev server exited with code ${code}`);
    }
  });

  const stop = () => {
    child.kill("SIGINT");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  waitForServer(url).then((ready) => {
    if (!ready) return;
    stdout.write(`\nReady: ${url}\n`);
    if (open) openBrowser(url);
  });
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
      template = templates.includes(DEFAULT_TEMPLATE) ? DEFAULT_TEMPLATE : templates[0];
    }
  }
  rl?.close();
  if (!templates.includes(template)) {
    console.error(`\n✗ Unknown template "${template}". Available: ${templates.join(", ")}`);
    exit(1);
  }
  if (args.packageManager && !["npm", "pnpm", "yarn", "bun"].includes(args.packageManager)) {
    console.error(`\n✗ Unknown package manager "${args.packageManager}". Available: npm, pnpm, yarn, bun`);
    exit(1);
  }
  if (args.port && (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535)) {
    console.error(`\n✗ Invalid port "${args.port}".`);
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

  // 5. Install and start
  const packageManager = detectPackageManager(args.packageManager);
  const installText = installCommandText(packageManager);
  const devText = devCommandText(packageManager, template);
  stdout.write(`\n✔ Scaffolded a ${LABEL[template] ?? template} video editor in ${dir}/\n`);

  if (!args.install) {
    stdout.write(
      `\nSkipped dependency install.\n\n` +
        `  cd ${dir}\n  ${installText}\n  ${devText}\n\n` +
        `Then open the local URL — a live, editable Shotstack editor loaded with a starter Edit.\n`,
    );
    return;
  }

  const [install, installArgs] = installCommand(packageManager);
  stdout.write(`\nInstalling dependencies with ${packageManager}...\n\n`);
  await runCommand(install, installArgs, { cwd: target });

  if (!args.start) {
    stdout.write(
      `\nDone. Start the editor when you're ready:\n\n` +
        `  cd ${dir}\n  ${devText}\n\n`,
    );
    return;
  }

  const preferredPort = args.port ?? defaultPort(template);
  const port = await findFreePort(preferredPort);
  if (port !== preferredPort) {
    stdout.write(`\nPort ${preferredPort} is in use — using ${port} instead.\n`);
  }
  stdout.write(
    `\nDone. The editor is ready.\n` +
      `• Edit the video in src/template.json (or in the editor itself).\n` +
      `• Render a final MP4 from the cloud with the CLI: npx shotstack render src/template.json --watch\n`,
  );
  startDevServer({ packageManager, target, template, port, open: args.open });
}

main().catch((err) => {
  console.error(err?.message ?? err);
  exit(1);
});
