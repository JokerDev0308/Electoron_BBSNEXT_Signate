@echo off
rem ------------------------------------------------
rem PowerShellスクリプト実行bat
rem 戻り値
rem ------------------------------------------------

set ARGS=%*

PowerShell -ExecutionPolicy RemoteSigned -File %ARGS%

exit /b %errorlevel%