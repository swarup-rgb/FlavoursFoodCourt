@echo off
title Flavours Food Court - Launcher
echo ========================================================
echo  Launching Flavours Food Court (Backend + Frontend)
echo ========================================================
start "Flavours Backend" cmd /c "%~dp0run-backend.bat"
start "Flavours Frontend" cmd /c "%~dp0run-frontend.bat"
echo Services are starting in separate terminal windows.

