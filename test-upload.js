// Test script for mail attachment upload
// Run this in your browser console after creating a mail

// First, create a test mail to get a mail ID
async function createTestMail() {
    try {
        const response = await fetch('/api/mails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_id: 'YOUR_USER_ID_HERE', // Replace with actual user ID
                subject: 'Test Email with Attachment',
                content: 'This is a test email for file upload testing.'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Test mail created:', result.mail.id);
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

// Test file upload with a dummy file
async function testFileUpload(mailId) {
    try {
        // Create a dummy file for testing
        const dummyContent = 'This is a test file content for attachment testing.';
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const file = new File([blob], 'test-file.txt', { type: 'text/plain' });
        
        console.log('📎 Testing file upload with file:', file.name, file.size, 'bytes');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mailId', mailId);
        
        const response = await fetch('/api/mails/attachments', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ File upload successful:', result);
            return result.attachment.id;
        } else {
            console.error('❌ File upload failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error during file upload:', error);
        return null;
    }
}

// Test the complete flow
async function runTest() {
    console.log('🚀 Starting mail attachment test...');
    
    // Step 1: Create a test mail
    const mailId = await createTestMail();
    if (!mailId) {
        console.log('❌ Cannot proceed without a mail ID');
        return;
    }
    
    // Step 2: Upload a file
    const attachmentId = await testFileUpload(mailId);
    if (!attachmentId) {
        console.log('❌ File upload failed');
        return;
    }
    
    // Step 3: Test download
    try {
        const downloadUrl = `/api/mails/attachments/${attachmentId}/download`;
        console.log('📥 Test download URL:', downloadUrl);
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Error testing download:', error);
    }
}

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. First, get a real user ID:
   - Go to your app and check the network tab
   - Look for any API call that shows user data
   - Copy the user ID

2. Replace 'YOUR_USER_ID_HERE' in the script above

3. Run: runTest()

4. Or test manually:
   - Create a mail first: createTestMail()
   - Upload a file: testFileUpload('MAIL_ID_HERE')
   - Test download: window.open('/api/mails/attachments/ATTACHMENT_ID/download')

📁 Or use the test HTML file: test-file-upload.html
`);

// Export functions for manual testing
window.createTestMail = createTestMail;
window.testFileUpload = testFileUpload;
window.runTest = runTest;
