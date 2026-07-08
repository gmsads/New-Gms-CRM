@echo off
title GMS Frontend Server  
echo ========================================
echo   GMS CRM - Starting Frontend
echo ========================================
echo.
cd /d c:\Users\prade\Desktop\gms\frontend
echo Starting frontend on http://localhost:5173
echo Press CTRL+C to stop
echo.
npm run dev
pause
