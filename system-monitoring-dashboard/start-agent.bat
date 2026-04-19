@echo off
cd /d "%~dp0"
echo Starting Retro System Monitor local cloud agent...
echo.
echo This sends status to Google Cloud Firestore and listens for power commands.
echo.
npm run agent
pause
