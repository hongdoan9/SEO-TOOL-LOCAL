@echo off
:: Chuyen thu muc lam viec ve dung thu muc chua file batch nay
cd /d "%~dp0"

:: Don dep cac tien trinh cu dang ket tren port 5000 (backend) va 5173 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5050') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do taskkill /f /pid %%a 2>nul

:: Khoi chay backend server cuc bo
start /b "" cmd /c "npm --prefix backend run dev"

:: Khoi chay frontend dev server cuc bo
start /b "" cmd /c "npm --prefix frontend run dev"

:: Doi 4 giay de server backend va frontend khoi dong hoan tat
ping 127.0.0.1 -n 5 >nul

:: Mo trinh duyet mac dinh vao giao giao dien cong cu SEO local
start http://localhost:5174
