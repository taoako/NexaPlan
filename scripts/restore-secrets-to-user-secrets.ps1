<#
Restores secrets from the local `secrets-backup/appsettings.recovered.json` file
into DotNet user-secrets for the `NexaPlan.API` project.

USAGE: run this locally on your machine (PowerShell)
  1) Inspect secrets-backup/appsettings.recovered.json manually before running.
  2) From the repo root run: `pwsh .\scripts\restore-secrets-to-user-secrets.ps1`

SECURITY: This script WILL set secrets on your machine only (user-secrets). It
does NOT commit or push any secret values. Do NOT run on CI or in an environment
where others can read your shell history unless you understand the implications.
#>

Param()

Set-StrictMode -Version Latest

$recoverFile = Join-Path -Path $PSScriptRoot -ChildPath "..\secrets-backup\appsettings.recovered.json"
if (-not (Test-Path $recoverFile)) {
    Write-Error "Recovered secrets file not found: $recoverFile`nPlease create it from the backup branch before running this script."
    exit 1
}

Write-Host "Reading recovered secrets from $recoverFile" -ForegroundColor Yellow

$jsonRaw = Get-Content -Raw -Path $recoverFile
try { $cfg = $jsonRaw | ConvertFrom-Json } catch { Write-Error "Failed to parse JSON. Inspect the file manually."; exit 1 }

Push-Location -Path "NexaPlan.API"
try {
    # Ensure project has user-secrets initialized
    dotnet user-secrets init 2>$null | Out-Null

    # Helper: set secret if present in recovered file
    function Set-IfPresent($pathArray, $userSecretKey) {
        $node = $cfg
        foreach ($p in $pathArray) {
            if ($null -eq $node.$p) { return }
            $node = $node.$p
        }
        if ($null -ne $node -and $node -ne "") {
            $val = $node.ToString()
            Write-Host "Setting $userSecretKey (value hidden)" -ForegroundColor Green
            dotnet user-secrets set $userSecretKey $val
        }
    }

    Set-IfPresent @('ConnectionStrings','DefaultConnection') 'ConnectionStrings:DefaultConnection'
    Set-IfPresent @('Smtp','Password') 'Smtp:Password'
    Set-IfPresent @('PayMongo','SecretKey') 'PayMongo:SecretKey'
    Set-IfPresent @('PayMongo','WebhookSecret') 'PayMongo:WebhookSecret'

    Write-Host "Done. Secrets set in user-secrets for NexaPlan.API. Do NOT commit secrets-backup/appsettings.recovered.json." -ForegroundColor Cyan
} finally {
    Pop-Location
}
