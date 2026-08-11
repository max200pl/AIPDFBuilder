@echo off
setlocal
set CONFIG=%1
if "%CONFIG%"=="" set CONFIG=Debug

"%~dp0bin\x64\%CONFIG%\sciterjs-windows.exe"
