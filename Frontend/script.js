/*
  Clean version of the advanced canvas system
  Keeps variable names similar to the old code
  But still supports:
   state system
   saving projects
   loading projects
   future shapes / text / images
*/

import { state } from "./state.js";

// Canvas setup
const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");
const ctx = canvas.getContext("2d");

// UI elements
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const loadProjectInput = document.getElementById("loadProjectInput");
const deleteBtn = document.getElementById("deleteBtn");

// Shape buttons
const addRectBtn = document.getElementById("addRectBtn");
const addCircleBtn = document.getElementById("addCircleBtn");
const addTriangleBtn = document.getElementById("addTriangleBtn");
const addLineBtn = document.getElementById("addLineBtn");
const fillToggle = document.getElementById("fillToggle");

let dragging = false;
let dragStart = { x: 0, y: 0 };

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


function getBounds(obj) {

  if (obj.type == "stroke") {
    const xs = obj.points.map(p => p.x);
    const ys = obj.points.map(p => p.y);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }

  if (obj.type === "shape") {
    if (obj.shapeType === "rectangle" || obj.shapeType === "triangle") {
      return { minX: obj.x, minY: obj.y, maxX: obj.x + obj.width, maxY: obj.y + obj.height };
    }
    if (obj.shapeType === "circle") {
      return { minX: obj.x - obj.radius, minY: obj.y - obj.radius, maxX: obj.x + obj.radius, maxY: obj.y + obj.radius };
    }
    if (obj.shapeType === "line") {
      return { minX: Math.min(obj.x, obj.x2), minY: Math.min(obj.y, obj.y2), maxX: Math.max(obj.x, obj.x2), maxY: Math.max(obj.y, obj.y2) };
    }
  }
}

function getObjectAt(x, y) {
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const obj = state.objects[i];

    if (obj.type !== "stroke" && obj.type !== "shape") continue;

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

    if (obj.type === "shape") obj.draw(pen);

    if (state.selectedId === obj.id) {
      drawSelection(obj);
    }

  }
    // future refrence for rosette, nevile and victoria
    //just uncomment the bottom lines based on your given task
    
    // if (obj.type === "text") drawText(obj);
    // if (obj.type === "image") drawImage(obj);
}

 function addText(){
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Hello World", 50, 50);
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

function drawShape(shapeType) {
  let shape;

  if (shapeType === "rectangle") {
    shape = {
      id: createId(),
      type: "shape",
      shapeType: "rectangle",
      x: canvas.width / 2 - 50,
      y: canvas.height / 2 - 50,
      width: 100,
      height: 80,
      color: state.brush.color,
      fill: state.brush.fill,
      draw: function(pen) {
        pen.strokeStyle = this.color;

        if (this.fill) {
          pen.fillStyle = this.color;
          pen.fillRect(this.x, this.y, this.width, this.height);
        }

        pen.strokeRect(this.x, this.y, this.width, this.height);
      }
    };
  }

  if (shapeType === "circle") {
    shape = {
      id: createId(),
      type: "shape",
      shapeType: "circle",
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 60,
      color: state.brush.color,
      fill: state.brush.fill,
      draw: function(pen) {
        pen.strokeStyle = this.color;
        pen.beginPath();
        pen.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.fill) {
          pen.fillStyle = this.color;
          pen.fill();
        }

        pen.stroke();
      }
    };
  }

  if (shapeType === "triangle") {
    shape = {
      id: createId(),
      type: "shape",
      shapeType: "triangle",
      x: canvas.width / 2 - 50,
      y: canvas.height / 2 - 50,
      width: 100,
      height: 100,
      color: state.brush.color,
      fill: state.brush.fill,
      draw: function(pen) {
        pen.strokeStyle = this.color;
        pen.beginPath();
        pen.moveTo(this.x + this.width/2, this.y);
        pen.lineTo(this.x, this.y + this.height);
        pen.lineTo(this.x + this.width, this.y + this.height);
        pen.closePath();

        if (this.fill) {
          pen.fillStyle = this.color;
          pen.fill();
        }
        pen.stroke();
      }
    };
  }

  if (shapeType === "line") {
    shape = {
      id: createId(),
      type: "shape",
      shapeType: "line",
      x: canvas.width / 2 - 50,
      y: canvas.height / 2,
      x2: canvas.width / 2 + 50,
      y2: canvas.height / 2,
      color: state.brush.color,
      fill: state.brush.fill,
      draw: function(pen) {
        pen.strokeStyle = this.color;
        pen.beginPath();
        pen.moveTo(this.x, this.y);
        pen.lineTo(this.x2, this.y2);
        pen.stroke();
      }
    };
  }

  state.objects.push(shape);
  state.selectedId = shape.id;
  render();
}

// Event listeners
addRectBtn.addEventListener("click", () => drawShape("rectangle"));
addCircleBtn.addEventListener("click", () => drawShape("circle"));
addTriangleBtn.addEventListener("click", () => drawShape("triangle"));
addLineBtn.addEventListener("click", () => drawShape("line"));

state.brush.fill = fillToggle.checked;

fillToggle.addEventListener("change", (e) => {
  state.brush.fill = e.target.checked;
});

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

  // if user clicked an existing object
  if (clicked) {
    state.selectedId = clicked.id;
    dragging = true;
    dragStart = pos;

    render();
    return;
  }

  // NORMAL DRAWING

  state.selectedId = null;

  state.drawing.isDrawing = true;

  const strokeId = createId();

  state.objects.push({
    id: strokeId,
    type: "stroke",
    color: state.brush.color,
    size: state.brush.size,
    points: [pos]
  });

  state.drawing.activeStrokeId = strokeId;

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

  // DRAGGING OBJECT
  if (dragging && state.selectedId) {

    const obj = state.objects.find(
      o => o.id === state.selectedId
    );

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (obj.type === "stroke") {
      obj.points.forEach(p => {
        p.x += dx;
        p.y += dy;
      });
    }

    if (obj.type === "shape") {
      if (obj.shapeType === "line") {
        obj.x += dx;
        obj.y += dy;
        obj.x2 += dx;
        obj.y2 += dy;
      } else {
        obj.x += dx;
        obj.y += dy;
      }
    }

    dragStart = pos;

    render();
  }

});

window.addEventListener("mouseup", () => {
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
  dragging = false;
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