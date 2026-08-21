@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ==========================================================
echo  MicelaneasStore - subir originales a Blob PRIVADO (V5.1)
echo ==========================================================
echo.
echo Esta version NO vincula el proyecto con Vercel CLI.
echo Usara directamente el BLOB_READ_WRITE_TOKEN de tu Blob privado.
echo.
echo IMPORTANTE:
echo - No pegues el token en ChatGPT.
echo - Copialo desde Vercel y pegalo SOLO en la ventana local que se abrira.
echo.
pause

call npm install
if errorlevel 1 goto :error

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\subir-originales-blob-local.ps1"
if errorlevel 1 goto :error

echo.
echo ==========================================================
echo  TODO SALIO BIEN
echo ==========================================================
echo.
echo Las 3 colecciones ya quedaron en Blob privado.
echo NO ejecutes PRIVATIZAR_ORIGINALES.bat hasta verificar
echo primero en Vercel ^> Storage ^> Manage Blobs.
echo.
pause
exit /b 0

:error
echo.
echo Ocurrio un error.
echo NO privatices ni borres las imagenes.
echo.
pause
exit /b 1
