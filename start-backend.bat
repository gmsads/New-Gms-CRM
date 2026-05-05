@echo off
title MongoDB Diagnostic + Fix
color 0E
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   GMS - MongoDB Diagnostic Tool             ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Check if mongod is in PATH
echo [1] Checking if mongod is in PATH...
where mongod >nul 2>&1
if %errorlevel% == 0 (
    echo     FOUND in PATH!
    goto :found_mongod
)

:: Check common install locations
echo     Not in PATH. Checking common locations...
echo.

set MONGOD_PATH=

for %%v in (8.0 7.0 6.0 5.0 4.4) do (
    if exist "C:\Program Files\MongoDB\Server\%%v\bin\mongod.exe" (
        set MONGOD_PATH=C:\Program Files\MongoDB\Server\%%v\bin\mongod.exe
        echo     FOUND: C:\Program Files\MongoDB\Server\%%v\bin\mongod.exe
        goto :found_path
    )
)

:: Not found anywhere
echo.
echo  ════════════════════════════════════════════════
echo   MongoDB is NOT installed on this computer!
echo  ════════════════════════════════════════════════
echo.
echo   You need to install MongoDB Community Server.
echo.
echo   1. Open this URL in your browser:
echo      https://www.mongodb.com/try/download/community
echo.
echo   2. Download: MongoDB 7.0 Community - Windows x64
echo.
echo   3. During install, CHECK "Install MongoDB as a Service"
echo.
echo   4. After install, close this window and run
echo      start-backend.bat again
echo.
echo  ════════════════════════════════════════════════
echo.
start "" "https://www.mongodb.com/try/download/community"
pause
exit /b 1

:found_path
echo.
echo [2] Starting mongod from: %MONGOD_PATH%
if not exist "C:\data\db" (
    echo     Creating data directory C:\data\db...
    mkdir "C:\data\db"
)
start "MongoDB" /MIN "%MONGOD_PATH%" --dbpath "C:\data\db" --quiet
echo     MongoDB started! Waiting 4 seconds...
timeout /t 4 /nobreak >nul
goto :check_running

:found_mongod
echo.
echo [2] Starting mongod...
if not exist "C:\data\db" mkdir "C:\data\db"
start "MongoDB" /MIN mongod --dbpath "C:\data\db" --quiet
echo     MongoDB started! Waiting 4 seconds...
timeout /t 4 /nobreak >nul

:check_running
echo.
echo [3] Verifying MongoDB is accepting connections...
:: Try to connect
powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 27017); $c.Close(); Write-Host '    MongoDB is UP on port 27017!' } catch { Write-Host '    STILL NOT READY - try waiting 10 more seconds' }" 2>nul

echo.
echo [4] Now starting GMS Backend...
echo.
cd /d c:\Users\prade\Desktop\gms\backend
npm run dev
pause
