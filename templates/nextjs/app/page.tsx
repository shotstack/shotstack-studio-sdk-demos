"use client";
import { useEffect } from "react";
import template from "./template.json";
import type { EditConfig } from "@shotstack/shotstack-studio";

export default function Home() {
	useEffect(() => {
		let disposed = false;
		const disposables: { dispose(): void }[] = [];

		const initShotstack = async () => {
			try {
				const { Edit, Canvas, Controls, Timeline, UIController } = await import("@shotstack/shotstack-studio");

				const edit = new Edit(template as EditConfig);

				const canvas = new Canvas(edit);
				disposables.push(canvas);
				const ui = UIController.create(edit, canvas);
				disposables.push(ui);
				await canvas.load();
				await edit.load();
				if (disposed) return;

				ui.registerButton({
					id: "text",
					icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3H13"/><path d="M8 3V13"/><path d="M5 13H11"/></svg>`,
					tooltip: "Add Text"
				});

				ui.registerButton({
					id: "shape",
					icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/></svg>`,
					tooltip: "Add Shape"
				});

				ui.on("button:text", ({ position }: { position: number }) => {
					edit.addTrack(0, {
						clips: [{
							asset: {
								type: "rich-text",
								text: "Title",
								font: { family: "Work Sans", size: 72, weight: 600, color: "#ffffff", opacity: 1 },
								align: { horizontal: "center", vertical: "middle" }
							},
							start: position,
							length: 5,
							width: 500,
							height: 200
						}]
					});
				});

				ui.on("button:shape", ({ position }: { position: number }) => {
					edit.addTrack(0, {
						clips: [{
							asset: {
								type: "svg",
								src: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="100" rx="10" ry="10" fill="#00FFFF"/></svg>'
							},
							start: position,
							length: 10,
							width: 100,
							height: 100
						}]
					});
				});

				const timelineContainer = document.querySelector<HTMLElement>("[data-shotstack-timeline]");
				if (!timelineContainer) {
					throw new Error("Timeline container not found");
				}
				const timeline = new Timeline(edit, timelineContainer);
				disposables.push(timeline);
				await timeline.load();
				if (disposed) return;

				const controls = new Controls(edit);
				await controls.load();

				edit.play();
				console.log("Shotstack Studio loaded — edit app/template.json or use the toolbar.");
			} catch (error) {
				console.error("Failed to load editor:", error);
			}
		};

		initShotstack();

		return () => {
			disposed = true;
			for (const d of disposables) {
				d.dispose();
			}
		};
	}, []);

	return (
		<>
			<div data-shotstack-studio className="c-shotstack-studio"></div>
			<div data-shotstack-timeline className="c-shotstack-timeline"></div>
		</>
	);
}
