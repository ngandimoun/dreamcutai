const { spawn } = require('child_process');

console.log('🎯 Running targeted backfill for problematic record...');
console.log('Record ID: 6639a5ba-0161-44da-8323-37c0a9e9a320');
console.log('');

const child = spawn('npx', ['tsx', 'scripts/backfill-suno-audio-ids.ts', '--ids=6639a5ba-0161-44da-8323-37c0a9e9a320'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ Targeted backfill completed successfully!');
  } else {
    console.log(`❌ Backfill failed with exit code ${code}`);
  }
});

child.on('error', (error) => {
  console.error('❌ Error running backfill:', error);
});




