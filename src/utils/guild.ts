/**
 * 公会系统 - v0.10
 */
export interface Guild {
  id: string;
  name: string;
  leaderId: string;
  level: number;
  members: any[];
}

export function createGuild(leaderId: string, name: string): Guild {
  return {
    id: `guild_${Date.now()}`,
    name,
    leaderId,
    level: 1,
    members: []
  };
}

export function joinGuild(guild: Guild, userId: string): boolean {
  if (guild.members.length >= 50) return false;
  guild.members.push({ userId, joinedAt: Date.now() });
  return true;
}
