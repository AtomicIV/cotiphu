import React from 'react';
import Game from './Game';
import UI from './UI';
import './index.css';

function App() {
  return (
    <div className="app-container">
        {/* Canvas 3D */}
      <Game />
      
        {/* UI Overlay */}
      <UI />
    </div>
  );
}

export default App;
