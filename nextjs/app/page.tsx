"use client";
import React, { useEffect, useRef } from "react";
import theme from "./minimal.json";

export default function Home() {
	const canvasContainerRef = useRef(null);

	useEffect(() => {
		const initShotstack = async () => {
			try {
				// 1. Retrieve an edit from a template
				const { Edit, Canvas, Controls, Timeline } = await import("@shotstack/shotstack-studio");
				const templateUrl = "https://shotstack-assets.s3.amazonaws.com/templates/hello-world/hello.json";
				const response = await fetch(templateUrl);
				const template = await response.json();

				// 2. Initialize the edit with dimensions and background color
				const edit = new Edit(template.output.size, template.timeline.background);
				await edit.load();

				// 3. Create a canvas to display the edit
				const canvas = new Canvas(template.output.size, edit);
				await canvas.load(); // Renders to [data-shotstack-studio] element

				// 4. Load the template
				await edit.loadEdit(template);

				// 5. Add timeline
				const timeline = new Timeline(edit, { width: template.output.size.width, height: 300 }, { theme });
				await timeline.load();

				// 6. Add keyboard controls
				const controls = new Controls(edit);
				await controls.load();

				// 7. Control playback with playback methods
				await edit.play();

				// Additional helpful information for the demo
				console.log("Demo loaded successfully! Try the following keyboard controls:");
				console.log("- Space: Play/Pause");
				console.log("- J: Stop");
				console.log("- K: Pause");
				console.log("- L: Play");
				console.log("- Left/Right Arrow: Seek");
				console.log("- Shift+Left/Right: Seek faster");
				console.log("- Comma/Period: Step frame by frame");
			} catch (error) {
				console.error("Failed to initialize Shotstack:", error);
			}
		};

		initShotstack();
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-black">
			<div className="flex-1 flex items-center justify-center">
				<div data-shotstack-studio className="w-full h-full max-w-screen-xl" ref={canvasContainerRef}></div>
			</div>
			<div className="flex justify-center">
				<div data-shotstack-timeline className="h-[300px] w-full max-w-screen-xl"></div>
			</div>
		</div>
	);
}
