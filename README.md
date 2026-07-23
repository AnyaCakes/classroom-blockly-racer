# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 4 of 8** — Blockly editor and the real interpreter.
Students write actual programs (move forward / turn left / turn
right blocks under a "when race starts" hat, which is itself a
normal movable/deletable block available from the palette) and click
Run to execute them - the same animation and collision pipeline from
Milestone 3, now driven by real code instead of debug buttons.
Hitting a wall costs a real 1.5-second shake penalty, during which
execution is genuinely paused (not just visually so - see the
commandId correlation in `useProgramRunner`/`RaceScene`) and the
offending block stays highlighted. The penalty doesn't stop the
program, though - once the shake finishes, execution continues with
the next block, same as a real robot that bumped into something and
kept going. Two independent controls: **Reset Sprite** (robot back to
start, code untouched) and **Clear Work Area** (blocks wiped, robot
untouched) - nothing else resets automatically. Loops and
conditionals are deliberately not available yet (progressive
unlocking is Milestone 7). The maze canvas and Blockly workspace sit
side by side (wrapping to stacked on narrow screens) so a student can
watch the robot and edit blocks at once.

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
   a palette offering that same start block plus "move forward,"
   "turn left," "turn right."
3. **The start block is a normal block now**: drag it out of the
   workspace to delete it (or right-click → Delete). Then drag a
   fresh one back in from the palette. Both should work exactly like
   any other block - nothing should refuse to move or delete it.
4. Drag a few movement blocks so they snap under the hat block.
   Click **Run**. The robot should execute them in order with the
   same smooth animation as before, and the Run button should read
   "Running…" and be disabled until execution finishes.
5. **Wall collision is a timed penalty, not a stop.** Build a
   program with at least two blocks *after* one that walks into a
   wall (e.g. move, move, move-into-wall, turn right, move). Click
   Run and watch closely:
   - When the robot hits the wall, it should shake in place for the
     full ~1.5 seconds, and **no further blocks should highlight or
     execute during that time** - the block that caused the collision
     stays highlighted while shaking.
   - Once the shake finishes, an amber "Hit a wall! Lost 1.5 seconds -
     continuing with the next block" message should appear, and
     **execution should then continue** - the highlight should move
     to the next block and it should actually run, not stop and wait
     for you to click Run again.
   - If a later block in the same run succeeds, the amber message
     should clear (or get replaced by the green "reached the goal"
     message if that later block reaches it).
   If you see execution stop after the shake instead of continuing,
   that's the bug to report back.
6. **The robot's position after a collision reflects reality.**
   Since the blocked move didn't happen, the robot should still be
   sitting where it was *before* attempting the wall - the collision
   costs time, not position. Confirm subsequent blocks (e.g. a turn)
   execute correctly from that actual position.
7. **Reset Sprite**: click it. The robot should snap back to the
   maze's start position/facing. Your blocks should be untouched.
8. **Clear Work Area**: with some blocks still in the workspace,
   click it. All blocks should disappear except a fresh "when race
   starts" hat block. The robot's position should be unaffected -
   wherever it was before this click, it stays.
9. **Successful run**: rebuild a program that solves the maze
   ("Around the Corner" needs move(s), a turn, then more moves).
   Click Run and confirm you reach the goal, see the green "You
   reached the goal!" message, and the Run button re-enables.
10. **Mid-shake cancellation**: trigger a wall collision, and *while
    the robot is still visibly shaking*, click either Reset Sprite or
    Clear Work Area. The shake should stop immediately, and no
    "blocked" message should appear afterward - this confirms both
    buttons genuinely cancel an in-flight run rather than racing
    against it.

**Known limitation (intentional, deferred to Milestone 5):** each
browser only renders and executes its own local robot - there's still
no server-side sync of one student's progress to another's screen.
Real simultaneous multi-student racing is Milestone 5.

**Color picker**: still works as before - your robot in the canvas
should be tinted whatever color you picked when joining.

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
