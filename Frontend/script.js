/*
  script.js
  This file handles:
  - drawing with the mouse (pen)
  - updating state
  - rendering (redrawing) the canvas
  - saving/loading projects (JSON)

  KEY IDEA:
  Every time something changes, we call render().
  render() clears the canvas and redraws everything from state.objects[].
*/

import { state } from "./state.js";

// -------------------------
// 1) Setup canvas
// -------------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// -------------------------
// 2) Grab UI elements
// -------------------------
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");

const saveProjectBtn = document.getElementById("saveProjectBtn");
const loadProjectInput = document.getElementById("loadProjectInput");

// Set brush settings from UI at the start
state.brush.color = colorPicker.value;
state.brush.size = Number(brushSize.value);

// -------------------------
// 3) Helper: get mouse position inside canvas
// -------------------------
function getMousePos(evt) {
  const box = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - box.left,
    y: evt.clientY - box.top
  };
}

// -------------------------
// 4) Helper: create a unique id for each object
// -------------------------
function uid() {
  return crypto.randomUUID();
}

// -------------------------
// 5) render() = draw everything from state.objects[]
// -------------------------
function render() {
  // Clear the whole canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Loop through every object saved in state
  for (const obj of state.objects) {
    // Right now we only support stroke objects
    if (obj.type === "stroke") drawStroke(obj);

    // Later teammates will add:
    // if (obj.type === "shape") drawShape(obj);
    // if (obj.type === "text") drawText(obj);
    // if (obj.type === "image") drawImage(obj);
  }
}

// -------------------------
// 6) drawStroke() = how we draw pen lines
// -------------------------
function drawStroke(strokeObj) {
  // Need at least 2 points to draw a line
  if (!strokeObj.points || strokeObj.points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = strokeObj.color;
  ctx.lineWidth = strokeObj.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(strokeObj.points[0].x, strokeObj.points[0].y);

  for (let i = 1; i < strokeObj.points.length; i++) {
    ctx.lineTo(strokeObj.points[i].x, strokeObj.points[i].y);
  }

  ctx.stroke();
  ctx.restore();
}

// -------------------------
// 7) Mouse events: create strokes and store them in state
// -------------------------
canvas.addEventListener("mousedown", (e) => {
  state.drawing.isDrawing = true;

  const p = getMousePos(e);
  const strokeId = uid();

  /*
    Create a new "stroke" object and push it into state.objects[].
    This is the important part.

    We are NOT just drawing pixels.
    We are saving the stroke as data.
  */
  state.objects.push({
    id: strokeId,
    type: "stroke",
    color: state.brush.color,
    size: state.brush.size,
    points: [p] // start with 1 point
  });

  state.drawing.activeStrokeId = strokeId;

  // Redraw the whole canvas
  render();
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.drawing.isDrawing) return;

  // Find the stroke we are currently drawing
  const active = state.objects.find(o => o.id === state.drawing.activeStrokeId);
  if (!active) return;

  // Add new point to the stroke
  active.points.push(getMousePos(e));

  // Redraw
  render();
});

window.addEventListener("mouseup", () => {
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
});

// -------------------------
// 8) UI events (colour, size, clear)
// -------------------------
colorPicker.addEventListener("change", (e) => {
  state.brush.color = e.target.value;
});

brushSize.addEventListener("change", (e) => {
  state.brush.size = Number(e.target.value);
});

clearButton.addEventListener("click", () => {
  // Remove all objects
  state.objects = [];
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  render();
});

// -------------------------
// 9) Save project (JSON)
// This saves STATE (objects list), not pixels.
// -------------------------
saveProjectBtn.addEventListener("click", () => {
  const data = JSON.stringify(state, null, 2); // formatted JSON
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "digital-canvas-project.json";
  a.click();

  URL.revokeObjectURL(url);
});

// -------------------------
// 10) Load project (JSON)
// Restores objects[] so we can edit later (shapes/text etc.)
// -------------------------
loadProjectInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const loaded = JSON.parse(text);

  // Basic validation
  if (!loaded || !Array.isArray(loaded.objects)) {
    alert("Invalid project file (missing objects array)");
    e.target.value = "";
    return;
  }

  // Restore only what we need
  state.brush = loaded.brush ?? state.brush;
  state.objects = loaded.objects;

  // Reset drawing state
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  // Update UI to match loaded brush settings
  colorPicker.value = state.brush.color;
  brushSize.value = String(state.brush.size);

  render();
  e.target.value = "";
});

// First draw
render();