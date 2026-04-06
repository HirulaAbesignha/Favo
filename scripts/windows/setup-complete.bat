@echo off
setlocal
cd /d "%~dp0\..\.."

echo ========================================
echo FAVO - Complete Setup Script
echo ========================================
echo.
echo This will:
echo 1. Test MySQL connection
echo 2. Create database if needed
echo 3. Import schema
echo 4. Generate correct .env.local
echo.
pause

REM Step 1: Get MySQL password
set /p MYSQL_PASSWORD="Enter your MySQL root password (or press Enter for no password): "

REM Step 2: Test connection
echo.
echo Testing MySQL connection...
mysql -u root -p%MYSQL_PASSWORD% -e "SELECT 'Connection OK!' as status;" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Cannot connect to MySQL!
    echo Please check:
    echo 1. MySQL is running: net start MySQL80
    echo 2. Password is correct
    echo.
    pause
    exit /b 1
)

echo SUCCESS! MySQL connection works.
echo.

REM Step 3: Create database and import schema
echo Creating database and importing schema...
mysql -u root -p%MYSQL_PASSWORD% -e "DROP DATABASE IF EXISTS favo; CREATE DATABASE favo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR creating database!
    pause
    exit /b 1
)

echo Importing schema...
mysql -u root -p%MYSQL_PASSWORD% favo < database\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR importing schema!
    pause
    exit /b 1
)

echo Database setup complete!
echo.

REM Step 4: Create .env.local with correct password
if "%MYSQL_PASSWORD%"=="" (
    echo Creating .env.local with no password...
    (
        echo # Database Configuration
        echo DATABASE_URL=mysql://root:@localhost:3306/favo
        echo.
        echo # JWT Secret
        echo JWT_SECRET=favo-super-secret-jwt-key-development-2026-xyz123abc
        echo.
        echo # Application URL
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
) else (
    echo Creating .env.local with your password...
    (
        echo # Database Configuration
        echo DATABASE_URL=mysql://root:%MYSQL_PASSWORD%@localhost:3306/favo
        echo.
        echo # JWT Secret
        echo JWT_SECRET=favo-super-secret-jwt-key-development-2026-xyz123abc
        echo.
        echo # Application URL
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
)

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your server: npm run dev
echo 2. Visit: http://localhost:3000
echo 3. Register a new account
echo.
echo Your database is ready with sample products!
echo.
pause
