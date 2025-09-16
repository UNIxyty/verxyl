// Complete test script for mail attachment upload
// Run this in your browser console or use the test page

// Step 1: Create a test mail first
async function createTestMail() {
  try {
    console.log('📧 Creating test mail...');
    
    const response = await fetch('/api/mails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: 'fbbc5913-1540-42ef-b333-65e1654160b8', // Replace with your user ID
        subject: 'Test Email for File Upload',
        content: 'This is a test email for testing file uploads.'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test mail created successfully!');
      console.log('Mail ID:', result.mail.id);
      return result.mail.id;
    } else {
      console.error('❌ Failed to create test mail:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating test mail:', error);
    return null;
  }
}

// Step 2: Test file upload with the mail ID
async function testFileUpload(mailId) {
  try {
    console.log('📎 Testing file upload...');
    
    // Create a test file
    const testContent = 'This is a test file content for attachment testing.';
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-file.txt', { type: 'text/plain' });
    
    console.log('File created:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mailId', mailId);
    
    console.log('FormData created with:', {
      file: file.name,
      mailId: mailId
    });
    
    // Test with debug API first
    console.log('🔍 Testing with debug API...');
    const debugResponse = await fetch('/api/debug-attachment-upload', {
      method: 'POST',
      body: formData
    });
    
    const debugResult = await debugResponse.json();
    console.log('Debug result:', debugResult);
    
    if (!debugResponse.ok) {
      console.error('❌ Debug test failed:', debugResult);
      return null;
    }
    
    // If debug passes, try actual upload
    console.log('🚀 Testing actual upload...');
    const uploadResponse = await fetch('/api/mails/attachments', {
      method: 'POST',
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResponse.ok) {
      console.log('✅ File upload successful!');
      console.log('Attachment ID:', uploadResult.attachment.id);
      return uploadResult.attachment.id;
    } else {
      console.error('❌ Upload failed:', uploadResult);
      return null;
    }
  } catch (error) {
    console.error('❌ Error during file upload:', error);
    return null;
  }
}

// Step 3: Test file download
async function testFileDownload(attachmentId) {
  try {
    console.log('📥 Testing file download...');
    
    const downloadUrl = `/api/mails/attachments/${attachmentId}/download`;
    console.log('Download URL:', downloadUrl);
    
    // Open download in new tab
    window.open(downloadUrl, '_blank');
    
    console.log('✅ Download test initiated - check new tab');
  } catch (error) {
    console.error('❌ Error testing download:', error);
  }
}

// Complete test flow
async function runCompleteTest() {
  console.log('🚀 Starting complete attachment test...');
  
  // Step 1: Create test mail
  const mailId = await createTestMail();
  if (!mailId) {
    console.log('❌ Cannot proceed without a mail ID');
    return;
  }
  
  // Step 2: Upload file
  const attachmentId = await testFileUpload(mailId);
  if (!attachmentId) {
    console.log('❌ File upload failed');
    return;
  }
  
  // Step 3: Test download
  await testFileDownload(attachmentId);
  
  console.log('✅ Complete test finished!');
}

// Individual test functions for manual testing
window.createTestMail = createTestMail;
window.testFileUpload = testFileUpload;
window.testFileDownload = testFileDownload;
window.runCompleteTest = runCompleteTest;

// Instructions
console.log(`
📋 Mail Attachment Upload Test Script

Available functions:
- createTestMail() - Create a test email
- testFileUpload(mailId) - Upload a file to the mail
- testFileDownload(attachmentId) - Download an attachment
- runCompleteTest() - Run the complete test flow

Quick start:
1. Run: runCompleteTest()
2. Or manually: createTestMail() then testFileUpload(mailId)

Note: Replace the recipient_id in createTestMail() with your actual user ID
`);

// Auto-run instructions
console.log('💡 To run the complete test, execute: runCompleteTest()');
