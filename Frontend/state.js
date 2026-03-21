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

  /*
    objects[] = EVERYTHING on the canvas stored as data.

    For now, we store only pen strokes as:
    { type: "stroke", color, size, points: [{x,y}, ...] }

    Later team members will add:
     shapes: { type: "shape", shapeType: "triangle", x, y, w, h, ... }
     text:   { type: "text", value, x, y, font, ... }
     images: { type: "image", src, x, y, w, h }
  */
  objects: [],

  selectedId: null,

  mode: "draw",

  currentTool: "paint",

  // Used while the user is currently drawing
  drawing: {
    isDrawing: false,
    activeStrokeId: null
  }
};