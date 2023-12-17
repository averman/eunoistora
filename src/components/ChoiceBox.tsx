// ChoiceBox.tsx
import React from 'react';
import { useGame } from '../contexts/GameContext';

const ChoiceBox = ({ choices }: { choices: { text: string; handler: () => void }[];}) => {
  const { setImage, setTextboxText, setChoiceBox } = useGame();
  return (
    <div className="choice-box">
      {choices.map((choice, index) => {
        let tempHandler = () => {
          choice.handler();
          setChoiceBox([]);
        }
        return <button key={index} onClick={tempHandler} className="choice-button">
          {choice.text}
        </button>
      }
      )}
    </div>
  );
};

export default ChoiceBox;
