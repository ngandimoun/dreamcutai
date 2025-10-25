const { exec } = require('child_process');

console.log('🎯 Quick backfill for task: 05163570bdbf53ae457120ac916b76d8');
console.log('This should catch the missing record...');
console.log('');

exec('npx tsx scripts/backfill-suno-audio-ids.ts --task-id=05163570bdbf53ae457120ac916b76d8', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
  
  console.log('✅ Quick backfill completed!');
});




