import { Edit, Canvas, Controls, Timeline } from "@shotstack/shotstack-studio";

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

		await canvas.load();
		await edit.load();

		const timelineContainer = document.querySelector("[data-shotstack-timeline]") as HTMLElement;
		const timeline = new Timeline(edit, timelineContainer);
		await timeline.load();

		const controls = new Controls(edit);
		await controls.load();

		edit.events.on("clip:selected", (data) => {
			console.log("Clip selected:", data);
		});

		edit.events.on("clip:updated", (data) => {
			console.log("Clip updated:", data);
		});

		edit.play();

		console.log("Demo loaded! Keyboard controls:");
		console.log("Playback: Space (play/pause), J (stop), K (pause), L (play)");
		console.log("Seek: Arrow Left/Right (hold Shift for 10x), Comma/Period (frame step)");
		console.log("Navigate: Home/End (timeline start/end), Shift+Home/End (clip start/end)");
		console.log("Clip: Arrow keys (move selected clip), Delete/Backspace (delete)");
		console.log("Edit: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)");
		console.log("Copy: Cmd/Ctrl+C (copy clip), Cmd/Ctrl+V (paste clip)");
		console.log("Toolbar: Backtick (toggle asset/clip mode)");
		console.log("Debug: I (log edit JSON to console)");
	} catch (error) {
		console.error("Failed to load demo:", error);
	}
}

main();
