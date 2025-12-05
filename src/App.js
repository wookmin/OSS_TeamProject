import React, { useState } from 'react';
import './App.css';
import AbsolutePitch from './AbsolutePitch';
import ReactionSpeed from './ReactionSpeed';
import MoleCatch from './MoleCatch';
import Leaderboard from './Leaderboard';

function App() {
  // 현재 화면 상태 관리 ('home', 'absolutePitch', 'reactionSpeed', 'fallingBlocks', 'moleCatch', 'leaderboard')
  const [currentView, setCurrentView] = useState('home');
  const [nickname, setNickname] = useState('');

  // 홈 화면 렌더링
  if (currentView === 'home') {
    return (
      <div className="App">
        <header className="App-header">
          <h1>OSS Team Project</h1>
          <p>
            다양한 미니 게임을 즐겨보세요!
          </p>
          
          {/* 닉네임 입력 창 */}
          <div className="nickname-section">
            <input
              type="text"
              placeholder="닉네임을 입력하세요 (선택사항)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="nickname-input"
              maxLength="15"
            />
            <span className="nickname-hint">
              {nickname ? `입력됨: ${nickname}` : '닉네임을 입력하면 점수가 순위에 반영됩니다'}
            </span>
          </div>

          {/* 게임 메뉴 */}
          <div className="game-menu">
            <button
              className="game-button"
              onClick={() => setCurrentView('absolutePitch')}
            >
              절대음감 테스트
            </button>
            <button
              className="game-button"
              onClick={() => setCurrentView('reactionSpeed')}
            >
              반응속도 테스트
            </button>
            <button
              className="game-button"
              onClick={() => setCurrentView('moleCatch')}
            >
              두더지 잡기 게임
            </button>
          </div>

          {/* 순위 보기 버튼 */}
          <button 
            className="leaderboard-toggle"
            onClick={() => setCurrentView('leaderboard')}
          >
            순위 보기 🏆
          </button>
        </header>
      </div>
    );
  }

  // 절대음감 게임 화면 렌더링
  if (currentView === 'absolutePitch') {
    return <AbsolutePitch onGoHome={() => setCurrentView('home')} nickname={nickname} />;
  }

  // 반응속도 게임 화면 렌더링
  if (currentView === 'reactionSpeed') {
    return <ReactionSpeed onGoHome={() => setCurrentView('home')} nickname={nickname} />;
  }

  // 두더지 잡기 게임 화면 렌더링
  if (currentView === 'moleCatch') {
    return <MoleCatch onGoHome={() => setCurrentView('home')} nickname={nickname} />;
  }

  // 리더보드 화면 렌더링
  if (currentView === 'leaderboard') {
    return <Leaderboard onGoHome={() => setCurrentView('home')} />;
  }

  return null;
}

export default App;
