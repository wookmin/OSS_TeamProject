import React, { useEffect, useRef, useState } from 'react';
import './FallingBlocks.css';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 6;

const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 20;

function FallingBlocks() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const playerRef = useRef({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 10 });
  const blocksRef = useRef([]);
  const keysRef = useRef({ left: false, right: false });
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isGameOver) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    lastTimeRef.current = performance.now();
    spawnTimerRef.current = 0;
    blocksRef.current = [];

    const loop = (time) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      updateGame(delta);
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line
  }, [isGameOver]);

  const updateGame = (delta) => {
    const player = playerRef.current;
    const blocks = blocksRef.current;

    if (keysRef.current.left) player.x -= PLAYER_SPEED;
    if (keysRef.current.right) player.x += PLAYER_SPEED;

    if (player.x < 0) player.x = 0;
    if (player.x > GAME_WIDTH - PLAYER_WIDTH)
      player.x = GAME_WIDTH - PLAYER_WIDTH;

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current > 700) {
      spawnTimerRef.current = 0;

      const speed = 2 + Math.random() * 2;
      const x = Math.random() * (GAME_WIDTH - BLOCK_WIDTH);

      blocks.push({
        id: Date.now() + Math.random(),
        x,
        y: -BLOCK_HEIGHT,
        speed,
      });
    }

    for (let i = blocks.length - i; i >= 0; i--) {
      blocks[i].y += blocks[i].speed;
      if (blocks[i].y > GAME_HEIGHT) {
        blocks.splice(i, 1);
        setScore((prev) => prev + 1);
      }
    }

    for (const block of blocks) {
      if (isColliding(
        player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
        block.x, block.y, BLOCK_WIDTH, BLOCK_HEIGHT
      )) {
        setIsGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
        break;
      }
    }
  };

  const isColliding = (x1, y1, w1, h1, x2, y2, w2, h2) => {
    return !(
      x1 + w1 < x2 ||
      x1 > x2 + w2 ||
      y1 + h1 < y2 ||
      y1 > y2 + h2
    );
  };

  const handleRestart = () => {
    playerRef.current = {
      x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - 10,
    };
    blocksRef.current = [];
    keysRef.current = { left: false, right: false };
    setScore(0);
    setIsGameOver(false);
  };

  const player = playerRef.current;
  const blocks = blocksRef.current;

  return (
    <div className="game-container">
      <h2>🧱 떨어지는 블럭 피하기</h2>
      <p>← → 방향키로 이동!</p>

      <div className="game-board">
        <div
          className="player"
          style={{ left: player.x, top: player.y }}
        />

        {blocks.map((block) => (
          <div
            key={block.id}
            className="block"
            style={{ left: block.x, top: block.y }}
          />
        ))}

        {isGameOver && (
          <div className="game-over">
            <div>💀 게임 오버!</div>
            <div>점수: {score}</div>
            <div>최고 점수: {highScore}</div>

            <button className="restart-btn" onClick={handleRestart}>
              다시 시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FallingBlocks;
