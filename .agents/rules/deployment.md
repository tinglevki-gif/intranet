# Homelab Deployment Rule for Tiglev Elementfabrik Intranet

Whenever changes, features, or fixes are implemented, build and deploy them exclusively and directly to the **Homelab Server**:

## 🖥️ Server Details & URLs
- **Host**: `192.168.1.29`
- **User**: `admin-server` (`admin-server@192.168.1.29`)
- **Project Path on Server**: `~/intranet-server/`
- **Application URL**: `http://192.168.1.29`

## ⚙️ Deployment Instructions
1. Automatically deploy changes using `powershell -ExecutionPolicy Bypass -File .\deploy_homelab.ps1 -CommitMessage "..."`.
2. Do not refer to `localhost` or alternative environments in responses—all user verification and links must point directly to the live Homelab instance at `http://192.168.1.29`.

## 🛡️ Database Safety Rule
- **NEVER** use `-v` or `--volumes` when taking down or restarting containers on the Homelab server (e.g. `docker compose down -v` is strictly forbidden).
- Preserves all persistent data in PostgreSQL, uploaded documents, avatars, and configuration.
