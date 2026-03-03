/*
  Clean version of the advanced canvas system
  Keeps variable names similar to the old code
  But still supports:
  - state system
  - saving projects
  - loading projects
  - future shapes / text / images
*/

import { state } from "./state.js";

// Canvas setup
const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");

// UI elements
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const loadProjectInput = document.getElementById("loadProjectInput");

// Set starting brush settings
state.brush.color = colorPicker.value;
state.brush.size = Number(brushSize.value);

// Get mouse position inside canvas
function getMousePosition(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: event.clientX - box.left,
    y: event.clientY - box.top
  };
}

// Create unique id
// ever drawing needs an id this will be important later fr undo/redo etc
function createId() {
  return crypto.randomUUID();
}

// Render everything from state
function render() {
  // Clear canvas
  pen.clearRect(0, 0, canvas.width, canvas.height);

  // Draw every saved object
  for (const obj of state.objects) {
    if (obj.type === "stroke") drawStroke(obj);

    // future refrence for rosette, nevile and victoria
    //just uncomment the bottom lines based on your given task
    
    // if (obj.type === "shape") drawShape(obj);
    // if (obj.type === "text") drawText(obj);
    // if (obj.type === "image") drawImage(obj);
  }
}

// this draws pen strokes
function drawStroke(stroke) {
  if (!stroke.points || stroke.points.length < 2) return;

  pen.save();
  pen.strokeStyle = stroke.color;
  pen.lineWidth = stroke.size;
  pen.lineCap = "round";
  pen.lineJoin = "round";

  pen.beginPath();
  pen.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    pen.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  pen.stroke();
  pen.restore();
}

// Mouse drawing
canvas.addEventListener("mousedown", (event) => {
  state.drawing.isDrawing = true;

  const startPoint = getMousePosition(event);
  const strokeId = createId();

  // this saves new stroke into state
  state.objects.push({
    id: strokeId,
    type: "stroke",
    color: state.brush.color,
    size: state.brush.size,
    points: [startPoint]
  });

  state.drawing.activeStrokeId = strokeId;

  render();
});

canvas.addEventListener("mousemove", (event) => {
  if (!state.drawing.isDrawing) return;

  const activeStroke = state.objects.find(
    obj => obj.id === state.drawing.activeStrokeId
  );

  if (!activeStroke) return;

  activeStroke.points.push(getMousePosition(event));
  render();
});

window.addEventListener("mouseup", () => {
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
});

// UI controls
colorPicker.addEventListener("change", (e) => {
  state.brush.color = e.target.value;
});

brushSize.addEventListener("change", (e) => {
  state.brush.size = Number(e.target.value);
});

clearButton.addEventListener("click", () => {
  state.objects = [];
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  render();
});

// Save project
saveProjectBtn.addEventListener("click", () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "digital-canvas-project.json";
  link.click();

  URL.revokeObjectURL(url);
});

// Load project
loadProjectInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const loadedData = JSON.parse(text);

  if (!loadedData || !Array.isArray(loadedData.objects)) {
    alert("Invalid project file");
    e.target.value = "";
    return;
  }

  state.brush = loadedData.brush ?? state.brush;
  state.objects = loadedData.objects;

  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  colorPicker.value = state.brush.color;
  brushSize.value = String(state.brush.size);

  render();
  e.target.value = "";
});

// First render
render();