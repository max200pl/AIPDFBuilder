@echo off
setlocal
set CONFIG=%1
if "%CONFIG%"=="" set CONFIG=Debug

"%~dp0builds\%CONFIG%\AIPDFBuilder.exe"
