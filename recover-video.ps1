Write-Host "🔄 Recovering stuck music video..." -ForegroundColor Cyan
Write-Host "Video ID: 8c2e1bb1-581d-4885-8023-17c7e0f1b8ff" -ForegroundColor Yellow
Write-Host "Suno Task ID: 954b6faaf0f888c613d322775087cfc5" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "📞 Running recovery script..." -ForegroundColor Green
    npx tsx scripts/recover-stuck-video-direct.ts
    
    Write-Host ""
    Write-Host "✅ Recovery script completed!" -ForegroundColor Green
    Write-Host "Please check your UI to see if the video is now available." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error running recovery script: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")














