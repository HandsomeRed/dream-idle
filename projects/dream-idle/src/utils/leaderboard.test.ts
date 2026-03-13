import {
  LeaderboardType,
  calculatePower,
  generateLeaderboard,
  getPlayerRank,
  getTopPlayers,
  updateRankChanges
} from './leaderboard';

describe('排行榜系统 v0.9', () => {
  const mockPlayers = [
    { userId: 'user1', nickname: '玩家 1', level: 50, attack: 100, defense: 80, hp: 500, mp: 200, speed: 60 },
    { userId: 'user2', nickname: '玩家 2', level: 45, attack: 120, defense: 70, hp: 450, mp: 180, speed: 70 },
    { userId: 'user3', nickname: '玩家 3', level: 55, attack: 90, defense: 90, hp: 550, mp: 220, speed: 50 },
    { userId: 'user4', nickname: '玩家 4', level: 40, attack: 150, defense: 60, hp: 400, mp: 150, speed: 80 },
    { userId: 'user5', nickname: '玩家 5', level: 60, attack: 80, defense: 100, hp: 600, mp: 250, speed: 40 },
  ];
  
  describe('战力计算', () => {
    test('计算玩家战力', () => {
      const power = calculatePower(50, 100, 80, 500, 200, 60);
      expect(power).toBeGreaterThan(0);
    });
    
    test('高等级高战力', () => {
      const power1 = calculatePower(50, 100, 80, 500, 200, 60);
      const power2 = calculatePower(60, 120, 90, 600, 250, 70);
      expect(power2).toBeGreaterThan(power1);
    });
  });
  
  describe('战力榜', () => {
    test('生成战力榜', () => {
      const leaderboard = generateLeaderboard(LeaderboardType.Power, mockPlayers);
      expect(leaderboard.type).toBe(LeaderboardType.Power);
      expect(leaderboard.entries.length).toBeLessThanOrEqual(100);
      expect(leaderboard.entries[0].rank).toBe(1);
    });
    
    test('战力榜按战力排序', () => {
      const leaderboard = generateLeaderboard(LeaderboardType.Power, mockPlayers);
      for (let i = 1; i < leaderboard.entries.length; i++) {
        expect(leaderboard.entries[i - 1].power).toBeGreaterThanOrEqual(leaderboard.entries[i].power);
      }
    });
  });
  
  describe('等级榜', () => {
    test('生成等级榜', () => {
      const leaderboard = generateLeaderboard(LeaderboardType.Level, mockPlayers);
      expect(leaderboard.type).toBe(LeaderboardType.Level);
    });
    
    test('等级榜按等级排序', () => {
      const leaderboard = generateLeaderboard(LeaderboardType.Level, mockPlayers);
      for (let i = 1; i < leaderboard.entries.length; i++) {
        expect(leaderboard.entries[i - 1].level).toBeGreaterThanOrEqual(leaderboard.entries[i].level);
      }
    });
  });
  
  describe('获取排名', () => {
    test('获取玩家排名', () => {
      const rank = getPlayerRank(LeaderboardType.Power, mockPlayers, 'user1');
      expect(rank).toBeGreaterThan(0);
      expect(rank).toBeLessThanOrEqual(mockPlayers.length);
    });
    
    test('不存在的玩家返回 -1', () => {
      const rank = getPlayerRank(LeaderboardType.Power, mockPlayers, 'nonexistent');
      expect(rank).toBe(-1);
    });
  });
  
  describe('获取前 N 名', () => {
    test('获取前 3 名', () => {
      const top3 = getTopPlayers(LeaderboardType.Power, mockPlayers, 3);
      expect(top3.length).toBe(3);
      expect(top3[0].rank).toBe(1);
      expect(top3[2].rank).toBe(3);
    });
    
    test('获取前 10 名（不足 10 人）', () => {
      const top10 = getTopPlayers(LeaderboardType.Power, mockPlayers, 10);
      expect(top10.length).toBe(mockPlayers.length);
    });
  });
  
  describe('排名变化', () => {
    test('更新排名变化', () => {
      const oldLeaderboard = generateLeaderboard(LeaderboardType.Power, mockPlayers);
      
      // 修改一个玩家的战力
      mockPlayers[0].attack += 50;
      
      const newLeaderboard = generateLeaderboard(LeaderboardType.Power, mockPlayers);
      updateRankChanges(oldLeaderboard, newLeaderboard);
      
      // 检查排名变化
      const entry = newLeaderboard.entries.find(e => e.userId === 'user1');
      expect(entry).toBeDefined();
      // 排名可能上升（rankChange > 0）或不变（rankChange = 0）
      expect(entry!.rankChange).toBeGreaterThanOrEqual(0);
    });
  });
});
