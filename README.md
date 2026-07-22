# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 1 of 8** — monorepo scaffolding, shared types, and a
server↔client health-check round trip. No game logic yet.

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

## Testing Milestone 1

1. With both dev servers running, open http://localhost:5173.
2. The page should show:
   - `HTTP health check: ok`
   - `Socket.io connection: connected`
3. Stop the server (`Ctrl+C` in that terminal) and the client should
   flip `Socket.io connection` to `disconnected` within a couple of
   seconds — confirming the connection is live, not just a one-time
   fetch.
4. `curl http://localhost:4000/health` directly should return
   `{"status":"ok","timestamp":...}`.

## Typechecking

```bash
npm run typecheck
```

Runs `tsc --noEmit` across every workspace — this is the main
guardrail keeping client, server, and shared types honest with each
other as the project grows.

## Roadmap

1. ✅ Monorepo scaffold + shared types
2. Room lifecycle (create/join, in-memory `RoomManager`)
3. Maze rendering with Phaser (static, no programming yet)
4. Blockly editor + custom step-by-step interpreter (sequencing only)
5. Race mechanics (simultaneous execution, win detection, leaderboard)
6. Teacher dashboard live view
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
