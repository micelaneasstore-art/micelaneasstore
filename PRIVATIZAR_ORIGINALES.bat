@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ===============================================
echo  MicelaneasStore - privatizar originales
echo ===============================================
echo.
echo IMPORTANTE: ejecuta esto SOLO despues de que SUBIR_ORIGINALES_BLOB.bat termine correctamente.
echo.
echo Se moveran:
echo   img\tradicional  ^> originales-privados\tradicional
echo   img\animada      ^> originales-privados\animada
echo   img\gorditos     ^> originales-privados\gorditos
echo.
echo img\preview NO se modifica.
echo.
pause
node scripts\privatizar-originales.mjs
pause
