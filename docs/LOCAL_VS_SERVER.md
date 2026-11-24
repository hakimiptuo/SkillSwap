# Development and classroom deployment

| Environment | Configuration | Access |
| --- | --- | --- |
| Windows development | Docker Desktop with WSL 2, `compose.yaml`, and a private `.env` based on `.env.example`. | Browser at `http://localhost:3000`. Optional MySQL client at `127.0.0.1:3307`. |
| Ubuntu classroom VM | Oracle VirtualBox, Docker Engine, `compose.production.yaml`, `Dockerfile.production`, and a private `.env.production` based on `.env.production.example`. | Windows browser at `http://127.0.0.1:3002` through SSH on VirtualBox host port `2222`. The application listens on Ubuntu loopback port `3001`; MySQL stays on the Docker network. |

The [README](../README.md) records the verified classroom environment and explains setup, SSH tunnelling, and fresh demo seeding. Both environments store MySQL data in named Docker volumes.
