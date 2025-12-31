@echo off
echo IskuXidh Git Push Script
echo -----------------------
echo.

:: Check if git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git lagama helin Computer-kaga (Git is not installed or not in PATH).
    echo Fadlan hubi inaad Git soo dejisay: https://git-scm.com/
    echo Markaad rakibto, dib u fur faylkan.
    pause
    exit /b
)

:: Initialize git if not already
if not exist .git (
    echo Initializing Git...
    git init
)

git add .
git commit -m "Update IskuXidh Project"
git branch -M main

:: Handle remote (remove if exists and re-add to avoid error)
git remote remove origin >nul 2>nul
git remote add origin https://github.com/cabdirisaqtimo-del/iskuxidh.git

echo.
echo Isku dayaya inaan GitHub u diro (Pushing to GitHub)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Wax baa khaldamay. Tani caadiyan waxay u dhacdaa:
    echo 1. Password-ka ama Token-ka GitHub oo u baahan in la geliyo.
    echo 2. Repository-ga GitHub oo aan weli laga abuurin account-kaaga.
)

pause
