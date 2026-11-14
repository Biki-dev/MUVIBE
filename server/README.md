# Blitz socket server

Socket.IO server behind Blitz Battle's private rooms. A room lives in
memory for the length of a bout and disappears when the last player
leaves, so there is nothing to migrate and no database to configure.

## Run it

```bash
cd server
npm install
npm start
```

It listens on port 3001. `GET /health` reports room and player counts,
so you can check it is up without a socket client:

```bash
curl http://localhost:3001/health
```

The app reads `EXPO_PUBLIC_SOCKET_URL` (see `.env.example`). It
defaults to `http://localhost:3001`, which works for the web preview.
A phone cannot reach your laptop on `localhost`, so set that variable
to the machine's LAN address before testing on a device.

## Protocol

Client to server:

| Event          | Payload              | Notes                          |
| -------------- | -------------------- | ------------------------------ |
| `room:create`  | `{ player }`         | acks `{ ok, code, state }`     |
| `room:join`    | `{ code, player }`   | acks `{ ok, state }` or error  |
| `room:start`   | `{ mode }`           | host only, needs 2+ players    |
| `score:update` | `{ score, finished }`| throttled to 1/s by the client |
| `room:leave`   | none                 | disconnect does this too       |

Server to client:

| Event          | Payload                  | When                        |
| -------------- | ------------------------ | --------------------------- |
| `room:state`   | full room state          | after any membership change |
| `room:started` | `{ mode, startedAt }`    | host started the bout       |
| `score:state`  | `{ players }`            | any player's score moved    |

`startedAt` is an epoch timestamp a second in the future, so both
phones count down from the same instant rather than from whenever
their own message arrived.

The server trusts nothing a client sends: names are truncated, Elo is
clamped, and a score that moves backwards is ignored as a late packet.
