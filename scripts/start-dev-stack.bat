@echo off
REM Lance la stack dev complete (3 fenetres : Postgres, API, Front)
REM Usage : double-clic ou  scripts\start-dev-stack.bat

cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev-stack.ps1"
if errorlevel 1 pause
