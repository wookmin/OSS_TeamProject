import React, { useEffect, useState } from 'react';
import './MoleCatch.css';

function MoleCatch() {
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    // 게임 타이머
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setIsPlaying(false);
    }
  }, [timeLeft, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    // 두더지 등장
    const interval = setInterval(() => {
      const newMoles = Array(9).fill(false);
      const randomIndex = Math.floor(Math.random() * 9);
      newMoles[randomIndex] = true;
      setMoles(newMoles);
    }, 600); // 0.6초마다 등장

    return () => clearInterval(interval);
  }, [isPlaying]);

  const hitMole = (index) => {
    if (!isPlaying) return;
    if (moles[index]) {
      setScore(score + 1);
      const newMoles = [...moles];
      newMoles[index] = false;
      setMoles(newMoles);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setIsPlaying(true);
  };

  return (
    <div className="mole-container">
      <h2>🐹 두더지 잡기 게임</h2>

      <div className="info">
        <div>점수: {score}</div>
        <div>남은 시간: {timeLeft}초</div>
      </div>

      <div className="grid">
        {moles.map((isMole, i) => (
          <div
            key={i}
            className={`hole ${isMole ? 'mole' : ''}`}
            onClick={() => hitMole(i)}
          ></div>
        ))}
      </div>

      {!isPlaying && (
        <button className="start-btn" onClick={startGame}>
          게임 시작
        </button>
      )}
    </div>
  );
}

export default MoleCatch;
