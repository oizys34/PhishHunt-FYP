@echo off
echo Checking TypeScript compilation...
echo.

npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ TypeScript compilation successful!
    echo No type errors found.
) else (
    echo.
    echo ❌ TypeScript compilation failed!
    echo Please check the errors above.
)

echo.
pause


