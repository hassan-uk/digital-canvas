import { state } from "./state.js";

const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearButton = document.getElementById("clearButton");
const deleteBtn = document.getElementById("deleteBtn");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const loadProjectInput = document.getElementById("loadProjectInput");

state.brush.color = colorPicker.value;
state.brush.size = Number(brushSize.value);

let dragging = false;
let dragStart = { x:0, y:0 };

function getMousePosition(event){
  const box = canvas.getBoundingClientRect();
  return {
    x: event.clientX - box.left,
    y: event.clientY - box.top
  };
}

function createId(){
  return crypto.randomUUID();
}

function getBounds(stroke){
  const xs = stroke.points.map(p=>p.x);
  const ys = stroke.points.map(p=>p.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function getObjectAt(x,y){

  for(let i = state.objects.length-1;i>=0;i--){

    const obj = state.objects[i];
    if(obj.type !== "stroke") continue;

    const b = getBounds(obj);

    if(
      x >= b.minX-5 &&
      x <= b.maxX+5 &&
      y >= b.minY-5 &&
      y <= b.maxY+5
    ){
      return obj;
    }
  }

  return null;
}

function render(){

  pen.clearRect(0,0,canvas.width,canvas.height);

  for(const obj of state.objects){

    if(obj.type === "stroke"){
      drawStroke(obj);
    }

    if(state.selectedId === obj.id){
      drawSelection(obj);
    }

  }
}

function drawStroke(stroke){

  if(stroke.points.length < 2) return;

  pen.strokeStyle = stroke.color;
  pen.lineWidth = stroke.size;
  pen.lineCap = "round";
  pen.lineJoin = "round";

  pen.beginPath();
  pen.moveTo(stroke.points[0].x, stroke.points[0].y);

  for(let i=1;i<stroke.points.length;i++){
    pen.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  pen.stroke();
}

function drawSelection(obj){

  const b = getBounds(obj);

  pen.strokeStyle = "blue";
  pen.lineWidth = 2;

  pen.strokeRect(
    b.minX-5,
    b.minY-5,
    (b.maxX-b.minX)+10,
    (b.maxY-b.minY)+10
  );
}

canvas.addEventListener("mousedown",(event)=>{

  const pos = getMousePosition(event);

  const clicked = getObjectAt(pos.x,pos.y);

  if(clicked){

    state.selectedId = clicked.id;
    dragging = true;
    dragStart = pos;

    render();
    return;
  }

  // NORMAL DRAWING (your original system)

  state.selectedId = null;

  state.drawing.isDrawing = true;

  const id = createId();

  state.objects.push({
    id,
    type:"stroke",
    color:state.brush.color,
    size:state.brush.size,
    points:[pos]
  });

  state.drawing.activeStrokeId = id;

  render();
});

canvas.addEventListener("mousemove",(event)=>{

  const pos = getMousePosition(event);

  // DRAW
  if(state.drawing.isDrawing){

    const stroke = state.objects.find(
      o=>o.id === state.drawing.activeStrokeId
    );

    if(!stroke) return;

    stroke.points.push(pos);

    render();
    return;
  }

  // DRAG
  if(dragging && state.selectedId){

    const obj = state.objects.find(o=>o.id===state.selectedId);

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    obj.points.forEach(p=>{
      p.x += dx;
      p.y += dy;
    });

    dragStart = pos;

    render();
  }

});

window.addEventListener("mouseup",()=>{

  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;

  dragging = false;

});

function deleteSelected(){

  if(!state.selectedId) return;

  state.objects = state.objects.filter(
    o=>o.id !== state.selectedId
  );

  state.selectedId = null;

  render();
}

deleteBtn.addEventListener("click",deleteSelected);

document.addEventListener("keydown",(e)=>{
  if(e.key === "Delete"){
    deleteSelected();
  }
});

colorPicker.addEventListener("change",(e)=>{
  state.brush.color = e.target.value;
});

brushSize.addEventListener("change",(e)=>{
  state.brush.size = Number(e.target.value);
});

clearButton.addEventListener("click",()=>{

  state.objects = [];

  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
  state.selectedId = null;

  render();
});

saveProjectBtn.addEventListener("click",()=>{

  const data = JSON.stringify(state,null,2);

  const blob = new Blob([data],{type:"application/json"});
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "digital-canvas-project.json";
  link.click();

  URL.revokeObjectURL(url);

});

loadProjectInput.addEventListener("change", async (e)=>{

  const file = e.target.files?.[0];
  if(!file) return;

  const text = await file.text();
  const loaded = JSON.parse(text);

  if(!loaded || !Array.isArray(loaded.objects)){
    alert("Invalid project file");
    return;
  }

  state.brush = loaded.brush ?? state.brush;
  state.objects = loaded.objects;

  state.drawing.isDrawing = false;
  state.drawing.activeStrokeId = null;
  state.selectedId = null;

  colorPicker.value = state.brush.color;
  brushSize.value = state.brush.size;

  render();
});

render();