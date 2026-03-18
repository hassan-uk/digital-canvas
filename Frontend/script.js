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

// Text button

const addTextBtn = document.getElementById("addTextBtn");
addTextBtn.addEventListener("click", addText);

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

// Text formatting state
// Text state
let textAlign = 'left';
let isBold = false;
let isItalic = false;
let isUnderline = false;
let isAddingText = false;
let textObjects = []; // stores all text on canvas
let selectedText = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// When "Add Text" is clicked, enable text placement mode
document.getElementById('insertTextBtn').addEventListener('click', () => {
    isAddingText = true;
    canvas.style.cursor = 'text';
});

// Click on canvas to place text input
canvas.addEventListener('click', (e) => {
    if (!isAddingText) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create an input box on top of the canvas
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type here...';
    input.style.position = 'absolute';
    input.style.left = `${rect.left + x}px`;
    input.style.top = `${rect.top + y - 10}px`;
    input.style.font = getFontString();
    input.style.color = document.getElementById('colorPicker').value;
    input.style.background = 'transparent';
    input.style.border = '1px dashed #aaa';
    input.style.outline = 'none';
    input.style.zIndex = 999;
    input.style.minWidth = '100px';
    document.body.appendChild(input);
    input.focus();

    // When user presses Enter or clicks away, confirm the text
    function confirmText() {
        const value = input.value.trim();
        if (value) {
            textObjects.push({
                text: value,
                x,
                y,
                font: getFontString(),
                color: document.getElementById('colorPicker').value,
                align: textAlign,
                underline: isUnderline
            });
            redrawCanvas();
        }
        document.body.removeChild(input);
        isAddingText = false;
        canvas.style.cursor = 'crosshair';
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmText();
    });

    input.addEventListener('blur', confirmText);
});

// Build font string from current settings
function getFontString() {
    const size = document.getElementById('fontSize').value;
    const font = document.getElementById('fontFamily').value;
    return `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${size}px '${font}'`;
}

// Redraw everything on canvas
function redrawCanvas() {
    // Redraw your existing shapes first
    // (your team's redraw function goes here)

    // Then draw all text objects
    textObjects.forEach(obj => {
        ctx.font = obj.font;
        ctx.fillStyle = obj.color;
        ctx.textAlign = obj.align;
        ctx.fillText(obj.text, obj.x, obj.y);

        // Underline
        if (obj.underline) {
            const width = ctx.measureText(obj.text).width;
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y + 3);
            ctx.lineTo(obj.x + width, obj.y + 3);
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
}

// Drag text
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a text object
    textObjects.forEach(obj => {
        ctx.font = obj.font;
        const width = ctx.measureText(obj.text).width;
        if (x >= obj.x && x <= obj.x + width && y >= obj.y - 20 && y <= obj.y + 5) {
            selectedText = obj;
            isDragging = true;
            dragOffsetX = x - obj.x;
            dragOffsetY = y - obj.y;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectedText) return;
    const rect = canvas.getBoundingClientRect();
    selectedText.x = e.clientX - rect.left - dragOffsetX;
    selectedText.y = e.clientY - rect.top - dragOffsetY;
    redrawCanvas();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    selectedText = null;
});
  
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