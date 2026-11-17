@echo off
title Flavours Food Court - Backend
cd /d "%~dp0flavours-foodcourt\backend"
echo ========================================================
echo  Starting Flavours Food Court Backend (Spring Boot)
echo  Running on http://localhost:8080
echo ========================================================
call .\mvnw.cmd spring-boot:run
pause

