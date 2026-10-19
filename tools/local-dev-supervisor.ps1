param(
    [string]$ProjectPath = 'D:\xampp\htdocs\laravel_react'
)

$ErrorActionPreference = 'Stop'
$xamppPath = Split-Path -Parent (Split-Path -Parent $ProjectPath)
$phpPath = Join-Path $xamppPath 'php\php.exe'
$mysqlStartPath = Join-Path $xamppPath 'mysql_start.bat'
$npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source
$logPath = Join-Path $ProjectPath 'storage\logs\local-dev'
$supervisorLog = Join-Path $logPath 'supervisor.log'
$mutex = [Threading.Mutex]::new($false, 'Local\LaravelReactLocalDevSupervisor')

if (-not $mutex.WaitOne(0, $false)) {
    exit 0
}

New-Item -ItemType Directory -Force -Path $logPath | Out-Null

function Write-SupervisorLog([string]$Message) {
    Add-Content -LiteralPath $supervisorLog -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
}

function Test-Port([int]$Port) {
    $client = [Net.Sockets.TcpClient]::new()
    try {
        $result = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne(800)) { return $false }
        $client.EndConnect($result)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Start-LoggedProcess(
    [string]$Name,
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$StdoutFile,
    [string]$StderrFile
) {
    Write-SupervisorLog "Starting $Name"
    Start-Process -FilePath $FilePath -ArgumentList $ArgumentList `
        -WorkingDirectory $ProjectPath -WindowStyle Hidden `
        -RedirectStandardOutput $StdoutFile -RedirectStandardError $StderrFile | Out-Null
}

try {
    Write-SupervisorLog 'Supervisor started.'
    $mysqlLastAttempt = [datetime]::MinValue
    $laravelLastAttempt = [datetime]::MinValue
    $viteLastAttempt = [datetime]::MinValue

    while ($true) {
        $now = Get-Date

        if (-not (Test-Port 3306) -and ($now - $mysqlLastAttempt).TotalSeconds -ge 30) {
            $mysqlLastAttempt = $now
            Write-SupervisorLog 'MySQL is not listening on 3306; starting XAMPP MySQL.'
            Start-Process -FilePath $mysqlStartPath -WorkingDirectory $xamppPath -WindowStyle Hidden | Out-Null
        }

        if (-not (Test-Port 8001) -and ($now - $laravelLastAttempt).TotalSeconds -ge 10) {
            $laravelLastAttempt = $now
            Start-LoggedProcess 'Laravel' $phpPath `
                @('artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload') `
                (Join-Path $logPath 'laravel.out.log') (Join-Path $logPath 'laravel.err.log')
        }

        if (-not (Test-Port 5173) -and ($now - $viteLastAttempt).TotalSeconds -ge 10) {
            $viteLastAttempt = $now
            Start-LoggedProcess 'Vite' $npmPath `
                @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort') `
                (Join-Path $logPath 'vite.out.log') (Join-Path $logPath 'vite.err.log')
        }

        Start-Sleep -Seconds 5
    }
} catch {
    Write-SupervisorLog "Supervisor stopped: $($_.Exception.Message)"
    throw
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
