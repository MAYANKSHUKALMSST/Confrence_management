@echo off
color 0A
title Update Local Domain Mapping

set "host_file=%windir%\System32\drivers\etc\hosts"
set "entry=10.30.71.50 conferencebooking.tp-link.com"

echo Checking for Administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo -------------------------------------------------------------
    echo ERROR: Administrator permissions are required!
    echo.
    echo Please close this window, RIGHT-CLICK the 'add-local-domain.bat'
    echo file, and select "Run as Administrator".
    echo -------------------------------------------------------------
    pause
    exit /b 1
)

echo.
echo Administrator permissions confirmed.
echo Checking if the domain is already mapped...

findstr /C:"conferencebooking.tp-link.com" "%host_file%" >nul
if %errorLevel% == 0 (
    echo.
    echo [OK] The domain is already mapped in your hosts file! No changes needed.
) else (
    echo Adding domain mapping to hosts file...
    echo.>>"%host_file%"
    echo %entry%>>"%host_file%"
    echo.
    echo [SUCCESS] Domain mapping added!
)

echo.
echo Flushing DNS cache so your browser recognizes it immediately...
ipconfig /flushdns >nul

echo.
echo -------------------------------------------------------------
echo All done! You can now visit: http://conferencebooking.tp-link.com
echo You can close this window.
echo -------------------------------------------------------------
pause
