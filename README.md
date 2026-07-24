# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Since Milestone 7 (part 4):** fixed the maze canvas progressively
"zooming in" over time, reported on both the student's race view and
the teacher's dashboard, independent of screen size. Root cause: the
Phaser canvas's container `<div>` had no explicit height - just
`width: 100%`, leaving height to be determined by its own content
(the canvas Phaser puts inside it). But modern Phaser's `Scale.FIT`
mode watches its parent container with a `ResizeObserver` and refits
whenever that container's *measured* size changes - creating a
circular dependency (container height depends on canvas size, canvas
size depends on container height) that could drift further with each
refit cycle. Fixed by giving the container an explicit height via
CSS `aspect-ratio`, computed from the same maze dimensions already
used for the Phaser Game's internal resolution - height is now a
pure function of width, decided by the browser before Phaser ever
measures anything, with nothing left to feed a loop.

**Since Milestone 7 (part 3):** two Practice Mode fixes.

1. **Loops unlocked on the Practice Grid.** `allowedBlocks` was still
   `['sequence']` only - now includes `'loops'`, since a
   free-experimentation sandbox is exactly where a student most wants
   to play with repeat blocks.
2. **Fixed a real bug**: solo Practice Mode (pick any maze from the
   home screen, no room) was showing "🎉 You finished the race!" the
   whole time, since it reused the same `isPractice` flag a student
   moved to the practice grid *after actually finishing a race* also
   uses. `isPractice` still correctly disables server reporting in
   both cases, but a new, separate `showFinishedBanner` prop on
   `RaceScreen` now controls the banner specifically - only ever true
   for the real post-race transition, never for solo Practice Mode,
   since nobody "finished a race" by just opening the practice picker.

**Since Milestone 7 (part 2):** two additions.

1. **Single-block dragging.** Grabbing a block out of the middle of a
   stack used to drag that block *and* everything connected below it
   - annoying when you just want to move or delete one block. Now
   every drag acts on a single block only, automatically reconnecting
   the block above to the block below (Blockly calls this "healing
   the stack"). This is Blockly's own built-in behavior - normally
   opt-in via holding Ctrl/Cmd while dragging - made the default for
   every drag instead, via a custom `BlockDragStrategy` subclass (see
   `blockDefinitions.ts`). **Flagging honestly: this was implemented
   from Blockly's documented dragging API, not verified against a
   running build** (no way to execute drag interactions in this
   environment) - the exact method (`setDragStrategy`) should be
   double-checked against whatever Blockly version actually resolves
   at `npm install` time. If it doesn't compile or doesn't work,
   that's the first thing to look at, not a sign the whole approach
   is wrong.
2. **Practice Mode.** The home screen's "who's joining" choice now
   has a third option, "Just practice" - picks any existing maze
   (including the open Practice Grid) and plays it solo, no room, no
   teacher, no leaderboard, no server reporting. Entirely a reuse of
   `RaceScreen` with `isPractice` forced on, same mechanism a
   finished student's practice grid already used - no new execution
   logic needed.

**Since Milestone 7:** an unsuccessful run (every block executes but
the robot never reaches the goal) now automatically resets the
sprite back to the maze's start, instead of leaving it wherever
execution stopped. Previously, clicking Run again after a failed run
continued from that resting position - letting a student
incrementally nudge the robot forward across repeated Run clicks
without ever reasoning about the whole program. Every Run click is
now a genuine fresh attempt from the top. Reset Sprite's role shifts
accordingly: its job is no longer "clean up after a failed run" (now
automatic) but "abort a run that's still in progress" - functionality
it already had (`cancelRun` was always callable mid-run), just now
its primary reason to exist rather than an edge case.

**Milestone 7 of 8** — progressive block unlocking: loops and
conditionals. Two new blocks, available only on mazes whose
`allowedBlocks` includes them (existing mazes stay sequencing-only -
this is "new harder mazes only" progressive unlocking, not a global
toggle):

- **`repeat [N] times`** - unlocked on **Loop Alley** (`loops`).
- **`if wall ahead / else`** - unlocked on **Ring Maze** and
  **Zigzag Trail** (`loops` + `conditionals`). Ring Maze is a clean
  3-sided perimeter where one uniform rule ("if wall ahead, turn
  right, else move forward") solves the whole thing - a gentler
  first introduction to the conditional block. Zigzag Trail is the
  harder follow-up, deliberately requiring mixed left/right turns so
  a single reflexive rule doesn't trivially solve it. No general
  boolean expressions - a fixed sensor check, deliberately scoped
  that way (comparisons/variables are a later pass, not this one).

Both nest arbitrarily (a loop inside a conditional inside a loop,
etc.) - this is the first real payoff of the interpreter's
generator-based design from Milestone 4, which was built specifically
so this wouldn't require restructuring how any caller consumes it.
The bigger architecture change: `if` needs a real answer from the
maze ("is there a wall ahead *right now*") before it can decide which
branch to take, which meant switching `useProgramRunner` from a plain
`for...of` loop to manually driving the generator via `gen.next(answer)`
- JS generators support this natively, but it's a genuine two-way
protocol now, not just "pull the next node." Sensor checks are
instant (no shake/animation), don't move the robot, and are
deliberately excluded from `race:progress` reporting - they're not
opponent-visible progress, just local plumbing between the runner and
the scene.

**Earlier milestones, condensed:** teacher dashboard with a shared
live maze view, full-roster leaderboard, and clientId-stable robot
tracking across reconnects (6) → race mechanics with
server-authoritative timing and a Practice Grid for finished students
(5) → Blockly editor and interpreter, with a real 1.5s shake penalty
on wall collisions that doesn't stop execution, plus Reset
Sprite/Clear Work Area as independent controls (4) → Phaser maze
rendering (3) → room lifecycle with reconnection handling (2) →
monorepo scaffold (1). Several rounds of real bugs found and fixed
via cross-device testing along the way (student reconnection, teacher
removal not resetting the removed student's screen, dashboard robot
desync after collisions) - full detail in commit history.

Students still pick a placeholder-colored robot when joining - the
same color identifies them on the teacher's shared dashboard view.

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

## Testing Milestone 7

Single tab is enough for most of this (the new blocks are entirely
about what a student can write, not multiplayer behavior) - use two
tabs only for the last step.

1. **Toolbox gating**: create a room, pick **"Straight Line"** or
   **"Around the Corner"** (either original maze) and start the race.
   Confirm the Blockly palette shows only start/move/turn - no repeat
   or if block. This confirms existing mazes correctly stay
   sequencing-only.
2. **Loop Alley**: end that race, start a new one on **Loop Alley**.
   The palette should now also offer **"repeat [ ] times."** Drag one
   in, set the count to 8 (default is 3 - click the number to edit
   it), snap a single "move forward" inside it, run. The robot should
   move all 8 tiles to the goal from one loop block instead of 8
   separate move blocks.
3. **Loop count edge cases**: try a repeat count that's too high or
   too low for the corridor (e.g. repeat 3 - robot stops short; repeat
   20 - robot should hit the goal and then, since 'finished' stops
   execution entirely per Milestone 4/5 behavior, the extra iterations
   never happen - confirm no error, no attempt to move past the goal).
4. **Zigzag Trail**: start a race on **Zigzag Trail**. Palette should
   now also offer **"if wall ahead / else."** This maze has 4
   segments and 3 turns (right, then left, then right) - try solving
   it two ways:
   - **Plain sequencing** (no loop/if at all) - should work exactly
     like any earlier maze, just longer.
   - **Loops for the straight segments** (e.g. `repeat 2: move
     forward` for the first segment) **combined with explicit turn
     blocks** at the right points - confirms nesting a movement
     inside a loop works, and that loops/turns can be freely mixed.
5. **The if block itself**: build a program using `if wall ahead` -
   e.g. right after the first segment, use it to decide whether to
   turn (put a turn block in "do," leave "else" empty or put a move
   block there). Click Run and confirm: the if-block itself
   highlights briefly while its condition is checked (no shake, no
   delay - this is instant, unlike a real collision), then whichever
   branch matches actually executes.
6. **Nesting**: build a program with a repeat block containing an if
   block containing another repeat block (however contrived - the
   point is confirming arbitrary nesting doesn't break). Confirm Run
   still highlights the correct block at each step and the robot
   behaves as the nested structure implies.
7. **Reset Sprite / Clear Work Area still work** with these new block
   types in the workspace - Clear Work Area should wipe repeat/if
   blocks along with everything else back to just the start hat.
8. **Multiplayer sanity check** (two tabs): race Zigzag Trail with a
   teacher + one student. Confirm the teacher's dashboard still
   tracks the student's robot accurately through loop/conditional
   execution - sensor checks specifically should produce **no visible
   effect** on the teacher's dashboard (no robot movement, no stray
   event), since they're deliberately excluded from opponent-progress
   reporting.

## Typechecking

```bash
npm run typecheck
```

Runs `tsc --noEmit` across every workspace — this is the main
guardrail keeping client, server, and shared types honest with each
other as the project grows.

## Deployment

GitHub Pages can only serve static files - it cannot run the
Socket.io server, which needs a long-running, always-reachable
process. So this is a two-part deployment: **client on GitHub Pages,
server on Render/Railway/Fly**, each pointed at the other via an
environment variable.

### 1. Deploy the server first

You need its URL before the client build can be pointed at it.

**Render (blueprint provided - easiest):**
1. Push this repo to GitHub if you haven't already.
2. In the Render dashboard: **New +** → **Blueprint** → connect this
   repo. Render reads `render.yaml` at the repo root and provisions
   the service automatically.
3. Once created, open the service → **Environment** and set
   `CLIENT_ORIGIN` to your future GitHub Pages URL - e.g.
   `https://username.github.io` (no trailing path, no trailing
   slash). You can update this later once you know the exact URL.
4. Note the service's URL (e.g. `https://classroom-blockly-racer-server.onrender.com`)
   - you'll need it in step 2 below.

**Railway (no blueprint file needed - auto-detects Node):**
1. **New Project** → **Deploy from GitHub repo** → select this repo.
2. Set **Root Directory** to the repo root (not `packages/server`) -
   the build needs the whole workspace to resolve `@racer/shared`.
3. Build command: `npm install && npm run build:shared && npm run build --workspace=@racer/server`
   Start command: `npm start --workspace=@racer/server`
4. Add environment variable `CLIENT_ORIGIN` (same value as above).

**Fly.io:**
1. `fly launch` from the repo root (generates a `fly.toml` -
   intentionally not pre-committed here since it embeds an app name
   and region you choose interactively).
2. When prompted for build/start commands, use the same two commands
   as the Railway section above.
3. `fly secrets set CLIENT_ORIGIN=https://username.github.io`

All three have a free tier sufficient for this app's scale (a small
in-memory app, one classroom's worth of concurrent connections).

### 2. Deploy the client to GitHub Pages

1. In this repo on GitHub: **Settings** → **Pages** → under **Build
   and deployment**, set **Source** to **GitHub Actions**. (You only
   need to do this once - `.github/workflows/deploy-client.yml` is
   already in the repo and handles the rest.)
2. **Settings** → **Secrets and variables** → **Actions** → **Variables**
   tab → **New repository variable**: name `VITE_SERVER_URL`, value
   the server URL from step 1 (e.g.
   `https://classroom-blockly-racer-server.onrender.com`).
3. Push to `main` (or go to the **Actions** tab and manually run
   "Deploy client to GitHub Pages"). The workflow builds the client
   with the correct subpath (`/repo-name/`, computed automatically)
   and publishes it.
4. Your game is live at `https://username.github.io/repo-name/`.

### 3. Close the loop

If you set `CLIENT_ORIGIN` on the server before knowing the exact
Pages URL, go back and update it now to match step 4 exactly
(protocol + host, no trailing slash) - a mismatch here is the single
most common cause of "it works locally but not when deployed"
(Socket.io's CORS check will silently reject the connection).

### Redeploying after changes

The GitHub Actions workflow re-runs automatically on every push to
`main` that touches `packages/client/` or `packages/shared/`. The
server needs a separate redeploy through whichever host you chose
(Render/Railway/Fly all auto-redeploy on push by default once
connected to the repo).

## Roadmap

1. ✅ Monorepo scaffold + shared types
2. ✅ Room lifecycle (create/join, in-memory `RoomManager`)
3. ✅ Maze rendering with Phaser (static, no programming yet)
4. ✅ Blockly editor + custom step-by-step interpreter (sequencing only)
5. ✅ Race mechanics (simultaneous execution, win detection, leaderboard)
6. ✅ Teacher dashboard live view
7. ✅ Progressive block unlocking (loops, conditionals - variables/functions deferred)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
