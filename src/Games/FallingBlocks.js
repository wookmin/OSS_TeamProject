// src/Games/FallingBlocks.jsx

import React, { useEffect, useRef, useState } from "react";
import "./FallingBlocks.css";
import { saveScore } from "../api";

const W = 400;
const H = 600;

const PLAYER_W = 40;
const PLAYER_H = 20;
const PLAYER_SPEED = 6;

const BLOCK_W = 40;
const BLOCK_H = 20;

// App.js 예시:
// <FallingBlocks onGoHome={() => setCurrentView('home')} nickname={nickname} />

function FallingBlocks({ onGoHome, nickname }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReady, setIsReady] = useState(true); // 시작 전 대기 상태

  const keys = useRef({ left: false, right: false });
  const player = useRef({ x: W / 2 - PLAYER_W / 2, y: H - PLAYER_H - 10 });
  const blocks = useRef([]);

  // 키 입력 처리
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "ArrowRight") keys.current.right = true;
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "ArrowRight") keys.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // 게임 루프
  useEffect(() => {
    // 준비 중이거나 게임 오버면 루프 돌리지 않음
    if (isReady || isGameOver) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 새 게임 시작 시 초기화
    blocks.current = [];
    player.current = { x: W / 2 - PLAYER_W / 2, y: H - PLAYER_H - 10 };
    let last = performance.now();
    let spawnTimer = 0;

    const loop = (t) => {
      const dt = t - last;
      last = t;
      spawnTimer += dt;

      // 배경 지우기
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, W, H);

      // 플레이어 이동
      if (keys.current.left) player.current.x -= PLAYER_SPEED;
      if (keys.current.right) player.current.x += PLAYER_SPEED;

      if (player.current.x < 0) player.current.x = 0;
      if (player.current.x > W - PLAYER_W) player.current.x = W - PLAYER_W;

      // 플레이어 그리기
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(player.current.x, player.current.y, PLAYER_W, PLAYER_H);

      // 블럭 생성
      if (spawnTimer > 700) {
        spawnTimer = 0;
        blocks.current.push({
          x: Math.random() * (W - BLOCK_W),
          y: -BLOCK_H,
          speed: 2 + Math.random() * 2,
        });
      }

      // 블럭 이동 + 그리기 + 충돌
      blocks.current.forEach((b, i) => {
        b.y += b.speed;

        ctx.fillStyle = "#f97373";
        ctx.fillRect(b.x, b.y, BLOCK_W, BLOCK_H);

        // 충돌 체크
        const hit =
          b.x < player.current.x + PLAYER_W &&
          b.x + BLOCK_W > player.current.x &&
          b.y < player.current.y + PLAYER_H &&
          b.y + BLOCK_H > player.current.y;

        if (hit) {
          setIsGameOver(true);
        }

        // 화면 아래로 나가면 점수 +1
        if (b.y > H) {
          blocks.current.splice(i, 1);
          setScore((s) => s + 1);
        }
      });

      if (!isGameOver && !isReady) {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isReady, isGameOver]);

  // 게임 오버 시 점수 저장
  useEffect(() => {
    if (!isGameOver) return;
    if (score <= 0) return;

    (async () => {
      let finalNickname = nickname;
      if (!finalNickname) {
        finalNickname = window.prompt(
          `게임 종료! 점수는 ${score}점이야.\n랭킹에 올릴 닉네임을 입력해줘 :)`
        );
      }

      if (!finalNickname) return;

      try {
        await saveScore("FallingBlocks", finalNickname, score);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [isGameOver, score, nickname]);

  // 시작하기
  const handleStart = () => {
    setScore(0);
    setIsGameOver(false);
    setIsReady(false);
  };

  // 다시 시작
  const handleRestart = () => {
    blocks.current = [];
    setScore(0);
    setIsGameOver(false);
    setIsReady(false);
  };

  // 메인으로
  const handleGoMain = () => {
    blocks.current = [];
    setScore(0);
    setIsGameOver(false);
    setIsReady(true);

    if (onGoHome) {
      onGoHome();
    }
  };

  return (
    <div className="canvas-wrapper">
      <h2 className="title">블럭 피하기</h2>

      <div className="status-bar">
        <span>점수: {score}</span>
        {nickname && <span>닉네임: {nickname}</span>}
      </div>

      <div style={{ position: "relative", width: W, margin: "0 auto" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas"
        />

        {/* 처음 들어왔을 때: 시작하기 오버레이 */}
        {isReady && !isGameOver && (
          <div className="game-over-ui">
            <div className="game-over-box">
              <h2>블럭 피하기</h2>
              <p>좌우 방향키로 블럭을 피해봐!</p>
              <button className="start-btn" onClick={handleStart}>
                시작하기
              </button>
              <button className="main-btn" onClick={handleGoMain}>
                홈으로
              </button>
            </div>
          </div>
        )}

        {/* 게임 오버 화면 */}
        {isGameOver && (
          <div className="game-over-ui">
            <div className="game-over-box">
              <h2>💀 게임 종료!</h2>
              <p>최종 점수: {score}</p>

              <button className="restart-btn" onClick={handleRestart}>
                다시 시작
              </button>

              <button className="main-btn" onClick={handleGoMain}>
                메인 페이지로
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 홈 버튼 (게임 중 / 대기 중 공통) */}
      <div className="control-buttons">
        <button className="main-btn" onClick={handleGoMain}>
          홈으로
        </button>
      </div>
    </div>
  );
}

export default FallingBlocks;
