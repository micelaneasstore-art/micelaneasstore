@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ==========================================================
echo  MicelaneasStore - generar previews con marca de agua
echo ==========================================================
echo.
echo Este proceso:
echo - Lee los PNG de originales-privados
echo - Genera previews WebP de 600 x 900 px
echo - Agrega la marca diagonal MICELANEASSTORE
echo - Reemplaza las imagenes de img\preview
echo.
echo NO modifica los originales privados.
echo.
pause

call npm install sharp
if errorlevel 1 goto :error

node "%~dp0scripts\generar-previews-marca-agua.mjs"
if errorlevel 1 goto :error

echo.
echo ==========================================================
echo  TODO SALIO BIEN
echo ==========================================================
echo.
echo Las 594 vistas previas fueron actualizadas.
echo Revisa img\preview antes de hacer Commit y Push.
echo.
pause
exit /b 0

:error
echo.
echo Ocurrio un error.
echo No se modificaron los originales privados.
echo.
pause
exit /b 1
