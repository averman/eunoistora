import React, { createContext, useState, useContext } from 'react';
import GameController from '../engine/GameController';

// Define your image map here
const imageMap: { [key: string]: string } = {
  'bg1': 'assets/backgrounds/bg1.png',
  'mainmenu': 'assets/backgrounds/mainmenu.png',
  'lily1': 'assets/chars/lily/f-lily1.png',
  'lily2': 'assets/chars/lily/f-lily2.png',
  // ... more images
};

// Define the shape of your context's state
interface GameState {
  backgroundImage: string;
  characterImages: { id: string; imageId: string; uri: string; }[];
  textBoxText: string;
  choiceBoxData: { text: string; handler: () => void }[];
  gameController: GameController;
  setImage: (layer: string, imageId: string) => void;
  registerResource: (resourceUri: string) => void;
  setTextboxText: (text: string) => void;
  setChoiceBox: (choices: { text: string; handler: () => void }[]) => void;
}

// Define the initial state
const initialState: GameState = {
  backgroundImage: '',
  characterImages: [
    { id: 'character1', imageId: '', uri: '' },
    { id: 'character2', imageId: '', uri: '' },
    { id: 'character3', imageId: '', uri: '' }
  ],
  textBoxText: '',
  choiceBoxData: [],
  gameController: new GameController(() => {}, () => {}, () => {}),
  setImage: () => { },
  registerResource: () => { },
  setTextboxText: () => { },
  setChoiceBox: () => { },
};

export const GameContext = createContext<GameState>(initialState);

export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(initialState.backgroundImage);
  const [characterImages, setCharacterImages] = useState(initialState.characterImages);
  const [choiceBoxData, setChoiceBoxData] = useState(initialState.choiceBoxData);
  const [textBoxText, setTextBoxText] = useState('');

  const setImage = (layer: string, imageId: string) => {
    switch (layer) {
      case 'background':
        setBackgroundImage(imageMap[imageId]);
        break;
      default:
        if (layer.startsWith('character')) {
          setCharacterImages(prevImages =>
            prevImages.map(char =>
              char.id === layer ? { ...char, imageId: imageId, uri: imageMap[imageId] } : char
            )
          );
        }
        break;
    }
  };

  const setTextboxText = (text: string) => {
    setTextBoxText(text);
  };


  const registerResource = (resourceUri: string) => {
  }

  const setChoiceBox = (choices: { text: string; handler: () => void }[]) => {
    setChoiceBoxData(choices);
  };

  const [gameController, setGameController] = useState<GameController>(new GameController(setImage, setTextboxText, setChoiceBox));

  return (
    <GameContext.Provider value={{ backgroundImage, characterImages, textBoxText, choiceBoxData, gameController, setImage, registerResource, setTextboxText, setChoiceBox }}>
      {children}
    </GameContext.Provider>
  );
};
