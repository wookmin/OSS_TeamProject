import React, { useEffect, useState, useCallback } from 'react';
import './MoleCatch.css';
import { saveScore } from '../api';

// App.js에서 이렇게 넘겨줌:
// <MoleCatch onGoHome={() => setCurrentView('home')} nickname={nickname} />

function MoleCatch({ onGoHome, nickname }) {
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const GAME_TIME = 20; // 게임 시간(초)

  // 게임 종료 처리
  const handleGameEnd = useCallback(async () => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsGameOver(true);

    if (score <= 0) return;

    // App에서 닉네임을 받은 경우 그대로 사용, 없으면 그때만 prompt
    let finalNickname = nickname;
    if (!finalNickname) {
      finalNickname = window.prompt(
        `게임 종료! 점수는 ${score}점이야.\n랭킹에 올릴 닉네임을 입력해줘 :)`
      );
    }

    if (!finalNickname) return;

    try {
      await saveScore('MoleCatch', finalNickname, score);
      alert('점수가 랭킹에 저장됐어!');
    } catch (error) {
      console.error(error);
      alert('점수 저장 중 오류가 났어 ㅠㅠ');
    }
  }, [score, nickname]);

  // 타이머
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    if (timeLeft <= 0) {
      handleGameEnd();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [isPlaying, isPaused, timeLeft, handleGameEnd]);

  // 두더지 등장
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const interval = setInterval(() => {
      const newMoles = Array(9).fill(false);
      const randomIndex = Math.floor(Math.random() * 9);
      newMoles[randomIndex] = true;
      setMoles(newMoles);
    }, 600); // 0.6초마다 등장

    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  const hitMole = (index) => {
    if (!isPlaying || isPaused) return;
    if (moles[index]) {
      setScore((prev) => prev + 1);
      const newMoles = [...moles];
      newMoles[index] = false;
      setMoles(newMoles);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
    setMoles(Array(9).fill(false));
  };

  const handlePauseToggle = () => {
    if (!isPlaying) return;
    setIsPaused((prev) => !prev);
  };

  const handleExitToHome = () => {

    // 상태 초기화
    setIsPlaying(false);
    setIsPaused(false);
    setIsGameOver(false);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setMoles(Array(9).fill(false));

    if (onGoHome) {
      onGoHome();
    }
  };

  return (
    <div className="mole-container">
      <h2>🐹 두더지 잡기 게임</h2>

      <div className="info">
        <div>점수: {score}</div>
        <div>남은 시간: {timeLeft}초</div>
        {nickname && <div>닉네임: {nickname}</div>}
      </div>

      <div className={`grid ${isPaused ? 'paused' : ''}`}>
        {moles.map((isMole, i) => (
          <div
            key={i}
            className={`hole ${isMole ? 'mole' : ''}`}
            onClick={() => hitMole(i)}
          ></div>
        ))}
      </div>

      <div className="buttons">
        {!isPlaying && (
          <button className="start-btn" onClick={startGame}>
            {isGameOver ? '다시 시작' : '게임 시작'}
          </button>
        )}

        {isPlaying && (
          <button className="pause-btn" onClick={handlePauseToggle}>
            {isPaused ? '계속하기' : '일시 정지'}
          </button>
        )}

        <button className="back-btn" onClick={handleExitToHome}>
          홈으로
        </button>
      </div>

      {/* 일시정지 오버레이 (선택 사항) */}
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-box">
            <p>⏸ 일시 정지 중</p>
            <button onClick={handlePauseToggle}>계속하기</button>
            <button onClick={handleExitToHome}>홈으로 나가기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoleCatch;
