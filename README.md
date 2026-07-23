# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 5 of 8** — race mechanics. Every student in a room races
the same maze simultaneously and independently (each solves it at
their own pace, on their own local Phaser/Blockly instance). The
server is authoritative for two things: who finished, and how long
it took - a client reports "I finished," but the server computes
elapsed time from its own recorded race-start timestamp, not
anything the client claims. A live leaderboard (rank, nickname, time)
updates for the whole room as students finish. A student who
finishes is automatically moved to an open, wall-free **Practice
Grid** so they keep coding for fun instead of sitting idle - their
code doesn't carry over from the race, since it's a clean instance
swap (same architecture as the maze canvas + Blockly workspace
everywhere else). Opponents' robots are **not** yet visible on a
student's own screen - the server already relays every step
(`race:progress` → `race:opponentProgress`), but nothing renders it
client-side yet; that's the first thing Milestone 6's teacher
dashboard will consume.

**Milestone 4 recap** — Blockly editor and the real interpreter.
Students write actual programs (move forward / turn left / turn
right blocks under a "when race starts" hat, which is itself a
normal movable/deletable block available from the palette) and click
Run to execute them. Hitting a wall costs a real 1.5-second shake
penalty, during which execution is genuinely paused (commandId
correlation in `useProgramRunner`/`RaceScene`) and the offending
block stays highlighted - but the penalty doesn't stop the program;
once the shake finishes, execution continues with the next block.
Two independent controls: **Reset Sprite** (robot back to start, code
untouched) and **Clear Work Area** (blocks wiped, robot untouched) -
nothing else resets automatically. Loops and conditionals are
deliberately not available yet (progressive unlocking is Milestone
7). The maze canvas and Blockly workspace sit side by side (wrapping
to stacked on narrow screens).

Students still pick a placeholder-colored robot when joining - the
chosen color is what shows on the robot while it executes their
program.

## Stack

- **Client**: React, TypeScript, Vite, Phaser 3, Blockly, Socket.io-client
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

## Testing Milestone 5

Three tabs this time: one teacher, two students (non-shared
sessionStorage - e.g. one normal window, one incognito window, one
different browser, or three separate profiles).

1. **Tab 1 (teacher)**: create a room. **Tabs 2 & 3 (students)**:
   join with different nicknames and colors.
2. **Tab 1**: pick "Around the Corner" and start the race. All three
   tabs should show the maze + Blockly workspace as before.
3. **Tab 2**: build a program that solves the maze and click Run.
   Once the robot reaches the goal, confirm:
   - The green "You reached the goal!" message appears (unchanged
     from Milestone 4).
   - A **leaderboard panel** appears showing Tab 2's nickname and a
     finish time in seconds.
   - Tab 2 is automatically switched to the **Practice Grid** - an
     open 8x8 area with no walls, a fresh empty Blockly workspace
     (your race code doesn't carry over - this is intentional), and
     a blue banner: "You finished the race! Keep practicing freely
     here..."
4. **Tab 1 and Tab 3** should *also* see the updated leaderboard with
   Tab 2's entry, without any refresh - confirms the leaderboard
   broadcasts to the whole room, not just the student who finished.
5. **Tab 3**: solve the maze too. Confirm Tab 3 gets ranked #2 on the
   leaderboard (below Tab 2), and Tab 3 also gets moved to its own
   Practice Grid. **All three tabs** should now show both entries on
   the leaderboard, in finish order.
6. **In the Practice Grid** (Tab 2 or 3): confirm you can still drag
   blocks, click Run, and move the robot around freely - there's no
   goal tile anywhere, so nothing should ever trigger a "finished"
   message here, however far you drive the robot.
7. **Timing sanity check**: the leaderboard times should roughly
   reflect real elapsed time from when the race started (Tab 1
   clicked "Start Race") to when each student's robot actually
   reached the goal - not from when they clicked Run, and not
   whatever a client might report (the server computes this itself;
   there's nothing to fake here even in principle from the browser
   console).
8. **Tab 1**: click "End race, back to lobby." All three tabs should
   return to the lobby, and the leaderboard should be gone if you
   start a fresh race afterward (starting a new race clears it).

**Known limitation (intentional, deferred to Milestone 6):** students
cannot see each other's robots on their own maze view - the server
already relays every movement (`race:progress` →
`race:opponentProgress`), but nothing renders it client-side yet.
The teacher dashboard in Milestone 6 is the first thing that will
actually show live opponent movement.

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
4. ✅ Blockly editor + custom step-by-step interpreter (sequencing only)
5. ✅ Race mechanics (simultaneous execution, win detection, leaderboard)
6. Teacher dashboard live view
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
