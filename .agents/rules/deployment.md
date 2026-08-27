# Homelab Deployment Rule for Tiglev Elementfabrik Intranet

Whenever changes, features, or fixes are implemented and verified for the Tiglev Elementfabrik intranet, automatically deploy them directly to the homelab server following these specifications:

## 🖥️ Server Details
- **Host**: `192.168.1.29`
- **User**: `admin-server` (`admin-server@192.168.1.29`)
- **Project Path on Server**: `~/intranet-server/`

## ⚙️ Deployment Instructions
1. **Commit & Push**: Push latest code changes to `origin/main` (`github.com/tinglevki-gif/intranet.git`).
2. **Execute Deployment on Server**:
   ```bash
   ssh admin-server@192.168.1.29 "cd ~/intranet-server/ && git pull origin main && sudo docker compose up -d --build"
   ```
3. **CRITICAL Database Safety Rule**:
   - **NEVER** use `-v` or `--volumes` when restarting or taking down containers (e.g. `docker compose down -v` is strictly forbidden).
   - Preserves all persistent data in PostgreSQL, uploaded documents, avatars, and configuration.
