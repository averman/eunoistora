// index.tsx

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { GameProvider } from './contexts/GameContext';
import { SettingProvider } from './contexts/SettingContext';

ReactDOM.render(
  <React.StrictMode>
    <SettingProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SettingProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
