@echo off
title Flavours Food Court - Frontend
cd /d "%~dp0flavours-foodcourt\frontend"
echo ========================================================
echo  Starting Flavours Food Court Frontend (Vite React)
echo  Running on http://localhost:5173
echo ========================================================
call npm run dev
pause

