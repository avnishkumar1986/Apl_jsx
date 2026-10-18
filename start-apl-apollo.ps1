$ErrorActionPreference = 'SilentlyContinue'

$projectPath = 'D:\xampp\htdocs\laravel_react'
$phpPath = 'D:\xampp\php\php.exe'
$artisanPath = Join-Path $projectPath 'artisan'
$mysqlStartPath = 'D:\xampp\mysql_start.bat'
$hotFile = Join-Path $projectPath 'public\hot'
$logDirectory = Join-Path $projectPath 'storage\logs'
$serverLog = Join-Path $logDirectory 'laravel-server.log'
$serverErrorLog = Join-Path $logDirectory 'laravel-server-error.log'
$queueLog = Join-Path $logDirectory 'queue-worker.log'
$queueErrorLog = Join-Path $logDirectory 'queue-worker-error.log'
$mutex = New-Object System.Threading.Mutex($false, 'Local\AplApolloLaravelSupervisor')

if (-not $mutex.WaitOne(0, $false)) {
    exit 0
}

try {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

    while ($true) {
        $mysqlListening = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue

        if (-not $mysqlListening -and (Test-Path $mysqlStartPath)) {
            Start-Process -FilePath $mysqlStartPath -WindowStyle Hidden
            Start-Sleep -Seconds 5
        }

        if (Test-Path $hotFile) {
            Remove-Item -LiteralPath $hotFile -Force
        }

        $laravelListening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue

        if (-not $laravelListening -and (Test-Path $phpPath)) {
            Start-Process `
                -FilePath $phpPath `
                -ArgumentList @('artisan', 'serve', '--host=127.0.0.1', '--port=8000') `
                -WorkingDirectory $projectPath `
                -WindowStyle Hidden `
                -RedirectStandardOutput $serverLog `
                -RedirectStandardError $serverErrorLog

            Start-Sleep -Seconds 3
        }

        $queueWorker = Get-CimInstance Win32_Process -Filter "Name = 'php.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like "*$artisanPath*queue:work*" }

        if (-not $queueWorker -and (Test-Path $phpPath)) {
            Start-Process `
                -FilePath $phpPath `
                -ArgumentList @($artisanPath, 'queue:work', 'database', '--queue=default', '--sleep=3', '--tries=1', '--timeout=300') `
                -WorkingDirectory $projectPath `
                -WindowStyle Hidden `
                -RedirectStandardOutput $queueLog `
                -RedirectStandardError $queueErrorLog
        }

        Start-Sleep -Seconds 15
    }
}
finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
