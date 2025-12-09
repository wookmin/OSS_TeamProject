// src/Games/Leaderboard.js

import React, { useState, useEffect } from 'react';
import { fetchAllRankings, deleteScore, updateNickname } from '../api';
import './Leaderboard.css';

const Leaderboard = ({ onGoHome }) => {
  const [rankings, setRankings] = useState({});
  const [loading, setLoading] = useState(true);

  // 닉네임 수정 상태
  const [editingId, setEditingId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');

  const loadRankings = async () => {
    setLoading(true);
    const data = await fetchAllRankings();
    setRankings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('이 점수를 삭제하시겠습니까?')) return;

    const success = await deleteScore(id);
    if (success) {
      // 삭제 후 다시 불러오기
      await loadRankings();
      // 혹시 편집 중이던 항목이면 편집 상태 해제
      if (editingId === id) {
        setEditingId(null);
        setEditingNickname('');
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditingNickname(item.nickname);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingNickname('');
  };

  const handleEditSave = async (item) => {
    const newName = editingNickname.trim();
    if (!newName) {
      alert('닉네임을 입력해줘!');
      return;
    }

    const ok = await updateNickname(item.id, item.gameName, item.score, newName);
    if (!ok) {
      alert('닉네임 수정 중 오류가 났어 ㅠㅠ');
      return;
    }

    // 서버 갱신 후 다시 불러오기
    await loadRankings();
    setEditingId(null);
    setEditingNickname('');
  };

  const gameNames = {
    AbsolutePitch: '절대음감 테스트',
    ReactionSpeed: '반응속도 테스트',
    MoleCatch: '두더지 잡기 게임',
    FallingBlocks: '블럭 피하기 게임',
  };

  if (loading) {
    return <div className="leaderboard-fullscreen">로딩 중...</div>;
  }

  return (
    <div className="leaderboard-fullscreen">
      <h1>🏆 게임 순위</h1>

      <div className="rankings-grid">
        {Object.keys(gameNames).map((gameKey) => (
          <div key={gameKey} className="ranking-card">
            <h3>{gameNames[gameKey]}</h3>

            {rankings[gameKey] && rankings[gameKey].length > 0 ? (
              <div className="ranking-list">
                {rankings[gameKey].map((item, index) => (
                  <div
                    key={item.id}
                    className={`ranking-item ${
                      index < 3 ? `rank-${index + 1}` : ''
                    }`}
                  >
                    <span className="rank">{index + 1}</span>

                    <span className="nickname">
                      {editingId === item.id ? (
                        <input
                          className="nickname-input"
                          value={editingNickname}
                          onChange={(e) => setEditingNickname(e.target.value)}
                        />
                      ) : (
                        item.nickname
                      )}
                    </span>

                    <span className="score">{item.score}</span>

                    <span className="actions">
                      {editingId === item.id ? (
                        <>
                          <button
                            className="edit-save-btn"
                            onClick={() => handleEditSave(item)}
                          >
                            저장
                          </button>
                          <button
                            className="edit-cancel-btn"
                            onClick={handleEditCancel}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => handleEditClick(item)}
                          >
                            수정
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(item.id)}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">등록된 점수가 없습니다.</p>
            )}
          </div>
        ))}
      </div>

      <button className="home-button" onClick={onGoHome}>
        메인으로 돌아가기
      </button>
    </div>
  );
};

export default Leaderboard;
