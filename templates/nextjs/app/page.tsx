"use client";
import { useEffect, useRef } from "react";
import template from "./template.json";
import type { Edit as ShotstackEdit, EditConfig } from "@shotstack/shotstack-studio";

export default function Home() {
	const editRef = useRef<ShotstackEdit | null>(null);

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
				editRef.current = edit;

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
			editRef.current = null;
			for (const d of disposables) {
				d.dispose();
			}
		};
	}, []);

	const copyJson = async () => {
		if (!editRef.current) return toast("Editor not ready yet.", "error");
		await navigator.clipboard.writeText(JSON.stringify(editRef.current.getEdit(), null, 2));
		toast("JSON copied", "success");
	};

	return (
		<>
			<div className="editor-shell">
				<div data-shotstack-studio className="c-shotstack-studio"></div>
				<div className="demo-toolbar" aria-label="Editor actions">
					<button className="toolbar-btn" type="button" data-tooltip="Copy JSON" aria-label="Copy Edit JSON" onClick={copyJson}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
					</button>
					<a className="toolbar-btn" href="https://shotstack.io/docs/guide/studio-sdk/" target="_blank" rel="noopener noreferrer" data-tooltip="API docs" aria-label="Open the Shotstack API docs">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
					</a>
					<a className="toolbar-btn" href="https://github.com/shotstack/shotstack-studio-sdk" target="_blank" rel="noopener noreferrer" data-tooltip="View SDK on GitHub" aria-label="View the Shotstack Studio SDK on GitHub">
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.01-.02-1.98-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02 0 2.04.14 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.36.81 1.08.81 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.22.68.83.56C20.57 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>
					</a>
				</div>
			</div>
			<div data-shotstack-timeline className="c-shotstack-timeline"></div>
		</>
	);
}

let toastTimer: number | undefined;
function toast(message: string, kind: "success" | "error") {
	let el = document.querySelector<HTMLDivElement>(".toast");
	if (!el) {
		el = document.createElement("div");
		el.className = "toast";
		document.body.appendChild(el);
	}
	el.textContent = message;
	el.classList.toggle("error", kind === "error");
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => el.remove(), 3000);
}
