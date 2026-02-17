import { Edit, Canvas, Controls, Timeline, UIController } from "@shotstack/shotstack-studio";

const TEMPLATE_URL = "https://shotstack-assets.s3.amazonaws.com/templates/sales-event-promotion/template.json";

async function main() {
	try {
		const response = await fetch(TEMPLATE_URL);
		if (!response.ok) {
			throw new Error(`Failed to load template: ${response.status}`);
		}
		const template = await response.json();

		const edit = new Edit(template);

		const canvas = new Canvas(edit);
		UIController.create(edit, canvas);
		await canvas.load();
		await edit.load();

		const timelineContainer = document.querySelector<HTMLElement>("[data-shotstack-timeline]");
		if (!timelineContainer) {
			throw new Error("Timeline container not found");
		}
		const timeline = new Timeline(edit, timelineContainer);
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
