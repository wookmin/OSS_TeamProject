const API_URL = 'https://69311fd011a8738467cd56f4.mockapi.io/gameRank';

// 게임별 점수 조회
export const fetchGameRankings = async (gameName) => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const filtered = data.filter(item => item.gameName === gameName);
    
    // ReactionSpeed는 낮은 점수가 좋은 점수 (오름차순 정렬)
    if (gameName === 'ReactionSpeed') {
      filtered.sort((a, b) => a.score - b.score);
    } else {
      filtered.sort((a, b) => b.score - a.score);
    }
    
    return filtered.slice(0, 10); // 상위 10명만
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// 점수 저장
export const saveScore = async (gameName, nickname, score) => {
  try {
    // 기존 데이터 조회
    const response = await fetch(API_URL);
    const allData = await response.json();
    
    // 동일한 게임, 동일한 닉네임의 기존 기록 찾기
    const existingRecord = allData.find(
      item => item.gameName === gameName && item.nickname === nickname
    );
    
    // ReactionSpeed는 낮을수록 좋은 점수, 나머지는 높을수록 좋은 점수
    const isReactionSpeed = gameName === 'ReactionSpeed';
    const isBetterScore = existingRecord 
      ? (isReactionSpeed ? score < existingRecord.score : score > existingRecord.score)
      : true;
    
    if (existingRecord) {
      // 기존 기록이 있는 경우
      if (isBetterScore) {
        // 더 좋은 점수인 경우: 기존 기록 업데이트
        await fetch(`${API_URL}/${existingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameName,
            nickname,
            score
          })
        });
      }
      // 더 나쁜 점수인 경우: 아무것도 하지 않음
    } else {
      // 기존 기록이 없는 경우: 새로 추가
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameName,
          nickname,
          score
        })
      });
    }
    
    // 해당 게임의 점수를 다시 조회하여 정렬
    const updatedResponse = await fetch(API_URL);
    const updatedData = await updatedResponse.json();
    const updatedGameScores = updatedData.filter(item => item.gameName === gameName);
    
    // 점수 정렬 (ReactionSpeed는 오름차순, 나머지는 내림차순)
    if (isReactionSpeed) {
      updatedGameScores.sort((a, b) => a.score - b.score);
    } else {
      updatedGameScores.sort((a, b) => b.score - a.score);
    }
    
    // 11위 이상은 삭제
    if (updatedGameScores.length > 10) {
      for (let i = 10; i < updatedGameScores.length; i++) {
        await fetch(`${API_URL}/${updatedGameScores[i].id}`, {
          method: 'DELETE'
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return null;
  }
};

// 모든 게임의 상위 10명 조회
export const fetchAllRankings = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    const games = ['AbsolutePitch', 'ReactionSpeed', 'MoleCatch'];
    const rankings = {};
    
    games.forEach(gameName => {
      const filtered = data.filter(item => item.gameName === gameName);
      // ReactionSpeed는 낮은 점수가 좋은 점수 (오름차순 정렬)
      if (gameName === 'ReactionSpeed') {
        filtered.sort((a, b) => a.score - b.score);
      } else {
        filtered.sort((a, b) => b.score - a.score);
      }
      rankings[gameName] = filtered.slice(0, 10);
    });
    
    return rankings;
  } catch (error) {
    console.error('Error fetching all rankings:', error);
    return {};
  }
};

// 점수 삭제
export const deleteScore = async (id) => {
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting score:', error);
    return false;
  }
};
