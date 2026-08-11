@echo off
setlocal
set CONFIG=%1
if "%CONFIG%"=="" set CONFIG=Debug

set MSBUILD="C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"
if not exist %MSBUILD% set MSBUILD=MSBuild.exe

%MSBUILD% "%~dp0AIPDFBuilder.sln" /p:Configuration=%CONFIG% /p:Platform=x64 /m
