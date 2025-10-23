@echo off
setlocal
set "AWS_PROFILE=cs260-startup"
node --inspect .\index.js
endlocal