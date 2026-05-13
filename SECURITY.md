**Secrets & Deployment Security**

- Never commit real credentials to git. Use `user-secrets` for local dev and
  environment variables for deployment (Azure Portal / Vercel / GitHub Actions).

Local recovery workflow (one-time, safe):

1. I created a local backup branch before the scrub called `before-secrets-scrub`.
   If you or I need to recover the original `appsettings.json`, extract it with:

```powershell
# from the repo root (Windows PowerShell)
mkdir secrets-backup
git show before-secrets-scrub:NexaPlan.API/appsettings.json > .\secrets-backup\appsettings.recovered.json
notepad .\secrets-backup\appsettings.recovered.json
```

2. Inspect `secrets-backup\appsettings.recovered.json` locally. DO NOT commit it.

3. Run the helper to migrate values to dotnet user-secrets (recommended):

```powershell
pwsh .\scripts\restore-secrets-to-user-secrets.ps1
```

4. After verifying the app runs locally with secrets in `user-secrets`, delete the
   recovered file:

```powershell
Remove-Item .\secrets-backup\appsettings.recovered.json
Remove-Item -Recurse .\secrets-backup
```

Deployment notes:
- Azure App Service: add connection strings and app settings under Configuration → Application settings. Use the exact JSON keys (e.g. `ConnectionStrings:DefaultConnection`, `PayMongo:SecretKey`).
- Vercel: add `VITE_API_BASE_URL` and other frontend envs in the Vercel project settings.

Post-scrub collaborator instructions:
- After history rewrite, collaborators must re-clone or reset:

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

If you want me to additionally add a `SECURITY.md` snippet to your README or set the Azure/Vercel envs for you, tell me which action to take.
