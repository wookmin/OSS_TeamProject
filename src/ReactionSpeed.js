import React, { useState, useRef } from 'react';
// CSS 파일 import 경로 수정: 같은 src 폴더 내에 있으므로 상대 경로 사용
import './ReactionSpeed.css'; 

const ReactionSpeed = ({ onGoHome }) => {
    // 상태: 'waiting' (시작전/초록), 'ready' (준비/빨강), 'now' (클릭/파랑), 'finished' (결과)
    const [state, setState] = useState('waiting');
    const [message, setMessage] = useState('화면을 클릭하면 시작합니다.');
    const [result, setResult] = useState([]); // 기록 저장 (ms)
    
    // 렌더링과 무관한 변수 관리 (타이머 ID, 시작 시간) [cite: 9~16주차.pdf]
    const timeout = useRef(null);
    const startTime = useRef();
    const endTime = useRef();

    // 게임 등급 계산 로직
    const getRank = (average) => {
        if (average < 200) return "GOD ⚡️"; // 초인적인 속도
        if (average < 250) return "Pro Gamer 🎮";
        if (average < 300) return "Excellent 👍";
        if (average < 350) return "Good 🙂";
        if (average < 400) return "Normal 😐";
        return "Turtle 🐢"; // 400ms 이상
    };

    // 화면 클릭 핸들러
    const handleClick = () => {
        // 1. 대기 상태 -> 준비 상태 (게임 시작)
        if (state === 'waiting') {
            setState('ready');
            setMessage('빨간색이 되면 클릭하세요!');
            
            // 랜덤 시간(2~5초) 후 신호 변경
            timeout.current = setTimeout(() => {
                setState('now');
                setMessage('지금 클릭하세요!!!');
                startTime.current = new Date(); // 시간 측정 시작
            }, Math.floor(Math.random() * 3000) + 2000);
        } 
        // 2. 준비 상태 (너무 빨리 클릭함 - 부정 출발)
        else if (state === 'ready') {
            clearTimeout(timeout.current);
            setState('waiting');
            setMessage('너무 성급하시군요! 빨간색으로 바뀌면 누르세요!.');
        } 
        // 3. 신호 상태 (정상 클릭)
        else if (state === 'now') {
            endTime.current = new Date();
            const diff = endTime.current - startTime.current; // 반응속도 (ms)
            
            // 결과 저장 (배열 불변성 유지) [cite: 9~16주차.pdf]
            setResult(prevResult => [...prevResult, diff]);

            // 5회 미만이면 계속 진행
            if (result.length < 4) { // 현재 length가 4이면 이번 추가로 5개가 됨
                setState('waiting');
                setMessage(`${diff}ms! 화면을 클릭하면 다음 라운드를 시작합니다.`);
            } else {
                setState('finished'); // 5회 완료
            }
        }
    };

    // 게임 리셋
    const resetGame = (e) => {
        e.stopPropagation(); // 부모 클릭 이벤트 전파 방지
        setResult([]);
        setState('waiting');
        setMessage('화면을 클릭하면 시작합니다.');
    };

    // --- 결과 화면 렌더링 ---
    if (state === 'finished') {
        const average = Math.round(result.reduce((a, c) => a + c) / result.length);
        return (
            <div className="reaction-game-container state-waiting" style={{cursor: 'default'}}>
                <h1>테스트 완료!</h1>
                <div className="result-board">
                    <p className="sub-message">당신의 평균 반응속도는?</p>
                    <h2 style={{fontSize: '3rem', margin: '10px 0'}}>{average}ms</h2>
                    <div className="rank-badge">{getRank(average)}</div>
                    <div style={{marginTop: '20px', color: '#ddd'}}>
                        {result.map((v, i) => <span key={i} style={{margin: '0 5px'}}>{i+1}차: {v}ms</span>)}
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                    <button className="btn-home" onClick={resetGame}>다시 하기</button>
                    <button className="btn-home" onClick={onGoHome}>메인으로</button>
                </div>
            </div>
        );
    }

    // --- 게임 진행 화면 렌더링 ---
    return (
        <div 
            className={`reaction-game-container state-${state}`} 
            onMouseDown={handleClick} // 모바일 터치 대응을 위해 onMouseDown 사용 가능 (또는 onClick)
        >
            <div className="game-message">{message}</div>
            {state === 'waiting' && result.length > 0 && 
                <div className="sub-message">현재 평균: {Math.round(result.reduce((a,c)=>a+c)/result.length)}ms</div>
            }
            {state === 'waiting' && 
                <div className="sub-message">{result.length} / 5 회 완료</div>
            }
            <button 
                className="btn-home" 
                onClick={(e) => {
                    e.stopPropagation();
                    clearTimeout(timeout.current);
                    onGoHome();
                }}
                style={{
                    position: 'absolute',
                    top: '60%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10
                }}
            >
                게임 종료
            </button>
        </div>
    );
};

export default ReactionSpeed;
