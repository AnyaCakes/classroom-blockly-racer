# Classroom Blockly Racer

A multiplayer classroom game that teaches programming logic through a
visual, block-based coding interface. Students race identical mazes
by programming a robot with Blockly; first to the goal wins.

## Status

**Milestone 6 of 8** — teacher dashboard live view. The teacher gets
a dedicated screen while racing (no longer the student's Blockly
workspace) showing: the room code, active maze name, a live elapsed
timer, **one shared maze with every connected student's robot moving
on it in real time** (color-matched to each student's pick), and a
leaderboard listing every student - finishers ranked by time,
everyone else shown as "Unfinished" rather than omitted. Disconnected
students' robots dim in place rather than disappearing. The teacher
can remove a student mid-race (same action as the lobby) and end the
race back to the lobby, same as before.

This is the first consumer of `race:progress`/`race:opponentProgress`
(wired since Milestone 5). One correctness fix made along the way:
that relay previously identified students by their socket id, which
changes on every reconnect - reused as a robot-map key, that would
have spawned a duplicate robot for anyone who reconnected mid-race.
It's now keyed by each student's stable `clientId` instead, matching
how the rest of the app already identifies players. Race-start timing
also moved from a server-internal map to a real field on `Room`
(`raceStartedAt`), so the dashboard's elapsed timer is exact without
extra plumbing.

Students' own view is unchanged - they still don't see opponents'
robots, by design (see the earlier decision to keep that exclusively
on the teacher's dashboard).

**Since deployment:** fixed a real bug found during cross-device
testing - a reconnected student's socket came back fine at the
transport level, but nothing told the server which `Player` record
the new socket belonged to (the teacher had this via
`room:rejoinTeacher`; students never had an equivalent). They'd sit
shown as "disconnected" in the roster until the 30s grace period
expired and removed them, even though they were actually back online.
Fixed by giving students the same silent auto-rejoin the teacher
already had, reusing `room:join` (see `useRoom.ts` - `RoomManager`
already treated a matching `clientId` as a reconnect, the client just
never told it to).

**Earlier milestones, condensed:** race mechanics with
server-authoritative timing and a Practice Grid for finished students
(5) → Blockly editor and interpreter, with a real 1.5s shake penalty
on wall collisions that doesn't stop execution, plus Reset
Sprite/Clear Work Area as independent controls (4) → Phaser maze
rendering (3) → room lifecycle with reconnection handling (2) →
monorepo scaffold (1). Full detail in each milestone's commit
history.

Students still pick a placeholder-colored robot when joining - the
same color now also identifies them on the teacher's shared dashboard
view.

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

## Testing Milestone 6

Same three-tab setup as before: one teacher, two students.

1. **Tab 1 (teacher)**: create a room. **Tabs 2 & 3 (students)**:
   join with different nicknames and *different* colors (important -
   you're about to visually distinguish them on one shared board).
2. **Tab 1**: pick a maze, start the race.
3. Tab 1 should now show the **dashboard**, not a Blockly workspace:
   room code, maze name, an elapsed timer ticking up from `0:00`,
   one maze with two robots on it (each tinted the color that student
   picked), and a leaderboard listing both students as "Unfinished."
4. **Tabs 2 & 3**: build and run programs. As each moves/turns, watch
   **Tab 1** - the corresponding robot on the teacher's shared maze
   should move/turn live, matching what's happening on that student's
   own screen (small network delay is expected and fine).
5. **Wall collision, watched live**: have one student walk into a
   wall. On Tab 1, that robot should give a quick visual bump - it
   does *not* need to replicate the student's full 1.5s pause exactly
   (the dashboard is a passive spectator view, not driving execution),
   just confirm something visibly happens rather than nothing.
6. **A student finishes**: confirm on Tab 1 that student's entry in
   the leaderboard panel updates from "Unfinished" to a real time,
   live, without refreshing.
7. **Disconnect a student** (devtools Network → Offline on Tab 2 or
   3): within a few seconds, that student's robot on Tab 1's shared
   maze should visibly dim (not disappear). Reconnect - it should
   brighten back to full opacity. This is the same clientId-based
   identity fix that made student roster reconnection work; confirm
   it also means **the robot doesn't duplicate** on reconnect - you
   should still see exactly one robot per student throughout.
8. **Remove a student**: click Remove next to a student's row on
   Tab 1's leaderboard panel. Confirm the same behavior as the lobby's
   Remove button (that student's screen resets), and their robot/row
   disappears from the dashboard.
9. **End race, back to lobby**: click it on Tab 1. All tabs return to
   the lobby. Start a new race and confirm Tab 1 gets a completely
   fresh dashboard (elapsed timer back at `0:00`, both students back
   to "Unfinished," robots reset to the new maze's start position).
10. **Student view unaffected**: confirm Tabs 2 & 3 still look and
    behave exactly like Milestone 5 - Blockly workspace, Run/Reset
    Sprite/Clear Work Area, their own leaderboard panel, Practice Grid
    on finishing. Students still can't see opponents' robots - that
    remains dashboard-only, by design.

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
7. Progressive block unlocking (loops, conditionals, variables, functions)
8. Polish pass (animations, error messaging, responsive layout, replay)

## License

MIT — this project is intended to remain fully open source.
