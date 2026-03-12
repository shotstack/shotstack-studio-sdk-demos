"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Edit, Canvas, Controls, Timeline } from "@shotstack/shotstack-studio";

const BUILTIN_OPEN_SANS_URL = "https://templates.shotstack.io/basic/asset/font/OpenSans.ttf";
const GSTATIC_OPEN_SANS_URL = "https://fonts.gstatic.com/s/opensans/v44/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf";

type ReproPayload = {
	timeline: {
		background: string;
		fonts?: Array<{ src: string }>;
		tracks: Array<{
			clips: Array<{
				asset: {
					type: "rich-text";
					text: string;
					font: {
						family: string;
						weight: number;
						size: number;
						color: string;
						opacity: number;
					};
					align: {
						horizontal: "center";
						vertical: "middle";
					};
				};
				start: number;
				length: number;
				width: number;
				height: number;
				offset: {
					x: number;
					y: number;
				};
			}>;
		}>;
	};
	output: {
		size: {
			width: number;
			height: number;
		};
		format: "mp4";
	};
};

type ReproVariant = {
	id: string;
	label: string;
	description: string;
	payload: ReproPayload;
};

const createApiPayload = (fonts?: Array<{ src: string }>): ReproPayload => ({
	timeline: {
		background: "#ffffff",
		...(fonts ? { fonts } : {}),
		tracks: [
			{
				clips: [
					{
						asset: {
							type: "rich-text",
							text: "Open Sans 900 repro",
							font: {
								family: "Open Sans",
								weight: 900,
								size: 64,
								color: "#111111",
								opacity: 1
							},
							align: {
								horizontal: "center",
								vertical: "middle"
							}
						},
						start: 0,
						length: 3,
						width: 900,
						height: 220,
						offset: {
							x: 0,
							y: 0
						}
					}
				]
			}
		]
	},
	output: {
		size: {
			width: 1920,
			height: 1080
		},
		format: "mp4"
	}
});

const REPRO_VARIANTS: ReproVariant[] = [
	{
		id: "no-timeline-fonts",
		label: "No timeline.fonts",
		description: "Open Sans 900 with only built-in resolution.",
		payload: createApiPayload()
	},
	{
		id: "built-in-font-url",
		label: "timeline.fonts -> built-in CDN",
		description: "Open Sans 900 with timeline.fonts using the built-in CDN font URL.",
		payload: createApiPayload([{ src: BUILTIN_OPEN_SANS_URL }])
	},
	{
		id: "gstatic-font-url",
		label: "timeline.fonts -> gstatic",
		description: "Open Sans 900 with timeline.fonts using the Google-hosted font URL from the issue.",
		payload: createApiPayload([{ src: GSTATIC_OPEN_SANS_URL }])
	}
];

const formatError = (err: unknown): { message: string; stack?: string } => {
	if (err instanceof Error) {
		let message = err.message;
		const issues = (err as { issues?: unknown[] }).issues;
		if (Array.isArray(issues) && issues.length > 0) {
			message += ` ${JSON.stringify(issues)}`;
		}
		return { message, stack: err.stack };
	}

	return { message: String(err) };
};

export default function VideoPreviewPage() {
	const [status, setStatus] = useState<"running" | "checks-failed" | "preview-loading" | "preview-ready" | "preview-error">("running");
	const studioRef = useRef<HTMLDivElement>(null);
	const timelineRef = useRef<HTMLDivElement>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const loadPreview = useCallback(async () => {
		cleanupRef.current?.();
		setStatus("running");
		let hadFailure = false;

		for (const variant of REPRO_VARIANTS) {
			let edit: Edit | null = null;
			console.groupCollapsed(`[issue-76] ${variant.label}`);
			console.log("payload", variant.payload);

			try {
				const apiPayload = variant.payload;
				const editConfig = {
					timeline: apiPayload.timeline,
					output: apiPayload.output,
				};

				edit = new Edit(editConfig as any);
				await edit.load();

				console.info(`[issue-76:${variant.id}] edit.load() succeeded`);
			} catch (err) {
				hadFailure = true;
				const { message } = formatError(err);
				console.error(`[repro:${variant.id}] edit.load failed`, err);
				console.error(`[issue-76:${variant.id}] ${message}`);
			} finally {
				console.groupEnd();
				try {
					(edit as any)?.dispose?.();
				} catch (disposeError) {
					console.warn(`[repro:${variant.id}] failed to dispose edit`, disposeError);
				}
			}
		}

		if (hadFailure) {
			setStatus("checks-failed");
			return;
		}

		setStatus("preview-loading");

		try {
			const apiPayload = REPRO_VARIANTS[0].payload;
			const editConfig = {
				timeline: apiPayload.timeline,
				output: apiPayload.output,
			};

			const edit = new Edit(editConfig as any);
			await edit.load();

			const canvas = new Canvas(edit);
			await canvas.load();

			const timelineContainer = timelineRef.current;
			if (!timelineContainer) {
				throw new Error("Timeline container not found.");
			}
			const timeline = new Timeline(edit, timelineContainer, { resizable: true });
			await timeline.load();

			const controls = new Controls(edit);
			await controls.load();

			cleanupRef.current = () => {
				try {
					(timeline as any)?.dispose?.();
					(canvas as any)?.dispose?.();
					(controls as any)?.dispose?.();
					(edit as any)?.dispose?.();
				} catch (_) {}
					cleanupRef.current = null;
				};

			console.info("[issue-76] All edit.load() checks passed. Loading fuller preview with the no-timeline.fonts variant.");
			setStatus("preview-ready");
		} catch (err) {
			const { message, stack } = formatError(err);
			console.error("[preview] full preview failed after edit.load() checks passed", err);
			console.error("[issue-76] Preview failure message:", message);
			if (stack) console.error(stack);
			setStatus("preview-error");
		}
	}, []);

	useEffect(() => {
		loadPreview();
		return () => {
			cleanupRef.current?.();
		};
	}, [loadPreview]);

	return (
		<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
			<header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
				<span style={{ fontSize: 14, color: "#6b7280" }}>Issue #76 repro</span>
				<span style={{ fontSize: 14, color: "#d1d5db" }}>|</span>
				<span style={{ fontSize: 14, fontWeight: 500 }}>Open Sans 900 / Next.js / published 2.4.0</span>
			</header>

			<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
				{(status === "running" || status === "preview-loading") && (
					<div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.75)" }}>
						<p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Loading preview…</p>
					</div>
				)}
				<div
					ref={studioRef}
					data-shotstack-studio
					style={{ flex: 1, minHeight: 0, width: "100%" }}
				/>
				<div
					ref={timelineRef}
					data-shotstack-timeline
					style={{ height: 300, borderTop: "1px solid #e5e7eb", overflow: "hidden", flexShrink: 0 }}
				/>
			</div>
		</div>
	);
}
