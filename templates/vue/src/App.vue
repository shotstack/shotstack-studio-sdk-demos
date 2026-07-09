<template>
	<div class="App">
		<div class="editor-shell">
			<div data-shotstack-studio class="c-shotstack-studio"></div>
			<div class="demo-toolbar" aria-label="Editor actions">
				<button class="toolbar-btn" type="button" data-tooltip="Copy JSON" aria-label="Copy Edit JSON" @click="copyJson">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
				</button>
				<a class="toolbar-btn" href="https://shotstack.io/docs/guide/studio-sdk/" target="_blank" rel="noopener noreferrer" data-tooltip="API docs" aria-label="Open the Shotstack API docs">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
				</a>
				<a class="toolbar-btn" href="https://github.com/shotstack/shotstack-studio-sdk" target="_blank" rel="noopener noreferrer" data-tooltip="View SDK on GitHub" aria-label="View the Shotstack Studio SDK on GitHub">
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.01-.02-1.98-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02 0 2.04.14 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.36.81 1.08.81 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.22.68.83.56C20.57 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>
				</a>
			</div>
		</div>
		<div data-shotstack-timeline class="c-shotstack-timeline"></div>
	</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { Edit, Canvas, Controls, Timeline, UIController } from "@shotstack/shotstack-studio";
import template from "./template.json";

// The starter Edit lives in src/template.json — the same JSON the Shotstack
// Edit API renders. Change it here or edit it live in the canvas/timeline below.

let disposed = false;
const disposables = [];
let currentEdit = null;

onMounted(async () => {
	try {
		const edit = new Edit(template);

		const canvas = new Canvas(edit);
		disposables.push(canvas);
		const ui = UIController.create(edit, canvas);
		disposables.push(ui);
		await canvas.load();
		await edit.load();
		if (disposed) return;
		currentEdit = edit;

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

		ui.on("button:text", ({ position }) => {
			edit.addTrack(0, {
				clips: [
					{
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
					}
				]
			});
		});

		ui.on("button:shape", ({ position }) => {
			edit.addTrack(0, {
				clips: [
					{
						asset: {
							type: "svg",
							src: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="100" rx="10" ry="10" fill="#00FFFF"/></svg>'
						},
						start: position,
						length: 10,
						width: 100,
						height: 100
					}
				]
			});
		});

		const timelineContainer = document.querySelector("[data-shotstack-timeline]");
		const timeline = new Timeline(edit, timelineContainer);
		disposables.push(timeline);
		await timeline.load();
		if (disposed) return;

		const controls = new Controls(edit);
		await controls.load();

		edit.play();
		console.log("Shotstack Studio loaded — edit src/template.json or use the toolbar.");
	} catch (error) {
		console.error("Failed to load editor:", error);
	}
});

onBeforeUnmount(() => {
	disposed = true;
	currentEdit = null;
	for (const d of disposables) {
		d.dispose();
	}
});

async function copyJson() {
	try {
		if (!currentEdit) throw new Error("Editor not ready yet.");
		await navigator.clipboard.writeText(JSON.stringify(currentEdit.getEdit(), null, 2));
		toast("JSON copied", "success");
	} catch (error) {
		toast(error instanceof Error ? error.message : "Could not copy JSON.", "error");
	}
}

let toastTimer;
function toast(message, kind) {
	let el = document.querySelector(".toast");
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
</script>

<style>
.editor-shell {
	position: relative;
	width: 100%;
	height: calc(100vh - 300px);
	min-height: 400px;
}

.c-shotstack-studio {
	width: 100%;
	height: 100%;
}

.c-shotstack-timeline {
	height: 300px;
}

.demo-toolbar {
	position: absolute;
	top: 12px;
	right: 12px;
	z-index: 10;
	display: flex;
	gap: 2px;
	padding: 6px;
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 14px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
}

.toolbar-btn {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: none;
	border-radius: 8px;
	color: rgba(0, 0, 0, 0.65);
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
	position: relative;
	padding: 0;
}

.toolbar-btn:hover {
	background: rgba(0, 0, 0, 0.06);
	color: rgba(0, 0, 0, 0.9);
}

.toolbar-btn:active {
	background: rgba(0, 0, 0, 0.1);
	transform: scale(0.95);
}

.toolbar-btn:disabled {
	cursor: progress;
	opacity: 0.55;
}

.toolbar-btn:focus-visible {
	outline: 2px solid #4a90e2;
	outline-offset: 1px;
}

.toolbar-btn svg {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
}

.toolbar-btn::after {
	content: attr(data-tooltip);
	position: absolute;
	top: calc(100% + 6px);
	right: 0;
	padding: 6px 10px;
	background: rgba(24, 24, 27, 0.95);
	color: #fff;
	font-size: 12px;
	font-weight: 500;
	white-space: nowrap;
	border-radius: 6px;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.15s ease, visibility 0.15s ease;
	pointer-events: none;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-btn:hover::after {
	opacity: 1;
	visibility: visible;
}

.toast {
	position: fixed;
	bottom: 16px;
	left: 50%;
	transform: translateX(-50%);
	background: #2a2a2e;
	color: #e0e0e0;
	padding: 8px 16px;
	border-radius: 4px;
	font-size: 12px;
	border: 1px solid #3a3a3e;
	z-index: 1000;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	max-width: 80vw;
}

.toast.error {
	border-color: #cc3344;
}
</style>
