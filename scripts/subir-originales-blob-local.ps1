$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MicelaneasStore - credencial local para Blob privado" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "En Vercel abre:"
Write-Host "Storage > micelaneasstore-blob > Getting Started > .env.local"
Write-Host ""
Write-Host "Copia SOLO el valor de BLOB_READ_WRITE_TOKEN."
Write-Host "No lo compartas por chat."
Write-Host ""

$secure = Read-Host "Pega aqui el BLOB_READ_WRITE_TOKEN" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "No se recibio ningun token."
    }

    # Si el usuario copia accidentalmente la linea completa:
    if ($token.StartsWith("BLOB_READ_WRITE_TOKEN=")) {
        $token = $token.Substring("BLOB_READ_WRITE_TOKEN=".Length).Trim()
    }

    $token = $token.Trim().Trim('"').Trim("'")

    if ($token.Length -lt 20) {
        throw "El token parece incompleto."
    }

    $env:BLOB_READ_WRITE_TOKEN = $token

    Write-Host ""
    Write-Host "Token recibido. Iniciando subida..." -ForegroundColor Green
    Write-Host ""

    & node "$PSScriptRoot\subir-originales-blob.mjs"

    if ($LASTEXITCODE -ne 0) {
        throw "El script de subida termino con codigo $LASTEXITCODE."
    }
}
finally {
    $env:BLOB_READ_WRITE_TOKEN = $null

    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    $token = $null
}

Write-Host ""
Write-Host "Subida terminada correctamente." -ForegroundColor Green
