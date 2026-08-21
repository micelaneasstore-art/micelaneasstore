@echo off
title MicelaneasStore - Generar previews protegidos
cd /d "%~dp0"

echo.
echo ============================================
echo   MICELANEASSTORE - PREVIEWS PROTEGIDOS
echo ============================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo No se encontro Python instalado.
    echo Instala Python desde python.org y marca "Add Python to PATH".
    pause
    exit /b 1
)

python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo Instalando Pillow...
    python -m pip install pillow
)

echo.
python generar_previews.py

echo.
pause
