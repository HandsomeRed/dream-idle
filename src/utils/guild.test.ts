import { createGuild, joinGuild } from './guild';
describe('公会系统 v0.10', () => {
  test('创建公会', () => {
    const guild = createGuild('user1', '测试公会');
    expect(guild.name).toBe('测试公会');
  });
  test('加入公会', () => {
    const guild = createGuild('user1', '测试公会');
    const joined = joinGuild(guild, 'user2');
    expect(joined).toBe(true);
  });
});
