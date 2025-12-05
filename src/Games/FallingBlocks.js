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

// App.js 에서 이렇게 쓸 거야:
// <FallingBlocks onGoHome={() => setCurrentView('home')} nickname={nickname} />

function FallingBlocks({ onGoHome, nickname }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(false);

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
    if (isGameOver) {
      // 게임 오버면 루프 정지
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

      // 일시 정지일 때: 상태 업데이트는 안 하지만 시간 기준은 유지
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

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

        ctx.fillStyle = "#f44336";
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

      if (!isGameOver) {
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
  }, [isGameOver]);

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
        alert("점수가 랭킹에 저장됐어!");
      } catch (error) {
        console.error(error);
        alert("점수 저장 중 오류가 났어 ㅠㅠ");
      }
    })();
  }, [isGameOver, score, nickname]);

  // 다시 시작
  const handleRestart = () => {
    blocks.current = [];
    setScore(0);
    setIsGameOver(false); // useEffect에서 루프 다시 시작
    setIsPaused(false);
    isPausedRef.current = false;
  };

  // 메인으로
  const handleGoMain = () => {
    // 게임 종료 상태라면 바로 이동
    if (isGameOver) {
      if (onGoHome) onGoHome();
      return;
    }

    // 게임이 진행 중일 때만 확인창 표시
    const ok = window.confirm(
      "홈으로 나가면 현재 게임이 종료되고 점수가 저장되지 않을 수 있어.\n그래도 나갈래?"
    );

    if (!ok) return;

    // 상태 초기화
    blocks.current = [];
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    isPausedRef.current = false;

    if (onGoHome) {
      onGoHome();
    }
  };


  // 일시 정지 / 계속하기
  const handlePauseToggle = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  };

  return (
    <div className="canvas-wrapper">
      <h2 className="title">🧱 Falling Blocks (Canvas)</h2>

      <div className="status-bar">
        <span>점수: {score}</span>
        {nickname && <span>닉네임: {nickname}</span>}
        <span>
          상태:{" "}
          {isGameOver ? "게임 종료" : isPaused ? "일시 정지" : "플레이 중"}
        </span>
      </div>

      <div style={{ position: "relative", width: W, margin: "0 auto" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas"
        />

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

      <div className="control-buttons">
        {!isGameOver && (
          <button className="pause-btn" onClick={handlePauseToggle}>
            {isPaused ? "계속하기" : "일시 정지"}
          </button>
        )}
        <button className="main-btn" onClick={handleGoMain}>
          홈으로
        </button>
      </div>
    </div>
  );
}

export default FallingBlocks;
