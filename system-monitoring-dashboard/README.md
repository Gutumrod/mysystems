# Retro System Monitoring Dashboard

Retro arcade-style monitoring dashboard for a home PC running local AI and n8n.

## Modes

### Local mode

Runs the dashboard and Express/WebSocket API directly on the PC.

```powershell
npm run remote
```

Open:

```text
http://localhost:3000
```

### Cloud mode

Designed for:

- GitHub Pages hosting the dashboard
- Google Cloud Firestore storing status and power commands
- A local agent running on the home PC

Run the home PC agent:

```powershell
npm run agent
```

See `CLOUD_DEPLOYMENT.md` for setup.

## Remote Power

The dashboard supports:

- Hibernate PC
- Shutdown PC

No process kill controls are included. The agent only accepts `hibernate` and `shutdown` commands after checking `POWER_CONTROL_PIN`.
