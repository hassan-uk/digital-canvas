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
const selectBtn = document.getElementById("selectBtn");
const paintBtn = document.getElementById("paintBtn");
const highlightBtn = document.getElementById("highlightBtn");
const eraseBtn = document.getElementById("eraseBtn");

const addTextBtn = document.getElementById("addTextBtn");
const fontFamilySelect = document.getElementById("fontFamily");
const fontSizeInput = document.getElementById("fontSize");

const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const underlineBtn = document.getElementById("underlineBtn");
const strikethroughBtn = document.getElementById("strikethroughBtn");

const alignLeftBtn = document.getElementById("alignLeftBtn");
const alignCenterBtn = document.getElementById("alignCenterBtn");
const alignRightBtn = document.getElementById("alignRightBtn");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const savePngBtn = document.getElementById("savePngBtn");
const loadProjectInput = document.getElementById("loadProjectInput");
const deleteBtn = document.getElementById("deleteBtn");
const importImageInput = document.getElementById("importImageInput");
const cropBtn = document.getElementById("cropBtn");
const resizeCanvasBtn = document.getElementById("resizeCanvasBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const addRectBtn = document.getElementById("addRectBtn");
const addCircleBtn = document.getElementById("addCircleBtn");
const addTriangleBtn = document.getElementById("addTriangleBtn");
const addLineBtn = document.getElementById("addLineBtn");
const fillToggle = document.getElementById("fillToggle");
const addLayerBtn = document.getElementById("addLayerBtn");
const deleteLayerBtn = document.getElementById("deleteLayerBtn");

const savePopup = document.getElementById("savePopup");
const projectNameInput = document.getElementById("projectNameInput");
const saveConfirmBtn = document.getElementById("saveConfirmBtn");
const saveCancelBtn = document.getElementById("saveCancelBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// Variables
let erasing = false;

let activeTextInput = null;

let textSettings = {
  fontFamily: "Arial",
  fontSize: 20,
  bold: false,
  italic: false,
  underline: false,
  align: "left"
};

let dragging = false;
let dragStart = { x: 0, y: 0 };

let resizing = false;
let resizeHandle = null;

let rotating = false;
let rotationOffset = 0;

let history = [];
let historyIndex = -1;

// Set starting brush settings
state.brush.color = colorPicker.value;
state.brush.size = Number(brushSize.value);
state.brush.shape = "round";
state.brush.opacity = 1;
state.currentTool = "paint";

canvas.width = state.canvas.width;
canvas.height = state.canvas.height;
applyZoom();

function getActiveLayer() {
  return state.layers.find(layer => layer.id === state.activeLayerId);
}

function getObjectRecordById(id) {
  for (const layer of state.layers) {
    const obj = layer.objects.find(item => item.id === id);
    if (obj) {
      return { layer, obj };
    }
  }
  return null;
}

// Get mouse position inside canvas
function getMousePosition(event) {
  const box = canvas.getBoundingClientRect();
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;

  return {
    x: (event.clientX - box.left) * scaleX,
    y: (event.clientY - box.top) * scaleY
  };
}

// Create unique id
// Every drawing needs an id this will be important later for undo/redo etc
function createId() {
  return crypto.randomUUID();
}

function getObjectCenter(obj) {
  if (obj.type === "shape") {
    if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
      return {
        x: obj.x + obj.width / 2,
        y: obj.y + obj.height / 2
      };
    }

    if (obj.shapeType === "circle") {
      return {
        x: obj.x,
        y: obj.y
      };
    }

    if (obj.shapeType === "line") {
      return {
        x: (obj.x + obj.x2) / 2,
        y: (obj.y + obj.y2) / 2
      };
    }
  }

  if (obj.type === "stroke") {
    const b = getBounds(obj);
    return {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2
    };
  }

  if (obj.type === "text") {
    const b = getBounds(obj);
    return {
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2
    };
  }

  return { x: 0, y: 0 };
}

function rotatePoint(px, py, cx, cy, angle) {
  const dx = px - cx;
  const dy = py - cy;

  return {
    x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: cy + dx * Math.sin(angle) + dy * Math.cos(angle)
  };
}

function getRotatedCorners(obj) {
  const angle = obj.rotation || 0;
  const center = getObjectCenter(obj);

  if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
    return [
      rotatePoint(obj.x, obj.y, center.x, center.y, angle),
      rotatePoint(obj.x + obj.width, obj.y, center.x, center.y, angle),
      rotatePoint(obj.x, obj.y + obj.height, center.x, center.y, angle),
      rotatePoint(obj.x + obj.width, obj.y + obj.height, center.x, center.y, angle)
    ];
  }

  if (obj.shapeType === "line") {
    return [
      rotatePoint(obj.x, obj.y, center.x, center.y, angle),
      rotatePoint(obj.x2, obj.y2, center.x, center.y, angle)
    ];
  }

  return [];
}


// Returns all the points on a stroke
function getAllPoints(obj) {
  const xs = obj.points.map(p => p.x);
  const ys = obj.points.map(p => p.y);

  return obj.points;
}


// Gets object from all stroke points
function getBetterObjectAt(x, y) {
  var xGood = false;
  var yGood = false;

  for (let i = state.objects.length - 1; i >= 0; i--) {
    const obj = state.objects[i];

    if (obj.type !== "stroke") continue;

    // Get array of all stroke points
    // const b = getAllPoints(obj);

    const b = getAllPoints(obj);

    // For every point, check if selection in vicinity
    for (var p of b) {
      var rad = brushSize.value*1;
      var lastPoint = b[0];
      xGood = false;
      yGood = false;

      if (b.indexOf(p) > 1) {
        lastPoint = b[b.indexOf(p) - 1];
      }

      if (x >= (Math.min(p.x-rad, lastPoint.x-rad)) && x <= (Math.max(p.x+rad, lastPoint.x+rad))) {
        xGood = true;
      }

      if (y >= (Math.min(p.y-rad, lastPoint.y-rad)) && y <= (Math.max(p.y+rad, lastPoint.y+rad))) {
        yGood = true;
      }

      // If both x and y in close vicinity, return object
      if (xGood && yGood) {
        console.log("x and y good");
        return obj;
      }
    }
  }
}


function getBounds(obj) {
  if (obj.type === "stroke") {
    const xs = obj.points.map(p => p.x);
    const ys = obj.points.map(p => p.y);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }


  if (obj.type === "text") {

  pen.save();

  let font = "";
  if (obj.bold) font += "bold ";
  if (obj.italic) font += "italic ";
  font += `${obj.fontSize}px ${obj.fontFamily}`;

  pen.font = font;

  const width = pen.measureText(obj.text).width;
  const height = obj.fontSize;

  pen.restore();

  let minX = obj.x;
  let maxX = obj.x + width;

  if (obj.align === "center") {
    minX = obj.x - width / 2;
    maxX = obj.x + width / 2;
  }

  if (obj.align === "right") {
    minX = obj.x - width;
    maxX = obj.x;
  }

  return {
    minX: minX - 6,
    minY: obj.y - height - 6,
    maxX: maxX + 6,
    maxY: obj.y + 6
  };
}

  if (obj.type === "shape") {
    if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
      const corners = getRotatedCorners(obj);
      const xs = corners.map(p => p.x);
      const ys = corners.map(p => p.y);

      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
      };
    }

    if (obj.shapeType === "circle") {
      return {
        minX: obj.x - obj.radius,
        minY: obj.y - obj.radius,
        maxX: obj.x + obj.radius,
        maxY: obj.y + obj.radius
      };
    }

    if (obj.shapeType === "line") {
      const points = getRotatedCorners(obj);
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);

      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
      };
    }
  }

  return null;
}

function getObjectAt(x, y) {
  for (let layerIndex = state.layers.length - 1; layerIndex >= 0; layerIndex--) {
    const layer = state.layers[layerIndex];

    for (let i = layer.objects.length - 1; i >= 0; i--) {
      const obj = layer.objects[i];

      if (obj.type !== "stroke" && obj.type !== "shape" && obj.type !== "text") continue;

      const b = getBounds(obj);
      if (!b) continue;

      if (
        x >= b.minX - 5 &&
        x <= b.maxX + 5 &&
        y >= b.minY - 5 &&
        y <= b.maxY + 5
      ) {
        return { layer, obj };
      }
    }
  }

  return null;
}

function renderGrid(context) {
  const gridSize = 25;
  context.save();
  context.strokeStyle = "#eaeaea";
  context.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.restore();
}

function drawCursor(x, y) {
  pen.save();
  pen.strokeStyle = "#000000";
  pen.lineWidth = 1.5;

  pen.beginPath();
  pen.moveTo(x - 8, y);
  pen.lineTo(x + 8, y);
  pen.moveTo(x, y - 8);
  pen.lineTo(x, y + 8);
  pen.stroke();

  pen.restore();
}


// Render everything from state
function render() {
  pen.clearRect(0, 0, canvas.width, canvas.height);

  pen.save();
  pen.fillStyle = "#ffffff";
  pen.fillRect(0, 0, canvas.width, canvas.height);
  pen.restore();

  renderGrid(pen);

  for (const layer of state.layers) {
    if (layer.visible === false) continue;
    for (const obj of layer.objects) {
      if (obj.type === "stroke") drawStroke(obj);
      if (obj.type === "shape") obj.draw(pen);
      if (obj.type === "text") drawText(obj);
      if (state.selectedId === obj.id) drawSelection(obj);
    }
  }

  if (state.mode === "crop" && state.crop.active) {
    drawCropBox();
  }
  renderLayerPanel();
  if (state.lastMousePos) drawCursor(state.lastMousePos.x, state.lastMousePos.y);
}

    // future refrence for rosette, nevile and victoria
    //just uncomment the bottom lines based on your given task
    
    // if (obj.type === "text") drawText(obj);
    // if (obj.type === "image") drawImage(obj);

function renderLayerPanel() {
  const panel = document.getElementById("layerPanel");
  panel.onclick = (e) => {
  e.stopPropagation();
};
  const buttons = panel.querySelectorAll("#addLayerBtn, #deleteLayerBtn");
  panel.innerHTML = "";
  const topRow = document.createElement("div");
  topRow.className = "layerActions";

  buttons.forEach(el => topRow.appendChild(el));
  panel.appendChild(topRow);

  // show top layer first
  [...state.layers].reverse().forEach(layer => {
    const div = document.createElement("div");
    div.className = "layerItem";

    if (layer.id === state.activeLayerId) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <span>${layer.name}</span>
      <button>
         <i class="bi ${layer.visible ? "bi-eye" : "bi-eye-slash"}"></i>
      </button>
    `;

    // click = select layer
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      state.activeLayerId = layer.id;
      render();
    });

    // button = toggle visibility
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      render();
    });

    panel.appendChild(div);
  });
}


function drawStroke(stroke) {
  if (!stroke.points || stroke.points.length < 2) return;

  pen.save();

  if (stroke.tool === "erase") {
    const activeLayer = getActiveLayer();

    // Only erase if this stroke belongs to active layer
    if (!activeLayer.objects.includes(stroke)) {
      return; // skip erase on other layers
    }
    
    pen.globalCompositeOperation = "destination-out";
    pen.strokeStyle = "rgba(0,0,0,1)";
  } else {
    pen.globalCompositeOperation = "source-over";
    pen.strokeStyle = stroke.color;
    pen.globalAlpha = stroke.opacity;
  }

  pen.lineWidth = stroke.size;
  pen.lineCap = stroke.shape;
  pen.lineJoin = stroke.shape;

  pen.beginPath();
  pen.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    pen.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  pen.stroke();
  pen.restore();
}

function drawText(obj) {
  pen.save();

  let font = "";
  if (obj.bold) font += "bold ";
  if (obj.italic) font += "italic ";
  font += `${obj.fontSize}px ${obj.fontFamily}`;

  pen.font = font;
  pen.fillStyle = obj.color;
  pen.textAlign = obj.align || "left";

  let drawX = obj.x;
  let drawY = obj.y;

  if (obj.rotation) {
    pen.translate(obj.x, obj.y);
    pen.rotate(obj.rotation);
    drawX = 0;
    drawY = 0;
  }

  pen.fillText(obj.text, drawX, drawY);

  const width = pen.measureText(obj.text).width;

  // ✅ UNDERLINE
  if (obj.underline) {
    pen.beginPath();
    pen.moveTo(drawX, drawY + 4);
    pen.lineTo(drawX + width, drawY + 4);
    pen.strokeStyle = obj.color;
    pen.lineWidth = obj.fontSize / 15;
    pen.stroke();
  }

  // ✅ STRIKETHROUGH
  if (obj.strikethrough) {
    pen.beginPath();
    pen.moveTo(drawX, drawY - obj.fontSize / 3);
    pen.lineTo(drawX + width, drawY - obj.fontSize / 3);
    pen.strokeStyle = obj.color;
    pen.lineWidth = obj.fontSize / 15;
    pen.stroke();
  }

  pen.restore();
}

function assignShapeDrawFunction(shape) {
  if (shape.shapeType === "rectangle") {
    shape.draw = function(pen) {
      pen.save();
      pen.strokeStyle = this.color;
      pen.fillStyle = this.color;

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      pen.translate(centerX, centerY);
      pen.rotate(this.rotation || 0);

      if (this.fill) {
        pen.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      }

      pen.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
      pen.restore();
    };
  }

  if (shape.shapeType === "circle") {
    shape.draw = function(pen) {
      pen.save();
      pen.strokeStyle = this.color;
      pen.beginPath();
      pen.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      if (this.fill) {
        pen.fillStyle = this.color;
        pen.fill();
      }

      pen.stroke();
      pen.restore();
    };
  }

  if (shape.shapeType === "triangle") {
    shape.draw = function(pen) {
      pen.save();
      pen.strokeStyle = this.color;
      pen.fillStyle = this.color;

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      pen.translate(centerX, centerY);
      pen.rotate(this.rotation || 0);

      pen.beginPath();
      pen.moveTo(0, -this.height / 2);
      pen.lineTo(-this.width / 2, this.height / 2);
      pen.lineTo(this.width / 2, this.height / 2);
      pen.closePath();

      if (this.fill) {
        pen.fill();
      }
      pen.stroke();
      pen.restore();
    };
  }

  if (shape.shapeType === "line") {
    shape.draw = function(pen) {
      pen.save();
      pen.strokeStyle = this.color;

      const centerX = (this.x + this.x2) / 2;
      const centerY = (this.y + this.y2) / 2;

      pen.translate(centerX, centerY);
      pen.rotate(this.rotation || 0);

      pen.beginPath();
      pen.moveTo(this.x - centerX, this.y - centerY);
      pen.lineTo(this.x2 - centerX, this.y2 - centerY);
      pen.stroke();
      pen.restore();
    };
  }

  if (shape.shapeType === "image") {
    shape.draw = function(pen) {
      if (!this.imageRef) {
        this.imageRef = new Image();
        this.imageRef.src = this.src;
        this.imageRef.onload = () => render();
      }

      if (!this.imageRef.complete) return;

      pen.save();

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      pen.translate(centerX, centerY);
      pen.rotate(this.rotation || 0);

      pen.drawImage(
        this.imageRef,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );

      pen.restore();
    };
  }
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
      rotation: 0
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
      rotation: 0
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
      rotation: 0
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
      rotation: 0
    };
  }

  if (!shape) return;

  assignShapeDrawFunction(shape);
  getActiveLayer().objects.push(shape);
  saveHistory();
  state.selectedId = shape.id;
  state.mode = "select";
  updateToolButtons();
  render();
}

function createImageObject(src, x, y, width, height) {
  const imageObj = {
    id: createId(),
    type: "shape",
    shapeType: "image",
    x,
    y,
    width,
    height,
    src,
    rotation: 0
  };

  assignShapeDrawFunction(imageObj);
  return imageObj;
}

function restoreShapeFunctions() {
  state.layers.flatMap(layer => layer.objects).forEach(obj => {
    if (obj.type !== "shape") return;
    assignShapeDrawFunction(obj);
  });
}

function applyZoom() {
  canvas.style.transform = `scale(${state.zoom})`;
  canvas.style.transformOrigin = "top center";
}
function exportCanvasAsPng() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportPen = exportCanvas.getContext("2d");

  exportPen.fillStyle = "#ffffff";
  exportPen.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  const gridSize = 25;
  exportPen.strokeStyle = "#eaeaea";
  exportPen.lineWidth = 1;

  for (let x = 0; x <= exportCanvas.width; x += gridSize) {
    exportPen.beginPath();
    exportPen.moveTo(x, 0);
    exportPen.lineTo(x, exportCanvas.height);
    exportPen.stroke();
  }

  for (let y = 0; y <= exportCanvas.height; y += gridSize) {
    exportPen.beginPath();
    exportPen.moveTo(0, y);
    exportPen.lineTo(exportCanvas.width, y);
    exportPen.stroke();
  }

  for (const layer of state.layers) {
    for (const obj of layer.objects) {
      if (obj.type === "stroke") {
        exportPen.save();

        if (obj.tool === "erase") {
          exportPen.strokeStyle = "#ffffff";
          exportPen.globalAlpha = 1;
        } else {
          exportPen.strokeStyle = obj.color;
          exportPen.globalAlpha = obj.opacity;
        }

        exportPen.lineWidth = obj.size;
        exportPen.lineCap = obj.shape;
        exportPen.lineJoin = obj.shape;

        exportPen.beginPath();
        exportPen.moveTo(obj.points[0].x, obj.points[0].y);

        for (let i = 1; i < obj.points.length; i++) {
          exportPen.lineTo(obj.points[i].x, obj.points[i].y);
        }

        exportPen.stroke();
        exportPen.restore();
      }

      if (obj.type === "shape") {
        obj.draw(exportPen);
      }
    }
  }

  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = "visualgrid.png";
  link.click();
}


function applyAlignToSelected() {
  if (!state.selectedId) return;

  const record = getObjectRecordById(state.selectedId);
  if (!record) return;

  const obj = record.obj;

  if (obj.type === "text") {
    obj.align = textSettings.align;
    saveHistory();
    render();
  }
}

addLayerBtn.addEventListener("click", () => {
  const newLayer = {
    id: crypto.randomUUID(),
    name: "Layer " + (state.layers.length + 1),
    visible: true,
    objects: []
  };

  state.layers.push(newLayer);
  state.activeLayerId = newLayer.id;
  state.selectedId = null;

  saveHistory();
  render();
});

deleteLayerBtn.addEventListener("click", () => {
  if (state.layers.length <= 1) return;

  const deletedLayerId = state.activeLayerId;
  const selectedRecord = state.selectedId ? getObjectRecordById(state.selectedId) : null;

  state.layers = state.layers.filter(layer => layer.id !== deletedLayerId);
  state.activeLayerId = state.layers[state.layers.length - 1].id;

  if (selectedRecord && selectedRecord.layer.id === deletedLayerId) {
    state.selectedId = null;
  }

  saveHistory();
  render();
});

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
  if (!b) return;

  pen.strokeStyle = "blue";
  pen.lineWidth = 2;

  pen.strokeRect(
    b.minX - 5,
    b.minY - 5,
    (b.maxX - b.minX) + 10,
    (b.maxY - b.minY) + 10
  );

  const size = 8;

  const corners = [
    { x: b.minX, y: b.minY },
    { x: b.maxX, y: b.minY },
    { x: b.minX, y: b.maxY },
    { x: b.maxX, y: b.maxY }
  ];

  pen.fillStyle = "white";
  pen.strokeStyle = "blue";

  corners.forEach(c => {
    pen.beginPath();
    pen.rect(c.x - size / 2, c.y - size / 2, size, size);
    pen.fill();
    pen.stroke();
  });

  const rotateHandleX = (b.minX + b.maxX) / 2;
  const rotateHandleY = b.minY - 25;

  pen.beginPath();
  pen.moveTo((b.minX + b.maxX) / 2, b.minY);
  pen.lineTo(rotateHandleX, rotateHandleY);
  pen.stroke();

  pen.beginPath();
  pen.arc(rotateHandleX, rotateHandleY, 6, 0, Math.PI * 2);
  pen.fillStyle = "white";
  pen.fill();
  pen.stroke();
}

function drawCropBox() {
  const x = Math.min(state.crop.startX, state.crop.currentX);
  const y = Math.min(state.crop.startY, state.crop.currentY);
  const width = Math.abs(state.crop.currentX - state.crop.startX);
  const height = Math.abs(state.crop.currentY - state.crop.startY);

  pen.save();
  pen.strokeStyle = "red";
  pen.lineWidth = 2;
  pen.setLineDash([6, 6]);
  pen.strokeRect(x, y, width, height);
  pen.restore();
}

// if clicked on corner
function getResizeHandle(obj, x, y) {
  const b = getBounds(obj);
  if (!b) return null;

  const size = 10;

  const handles = {
    tl: { x: b.minX, y: b.minY },
    tr: { x: b.maxX, y: b.minY },
    bl: { x: b.minX, y: b.maxY },
    br: { x: b.maxX, y: b.maxY }
  };

  for (const key in handles) {
    const h = handles[key];

    if (
      x >= h.x - size &&
      x <= h.x + size &&
      y >= h.y - size &&
      y <= h.y + size
    ) {
      return key;
    }
  }

  return null;
}

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify({
    layers: state.layers,
    canvas: state.canvas,
    activeLayerId: state.activeLayerId,
    zoom: state.zoom
  }));
  historyIndex++;
}

function undo() {
  if (historyIndex <= 0) return;

  historyIndex--;
  const savedState = JSON.parse(history[historyIndex]);
  state.layers = savedState.layers;
  state.canvas = savedState.canvas ?? state.canvas;
  state.activeLayerId = savedState.activeLayerId ?? state.layers[0].id;
  state.zoom = savedState.zoom ?? 1;
  canvas.width = state.canvas.width;
  canvas.height = state.canvas.height;
  restoreShapeFunctions();
  applyZoom();
  state.selectedId = null;

  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;

  historyIndex++;
  const savedState = JSON.parse(history[historyIndex]);
  state.layers = savedState.layers;
  state.canvas = savedState.canvas ?? state.canvas;
  state.activeLayerId = savedState.activeLayerId ?? state.layers[0].id;
  state.zoom = savedState.zoom ?? 1;
  canvas.width = state.canvas.width;
  canvas.height = state.canvas.height;
  restoreShapeFunctions();
  applyZoom();
  state.selectedId = null;

  render();
}

function getRotateHandle(obj, x, y) {
  const b = getBounds(obj);
  if (!b) return false;

  const handleX = (b.minX + b.maxX) / 2;
  const handleY = b.minY - 25;
  const size = 10;

  return (
    x >= handleX - size &&
    x <= handleX + size &&
    y >= handleY - size &&
    y <= handleY + size
  );
}

function updateToolButtons() {
  paintBtn.classList.remove("activeTool");
  highlightBtn.classList.remove("activeTool");
  eraseBtn.classList.remove("activeTool");
  selectBtn.classList.remove("activeTool");
  cropBtn.classList.remove("activeTool");

  if (state.mode === "select") {
    selectBtn.classList.add("activeTool");
  } else if (state.mode === "crop") {
    cropBtn.classList.add("activeTool");
  } else {
    if (state.currentTool === "paint") {
      paintBtn.classList.add("activeTool");
    }

    if (state.currentTool === "highlight") {
      highlightBtn.classList.add("activeTool");
    }

    if (state.currentTool === "erase") {
      eraseBtn.classList.add("activeTool");
    }
  }
}

paintBtn.addEventListener("click", () => {
  state.mode = "draw";
  state.currentTool = "paint";
  state.selectedId = null;
  state.brush.shape = "round";
  state.brush.opacity = 1;
  updateToolButtons();
  render();
});



const textDropdown = document.querySelector(".dropdown-menu");

addTextBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  // OPEN / CLOSE DROPDOWN
  textDropdown.classList.toggle("open");

  // ACTIVATE TEXT TOOL
  state.currentTool = "text";
  state.mode = "draw";
  state.selectedId = null;
});

fontFamilySelect.addEventListener("change", () => {
  textSettings.fontFamily = fontFamilySelect.value;
});

fontSizeInput.addEventListener("change", () => {
  textSettings.fontSize = Number(fontSizeInput.value);
});



boldBtn.addEventListener("click", () => {
  textSettings.bold = !textSettings.bold;
  boldBtn.classList.toggle("activeTool", textSettings.bold);
});

italicBtn.addEventListener("click", () => {
  textSettings.italic = !textSettings.italic;
  italicBtn.classList.toggle("activeTool", textSettings.italic);
});

underlineBtn.addEventListener("click", () => {
  textSettings.underline = !textSettings.underline;
  underlineBtn.classList.toggle("activeTool", textSettings.underline);
});

alignLeftBtn.onclick = () => {
  textSettings.align = "left";

  alignLeftBtn.classList.add("activeTool");
  alignCenterBtn.classList.remove("activeTool");
  alignRightBtn.classList.remove("activeTool");

  applyAlignToSelected();
};

alignCenterBtn.onclick = () => {
  textSettings.align = "center";

  alignCenterBtn.classList.add("activeTool");
  alignLeftBtn.classList.remove("activeTool");
  alignRightBtn.classList.remove("activeTool");

  applyAlignToSelected();
};

alignRightBtn.onclick = () => {
  textSettings.align = "right";

  alignRightBtn.classList.add("activeTool");
  alignLeftBtn.classList.remove("activeTool");
  alignCenterBtn.classList.remove("activeTool");

  applyAlignToSelected();
};

highlightBtn.addEventListener("click", () => {
  state.mode = "draw";
  state.currentTool = "highlight";
  state.selectedId = null;
  state.brush.shape = "square";
  state.brush.opacity = 0.25;
  updateToolButtons();
  render();
});

eraseBtn.addEventListener("click", () => {
  state.mode = "draw";
  state.currentTool = "erase";
  state.selectedId = null;
  state.brush.shape = "round";
  state.brush.opacity = 1;
  updateToolButtons();
  render();
});

selectBtn.addEventListener("click", () => {
  if (state.mode === "select") {
    state.mode = "draw";
    state.selectedId = null;
  } else {
    state.mode = "select";
  }

  updateToolButtons();
  render();
});

cropBtn.addEventListener("click", () => {
  if (state.mode === "crop") {
    state.mode = "draw";
    state.crop.active = false;
  } else {
    state.mode = "crop";
    state.selectedId = null;
  }

  updateToolButtons();
  render();
});

resizeCanvasBtn.addEventListener("click", () => {
  const newWidth = prompt("Enter new canvas width", canvas.width);
  if (newWidth === null) return;

  const newHeight = prompt("Enter new canvas height", canvas.height);
  if (newHeight === null) return;

  const width = Number(newWidth);
  const height = Number(newHeight);

  if (!width || !height || width < 50 || height < 50) {
    alert("Invalid canvas size");
    return;
  }

  state.canvas.width = width;
  state.canvas.height = height;
  canvas.width = width;
  canvas.height = height;

  saveHistory();
  render();
});

zoomInBtn.addEventListener("click", () => {
  state.zoom = Math.min(3, +(state.zoom + 0.1).toFixed(2));
  applyZoom();
});

zoomOutBtn.addEventListener("click", () => {
  state.zoom = Math.max(0.4, +(state.zoom - 0.1).toFixed(2));
  applyZoom();
});

savePngBtn.addEventListener("click", exportCanvasAsPng);

importImageInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      const maxWidth = canvas.width * 0.6;
      const maxHeight = canvas.height * 0.6;

      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

      width *= ratio;
      height *= ratio;

      const imageObj = createImageObject(
        reader.result,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height
      );

      imageObj.imageRef = img;

      getActiveLayer().objects.push(imageObj);
      state.selectedId = imageObj.id;
      state.mode = "select";

      saveHistory();
      updateToolButtons();
      render();
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
  e.target.value = "";
});

function cropCanvas() {
  const x = Math.min(state.crop.startX, state.crop.currentX);
  const y = Math.min(state.crop.startY, state.crop.currentY);
  const width = Math.abs(state.crop.currentX - state.crop.startX);
  const height = Math.abs(state.crop.currentY - state.crop.startY);

  if (width < 10 || height < 10) {
    state.crop.active = false;
    state.mode = "draw";
    updateToolButtons();
    render();
    return;
  }

  for (const layer of state.layers) {
    const newObjects = [];

    for (const obj of layer.objects) {
      const bounds = getBounds(obj);
      if (!bounds) continue;

      const intersects =
        bounds.maxX >= x &&
        bounds.minX <= x + width &&
        bounds.maxY >= y &&
        bounds.minY <= y + height;

      if (!intersects) continue;

      if (obj.type === "stroke") {
        obj.points = obj.points
          .filter(point =>
            point.x >= x &&
            point.x <= x + width &&
            point.y >= y &&
            point.y <= y + height
          )
          .map(point => ({
            x: point.x - x,
            y: point.y - y
          }));

        if (obj.points.length >= 2) {
          newObjects.push(obj);
        }
      }

      if (obj.type === "shape") {
        if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
          obj.x -= x;
          obj.y -= y;
        }

        if (obj.shapeType === "circle") {
          obj.x -= x;
          obj.y -= y;
        }

        if (obj.shapeType === "line") {
          obj.x -= x;
          obj.y -= y;
          obj.x2 -= x;
          obj.y2 -= y;
        }

        newObjects.push(obj);
      }
    }

    layer.objects = newObjects;
  }

  state.canvas.width = width;
  state.canvas.height = height;
  canvas.width = width;
  canvas.height = height;

  state.selectedId = null;
  state.crop.active = false;
  state.mode = "draw";

  saveHistory();
  updateToolButtons();
  render();
}

function toggleDropdown(id) {
  const el = document.getElementById(id);
  const wasOpen = el.classList.contains("open");
  document.querySelectorAll(".drop-wrap").forEach(d => d.classList.remove("open"));
  if (!wasOpen) el.classList.add("open");
}

document.addEventListener("click", e => {
  if (!e.target.closest(".drop-wrap")) {
    document.querySelectorAll(".drop-wrap").forEach(d => d.classList.remove("open"));
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    textDropdown.classList.remove("open");
  }
});

window.toggleDropdown = toggleDropdown;

// Mouse drawing
canvas.addEventListener("mousedown", (event) => {
  const pos = getMousePosition(event);

  if (state.mode !== "select" && state.currentTool !== "text") {
    const clickedRecord = getObjectAt(pos.x, pos.y);
    if (clickedRecord && clickedRecord.obj.type === "text") {
      state.selectedId = clickedRecord.obj.id;
      state.activeLayerId = clickedRecord.layer.id;
      state.mode = "select";
      updateToolButtons();
      render();
      return;
    }
  }

  if (state.currentTool === "text") {

    // remove old input if exists
    if (activeTextInput) {
      activeTextInput.remove();
    }

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type here...";

    const rect = canvas.getBoundingClientRect();

    input.style.position = "absolute";
    input.style.left = rect.left + pos.x + "px";
    input.style.top = rect.top + pos.y + "px";
    input.style.fontSize = textSettings.fontSize + "px";
    input.style.fontFamily = textSettings.fontFamily;
    input.style.border = "1px dashed #333";
    input.style.background = "transparent";
    input.style.color = state.brush.color;
    input.style.outline = "none";
    input.style.zIndex = 1000;

    document.body.appendChild(input);
    setTimeout(() => input.focus(), 0);

    activeTextInput = input;

    // SAVE TEXT
    input.addEventListener("keydown", (e) => {
      
      if (e.key === "Enter") {
        if (input.value.trim() !== "") {
          getActiveLayer().objects.push({
            id: createId(),
            type: "text",
            x: pos.x,
            y: pos.y,
            text: input.value,
            fontSize: textSettings.fontSize,
            fontFamily: textSettings.fontFamily,
            bold: textSettings.bold,
            italic: textSettings.italic,
            underline: textSettings.underline,
            align: textSettings.align,
            color: state.brush.color,
            rotation: 0                    // ← enables rotate handle
        });

          saveHistory();
          render();
        }

        input.remove();
        activeTextInput = null;

        state.currentTool = "paint";
        state.mode = "draw";
        updateToolButtons();
      }

      if (e.key === "Escape") {
        input.remove();
        activeTextInput = null;

        state.currentTool = "paint"; // or "select"
      }
    });

    return;
  }

  if (state.mode === "select") {

    const clickedRecord = getObjectAt(pos.x, pos.y);  
    if (clickedRecord) {

      const obj = clickedRecord.obj;
      if (obj.type === "text") {
        textSettings.align = obj.align || "left";

        alignLeftBtn.classList.toggle("activeTool", obj.align === "left");
        alignCenterBtn.classList.toggle("activeTool", obj.align === "center");
        alignRightBtn.classList.toggle("activeTool", obj.align === "right");
      }

      state.selectedId = obj.id;
      console.log("Selected:", obj);
      state.activeLayerId = clickedRecord.layer.id;

      // check resize
      const handle = getResizeHandle(obj, pos.x, pos.y);
      if (handle) {
        resizing = true;
        resizeHandle = handle;
        dragStart = pos;
        return;
      }

      // check rotate
      if (obj.type === "shape" || obj.type === "text") {
        const rotateClicked = getRotateHandle(obj, pos.x, pos.y);
        if (rotateClicked) {
          rotating = true;

          const center = getObjectCenter(obj);
          const mouseAngle = Math.atan2(pos.y - center.y, pos.x - center.x);

          rotationOffset = mouseAngle - (obj.rotation || 0);
          return;
        }
      }

      dragging = true;
      dragStart = pos;

      render();
      return;
    }

    // click empty space
    state.selectedId = null;
    render();
    return;
  }

  // NORMAL DRAWING

  state.selectedId = null;
  state.drawing.isDrawing = true;

  const strokeId = createId();

  let strokeColor = state.brush.color;
  let strokeOpacity = state.brush.opacity;
  let strokeSize = state.brush.size;

  if (state.currentTool === "highlight") {
    strokeOpacity = 0.25;
    strokeSize = state.brush.size + 8;
  }

  if (state.currentTool === "erase") {
    strokeColor = "#ffffff";
    strokeOpacity = 1;
    strokeSize = state.brush.size + 10;
    erasing = true;
  }

  getActiveLayer().objects.push({
    id: strokeId,
    type: "stroke",
    tool: state.currentTool,
    color: strokeColor,
    size: strokeSize,
    shape: state.brush.shape,
    opacity: strokeOpacity,
    points: [pos]
  });

  state.drawing.activeStrokeId = strokeId;

  render();
});

canvas.addEventListener("mousemove", (event) => {
  const pos = getMousePosition(event);
  state.lastMousePos = pos;
   render();

  if (state.mode === "crop") {
    if (state.crop.active) {
      state.crop.currentX = pos.x;
      state.crop.currentY = pos.y;
      render();
    }
    return;
  }

  if (state.mode !== "select") {
    // DRAWING (original behaviour)
    if (state.drawing.isDrawing) {
      const activeRecord = getObjectRecordById(state.drawing.activeStrokeId);
      const activeStroke = activeRecord?.obj || null;

      if (!activeStroke) return;

      activeStroke.points.push(pos);

      render();
      return;
    }

    return;
  }

  if (rotating && state.selectedId) {
    const record = getObjectRecordById(state.selectedId);
    const obj = record?.obj || null;

    if (obj && (obj.type === "shape" || obj.type === "text")) {
      const center = getObjectCenter(obj);
      const mouseAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
      obj.rotation = mouseAngle - rotationOffset;

      render();
    }

    return;
  }

  if (resizing && state.selectedId) {
    const record = getObjectRecordById(state.selectedId);
    const obj = record?.obj || null;

    if (!obj) return;

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;


    if (obj.type === "text") {
  obj.fontSize = Math.max(8, obj.fontSize + dy * 0.5);
}

    if (obj.type === "shape") {
      if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
        if (resizeHandle === "br") {
          obj.width += dx;
          obj.height += dy;
        }
        if (resizeHandle === "tl") {
          obj.x += dx;
          obj.y += dy;
          obj.width -= dx;
          obj.height -= dy;
        }
        if (resizeHandle === "tr") {
          obj.y += dy;
          obj.width += dx;
          obj.height -= dy;
        }
        if (resizeHandle === "bl") {
          obj.x += dx;
          obj.width -= dx;
          obj.height += dy;
        }
      }

      if (obj.shapeType === "circle") {
        obj.radius += dx * 0.5;
      }

      if (obj.shapeType === "line") {
        obj.x2 += dx;
        obj.y2 += dy;
      }
    }

    dragStart = pos;
    render();
    return;
  }

  // DRAGGING OBJECT
  if (dragging && state.selectedId) {
    const record = getObjectRecordById(state.selectedId);
    const obj = record?.obj || null;

    if (!obj) return;

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (obj.type === "stroke") {
      obj.points.forEach(p => {
        p.x += dx;
        p.y += dy;
      });
    }

    if (obj.type === "text") {
      obj.x += dx;
      obj.y += dy;
    }

    if (obj.type === "shape") {
      if (obj.shapeType === "line") {
        obj.x += dx;
        obj.y += dy;
        obj.x2 += dx;
        obj.y2 += dy;
      } else if (obj.shapeType === "rectangle" || obj.shapeType === "triangle" || obj.shapeType === "image") {
        obj.x += dx;
        obj.y += dy;
      } else if (obj.shapeType === "circle") {
        obj.x += dx;
        obj.y += dy;
      }
    }

    dragStart = pos;

    render();
  }
});

window.addEventListener("mouseup", () => {
  if (state.mode === "crop" && state.crop.active) {
    cropCanvas();
    return;
  }

  if (state.drawing.isDrawing) {
    state.drawing.isDrawing = false;
    state.drawing.activeStrokeId = null;
    saveHistory();
  }

  // Save after moving/resizing/rotating
  if (dragging || resizing || rotating) {
    saveHistory();
  }

  dragging = false;
  resizing = false;
  resizeHandle = null;
  rotating = false;
  erasing = false;
});

// UI controls
colorPicker.addEventListener("change", (e) => {
  state.brush.color = e.target.value;
});

brushSize.addEventListener("change", (e) => {
  state.brush.size = Number(e.target.value);
});

clearButton.addEventListener("click", () => {
  for (const layer of state.layers) {
    layer.objects = [];
  }
  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
  state.selectedId = null;

  saveHistory();

  updateToolButtons();
  render();
});

function deleteSelected() {
  if (!state.selectedId) return;

  const record = getObjectRecordById(state.selectedId);
  if (!record) return;

  record.layer.objects = record.layer.objects.filter(o => o.id !== state.selectedId);
  state.selectedId = null;
  saveHistory();

  updateToolButtons();
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
// open popup
saveProjectBtn.addEventListener("click", () => {
  projectNameInput.value = "";
  savePopup.style.display = "flex";
});

// save project
saveConfirmBtn.addEventListener("click", () => {
  const name = projectNameInput.value || "visualgrid-project";
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

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// Load project
loadProjectInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const loadedData = JSON.parse(text);

  if (!loadedData || !Array.isArray(loadedData.layers)) {
    alert("Invalid project file");
    e.target.value = "";
    return;
  }

  state.layers = loadedData.layers;
  state.activeLayerId = loadedData.activeLayerId ?? state.layers[0].id;
  state.canvas = loadedData.canvas ?? state.canvas;
  state.zoom = loadedData.zoom ?? 1;
  canvas.width = state.canvas.width;
  canvas.height = state.canvas.height;
  restoreShapeFunctions();
  applyZoom();
  state.selectedId = loadedData.selectedId ?? null;
  state.mode = loadedData.mode ?? "draw";
  state.currentTool = loadedData.currentTool ?? "paint";
  state.brush = loadedData.brush ?? state.brush;

  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  colorPicker.value = state.brush.color;
  brushSize.value = String(state.brush.size);
  fillToggle.checked = !!state.brush.fill;

  updateToolButtons();
  render();
  e.target.value = "";
});

// First render
updateToolButtons();
render();
saveHistory();