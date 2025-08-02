# Shotstack Canvas TypeScript Demo

A TypeScript demonstration of the [Shotstack Studio SDK](https://github.com/shotstack/shotstack-studio-sdk) showing how to create an interactive video player with timeline controls.

## Overview

This demo implements a simple video player that:

- Loads a template from Shotstack's servers
- Displays the video in a canvas element
- Provides timeline controls for editing
- Includes keyboard shortcuts for playback control

## Prerequisites

- Node.js 14.x or higher
- npm or yarn

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Create a production build:

```bash
npm run build
```

## Keyboard Controls

- **Space**: Play/Pause
- **J**: Stop
- **K**: Pause
- **L**: Play
- **Left/Right Arrow**: Seek
- **Shift+Left/Right**: Seek faster
- **Comma/Period**: Step frame by frame

## Project Structure

- `src/main.ts` - Main application entry point with Shotstack Studio SDK integration
- `src/minimal.json` - Theme configuration for the timeline
- `index.html` - HTML entry point with the required `[data-shotstack-studio]` element

## Key Features

- **Template Loading**: Fetches video templates from remote URLs
- **Studio Components**: Initializes Edit, Canvas, Timeline, and Controls
- **Error Handling**: Custom error classes for template loading and studio initialization
- **Clean Architecture**: Follows single responsibility principle with focused functions

## Learn More

- [Shotstack Studio SDK Documentation](https://github.com/shotstack/shotstack-studio-sdk)
- [Shotstack Website](https://shotstack.io)
