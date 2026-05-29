# Spell Adventure

A turn-based pixel art RPG where you collect spells by defeating enemies — think Pokémon, but for spellcasters.

## Play

Open `index.html` in any modern browser. No build step, no server required.

> **Note:** Some browsers restrict local file loading of images. If sprites don't appear, serve the folder with a local server:
> ```
> npx serve .
> # or
> python3 -m http.server 8080
> ```

## Gameplay

### Core Loop
1. **Choose a zone** on the world map (new zones unlock as you level up)
2. **Select an enemy** to fight
3. **Win battles** to earn XP and collect spell drops
4. **Level up** — choose a stat bonus each level: +2 HP, +1 ATK, or +1 SPD
5. **Build your spellbook** — equip up to 6 spells for battle

### Combat
- **Turn order**: higher SPD goes first; ties are random
- **One spell per turn**
- **Mana**: every spell costs mana; only regenerates from Mana Surge or at end of battle
- **Cooldowns**: powerful spells can't be used every turn
- **Status effects**: apply debuffs to the enemy or buffs to yourself
- **Type advantage**: matching spell element vs. enemy weakness = 2× damage

### Leveling
Your hero has 3 visual tiers that upgrade automatically:
- Tier 1: Levels 1–5
- Tier 2: Levels 6–12  
- Tier 3: Levels 13+

## Zones

| Zone | Unlock Level | Enemy Types |
|------|-------------|-------------|
| Bog | 1 | Orc Grunt, Bog Troll |
| Ember | 4 | Lava Wyrm, Magma Golem |
| Frozen | 7 | Frost Wisp, Ice Drake |
| Shadow | 11 | Shadow Imp, Void Wraith |

## Spells (22 total)

| Name | Element | Rarity | Cost | Effect |
|------|---------|--------|------|--------|
| Strike | Physical | Common | 0 | 100% ATK damage |
| Rock Throw | Earth | Common | 1 | 110% ATK, low bleed chance |
| Mana Surge | Arcane | Common | 0 | Restore 3 mana |
| Fireball | Fire | Uncommon | 2 | 150% ATK + burn |
| Ice Shard | Ice | Uncommon | 2 | 130% ATK, 50% freeze chance |
| Thunder Bolt | Thunder | Uncommon | 2 | 140% ATK |
| Poison Dart | Nature | Common | 1 | 80% ATK + poison |
| Shadow Slash | Shadow | Uncommon | 2 | 130% ATK + bleed |
| Holy Light | Holy | Rare | 3 | 160% ATK, heals caster 15% |
| Acid Spray | Corrosion | Rare | 3 | 120% ATK + corrosion |
| Wind Slash | Wind | Uncommon | 2 | 145% ATK |
| Earthquake | Earth | Rare | 4 | 200% ATK |
| Blizzard | Ice | Epic | 5 | 250% ATK + freeze |
| Inferno | Fire | Epic | 5 | 300% ATK + burn (2 turn CD) |
| Chain Lightning | Thunder | Rare | 4 | 220% ATK |
| Regen | Nature | Uncommon | 2 | Heal 20% HP, regen 3 turns |
| Blood Pact | Shadow | Epic | 3 | Sacrifice 15% HP, deal 350% |
| Curse | Shadow | Rare | 3 | Curse — target takes more damage |
| Haste | Arcane | Rare | 3 | Haste — +SPD for 3 turns |
| Null Barrier | Arcane | Epic | 4 | Ward — reduce incoming damage 50% |
| Void Drain | Shadow | Legendary | 6 | 400% ATK + drain 2 mana |
| Meteor Strike | Fire | Legendary | 7 | 500% ATK + burn (3 turn CD) |

## Status Effects

| Effect | Icon | Description |
|--------|------|-------------|
| Burn | 🔥 | 25% ATK damage per turn (fire) |
| Freeze | ❄️ | Skip next turn |
| Poison | ☠️ | 15% ATK damage per turn (nature) |
| Bleed | 🩸 | 20% ATK damage per turn |
| Shock | ⚡ | 20% ATK damage per turn (thunder) |
| Curse | 💀 | Take 35% more damage |
| Slow | 🐢 | SPD halved |
| Ward | 🛡️ | Take 50% less damage |
| Haste | 💨 | SPD doubled |
| Regen | 💚 | Heal 15% max HP per turn |

## Element Chart

Elements have strengths and weaknesses. Effective hits deal 2× damage; resistant targets take 0.5× damage; immune targets take 0×.

Key matchups:
- **Fire** beats Ice, Nature
- **Ice** beats Earth, Wind
- **Thunder** beats Wind, Water
- **Holy** beats Shadow (2×)
- **Shadow** resists Holy
- **Earth** resists Physical, Thunder

## Architecture

```
spellAdventure/
├── index.html
├── css/
│   ├── main.css       — variables, reset, shared components
│   ├── battle.css     — battle screen layout and spell cards
│   └── ui.css         — menus, world map, spellbook
├── js/
│   ├── data/
│   │   ├── spells.js  — spell definitions + status effect registry
│   │   ├── world.js   — zones, type chart, XP table
│   │   └── enemies.js — enemy definitions + sprite sheet metadata
│   ├── core/
│   │   ├── EventBus.js    — pub/sub event system
│   │   └── SaveManager.js — localStorage save/load
│   ├── entities/
│   │   ├── Combatant.js — base class: stats, spells, status effects
│   │   ├── Hero.js      — player entity
│   │   └── Enemy.js     — enemy entity with type weaknesses
│   ├── systems/
│   │   ├── SpellResolver.js — spell effect resolution + type math
│   │   ├── AIBrain.js       — enemy AI decision logic
│   │   └── BattleEngine.js  — turn loop, event emission
│   ├── ui/
│   │   ├── Animator.js      — canvas sprite sheet animator
│   │   ├── BattleView.js    — battle screen DOM + event listeners
│   │   ├── SpellBookView.js — spell collection management
│   │   ├── WorldView.js     — zone selection map
│   │   └── MenuView.js      — title, name entry, victory, defeat, hero profile
│   └── main.js — game controller + screen router
└── Assets/
    ├── Assets_Hero/   — hero sprite sheets (3 tiers × 5 animations)
    ├── Assets_Enemy/  — orc enemy sprite sheets
    ├── Assets_Spells/ — spell book + spell icons
    └── Assets_Maps/   — background tiles
```

All code uses the `window.SA` namespace — no bundler required. Load order is managed via `<script>` tag ordering in `index.html`.

## Asset Credits

Pixel art assets by [Craftpix.net](https://craftpix.net). Used under their free/commercial license terms.

## Browser Support

Tested in Chrome, Firefox, Safari, Edge (latest). Requires:
- ES6 classes
- CSS Grid + Custom Properties
- Canvas 2D API
- localStorage
