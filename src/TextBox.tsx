import React, { useState, useEffect } from 'react';

const TextBox = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [clearIntervalFunction, setClearIntervalFunction] = useState<any>(null);

  useEffect(() => {
    setIsComplete(false);
    setDisplayedText('');

    let index = 0;
    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => {
          // Check for paragraph break
          if (text[index] === '\n' && text[index + 1] === '\n') {
            return prev + '\n\n';
          }
          return prev + text[index];
        });
        index++;
      } else {
        clearInterval(intervalId);
        setIsComplete(true);
      }
    }, 50); // Adjust the speed as needed

    setClearIntervalFunction(intervalId);

    return () => clearInterval(intervalId);
  }, [text]);

  // Split the text into paragraphs for rendering
  const paragraphs = displayedText.split('\n\n').map((paragraph, index) => (
    <p key={index}>{paragraph}{isComplete?'':<span className="typing-cursor">|</span>}</p>
  ));

  const handleClick = () => {
    if (!isComplete) {
      setIsComplete(true);
      if(clearIntervalFunction) clearInterval(clearIntervalFunction);
      setDisplayedText(text); // Show full text immediately
    }
  };

  return (
    <div className="text-box" onClick={handleClick}>
      {paragraphs}
    </div>
  );
};

export default TextBox;
