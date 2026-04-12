/*
  state.js
  This file stores ALL the important data for our app.

  IMPORTANT IDEA:
  The canvas is NOT the "truth".
  The "truth" is the state object.

  That way:
  - We can save the project (state) to a file
  - We can load it back and still edit shapes/text later
*/

export const state = {
  brush: {
    color: "#000000",
    size: 5,
    fill: false,
    shape: "round",
    opacity: 1
  },

  layers: [
    {
      id: "layer1",
      name: "Layer 1",
      objects: []
    }
  ],

  activeLayerId: "layer1",

  canvas: {
    width: 1200,
    height: 630
  },

  crop: {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  },

  zoom: 1,

  selectedId: null,

  mode: "draw",

  currentTool: "paint",

  drawing: {
    isDrawing: false,
    activeStrokeId: null
  }
};