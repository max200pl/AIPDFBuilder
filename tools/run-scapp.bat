@echo off
rem Fast-iteration run: loads res\main.htm directly via the SDK's generic
rem scapp.exe host, no compilation needed. Use build.bat + run.bat for the
rem real compiled native host.
setlocal
set SCRIPT_DIR=%~dp0
if "%SCITER_SDK_ROOT%"=="" set SCITER_SDK_ROOT=%SCRIPT_DIR%..\..\sciter-js-sdk-main\sciter-js-sdk-main
"%SCITER_SDK_ROOT%\bin\windows\x64\scapp.exe" "%SCRIPT_DIR%..\res\main.htm"
