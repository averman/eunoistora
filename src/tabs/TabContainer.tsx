import React, { useContext, useEffect, useState } from 'react';
import GameTab from './GameTab';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useGame } from '../contexts/GameContext';
import GameController from '../engine/GameController';
import SettingsTab from './SettingTab';
import { SettingContext } from '../contexts/SettingContext';
import ChatTab from './ChatTab';
import CharacterTab from './CharacterTab';

const TabContainer: React.FC = () => {

    

  const { setImage, setTextboxText, setChoiceBox, gameController } = useGame();
  const { settings, updateSetting } = useContext(SettingContext);

  // expose setImage to the window for debugging purposes
  (window as any).setImage = setImage;
  (window as any).setTextboxText = setTextboxText;
  (window as any).setChoiceBox = setChoiceBox;

  useEffect(() => {
    gameController.init(settings);
    (window as any).gameController = gameController;
  }, []);
  
  const [activeTab, setActiveTab] = useState<string>('gameTab');

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  const goToMainMenu = () => {
    gameController.mainMenu();
    setActiveTab('gameTab');
  }  

  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'gameTab' ? 'active' : ''}`} onClick={() => handleTabChange('gameTab')}>Game</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'settingsTab' ? 'active' : ''}`} onClick={() => handleTabChange('settingsTab')}>Settings</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'characterTab' ? 'active' : ''}`} onClick={() => handleTabChange('characterTab')}>Characters</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'chatTab' ? 'active' : ''}`} onClick={() => handleTabChange('chatTab')}>Chat</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link`} onClick={goToMainMenu}>Go to Main Menu</a>
        </li>
      </ul>
      <div className="tab-content p-3">
        {activeTab === 'gameTab' && <GameTab />}
        {activeTab === 'settingsTab' && <SettingsTab />}
        {activeTab === 'characterTab' && <CharacterTab />}
        {activeTab === 'chatTab' && <ChatTab />}
      </div>
    </div>
  );
};

export default TabContainer;
