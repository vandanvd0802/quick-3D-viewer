@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\vite\bin\vite.js" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

rem Reuse the viewer if it is already running; a second Vite process may choose another port.
powershell -NoProfile -Command "try { Invoke-WebRequest 'http://127.0.0.1:5173/api/models' -TimeoutSec 1 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto open_viewer

start "Quick 3D Viewer" /D "%~dp0" cmd /k "npm run dev -- --host 127.0.0.1 --strictPort"

rem Wait until the library API is ready before opening the browser.
for /L %%I in (1,1,60) do (
  powershell -NoProfile -Command "try { Invoke-WebRequest 'http://127.0.0.1:5173/api/models' -TimeoutSec 1 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 goto open_viewer
  timeout /t 1 /nobreak >nul
)
echo The viewer server did not become ready. Check the server window for an error.
pause
exit /b 1

:open_viewer
start "" "http://127.0.0.1:5173/"
