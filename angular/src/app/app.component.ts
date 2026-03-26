import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { Edit, Canvas, Controls, Timeline } from "@shotstack/shotstack-studio";

@Component({
	selector: "app-root",
	template: `
		<div class="app">
			<div data-shotstack-studio #canvasContainer class="canvas-container"></div>
			<div data-shotstack-timeline #timelineContainer class="timeline-container"></div>
		</div>
	`,
	styles: [
		`
			:host {
				display: block;
				height: 100%;
			}
			.c-shotstack-studio {
				width: 100%;
				height: calc(100vh - 300px);
				min-height: 400px;
			}
			.c-shotstack-timeline {
				height: 300px;
			}
		`
	]
})
export class App implements AfterViewInit {
	@ViewChild("canvasContainer") canvasContainerRef!: ElementRef;
	@ViewChild("timelineContainer") timelineContainerRef!: ElementRef;

	private readonly TEMPLATE_URL = "https://shotstack-assets.s3.amazonaws.com/templates/sales-event-promotion/template.json";

	ngAfterViewInit(): void {
		this.initShotstack();
	}

	async initShotstack(): Promise<void> {
		try {
			const response = await fetch(this.TEMPLATE_URL);
			if (!response.ok) {
				throw new Error(`Failed to load template: ${response.status}`);
			}
			const template = await response.json();

			const edit = new Edit(template);
			const canvas = new Canvas(edit);

			await canvas.load();
			await edit.load();

			const timeline = new Timeline(edit, this.timelineContainerRef.nativeElement);
			await timeline.load();

			const controls = new Controls(edit);
			await controls.load();

			edit.events.on("clip:selected", (data: unknown) => {
				console.log("Clip selected:", data);
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
}
