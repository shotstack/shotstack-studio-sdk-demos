import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Edit, Canvas, Controls, Timeline } from '@shotstack/shotstack-studio';
import theme from '../minimal.json';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <div data-shotstack-studio #canvasContainer class="canvas-container"></div>
      <div data-shotstack-timeline class="timeline-container"></div>
    </div>
  `,
  styles: [
    `
    .app {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .canvas-container {
      flex: 1;
      background-color: #000;
    }
    .timeline-container {
      height: 300px;
      background-color: #1a1a1a;
    }
  `,
  ],
})
export class App implements AfterViewInit {
  @ViewChild('canvasContainer') canvasContainerRef!: ElementRef;

  private readonly TEMPLATE_URL = 'https://shotstack-assets.s3.amazonaws.com/templates/hello-world/hello.json';

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
}
