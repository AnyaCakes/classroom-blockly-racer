# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 2 of 8** — room lifecycle: teacher creates a room and
gets a code, students join with the code and a nickname, and the
roster updates live for everyone in the room. Reconnection (by a
persistent per-tab `clientId`) is handled for both students and the
teacher, with a 30-second grace period before someone is dropped for
good. No maze or Blockly yet.

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

## Testing Milestone 2

Open two browser contexts that don't share `sessionStorage` — e.g. a
normal window and an incognito/private window — both pointed at
http://localhost:5173.

1. **Tab 1 (teacher)**: choose "I'm the teacher." A 4-character room
   code appears (e.g. `RK4X`).
2. **Tab 2 (student)**: choose "I'm a student," enter that code and a
   nickname, and join. Tab 2 should land on the lobby screen showing
   itself in the roster.
3. **Tab 1** should update to show the new student *without a
   refresh* — confirms `room:state` is broadcasting correctly.
4. **Duplicate nickname**: open a third tab, join the same room with
   the exact nickname from step 2. It should be rejected with a clear
   message instead of joining.
5. **Bad room code**: try joining with a made-up code (e.g. `ZZZZ`).
   Should fail with "we couldn't find a room."
6. **Reconnection**: in Tab 2's devtools, go offline (Network tab →
   Offline), wait a few seconds, then go back online. Tab 1 should
   briefly show the student as disconnected, then the student should
   reappear as connected — same entry in the roster, not a duplicate.
7. **Grace-period expiry**: go offline in Tab 2 and stay offline for
   the full 30 seconds. Tab 1 should show the student removed from
   the roster entirely.
8. **Teacher removal**: with a second student joined and connected,
   click "Remove" next to their name in Tab 1. That student's tab
   should immediately drop back to the role-select screen, and Tab 1's
   roster should update to no longer show them.

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
3. Maze rendering with Phaser (static, no programming yet)
4. Blockly editor + custom step-by-step interpreter (sequencing only)
5. Race mechanics (simultaneous execution, win detection, leaderboard)
6. Teacher dashboard live view
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
