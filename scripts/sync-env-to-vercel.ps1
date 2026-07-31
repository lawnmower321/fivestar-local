# Uploads the four required env vars from .env.local to the linked Vercel
# project (production, preview, development). Values are never printed.
$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) { throw ".env.local not found at $envFile" }

$wanted = @("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "OPENROUTER_API_KEY")
$lines = Get-Content $envFile

foreach ($name in $wanted) {
    $line = $lines | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if (-not $line) { Write-Host "SKIP  $name (not found in .env.local)"; continue }
    $value = ($line -replace "^$name=", "").Trim().Trim('"')
    foreach ($target in @("production", "preview", "development")) {
        $value | vercel env add $name $target --force --scope lawnmower321s-projects 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Host "OK    $name -> $target" }
        else { Write-Host "FAIL  $name -> $target" }
    }
}
Write-Host ""
Write-Host "Done. Current variables on Vercel:"
vercel env ls --scope lawnmower321s-projects
