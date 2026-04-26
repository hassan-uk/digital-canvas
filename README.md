# Digital Canvas

This is a digital canvas website where users can draw and interact with visuals.  
The code has been cleaned up, with simpler logic and comments to make it easier to understand and build on in the future.

## Features

- Basic canvas setup
- Drawing with brush size and color selection
- Clear canvas button
- Save and load projects (JSON)
- Placeholder for future tools: shapes, text, images
- Comments and structure added to help collaboration

## How to Run

Clone the repository:

git clone https://github.com/hassan-uk/digital-canvas.git

Open the project in VS Code.

Run with Live Server (recommended) to enable module imports:

Right-click index.html → Open with Live Server

Or press Go Live at the bottom-right in VS Code

Note: The project uses ES module imports (import { state } from "./state.js";) which won’t work if opened directly with file:// or through run and debug.

## Update

### Project Overview
- The digital Cancas is a web-based drawing application that allows the user to create and interact with visuals directly in our browser.
- It provides a simple and intuitive interface for freehand drawing and we desinged it to be easy to use and extend for future features.

### How to Use
- Open the application in your web browser by running the 'index.html' file
- Use your mouse to draw freely on the canvas
- Select different brush sizes and colours to customise your drawing
- Use the clear canvas button to erase your work
- Save your drawing using the save feature
- Load a previously saved drawing using the load option

### Improvements Made
- Code has been cleaned and simplified
- Added comments for better readability
- Improved structure to suport collaboration
