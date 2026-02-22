# CoolHub

A modern web dashboard and CLI for controlling [CoolMasterNet](https://coolautomation.com/products/coolmasternet/) HVAC systems over your local network.

![Dashboard](docs/dashboard.png)

![Settings](docs/settings.png)

## Features

- **Real-time dashboard** -- see all your HVAC units at a glance with live temperature, mode, and status updates via WebSocket
- **Full unit control** -- power on/off, mode (cool/heat/dry/fan/auto), target temperature, fan speed, and swing
- **Room grouping** -- organize units into rooms or zones with bulk power controls
- **Scheduling** -- create cron-based automations (e.g. "Weekdays 6am: heat bedroom to 22C")
- **Temperature history** -- track and chart temperature trends over time
- **Filter & error alerts** -- see which units need filter cleaning or have error codes
- **Custom naming** -- give friendly names to your units (e.g. L1.100 = "Lounge room")
- **CLI tool** -- control units from the terminal
- **Mobile friendly** -- responsive layout with bottom tab navigation for phones

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10 or later (`npm install -g pnpm`)
- A **CoolMasterNet** device on your local network

## Quick Start

```bash
# Clone the repo
git clone git@github.com:dougrathbone/coolhub.git
cd coolhub

# Install dependencies
pnpm install

# Configure your CoolMasterNet IP
cp .env.example .env
# Edit .env and set COOLMASTER_HOST to your device's IP address

# Build everything
pnpm build

# Start the server (serves both API and web UI)
pnpm start
```

Then open http://localhost:3000 in your browser.

## Development

```bash
# Run both the API server and Vite dev server with hot reload
pnpm dev
```

This starts:
- **Vite dev server** at http://localhost:5173 (with API proxy to the backend)
- **Fastify API server** at http://localhost:3000

## Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and edit:

| Variable | Default | Description |
|---|---|---|
| `COOLMASTER_HOST` | `192.168.1.100` | CoolMasterNet device IP address |
| `COOLMASTER_PORT` | `10102` | CoolMasterNet ASCII interface port |
| `COOLMASTER_SWING` | `false` | Enable swing/louvre control queries |
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | HTTP server bind address |
| `POLL_INTERVAL_MS` | `10000` | How often to poll unit status (ms) |
| `HISTORY_INTERVAL_MS` | `300000` | How often to record temperature history (ms) |
| `DB_PATH` | `./coolhub.db` | SQLite database file path |

## CLI Usage

```bash
# Show status of all units
pnpm cli status

# Show a single unit
pnpm cli status L1.100

# Turn a unit on/off
pnpm cli on L1.100
pnpm cli off L1.100

# Set temperature, mode, and fan speed
pnpm cli set L1.100 --temp 22 --mode cool --fan med

# Show CoolMasterNet bridge info
pnpm cli info

# Test connectivity
pnpm cli ping
```

Pass `--host` and `--port` to target a specific CoolMasterNet device:

```bash
pnpm cli --host 192.168.0.23 --port 10102 status
```

## Project Structure

```
packages/
  client/     @coolhub/client  - CoolMasterNet TCP client library
  server/     @coolhub/server  - Fastify API server + WebSocket + SQLite
  web/        @coolhub/web     - React + Vite + Tailwind CSS frontend
  cli/        @coolhub/cli     - Command-line interface
```

## License

MIT
