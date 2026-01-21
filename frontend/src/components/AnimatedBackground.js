import React, { useEffect, useState } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  const quizElements = [
    '?', '?', '?', // Question marks
    '+', '-', '×', '÷', '=', // Operators
    '✓', '✗', // Checkmarks
    'A', 'B', 'C', 'D', // Answer choices
    '1', '2', '3', '4', '5', // Numbers
    'Q', 'Q', // Quiz
    '!', '%', // Other symbols
  ];
  
  const [elements, setElements] = useState([]);

  useEffect(() => {
    // Create elements with random positions and delays
    const newElements = quizElements.map((element, index) => ({
      id: index,
      element,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      direction: Math.random() > 0.5 ? 'normal' : 'reverse',
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="animated-background">
      {elements.map((item) => {
        // Add special class for question marks and operators
        const isQuestionMark = item.element === '?';
        const isOperator = ['+', '-', '×', '÷', '='].includes(item.element);
        const className = `floating-element ${isQuestionMark ? 'question-mark' : ''} ${isOperator ? 'operator' : ''}`.trim();
        
        return (
          <div
            key={item.id}
            className={className}
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              animationDirection: item.direction,
            }}
          >
            {item.element}
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedBackground;

