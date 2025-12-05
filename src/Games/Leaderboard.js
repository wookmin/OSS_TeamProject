import React, { useState, useEffect } from 'react';
import { fetchAllRankings, deleteScore } from '../api';
import './Leaderboard.css';

const Leaderboard = ({ onGoHome }) => {
  const [rankings, setRankings] = useState({});
  const [loading, setLoading] = useState(true);

  const loadRankings = async () => {
    const data = await fetchAllRankings();
    setRankings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('이 점수를 삭제하시겠습니까?')) {
      const success = await deleteScore(id);
      if (success) {
        loadRankings(); // 삭제 후 다시 불러오기
      }
    }
  };

  const gameNames = {
    'AbsolutePitch': '절대음감 테스트',
    'ReactionSpeed': '반응속도 테스트',
    'MoleCatch': '두더지 잡기 게임',
    'FallingBlocks': '블럭 피하기 게임'
  };

  if (loading) {
    return <div className="leaderboard-fullscreen">로딩 중...</div>;
  }

  return (
    <div className="leaderboard-fullscreen">
      <h1>🏆 게임 순위</h1>
      <div className="rankings-grid">
        {Object.keys(gameNames).map(gameKey => (
          <div key={gameKey} className="ranking-card">
            <h3>{gameNames[gameKey]}</h3>
            {rankings[gameKey] && rankings[gameKey].length > 0 ? (
              <div className="ranking-list">
                {rankings[gameKey].map((item, index) => (
                  <div key={item.id} className={`ranking-item ${index < 3 ? `rank-${index + 1}` : ''}`}>
                    <span className="rank">{index + 1}</span>
                    <span className="nickname">{item.nickname}</span>
                    <span className="score">{item.score}</span>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(item.id)}
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">등록된 점수가 없습니다.</p>
            )}
          </div>
        ))}
      </div>
      <button className="home-button" onClick={onGoHome}>메인으로 돌아가기</button>
    </div>
  );
};

export default Leaderboard;
