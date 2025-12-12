@echo off
setlocal enabledelayedexpansion

rem Usage: build.bat "C:\path\to\deploy"
if "%~1"=="" (
	echo Usage: build.bat "C:\path\to\deploy"
	exit /b 1
)

set "deployDir=%~1"
set "scriptDir=%~dp0"

echo ----^> Deploying build to %deployDir%

rem Step 1: Build the distribution package
echo ----^> Build the distribution package
if exist "%scriptDir%build" rmdir /s /q "%scriptDir%build"
mkdir "%scriptDir%build"

pushd "%scriptDir%parallel" || exit /b 1
for /f %%i in ('powershell -NoProfile -Command "[int][double]::Parse((Get-Date -AsUTC).ToUniversalTime().Subtract([datetime]'1970-01-01').TotalSeconds)"') do set VERSION_STAMP=%%i
echo export const VERSION_STAMP = %VERSION_STAMP%;> src\version.js

npm install
if errorlevel 1 goto :fail

npm run build
if errorlevel 1 goto :fail
popd

robocopy "%scriptDir%parallel\dist" "%scriptDir%build\public" /MIR >nul
if errorlevel 8 goto :fail

rem Step 2: Clear out previous distribution at target
echo ----^> Clearing out previous distribution at %deployDir%
if exist "%deployDir%" rmdir /s /q "%deployDir%"
mkdir "%deployDir%"

rem Step 3: Copy the distribution package to the target
echo ----^> Copy the distribution package to %deployDir%
robocopy "%scriptDir%build" "%deployDir%" /MIR
if errorlevel 8 goto :fail

rem Step 4: Remove local copy of the distribution package
echo ----^> Removing local copy of the distribution package
if exist "%scriptDir%build" rmdir /s /q "%scriptDir%build"
if exist "%scriptDir%parallel\dist" rmdir /s /q "%scriptDir%parallel\dist"
echo export const VERSION_STAMP = "DEV";> "%scriptDir%parallel\src\version.js"

echo ----^> Done
exit /b 0

:fail
echo Build failed. Aborting.
popd >nul 2>&1
exit /b 1
