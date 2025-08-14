import { Card } from '../components/game-elements/Card'

export default {
  Add: (
    <Card
      card={{
        id: 'card1',
        type: 'add',
        value: 5,
      }}
    />
  ),
  Subtract: (
    <Card
      card={{
        id: 'card2',
        type: 'subtract',
        value: 3,
      }}
    />
  ),
  Flip: (
    <Card
      card={{
        id: 'card3',
        type: 'flip',
        magnitude: 'add',
        value: 1,
      }}
    />
  ),
  Invert: (
    <Card
      card={{
        id: 'card4',
        type: 'invert',
        value: '2&4',
      }}
    />
  ),
  Double: (
    <Card
      card={{
        id: 'card5',
        value: 'D',
        type: 'double',
      }}
    />
  ),
  TieBreaker: (
    <Card
      card={{
        id: 'card6',
        type: 'tiebreaker',
        value: 1,
        magnitude: 'add',
      }}
    />
  ),
}
