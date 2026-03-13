/*
  Clean version of the advanced canvas system
  Keeps variable names similar to the old code
  But still supports:
   state system
   saving projects
   loading projects
   future shapes / text / images
*/

// RAINBOW PEN: https://www.w3schools.com/tags/canvas_strokestyle.asp

import { state } from "./state.js";

// Canvas setup
const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");

// UI elements
const selectBtn = document.getElementById("selectBtn");
const paintBtn = document.getElementById("paintBtn");
const highlightBtn = document.getElementById("highlightBtn");
const eraseBtn = document.getElementById("eraseBtn");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const loadProjectInput = document.getElementById("loadProjectInput");
const deleteBtn = document.getElementById("deleteBtn");

// Variables
let erasing = false;
let dragging = false;
let dragStart = { x: 0, y: 0 };
let mode = "paint";

// Set starting brush settings
state.brush.color = (colorPicker.value);
state.brush.size = Number(brushSize.value);
state.brush.shape = "round";
state.brush.opacity = 1;

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


function getBounds(stroke) {
  const xs = stroke.points.map(p => p.x);
  const ys = stroke.points.map(p => p.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function getObjectAt(x, y) {
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const obj = state.objects[i];

    if (obj.type !== "stroke") continue;

    const b = getBounds(obj);

    if (
      x >= b.minX - 5 &&
      x <= b.maxX + 5 &&
      y >= b.minY - 5 &&
      y <= b.maxY + 5
    ) {
      return obj;
    }
  }

  return null;
}


// Render everything from state
function render() {
  // Clear canvas
  pen.clearRect(0, 0, canvas.width, canvas.height);

  // Draw every saved object
  for (const obj of state.objects) {

  if (obj.type === "stroke") drawStroke(obj);

  if (state.selectedId === obj.id) {
    drawSelection(obj);
  }

}
    // future refrence for rosette, nevile and victoria
    //just uncomment the bottom lines based on your given task
    
    // if (obj.type === "shape") drawShape(obj);
    // if (obj.type === "text") drawText(obj);
    // if (obj.type === "image") drawImage(obj);
}


// MODES
selectBtn.addEventListener("click", () => {
  mode = "select";
});

paintBtn.addEventListener("click", () => {
  mode = "paint";
  state.brush.opacity = 1;
  state.brush.shape = "round";
});

highlightBtn.addEventListener("click", () => {
  mode = "highlight"
  state.brush.opacity = 0.5;
  state.brush.shape = "square";
})

eraseBtn.addEventListener("click", () => {
  mode = "erase";
});


// this draws pen strokes
function drawStroke(stroke) {
  if (!stroke.points || stroke.points.length < 2) return;

  pen.save();
  pen.strokeStyle = stroke.color;
  pen.lineWidth = stroke.size;
  pen.lineCap = stroke.shape;
  pen.lineJoin = stroke.shape;
  pen.globalAlpha = stroke.opacity;

  pen.beginPath();
  pen.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    pen.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  pen.stroke();
  pen.restore();
}

function drawSelection(obj) {
  const b = getBounds(obj);

  pen.strokeStyle = "blue";
  pen.lineWidth = 2;

  pen.strokeRect(
    b.minX - 5,
    b.minY - 5,
    (b.maxX - b.minX) + 10,
    (b.maxY - b.minY) + 10
  );
}

// Mouse drawing
canvas.addEventListener("mousedown", (event) => {
  const pos = getMousePosition(event);
  const clicked = getObjectAt(pos.x, pos.y);

  // SELECTION 
  // if user clicked on existing object
  if (clicked && mode == "select") {
    state.selectedId = clicked.id;
    dragging = true;
    dragStart = pos;

    render();
    return;
  }

  // NORMAL DRAWING
  if (mode == "paint" || mode == "highlight") {
    state.selectedId = null;

    state.drawing.isDrawing = true;

    const strokeId = createId();

    state.objects.push({
      id: strokeId,
      type: "stroke",
      color: state.brush.color,
      size: state.brush.size,
      shape: state.brush.shape,
      opacity: state.brush.opacity,
      points: [pos]
    });

    state.drawing.activeStrokeId = strokeId;
  }

  // ERASING
  if (mode == "erase") {
    erasing = true;
  }

  render();
});

canvas.addEventListener("mousemove", (event) => {

  const pos = getMousePosition(event);

  // DRAWING (original behaviour)
  if (state.drawing.isDrawing) {

    const activeStroke = state.objects.find(
      obj => obj.id === state.drawing.activeStrokeId
    );

    if (!activeStroke) return;

    activeStroke.points.push(pos);

    render();
    return;
  }

  // ERASING
  if (erasing) {
  //  if mouse position collides with stroke position, get stroke and set to null
  state.selectedId = getObjectAt(pos.x, pos.y).id;

  state.objects = state.objects.filter(
    o => o.id !== state.selectedId
  );
  state.selectedId = null;

  render();
  }

  // DRAGGING OBJECT
  if (dragging && state.selectedId) {

    const obj = state.objects.find(
      o => o.id === state.selectedId
    );

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    obj.points.forEach(p => {
      p.x += dx;
      p.y += dy;
    });

    dragStart = pos;

    render();
  }
});

window.addEventListener("mouseup", () => {
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
  dragging = false;
  erasing = false
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
  state.selectedId = null;

  render();
});

function deleteSelected() {
  if (!state.selectedId) return;

  state.objects = state.objects.filter(
    o => o.id !== state.selectedId
  );
  state.selectedId = null;

  render();
}

// Delete selected
deleteBtn.addEventListener("click", deleteSelected);
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete") {
    deleteSelected();
  }
});


// Save project
// popup elements
const savePopup = document.getElementById("savePopup");
const projectNameInput = document.getElementById("projectNameInput");
const saveConfirmBtn = document.getElementById("saveConfirmBtn");
const saveCancelBtn = document.getElementById("saveCancelBtn");

// open popup
saveProjectBtn.addEventListener("click", () => {
  projectNameInput.value = "";
  savePopup.style.display = "flex";
});

// save project
saveConfirmBtn.addEventListener("click", () => {
  const name = projectNameInput.value;
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = name + ".json";
  link.click();

  URL.revokeObjectURL(url);

  savePopup.style.display = "none";
});

// cancel popup
saveCancelBtn.addEventListener("click", () => {
  savePopup.style.display = "none";
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