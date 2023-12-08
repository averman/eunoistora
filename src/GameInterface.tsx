import React, { useState } from 'react';
import { useGame } from './GameContext';
import TextBox from './TextBox';
import ChoiceBox from './ChoiceBox';

const GameInterface: React.FC = () => {
    const { backgroundImage, characterImages, textBoxText, choiceBoxData, gameController, setImage } = useGame();

    const isChoiceModal = choiceBoxData.length > 0;

    function grayout(name: string) {
        return `${name}${isChoiceModal && gameController.state.screen != 'mainMenu' ? ' gray-out' : ''}`
    }

    return (
        <div className="game-interface">
            {backgroundImage && <div className={grayout("background-layer")}><img src={backgroundImage} alt='backgroundImage' /></div>}
            {!isChoiceModal && <div className="character-layer">
                <div className={grayout("character-container")}>
                    {characterImages.filter(char => char.id && char.uri).map((char, index) =>
                        char.imageId && <img key={index} src={char.uri} alt={`Character ${index + 1}`} />
                    )}
                </div>
            </div>}
            {textBoxText && !isChoiceModal && <div className="text-box-layer"><TextBox text={textBoxText} /></div>}
            {isChoiceModal && <ChoiceBox choices={choiceBoxData} />}
        </div>
    );
};

export default GameInterface;
