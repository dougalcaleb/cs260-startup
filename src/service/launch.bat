@echo off
setlocal
set "AWS_PROFILE=cs260-startup"
set "AWS_REGION=us-east-1"
node --inspect .\index.js
endlocal