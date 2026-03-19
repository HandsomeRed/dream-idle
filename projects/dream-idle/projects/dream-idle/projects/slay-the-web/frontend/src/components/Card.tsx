interface CardProps {
  card: {
    id: string
    name: string
    description: string
    type: string
    cost: number
    damage?: number
    block?: number
    draw?: number
    energy_gain?: number
  }
  index: number
  canPlay: boolean
  onPlay: (index: number) => void
}

export default function Card({ card, index, canPlay, onPlay }: CardProps) {
  const handleClick = () => {
    if (canPlay) {
      onPlay(index)
    }
  }

  return (
    <div 
      className={`card ${card.type} ${!canPlay ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      <div className="card-cost">{card.cost}</div>
      
      <div className="card-name">{card.name}</div>
      <div className="card-type">{getTypeName(card.type)}</div>
      
      <div className="card-description">{card.description}</div>
      
      <div className="card-stats">
        {card.damage !== undefined && card.damage > 0 && (
          <div className="card-stat">
            <span>⚔️</span>
            <span>{card.damage}</span>
          </div>
        )}
        
        {card.block !== undefined && card.block > 0 && (
          <div className="card-stat">
            <span>🛡️</span>
            <span>{card.block}</span>
          </div>
        )}
        
        {card.draw !== undefined && card.draw > 0 && (
          <div className="card-stat">
            <span>🎴</span>
            <span>{card.draw}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function getTypeName(type: string) {
  switch (type) {
    case 'attack':
      return '攻击'
    case 'skill':
      return '技能'
    case 'power':
      return '能力'
    default:
      return type
  }
}
