// Quick debug test for mail attachments
// Run this in your browser console

async function quickDebugTest() {
  console.log('🔍 Running quick debug test...')
  
  try {
    // Create a test file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mailId', 'test-mail-id') // This will fail but show us what's wrong
    
    console.log('📤 Testing debug endpoint...')
    
    const response = await fetch('/api/debug-attachment-simple', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    console.log('📊 Debug result:', result)
    
    if (response.ok) {
      console.log('✅ All checks passed!')
    } else {
      console.log('❌ Debug failed:', result.error)
      if (result.envCheck) {
        console.log('🔧 Environment issues:', result.envCheck)
      }
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { error: error.message }
  }
}

// Auto-run the test
quickDebugTest()

// Also provide manual function
window.quickDebugTest = quickDebugTest

console.log('💡 Run quickDebugTest() to test again')
