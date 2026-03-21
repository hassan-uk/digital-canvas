const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");

let mode = "idle"; // drawing | dragging | idle
let currentStroke = null;
let dragStart = {x:0,y:0};

let brushColor = "#000000";
let brushSize = 5;

const state = {
    objects: [],
    selectedId: null
};

function redraw(){

    pen.clearRect(0,0,canvas.width,canvas.height);

    state.objects.forEach(obj => {

        pen.strokeStyle = obj.color;
        pen.lineWidth = obj.size;
        pen.lineCap = "round";

        pen.beginPath();

        obj.points.forEach((p,i)=>{
            if(i===0){
                pen.moveTo(p.x,p.y);
            }else{
                pen.lineTo(p.x,p.y);
            }
        });

        pen.stroke();

        if(obj.id === state.selectedId){
            drawSelectionBox(obj);
        }
    });
}

function drawSelectionBox(obj){

    let xs = obj.points.map(p=>p.x);
    let ys = obj.points.map(p=>p.y);

    let minX = Math.min(...xs);
    let minY = Math.min(...ys);
    let maxX = Math.max(...xs);
    let maxY = Math.max(...ys);

    pen.strokeStyle = "blue";
    pen.lineWidth = 2;

    pen.strokeRect(
        minX-5,
        minY-5,
        (maxX-minX)+10,
        (maxY-minY)+10
    );
}

function getObjectAt(x,y){

    for(let i = state.objects.length-1; i>=0; i--){

        const obj = state.objects[i];

        let xs = obj.points.map(p=>p.x);
        let ys = obj.points.map(p=>p.y);

        let minX = Math.min(...xs);
        let minY = Math.min(...ys);
        let maxX = Math.max(...xs);
        let maxY = Math.max(...ys);

        if(
            x >= minX-5 &&
            x <= maxX+5 &&
            y >= minY-5 &&
            y <= maxY+5
        ){
            return obj;
        }
    }

    return null;
}

canvas.addEventListener("mousedown",(e)=>{

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = getObjectAt(x,y);

    if(clicked){

        state.selectedId = clicked.id;
        mode = "dragging";
        dragStart = {x,y};

    }else{

        state.selectedId = null;

        mode = "drawing";

        currentStroke = {
            id: Date.now(),
            color: brushColor,
            size: brushSize,
            points: [{x,y}]
        };

        state.objects.push(currentStroke);
    }

    redraw();
});

canvas.addEventListener("mousemove",(e)=>{

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if(mode === "drawing"){

        currentStroke.points.push({x,y});
        redraw();
    }

    if(mode === "dragging"){

        const obj = state.objects.find(o=>o.id === state.selectedId);

        const dx = x - dragStart.x;
        const dy = y - dragStart.y;

        obj.points.forEach(p=>{
            p.x += dx;
            p.y += dy;
        });

        dragStart = {x,y};

        redraw();
    }
});

canvas.addEventListener("mouseup",()=>{

    mode = "idle";

});

function deleteSelected(){

    if(!state.selectedId) return;

    state.objects = state.objects.filter(
        obj => obj.id !== state.selectedId
    );

    state.selectedId = null;

    redraw();
}

document.addEventListener("keydown",(e)=>{
    if(e.key === "Delete"){
        deleteSelected();
    }
});

document.getElementById("deleteButton").addEventListener("click",()=>{
    deleteSelected();
});

document.getElementById("colorPicker").addEventListener("change",(e)=>{
    brushColor = e.target.value;
});

document.getElementById("brushSize").addEventListener("change",(e)=>{
    brushSize = e.target.value;
});

document.getElementById("clearButton").addEventListener("click",()=>{
    state.objects = [];
    state.selectedId = null;
    redraw();
});