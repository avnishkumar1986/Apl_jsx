$ErrorActionPreference = 'Stop'

$projectPath = 'D:\xampp\htdocs\laravel_react'
$phpPath = 'D:\xampp\php\php.exe'
$port = 8001
$logDirectory = Join-Path $projectPath 'storage\logs'
$outputLog = Join-Path $logDirectory 'local-server.log'
$errorLog = Join-Path $logDirectory 'local-server-error.log'

$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    exit 0
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

Start-Process `
    -FilePath $phpPath `
    -ArgumentList @('artisan', 'serve', '--host=127.0.0.1', "--port=$port", '--no-reload') `
    -WorkingDirectory $projectPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outputLog `
    -RedirectStandardError $errorLog
