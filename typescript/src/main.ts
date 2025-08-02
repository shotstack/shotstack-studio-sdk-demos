import theme from "./minimal.json";
import { Edit, Canvas, Controls, Timeline } from "@shotstack/shotstack-studio";

const TEMPLATE_URL = "https://shotstack-assets.s3.amazonaws.com/templates/hello-world/hello.json";

async function main() {
	try {
		const response = await fetch(TEMPLATE_URL);
		if (!response.ok) {
			throw new Error(`Failed to load template: ${response.status}`);
		}
		const template = await response.json();

		const edit = new Edit(template.output.size, template.timeline.background);
		await edit.load();

		const canvas = new Canvas(template.output.size, edit);
		await canvas.load();

		await edit.loadEdit(template);

		const timeline = new Timeline(edit, { width: 1280, height: 300 }, { theme });
		await timeline.load();

		const controls = new Controls(edit);
		await controls.load();

		edit.play();

		console.log("Demo loaded! Keyboard controls:");
		console.log("- Space: Play/Pause");
		console.log("- J/K/L: Stop/Pause/Play");
		console.log("- Arrow keys: Seek (hold Shift for faster)");
		console.log("- Comma/Period: Step frame by frame");
	} catch (error) {
		console.error("Failed to load demo:", error);
	}
}

main();
