import React, { useState } from 'react';
import './App.css';
import AbsolutePitch from './AbsolutePitch';
import ReactionSpeed from './ReactionSpeed';

function App() {
  // 현재 화면 상태 관리 ('home' 또는 'absolutePitch')
  const [currentView, setCurrentView] = useState('home');

  // 홈 화면 렌더링
  if (currentView === 'home') {
    return (
      <div className="App">
        <header className="App-header">
          <h1>OSS Team Project</h1>
          <p>
            다양한 미니 게임을 즐겨보세요!
          </p>
          <div className="game-menu">
            <button
              className="game-button"
              onClick={() => setCurrentView('absolutePitch')}
            >
              절대음감 테스트
            </button>
            {/* 추후 다른 게임 버튼 추가 가능 */}
            <button
              className="game-button"
              onClick={() => setCurrentView('reactionSpeed')}
            >
              반응속도 테스트
            </button>
          </div>
        </header>
      </div>
    );
  }

  // 절대음감 게임 화면 렌더링
  if (currentView === 'absolutePitch') {
    return <AbsolutePitch onGoHome={() => setCurrentView('home')} />;
  }

  // 반응속도 게임 화면 렌더링
  if (currentView === 'reactionSpeed') {
    return <ReactionSpeed onGoHome={() => setCurrentView('home')} />;
  }

  return null;
}

export default App;
