@echo off
cd /d "%~dp0"
echo Starting Retro System Monitor for remote access...
echo.
echo Web dashboard: http://localhost:3000
echo API health:     http://localhost:4000/api/stats
echo.
npm run remote
pause
