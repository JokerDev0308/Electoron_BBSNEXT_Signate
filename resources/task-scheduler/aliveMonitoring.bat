@echo off

set process_name=%1
set exePath=%2
set timeSpan=30

@REM Change the character encoding to Unicode.
chcp 65001

:loop

timeout /nobreak %timeSpan%

@REM Searches for process names.
tasklist | find /i "%process_name%"

if %ERRORLEVEL% equ 0 (
  echo %process_name% Running.
) Else (
  start "" %exePath%
)

goto loop

exit 0
