# AI Tax Filing Setup Script for Windows PowerShell

Write-Host "🇵🇰 AI Tax Filing for Pakistan - Setup Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Setting up Backend..." -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"

if (Test-Path "node_modules") {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 2: Setting up Frontend..." -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\frontend"

if (Test-Path "node_modules") {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
}

Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open your browser to: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Or use the run-dev.ps1 script to start both servers!" -ForegroundColor Yellow
Write-Host ""
