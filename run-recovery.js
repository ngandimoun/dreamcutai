const { exec } = require('child_process');

console.log('🔄 Starting video recovery...');
console.log('Video ID: 8c2e1bb1-581d-4885-8023-17c7e0f1b8ff');
console.log('Suno Task ID: 954b6faaf0f888c613d322775087cfc5');
console.log('');

exec('npx tsx scripts/recover-stuck-video-direct.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Warnings:', stderr);
  }
  
  console.log(stdout);
  console.log('');
  console.log('✅ Recovery script completed!');
  console.log('Please check your UI to see if the video is now available.');
});














