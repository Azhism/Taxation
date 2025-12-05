# PostgreSQL Database Setup Script

Write-Host "🗄️  PostgreSQL Database Setup for AI Tax Filing" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Get PostgreSQL credentials
Write-Host "Please provide your PostgreSQL credentials:" -ForegroundColor Yellow
$dbUser = Read-Host "PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = "tax_filing_db"

Write-Host ""
Write-Host "Step 1: Creating database '$dbName'..." -ForegroundColor Cyan

# Create database
$createDbCmd = "CREATE DATABASE $dbName;"
$env:PGPASSWORD = $dbPasswordPlain

try {
    # Try to create database (ignore error if exists)
    psql -U $dbUser -c $createDbCmd 2>$null
    Write-Host "✓ Database created (or already exists)" -ForegroundColor Green
} catch {
    Write-Host "! Database may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Running schema migrations..." -ForegroundColor Cyan

# Run schema file
$schemaPath = "$PSScriptRoot\backend\database\schema.sql"

if (Test-Path $schemaPath) {
    psql -U $dbUser -d $dbName -f $schemaPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database schema created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create schema" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Schema file not found at: $schemaPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Updating .env file..." -ForegroundColor Cyan

# Update .env file
$envPath = "$PSScriptRoot\backend\.env"
$databaseUrl = "DATABASE_URL=postgresql://${dbUser}:${dbPasswordPlain}@localhost:5432/$dbName"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $newContent = @()
    $updated = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_URL=") {
            $newContent += $databaseUrl
            $updated = $true
        } else {
            $newContent += $line
        }
    }
    
    if (-not $updated) {
        $newContent += ""
        $newContent += "# PostgreSQL Database"
        $newContent += $databaseUrl
    }
    
    $newContent | Set-Content $envPath
    Write-Host "✓ .env file updated with database credentials" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying database setup..." -ForegroundColor Cyan

# Verify tables
$verifyCmd = "\dt"
$tables = psql -U $dbUser -d $dbName -c $verifyCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database tables verified:" -ForegroundColor Green
    Write-Host $tables
} else {
    Write-Host "! Could not verify tables, but setup may be successful" -ForegroundColor Yellow
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✓ Database Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Yellow
Write-Host "  Name: $dbName" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host ""
Write-Host "Tables Created:" -ForegroundColor Yellow
Write-Host "  - users (for user accounts)" -ForegroundColor White
Write-Host "  - documents (for uploaded files)" -ForegroundColor White
Write-Host "  - tax_forms (for tax returns)" -ForegroundColor White
Write-Host "  - sessions (for session management)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install dependencies: cd backend; npm install" -ForegroundColor Cyan
Write-Host "2. Start backend: npm run dev" -ForegroundColor Cyan
Write-Host "3. You should see: '✓ Connected to PostgreSQL database'" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more details, see: DATABASE_SETUP.md" -ForegroundColor Gray
Write-Host ""
