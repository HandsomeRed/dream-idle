# -*- coding: utf-8 -*-
"""
Slay the Web - 简化版战斗服务器
复用原项目的战斗逻辑，通过 WebSocket 与前端通信
"""
import asyncio
import json
import random
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# ==================== 简化版游戏数据结构 ====================

class CardType(str, Enum):
    ATTACK = "attack"
    SKILL = "skill"
    POWER = "power"

@dataclass
class Card:
    id: str
    name: str
    description: str
    card_type: CardType
    cost: int
    damage: int = 0
    block: int = 0
    draw: int = 0
    energy_gain: int = 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.card_type.value,
            'cost': self.cost,
            'damage': self.damage,
            'block': self.block,
            'draw': self.draw,
            'energy_gain': self.energy_gain,
        }

@dataclass
class Player:
    max_hp: int = 80
    hp: int = 80
    energy: int = 3
    max_energy: int = 3
    block: int = 0
    hand: List[Card] = None
    deck: List[Card] = None
    discard: List[Card] = None
    
    def __post_init__(self):
        if self.hand is None:
            self.hand = []
        if self.deck is None:
            self.deck = []
        if self.discard is None:
            self.discard = []
    
    def to_dict(self):
        return {
            'max_hp': self.max_hp,
            'hp': self.hp,
            'energy': self.energy,
            'max_energy': self.max_energy,
            'block': self.block,
            'hand': [c.to_dict() for c in self.hand],
            'deck_count': len(self.deck),
            'discard_count': len(self.discard),
        }

@dataclass
class Enemy:
    id: str
    name: str
    max_hp: int
    hp: int
    block: int = 0
    intent: str = "attack"
    intent_value: int = 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'max_hp': self.max_hp,
            'hp': self.hp,
            'block': self.block,
            'intent': self.intent,
            'intent_value': self.intent_value,
        }

# ==================== 基础卡牌定义 ====================

def create_basic_cards() -> List[Card]:
    """创建基础卡牌"""
    return [
        Card("strike", "打击⚔️", "造成 6 点伤害", CardType.ATTACK, 1, damage=6),
        Card("defend", "防御🛡️", "获得 5 点格挡", CardType.SKILL, 1, block=5),
        Card("bash", "重击💥", "造成 10 点伤害", CardType.ATTACK, 2, damage=10),
        Card("iron_wave", "铁波🌊", "造成 4 点伤害，获得 5 格挡", CardType.ATTACK, 1, damage=4, block=5),
        Card("cleave", "顺劈✂️", "造成 8 点伤害", CardType.ATTACK, 1, damage=8),
        Card("armorsmith", "锻甲🔨", "获得 8 点格挡", CardType.SKILL, 1, block=8),
        Card("inflame", "激怒🔥", "获得 2 点力量", CardType.POWER, 1, energy_gain=2),
        Card("draw_card", "抽牌🎴", "抽取 2 张牌", CardType.SKILL, 0, draw=2),
    ]

# ==================== 敌人定义 ====================

def create_enemy(name: str, hp: int) -> Enemy:
    """创建敌人"""
    return Enemy(
        id=f"enemy_{name}",
        name=name,
        max_hp=hp,
        hp=hp,
        intent="attack",
        intent_value=random.randint(6, 12)
    )

# ==================== 战斗逻辑 ====================

class CombatState:
    """战斗状态管理"""
    
    def __init__(self):
        self.player = Player()
        self.enemy: Optional[Enemy] = None
        self.turn = 1
        self.is_player_turn = True
        self.combat_log: List[str] = []
        self.game_over = False
        self.victory = False
        
        # 初始化牌组
        self.player.deck = create_basic_cards() * 3  # 每种牌 3 张
        self.player.discard = []
    
    def start_combat(self, enemy_name: str = "史莱姆", enemy_hp: int = 42):
        """开始战斗"""
        self.enemy = create_enemy(enemy_name, enemy_hp)
        self.combat_log = ["⚔️ 战斗开始！"]
        self.game_over = False
        self.victory = False
        self.turn = 1
        self.is_player_turn = True
        
        # 重置玩家状态
        self.player.hp = self.player.max_hp
        self.player.energy = self.player.max_energy
        self.player.block = 0
        self.player.hand = []
        self.player.discard = []
        
        # 抽初始手牌
        self._draw_cards(5)
        self.combat_log.append(f"遭遇 {self.enemy.name} (HP: {self.enemy.hp}/{self.enemy.max_hp})")
    
    def _draw_cards(self, count: int):
        """抽牌"""
        for _ in range(count):
            if len(self.player.deck) == 0:
                if len(self.player.discard) == 0:
                    break
                # 洗牌
                self.player.deck = self.player.discard.copy()
                random.shuffle(self.player.deck)
                self.player.discard = []
                self.combat_log.append("🔄 牌库重洗")
            
            if len(self.player.deck) > 0:
                card = self.player.deck.pop()
                self.player.hand.append(card)
    
    def play_card(self, card_index: int, target: str = "enemy"):
        """出牌"""
        if not self.is_player_turn:
            return {"success": False, "error": "不是你的回合"}
        
        if card_index < 0 or card_index >= len(self.player.hand):
            return {"success": False, "error": "无效的卡牌索引"}
        
        card = self.player.hand[card_index]
        
        # 检查能量
        if self.player.energy < card.cost:
            return {"success": False, "error": "能量不足"}
        
        # 消耗能量
        self.player.energy -= card.cost
        
        # 执行卡牌效果
        effects = []
        
        if card.damage > 0:
            actual_damage = card.damage  # 可以添加力量加成
            self.enemy.hp = max(0, self.enemy.hp - actual_damage)
            self.enemy.block = max(0, self.enemy.block - actual_damage)
            effects.append(f"造成 {actual_damage} 点伤害")
        
        if card.block > 0:
            self.player.block += card.block
            effects.append(f"获得 {card.block} 点格挡")
        
        if card.draw > 0:
            self._draw_cards(card.draw)
            effects.append(f"抽取 {card.draw} 张牌")
        
        if card.energy_gain > 0:
            self.player.energy = min(self.player.max_energy, self.player.energy + card.energy_gain)
            effects.append(f"获得 {card.energy_gain} 点能量")
        
        # 卡牌进入弃牌堆
        self.player.hand.pop(card_index)
        self.player.discard.append(card)
        
        self.combat_log.append(f"使用 {card.name}: {'; '.join(effects)}")
        
        # 检查胜利
        if self.enemy.hp <= 0:
            self.victory = True
            self.game_over = True
            self.combat_log.append("🎉 胜利！")
            return {"success": True, "game_over": True, "victory": True}
        
        return {"success": True, "effects": effects}
    
    def end_turn(self):
        """结束回合"""
        if not self.is_player_turn:
            return {"success": False, "error": "不是你的回合"}
        
        self.is_player_turn = False
        
        # 手牌进入弃牌堆
        self.player.discard.extend(self.player.hand)
        self.player.hand = []
        self.player.block = 0  # 回合结束清除格挡
        
        self.combat_log.append("⏭️ 回合结束")
        
        return {"success": True}
    
    def enemy_turn(self):
        """敌人回合"""
        if self.is_player_turn:
            return {"success": False, "error": "玩家回合未结束"}
        
        if not self.enemy:
            return {"success": False, "error": "没有敌人"}
        
        # 敌人行动
        enemy_action = self.enemy.intent
        enemy_value = self.enemy.intent_value
        
        if enemy_action == "attack":
            damage = enemy_value
            # 格挡抵消
            if self.player.block > 0:
                blocked = min(self.player.block, damage)
                self.player.block -= blocked
                damage -= blocked
                self.combat_log.append(f"🛡️ 格挡了 {blocked} 点伤害")
            
            self.player.hp = max(0, self.player.hp - damage)
            self.combat_log.append(f"👹 敌人攻击造成 {damage} 点伤害")
        elif enemy_action == "defend":
            self.enemy.block += enemy_value
            self.combat_log.append(f"👹 敌人获得 {enemy_value} 点格挡")
        elif enemy_action == "buff":
            self.enemy.intent_value += 2
            self.combat_log.append(f"👹 敌人强化了")
        
        # 检查失败
        if self.player.hp <= 0:
            self.game_over = True
            self.victory = False
            self.combat_log.append("💀 失败...")
        
        # 准备下一回合
        if not self.game_over:
            self._start_player_turn()
        
        return {"success": True}
    
    def _start_player_turn(self):
        """开始玩家回合"""
        self.turn += 1
        self.is_player_turn = True
        self.player.energy = self.player.max_energy
        
        # 抽牌
        self._draw_cards(5)
        
        # 敌人意图更新
        if self.enemy:
            actions = ["attack", "defend", "buff"]
            self.enemy.intent = random.choice(actions)
            self.enemy.intent_value = random.randint(6, 14) if self.enemy.intent == "attack" else random.randint(5, 10)
        
        self.combat_log.append(f"🎴 第 {self.turn} 回合开始")
    
    def get_state(self):
        """获取当前战斗状态"""
        return {
            'player': self.player.to_dict(),
            'enemy': self.enemy.to_dict() if self.enemy else None,
            'turn': self.turn,
            'is_player_turn': self.is_player_turn,
            'combat_log': self.combat_log[-10:],  # 最近 10 条日志
            'game_over': self.game_over,
            'victory': self.victory,
        }

# ==================== WebSocket 服务器 ====================

class GameServer:
    """游戏服务器"""
    
    def __init__(self):
        self.games: Dict[str, CombatState] = {}
    
    def create_game(self, game_id: str) -> CombatState:
        """创建新游戏"""
        game = CombatState()
        self.games[game_id] = game
        return game
    
    def get_game(self, game_id: str) -> Optional[CombatState]:
        """获取游戏"""
        return self.games.get(game_id)

# 全局游戏服务器
server = GameServer()

# ==================== FastAPI + WebSocket ====================

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    await websocket.accept()
    
    # 创建或获取游戏
    game = server.get_game(game_id)
    if not game:
        game = server.create_game(game_id)
        game.start_combat()
    
    try:
        # 发送初始状态
        await websocket.send_json(game.get_state())
        
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get('action')
            
            if action == 'play_card':
                result = game.play_card(
                    message.get('card_index'),
                    message.get('target', 'enemy')
                )
            elif action == 'end_turn':
                result = game.end_turn()
                if result['success'] and not game.game_over:
                    # 敌人回合
                    await asyncio.sleep(1)  # 延迟 1 秒
                    game.enemy_turn()
            elif action == 'restart':
                game.start_combat()
            else:
                result = {'success': False, 'error': '未知操作'}
            
            # 发送新状态
            await websocket.send_json(game.get_state())
    
    except WebSocketDisconnect:
        print(f"玩家断开连接: {game_id}")

@app.get("/")
async def root():
    return {"message": "Slay the Web API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
