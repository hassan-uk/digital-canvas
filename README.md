# Digital Canvas

A web-based interactive drawing application that allows users to create, edit, and manage visual content directly in the browser.  
The project is designed with simplicity, usability, and future scalability in mind.

---

## Features

### Drawing Tools
- Pen tool for freehand drawing  
- Highlighter tool for soft overlay strokes  
- Eraser tool for removing content  

### Controls & Customisation
- Adjustable brush size  
- Colour selection  
- Clear canvas functionality  

### Project Management
- Save drawings as JSON  
- Load previously saved projects  

### Keyboard Shortcuts (Hotkeys)

| Action        | Shortcut      |
|--------------|--------------|
| Pen Tool     | `Ctrl + P`   |
| Highlighter  | `Ctrl + H`   |
| Eraser       | `Ctrl + E`   |
| Undo         | `Ctrl + Z`   |
| Redo         | `Ctrl + Y`   |

### User Experience
- Interactive button hover effects for better feedback  
- Clean and intuitive interface  
- Grid-based canvas layout for precision drawing  

### Code Quality
- Modular JavaScript structure (ES Modules)  
- Cleaned and simplified logic  
- Commented code for maintainability and collaboration  

---

## Technologies Used
- HTML5 Canvas  
- CSS3  
- JavaScript (ES Modules)  
- VS Code + Live Server  

---

## How to Run

Clone the repository:

git clone https://github.com/hassan-uk/digital-canvas.git

Open the project in VS Code.

Run with Live Server (recommended) to enable module imports:

Right-click index.html → Open with Live Server

Or press Go Live at the bottom-right in VS Code

Note: The project uses ES module imports (import { state } from "./state.js";) which won’t work if opened directly with file:// or through run and debug.

### How to Use
- Open the application in your web browser by running the 'index.html' file
- Use your mouse to draw freely on the canvas
- Select different brush sizes and colours to customise your drawing
- Use the clear canvas button to erase your work
- Save your drawing using the save feature
- Load a previously saved drawing using the load option

