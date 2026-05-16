# Pazaak-Web

A web implementation of Pazaak — the Star Wars card game from Knights of the Old Republic — played in real-time between two Players over WebSocket.

## Language

### Match & Game structure

**Match**:
A best-of-five-Games contest between exactly two Players.
_Avoid_: Game (when referring to the whole contest), session

**Game**:
A single round within a Match where both Players build Board totals, ending when both have Stood or Busted.
_Avoid_: Round, hand

**Round**:
The ordinal position of the current Game within a Match (1st game, 2nd game, etc.).
_Avoid_: Game (when referring to position), turn number

**Score**:
The number of Games each Player has won within a Match. First to 3 wins the Match.
_Avoid_: Points, tally

---

### Cards

**Board**:
The ordered collection of cards a Player has accumulated during the current Game; its total is compared against 20 to determine the Game outcome.
_Avoid_: Field, table, play area

**Hand**:
The set of special side-deck cards a Player draws at the start of a Match and can voluntarily play from during their turn.
_Avoid_: Side deck, deck (when referring to the hand)

**Game Deck**:
The shared pool of neutral cards automatically dealt to Players each turn.
_Avoid_: Deck (ambiguous — always qualify as "game deck" or "hand")

**Add Card** / **Subtract Card**:
A Hand card that adds or subtracts a fixed value from the Board total.
_Avoid_: Plus card, minus card

**Double Card**:
A Hand card that copies the effect of the last card already on the Board, applying an equal adjustment to the Board total.
_Avoid_: Copy card, mirror card

**Flip Card**:
A Hand card with a fixed value and a magnitude (add or subtract). Its magnitude can be reversed by an Invert Card.
_Avoid_: Signed card

**Tiebreaker Card**:
A Hand card that behaves like a Flip Card but additionally wins any tied Board total comparison when it is the last card on the Board.
_Avoid_: Tie card, trump card

**Invert Card**:
A Hand card that reverses the sign of all Board cards whose values match either of the card's two target numbers, including flipping the magnitude of Flip and Tiebreaker Cards.
_Avoid_: Flip card (ambiguous — "Flip Card" is a different type)

---

### Turn & status

**Turn**:
The period during which one Player draws a card from the Game Deck onto their Board and then takes one or more actions before passing control.
_Avoid_: Move, round (when referring to a single turn)

**End Turn**:
A Player action that finalises their current Turn and passes control to the opponent without locking in their Board total.
_Avoid_: Pass, skip

**Stand**:
A Player action that locks in their Board total for the rest of the current Game; a Standing Player no longer draws or acts.
_Avoid_: Stick, hold, pass

**Bust**:
The state of a Player whose Board total exceeds 20.
_Avoid_: Overshoot, over

---

### Players

**Player**:
A participant in a Match — either a human connected over WebSocket or an AI Player.
_Avoid_: User (unless referring to the web account layer)

**AI Player**:
A server-controlled Player whose moves are generated autonomously by the AI Engine instead of received from a human client.
_Avoid_: Bot, CPU, computer player

**AI Engine**:
The server-side module that inspects game state and produces the next action for an AI Player.
_Avoid_: Bot logic, AI brain

---

### Match lifecycle

**Waiting**:
The Match status when only one Player has joined and the second slot is empty.

**In-Progress**:
The Match status when both Players are present and Games are being played.

**Finished**:
The Match status when one Player has won 3 Games and the Match is over.

**Rematch**:
A replay of the full Match between the same two Players, resetting Score and Games.

## Relationships

- A **Match** contains one or more **Games**, played sequentially
- A **Game** has exactly two **Boards** — one per **Player**
- Each **Player** has one **Hand** and draws from one shared **Game Deck** per Game
- A **Turn** belongs to exactly one **Player** within a **Game**
- An **AI Player** is a **Player** whose Turn actions are produced by the **AI Engine**
- A **Rematch** resets a **Match** to In-Progress with the same two **Players**

## Example dialogue

> **Dev:** "After the human Stands, whose Turn is it?"
> **Domain expert:** "The opponent's. If the opponent is an AI Player, the AI Engine generates its next action automatically — the AI Player doesn't wait for an HTTP request."

> **Dev:** "Can a Player play multiple Hand cards in one Turn?"
> **Domain expert:** "Yes — a Player can play as many Hand cards as they like before they End Turn or Stand."

> **Dev:** "What's the difference between a Game ending and a Match ending?"
> **Domain expert:** "A Game ends when both Players have Stood or Busted; the Score is updated. The Match ends when one Player's Score reaches 3."

## Flagged ambiguities

- "Deck" is ambiguous — it refers to both the **Hand** (side deck of special cards) and the **Game Deck** (shared draw pile). Always qualify which one you mean.
- "Round" was used for both the ordinal Game index (1st, 2nd…) and for a single exchange of turns — resolved: **Round** = ordinal Game index; **Turn** = single player action window.
