// Main entry point - Plotly Text System
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BasicPlotlyTextDemo } from './examples/BasicPlotlyTextDemo';
import { setup } from 'goober';

// Setup Goober CSS-in-JS (same as Design Studio)
setup(React.createElement);

// Global styles to match Design Studio theme
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                 'Helvetica Neue', Arial, sans-serif;
    background: #252a30;
    color: #f5f8fa;
    overflow: hidden;
  }
  
  #root {
    width: 100vw;
    height: 100vh;
  }
  
  /* Custom scrollbar styling (matching Design Studio) */
  ::-webkit-scrollbar {
    width: 6px;
    height: 4px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(47, 52, 60, 0.3);
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #495563;
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #48aff0;
  }
  
  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: #495563 rgba(47, 52, 60, 0.3);
  }
  
  /* Plotly customizations */
  .plotly .modebar {
    background: rgba(47, 52, 60, 0.9) !important;
    border: 1px solid #495563 !important;
    border-radius: 6px !important;
  }
  
  .plotly .modebar-btn {
    color: #a7b6c2 !important;
  }
  
  .plotly .modebar-btn:hover {
    background: rgba(72, 175, 240, 0.1) !important;
    color: #48aff0 !important;
  }
  
  .plotly .modebar-btn.active {
    background: #48aff0 !important;
    color: white !important;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

// Render the demo application
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BasicPlotlyTextDemo />
  </React.StrictMode>
);