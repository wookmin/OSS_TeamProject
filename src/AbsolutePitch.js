import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AbsolutePitch.css';
import * as Tone from 'tone';
import { saveScore } from './api';

// 음계 데이터 (C4 ~ C5)
const notesData = [
    { note: "C", freq: 261.63, type: "white" },
    { note: "C#", freq: 277.18, type: "black" },
    { note: "D", freq: 293.66, type: "white" },
    { note: "D#", freq: 311.13, type: "black" },
    { note: "E", freq: 329.63, type: "white" },
    { note: "F", freq: 349.23, type: "white" },
    { note: "F#", freq: 369.99, type: "black" },
    { note: "G", freq: 392.00, type: "white" },
    { note: "G#", freq: 415.30, type: "black" },
    { note: "A", freq: 440.00, type: "white" },
    { note: "A#", freq: 466.16, type: "black" },
    { note: "B", freq: 493.88, type: "white" },
    { note: "C5", freq: 523.25, type: "white" }
];

// 레벨별 설정
const LEVEL_CONFIG = {
    1: { label: "Lv.1 초급", score: 50, notes: 1, black: false },
    2: { label: "Lv.2 중급", score: 100, notes: 1, black: true },
    3: { label: "Lv.3 고급", score: 150, notes: 2, black: false },
    4: { label: "Lv.4 전문가", score: 200, notes: 2, black: true },
    5: { label: "Lv.5 마스터", score: 250, notes: 3, black: true },
    6: { label: "Lv.6 절대음감", score: 300, notes: 4, black: true },
};

const MAX_LEVEL = 6;
const QUESTIONS_PER_LEVEL = 5;

const AbsolutePitch = ({ onGoHome, nickname }) => {
    // --- State Management ---
    const [gameStatus, setGameStatus] = useState('ready'); // ready, playing, finished, gameover
    const [currentLevel, setCurrentLevel] = useState(1);
    const [qIndex, setQIndex] = useState(1); // 1~5
    const [totalScore, setTotalScore] = useState(0);
    const [retriesLeft, setRetriesLeft] = useState(1); // 기회: 1 (실패시 0, 0에서 실패시 게임오버)

    // UI Messages
    const [statusText, setStatusText] = useState("준비되셨나요?");
    const [statusColor, setStatusColor] = useState("#aaa");

    // Logic States
    const [targetIndices, setTargetIndices] = useState([]);
    const [foundIndices, setFoundIndices] = useState(new Set());
    const [keyStates, setKeyStates] = useState({});

    // Refs
    const synthRef = useRef(null);
    const usedProblemsRef = useRef(new Set()); // 중복 문제 방지

    // --- Audio System with Tone.js ---
    useEffect(() => {
        // Tone.js Polyphonic Synth 생성 (여러 음을 동시에 재생 가능)
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.005,
                decay: 0.3,
                sustain: 0.4,
                release: 1.2
            }
        }).toDestination();

        // 볼륨 조정
        synthRef.current.volume.value = -8;

        return () => {
            if (synthRef.current) {
                synthRef.current.dispose();
            }
        };
    }, []);

    const playPianoSound = useCallback((freq, duration = 0.75) => {
        if (!synthRef.current) return;
        
        // Tone.js는 자동으로 AudioContext를 시작하므로 명시적 resume 필요
        Tone.start();
        
        // 주파수를 MIDI 노트로 변환하여 재생
        const note = Tone.Frequency(freq, "hz").toNote();
        synthRef.current.triggerAttackRelease(note, duration);
    }, []);

    const playTargets = useCallback(() => {
        targetIndices.forEach(idx => {
            playPianoSound(notesData[idx].freq, 1.0);
        });
    }, [targetIndices, playPianoSound]);

    // --- Game Logic ---

    // 문제 생성 함수
    const generateProblem = useCallback((level) => {
        const config = LEVEL_CONFIG[level];
        const numNotes = config.notes;
        const useBlack = config.black;

        // 건반 풀 생성
        const pool = [];
        notesData.forEach((n, i) => {
            if (!useBlack && n.type === 'black') return;
            pool.push(i);
        });

        // 중복되지 않는 문제 생성
        let maxAttempts = 100;
        let candidate = [];
        let keyStr = "";

        do {
            candidate = [];
            let tempPool = [...pool];
            for (let i = 0; i < numNotes; i++) {
                if (tempPool.length === 0) break;
                const randIdx = Math.floor(Math.random() * tempPool.length);
                candidate.push(tempPool[randIdx]);
                tempPool.splice(randIdx, 1);
            }
            candidate.sort((a, b) => a - b);
            keyStr = candidate.join(',');
            maxAttempts--;
        } while (usedProblemsRef.current.has(keyStr) && maxAttempts > 0);

        setTargetIndices(candidate);
        usedProblemsRef.current.add(keyStr); // 출제된 문제 기록
    }, []);

    // 게임 종료 시 점수 저장
    useEffect(() => {
        if ((gameStatus === 'finished' || gameStatus === 'gameover') && nickname) {
            saveScore('AbsolutePitch', nickname, totalScore);
        }
    }, [gameStatus, nickname, totalScore]);

    // 다음 라운드(문제) 진행
    const nextRound = useCallback(() => {
        setFoundIndices(new Set());
        setKeyStates({});
        setRetriesLeft(1); // 기회 초기화

        // 레벨업 체크
        let nextLvl = currentLevel;
        let nextQ = qIndex + 1;

        // 첫 시작이 아니고, 문제 번호가 제한을 넘어가면 레벨업
        if (gameStatus === 'playing') {
            if (nextQ > QUESTIONS_PER_LEVEL) {
                nextLvl = currentLevel + 1;
                nextQ = 1;
                // 레벨 중복 기록 초기화 (새로운 레벨에서는 이전 레벨 문제 기록 무시해도 됨, 혹은 유지)
                usedProblemsRef.current.clear();
            }
        } else {
            // 게임 시작 시 초기화
            nextLvl = 1;
            nextQ = 1;
            usedProblemsRef.current.clear();
        }

        // 게임 클리어 체크
        if (nextLvl > MAX_LEVEL) {
            setGameStatus('finished');
            return;
        }

        // 상태 업데이트
        setCurrentLevel(nextLvl);
        setQIndex(nextQ);
        generateProblem(nextLvl);

        setStatusText(`${LEVEL_CONFIG[nextLvl].label} - 문제 ${nextQ}번`);
        setStatusColor("#fff");
    }, [currentLevel, qIndex, gameStatus, generateProblem]);

    // 문제 자동 재생 Effect
    useEffect(() => {
        if (gameStatus === 'playing' && targetIndices.length > 0) {
            setTimeout(playTargets, 600);
        }
    }, [targetIndices, gameStatus, playTargets]);

    // 게임 시작 핸들러
    const startGame = () => {
        setGameStatus('playing');
        setTotalScore(0);
        setCurrentLevel(1);
        setQIndex(0); // nextRound에서 1로 됨
        setFoundIndices(new Set());
        setKeyStates({});
        setRetriesLeft(1);
        usedProblemsRef.current.clear();

        // 초기화 후 첫 문제 생성
        setCurrentLevel(1);
        setQIndex(1);
        generateProblem(1);

        setStatusText(`${LEVEL_CONFIG[1].label} - 문제 1번`);
        setStatusColor("#fff");
    };

    // 건반 클릭 핸들러
    const handleKeyClick = (index) => {
        // [사용자 요청] 클릭 시 소리 끔
        // playPianoSound(notesData[index].freq, 0.5); 

        if (gameStatus !== 'playing') return;
        if (foundIndices.has(index)) return; // 이미 찾은 건반 무시

        if (targetIndices.includes(index)) {
            // --- 정답 ---
            setKeyStates(prev => ({ ...prev, [index]: 'correct' }));
            const newFound = new Set(foundIndices);
            newFound.add(index);
            setFoundIndices(newFound);

            // 모든 음을 찾았을 때
            if (newFound.size === targetIndices.length) {
                const scoreGain = LEVEL_CONFIG[currentLevel].score;
                setTotalScore(prev => prev + scoreGain);
                setStatusText(`정답! +${scoreGain}점`);
                setStatusColor("#2ecc71");

                // 승리 효과음
                setTimeout(() => playPianoSound(523.25, 0.2), 0);
                setTimeout(() => playPianoSound(659.25, 0.2), 100);
                setTimeout(() => playPianoSound(783.99, 0.4), 200);

                setTimeout(nextRound, 1500);
            } else {
                // 아직 찾아야 할 음이 남았을 때 상태 메시지 업데이트
                setStatusText(`정답! ${newFound.size} / ${targetIndices.length} 발견`);
                setStatusColor("#2ecc71");
            }
        } else {
            // --- 오답 ---
            setKeyStates(prev => ({ ...prev, [index]: 'wrong' }));

            // 시각적 피드백 제거 (오답 건반만 삭제, 정답 건반은 유지)
            setTimeout(() => {
                setKeyStates(prev => {
                    const newState = { ...prev };
                    // 오답 건반만 삭제
                    if (newState[index] === 'wrong') {
                        delete newState[index];
                    }
                    return newState;
                });
            }, 500);

            if (retriesLeft > 0) {
                // 기회 1회 차감 (아직 게임오버 아님)
                setRetriesLeft(0);
                setStatusText("틀렸습니다! 마지막 기회입니다.");
                setStatusColor("#f39c12");
            } else {
                // 기회 소진 -> 게임 오버
                setGameStatus('gameover');
                setStatusText("게임 오버!");
                setStatusColor("#e74c3c");
                // 꽝 소리
                playPianoSound(100, 0.5);
            }
        }
    };

    // 랭크 계산
    const getRank = (score) => {
        // 총점 만점: (50*5) + (100*5) + ... + (300*5) = 5250점
        if (score >= 5000) return "Absolute God";
        if (score >= 4000) return "Maestro";
        if (score >= 3000) return "Professional";
        if (score >= 2000) return "Musician";
        if (score >= 1000) return "Student";
        return "Novice";
    };

    return (
        <div className="pitch-game-container">
            <h1>Absolute Pitch Challenge</h1>

            <div className="dashboard">
                <div className="stat-box">
                    <span className="stat-label">Level</span>
                    <span className="stat-value level">
                        {gameStatus === 'ready' ? '-' : `Lv.${currentLevel}`}
                    </span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Stage</span>
                    <span className="stat-value">
                        {gameStatus === 'ready' ? '-' : `${qIndex} / ${QUESTIONS_PER_LEVEL}`}
                    </span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Score</span>
                    <span className="stat-value highlight">{totalScore}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Life</span>
                    <span className="stat-value life">
                        {gameStatus === 'playing' ? (retriesLeft > 0 ? "❤️❤️" : "❤️💔") : "-"}
                    </span>
                </div>
            </div>

            <div className="status-bar" style={{ color: statusColor }}>{statusText}</div>

            <div className="controls">
                {gameStatus === 'ready' ? (
                    <button onClick={startGame} className="btn-start">
                        ▶ GAME START
                    </button>
                ) : (
                    <button
                        className="btn-replay"
                        onClick={playTargets}
                        disabled={gameStatus !== 'playing'}
                    >
                        ↺ 다시 듣기
                    </button>
                )}
            </div>

            <div className="piano-wrapper">
                <div className="piano-keys" style={{ width: `${8 * 60}px` }}>
                    {notesData.map((note, index) => {
                        let style = {};
                        if (note.type === 'black') {
                            // 검은 건반의 위치 계산 개선
                            const whiteIndex = notesData.slice(0, index).filter(n => n.type === 'white').length;
                            const leftPos = whiteIndex * 60;
                            style = { left: `${leftPos}px` };
                        }

                        let className = `key ${note.type}`;
                        if (keyStates[index]) className += ` ${keyStates[index]}`;

                        return (
                            <div
                                key={index}
                                className={className}
                                style={style}
                                onMouseDown={() => handleKeyClick(index)}
                            >
                                {note.type === 'white' ? note.note.replace(/\d/, '') : ''}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button className="home-button" onClick={onGoHome}>메인으로 돌아가기</button>

            {/* 결과 모달 (게임 클리어 or 게임 오버) */}
            {(gameStatus === 'finished' || gameStatus === 'gameover') && (
                <div className="game-over-modal">
                    <div className="modal-content">
                        <div className="modal-title">
                            {gameStatus === 'finished' ? "All Clear! 🎉" : "Game Over"}
                        </div>
                        <div className="modal-score">{totalScore}점</div>
                        <div className="modal-rank">{getRank(totalScore)}</div>
                        <div style={{ color: '#aaa', marginBottom: '20px' }}>
                            {gameStatus === 'finished' ? "모든 단계를 정복하셨습니다!" : `최종 도달: Lv.${currentLevel}`}
                        </div>
                        <button className="btn-restart" onClick={startGame}>다시 도전</button>
                        <br /><br />
                        <button className="btn-restart" style={{ backgroundColor: '#555' }} onClick={onGoHome}>나가기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AbsolutePitch;
