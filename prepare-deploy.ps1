# Prepare Rosewood Deployment
# Copies rosewood project into docker/rosewood for deployment

Write-Host "Preparing Rosewood for deployment..." -ForegroundColor Cyan

# Remove old rosewood directory if it exists
if (Test-Path "rosewood") {
    Write-Host "Removing old rosewood directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force rosewood
}

# Create rosewood directory
New-Item -ItemType Directory -Path "rosewood" | Out-Null

# Copy rosewood project (excluding heavy folders)
Write-Host "Copying rosewood project..." -ForegroundColor Green
$source = "..\RosewoodFinal\rosewood"

# Copy all files
Copy-Item -Path "$source\*" -Destination "rosewood\" -Recurse -Force -Exclude @(
    "node_modules",
    ".next",
    ".git",
    "rosewood"
)

Write-Host "Done! Rosewood project ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. git add ." -ForegroundColor White
Write-Host "2. git commit -m ""Add rosewood source""" -ForegroundColor White
Write-Host "3. git push" -ForegroundColor White
