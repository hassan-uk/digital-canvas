const canvas = document.getElementById("canvas");
const pen = canvas.getContext("2d");

let drawing = false;

pen.strokeStyle = "#000000";
pen.lineWidth = 5;
pen.lineCap = "round";

canvas.addEventListener("mousedown", () => {
    drawing = true;
    pen.beginPath();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
});

canvas.addEventListener("mousemove", (info) => {
    if (!drawing) return;

    const box = canvas.getBoundingClientRect();
    const x = info.clientX - box.left;
    const y = info.clientY - box.top;

    pen.lineTo(x, y);
    pen.stroke();
});

document.getElementById("colorPicker").addEventListener("change", (e) => {
    pen.strokeStyle = e.target.value;
});

document.getElementById("brushSize").addEventListener("change", (e) => {
    pen.lineWidth = e.target.value;
});

document.getElementById("clearButton").addEventListener("click", () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
});
