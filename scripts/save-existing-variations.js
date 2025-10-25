// Script to save all existing character variations to Supabase
// Run this in your browser console on the comics page

const existingVariations = [
  // From your terminal logs - these are the variations you've already generated
  'https://v3b.fal.media/files/b/elephant/8v0F-Efp2rD-ylkVmrT7F_10a6cb42676343458e7370e8eb07b9d9.png',
  'https://v3b.fal.media/files/b/lion/U2080Gy_kpaxhXWXD-2Q3_f4f883f0d55748a0af9eedd80596a21c.png',
  'https://v3b.fal.media/files/b/panda/84B9KCF7c8_2pMiFOBL2L_42b93a43541b4ea5b889a7ad252966d6.png',
  'https://v3b.fal.media/files/b/penguin/HIUFfeVsgcHrh5PrcpcTX_aa93b9cc98514cb3ae56390627c43ef9.png',
  
  // Second generation
  'https://v3b.fal.media/files/b/koala/pK_xsUwJxmtrK31_5jI3u_5dc10fca44244e4fa006f4fdec1162c6.png',
  'https://v3b.fal.media/files/b/tiger/4WYBcieFS72QyBzQOx62o_394f0318fc3848c59a32ca98ef59b083.png',
  'https://v3b.fal.media/files/b/elephant/LgLDOgOlUskPsSQJMy4_T_fc0b7575722148f09377b27a83cb87e8.png',
  'https://v3b.fal.media/files/b/monkey/spWvhwFAzkSXvSvr5xcwD_ee3c5b0f01ef47758ebd065706a19874.png'
]

async function saveAllVariations() {
  console.log('🚀 Starting bulk save of existing variations...')
  
  try {
    const response = await fetch('/api/save-variations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variations: existingVariations,
        comicTitle: 'Previous Character Generations'
      }),
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Success!', result.message)
      alert(`✅ Successfully saved ${result.savedCount} variations to Templates!`)
    } else {
      console.error('❌ Error:', result.error)
      alert(`❌ Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    alert(`❌ Network error: ${error.message}`)
  }
}

// Run the function
saveAllVariations()
