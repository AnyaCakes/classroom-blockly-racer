# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 3 of 8** — maze rendering with Phaser. A teacher can
start a race with a chosen maze; every client renders the same
maze layout and robot start position from real `MazeDefinition` data
(nothing hardcoded). Temporary debug buttons (move/turn) prove the
animation and collision-detection pipeline that Milestone 4's real
Blockly interpreter will drive. No Blockly or student programs yet.

**Since Milestone 3:** students pick a robot color when joining
(placeholder colored circles for now, real sprite art comes later
per the graphics plan). The color is stored on `Player`, shown as a
swatch in the lobby roster, and applied to the robot in-race via
Phaser's `setTint()` against a white base texture.

## Stack

- **Client**: React, TypeScript, Vite, Socket.io-client (Phaser 3 and
  Blockly are added in Milestones 3–4)
- **Server**: Node.js, Express, Socket.io, TypeScript
- **Shared**: a workspace package holding types, the maze/program
  data model, and (from Milestone 4) the execution interpreter — used
  by both client and server so they can never drift out of sync

## Project Structure

```
packages/
  shared/   # types, maze data, interpreter (pure, no DOM/Node deps)
  server/   # Express + Socket.io game server
  client/   # React + Vite frontend
```

## Getting Started

Requires Node.js 18+.

```bash
npm install
npm run build:shared      # shared package must be built before the
                           # server/client can resolve it
```

Run both dev servers (two terminals):

```bash
npm run dev:server        # http://localhost:4000
npm run dev:client        # http://localhost:5173
```

## Testing Milestone 3

Two tabs, same setup as Milestone 2 (teacher + student, non-shared
sessionStorage).

1. **Tab 1 (teacher)**: create a room. **Tab 2 (student)**: join it.
2. **Tab 1**: pick a maze from the dropdown (try both "Straight Line"
   and "Around the Corner" across two runs to confirm layouts
   genuinely differ) and click "Start Race."
3. Both tabs should switch from the lobby to a canvas showing the
   maze grid and a robot at the marked start position/facing.
4. Using the debug buttons in either tab, click "Move Forward" a few
   times, then "Turn Left"/"Turn Right." The robot should animate
   smoothly, and "Last result" should update with each action's
   outcome (`moved to (x, y)`, `turned to face N`, etc.) - this
   proves the interpreter-facing event contract Milestone 4 will
   build on.
5. Drive the robot into a wall (or the maze boundary). Movement
   should stop and "Last result" should show `blocked by wall` (or
   `blocked by boundary`) instead of silently doing nothing or
   crashing.
6. Drive the robot to the goal tile. "Last result" should show
   `reached the goal!`.
7. **Tab 1**: click "End race, back to lobby." Both tabs should
   return to the lobby screen with the roster intact.

**Known limitation (intentional, deferred to Milestone 4/5):** the
debug controls are shared/global rather than per-student, and there's
no server-side sync of robot positions between students yet - each
browser's robot only reflects that browser's own button clicks. Real
simultaneous multi-student racing is Milestone 5.

**Testing the color picker:** on the join form, pick a color other
than the default (e.g. purple) before joining. Confirm: (1) the
lobby roster shows a matching-colored dot next to your name, and
(2) once a race starts, your robot in the canvas is tinted that
color rather than the default blue. Two students joining with
*different* colors in the same room should each see their own
correct color - this isn't cross-checked between browsers yet since
each browser only renders its own local robot (see the limitation
above), but each student's own robot should match their own pick.

## Typechecking

```bash
npm run typecheck
```

Runs `tsc --noEmit` across every workspace — this is the main
guardrail keeping client, server, and shared types honest with each
other as the project grows.

## Roadmap

1. ✅ Monorepo scaffold + shared types
2. ✅ Room lifecycle (create/join, in-memory `RoomManager`)
3. ✅ Maze rendering with Phaser (static, no programming yet)
4. Blockly editor + custom step-by-step interpreter (sequencing only)
5. Race mechanics (simultaneous execution, win detection, leaderboard)
6. Teacher dashboard live view
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
