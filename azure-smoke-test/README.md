# Azure Smoke Test

Minimal Node 22 Express application for verifying Azure App Service Linux deployment.

The deployed ZIP must contain only:

- `package.json`
- `server.js`

The app exposes `GET /` and returns:

```json
{ "status": "ok" }
```
