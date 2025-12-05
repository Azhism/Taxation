# Run both backend and frontend in development mode

Write-Host "🚀 Starting AI Tax Filing Platform..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Start backend in background
Write-Host "Starting backend server on port 4000..." -ForegroundColor Cyan
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -PassThru

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in background
Write-Host "Starting frontend server on port 3000..." -ForegroundColor Cyan
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -PassThru

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✓ Both servers started!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (servers will keep running)" -ForegroundColor Gray
Write-Host "To stop servers, close the PowerShell windows or use Task Manager" -ForegroundColor Gray
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Script terminated" -ForegroundColor Red
}
