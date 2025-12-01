@echo off
echo Setting up PhishHunt Database...
echo.

echo Please enter your MySQL root password when prompted:
mysql -u root -p < server\database\schema.sql

echo.
echo Database setup complete!
echo You can now run: npm run dev
pause


