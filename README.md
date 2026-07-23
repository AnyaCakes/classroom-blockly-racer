# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 4 of 8** — Blockly editor and the real interpreter.
Students write actual programs (move forward / turn left / turn
right blocks under a "when race starts" hat) and click Run to
execute them - the same animation and collision pipeline from
Milestone 3, now driven by real code instead of debug buttons.
Hitting a wall costs a real 1.5-second shake penalty and highlights
the offending block; a Reset button snaps the robot back to the
maze's start and clears the workspace, but nothing else resets
automatically - a blocked run leaves the robot exactly where it
stopped until the student explicitly resets or the teacher starts a
new race. Loops and conditionals are deliberately not available yet
(progressive unlocking is Milestone 7).

Students still pick a placeholder-colored robot when joining (see
the color picker added after Milestone 3) - the chosen color is what
now shows on the robot while it executes their program.

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

## Testing Milestone 4

Two tabs, same setup as before (teacher + student, non-shared
sessionStorage).

1. **Tab 1 (teacher)**: create a room, pick a maze, start the race.
   **Tab 2 (student)**: join, pick a color, and follow along.
2. Tab 2 should show the maze canvas *and*, below it, a Blockly
   workspace with a "when race starts" hat block already placed and
   a palette offering "move forward," "turn left," "turn right."
3. Drag a few movement blocks so they snap under the hat block.
   Click **Run**. The robot should execute them in order with the
   same smooth animation as Milestone 3, and the Run button should
   read "Running…" and be disabled until execution finishes.
4. **Wall collision**: build a program that walks into a wall.
   Confirm: (a) the robot visibly shakes in place for about 1.5
   seconds — not an instant stop, (b) the block that caused it is
   highlighted in the workspace, (c) a friendly amber message appears
   ("Oops - there's a wall there!..."), not a browser alert or crash.
5. **Nothing auto-resets after a blocked run.** After step 4, do
   *not* click Reset - click Run again instead. The robot should
   attempt to execute the same blocks starting from wherever it
   currently sits (the pre-collision position), not from the maze's
   start. This is intentional: only the Reset button repositions the
   robot.
6. **Reset button**: click it. The robot should snap back to the
   maze's start position/facing, and the Blockly workspace should
   clear back to just the empty "when race starts" hat block - your
   program is gone. This is exactly what was asked for (Reset = full
   restart, not just a position nudge), not a bug to report.
7. **Successful run**: rebuild a program that solves the maze
   ("Around the Corner" needs move(s), a turn, then more moves).
   Click Run and confirm you reach the goal, see the green "You
   reached the goal!" message, and the Run button re-enables.
8. **Mid-shake Reset**: trigger a wall collision, and *while the
   robot is still visibly shaking*, click Reset. The shake should
   stop immediately, the robot should jump to the start position, and
   the pending "blocked" message should not appear afterward - this
   confirms Reset genuinely cancels an in-flight run rather than
   racing against it.

**Known limitation (intentional, deferred to Milestone 5):** each
browser only renders and executes its own local robot - there's still
no server-side sync of one student's progress to another's screen.
Real simultaneous multi-student racing is Milestone 5.

**Color picker**: still works as before - your robot in the canvas
should be tinted whatever color you picked when joining, now visible
while your program runs rather than while clicking debug buttons.

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
5. Race mechanics (simultaneous execution, win detection, leaderboard)
6. Teacher dashboard live view
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
