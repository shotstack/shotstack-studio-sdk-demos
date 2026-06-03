// Remove scaffold-template build artifacts before packing, so they never end up
// in the published tarball. Runs automatically via the `prepack` lifecycle hook
// (npm pack / npm publish). Not shipped to consumers.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ARTIFACTS = [".next", "dist", "build", "out", ".angular", ".turbo", ".vercel"];

for (const entry of readdirSync("templates", { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	for (const artifact of ARTIFACTS) {
		rmSync(join("templates", entry.name, artifact), { recursive: true, force: true });
	}
}
