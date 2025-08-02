<template>
  <div class="app">
    <div data-shotstack-studio class="canvas-container"></div>
    <div data-shotstack-timeline class="timeline-container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { Edit, Canvas, Controls, Timeline } from '@shotstack/shotstack-studio';
import theme from './minimal.json';

onMounted(async () => {
  try {
    // 1. Retrieve an edit from a template
    const templateUrl =
      'https://shotstack-assets.s3.amazonaws.com/templates/hello-world/hello.json';
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
    const timeline = new Timeline(edit, { width: 1280, height: 300 }, { theme });
    await timeline.load();

    // 6. Add keyboard controls
    const controls = new Controls(edit);
    await controls.load();

    // 7. Control playback with playback methods
    await edit.play();

    // Additional helpful information for the demo
    console.log(
      'Demo loaded successfully! Try the following keyboard controls:'
    );
    console.log('- Space: Play/Pause');
    console.log('- J: Stop');
    console.log('- K: Pause');
    console.log('- L: Play');
    console.log('- Left/Right Arrow: Seek');
    console.log('- Shift+Left/Right: Seek faster');
    console.log('- Comma/Period: Step frame by frame');
  } catch (error) {
    console.error('Error in Shotstack Studio demo:', error);
  }
});
</script>

<style>
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
  background-color: #f8f8f8;
}
</style>
