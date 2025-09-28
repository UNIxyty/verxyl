# n8n PDF Upload to Supabase Storage Guide

## 🎯 Overview

This guide shows you how to upload PDF files from n8n workflows to your Supabase Storage for the invoices feature.

## 🔧 Method 1: Using Your App's API Endpoint (Recommended)

### API Endpoint
**URL**: `https://your-domain.com/api/n8n/upload-invoice-pdf`
**Method**: `POST`

### n8n HTTP Request Node Configuration

```json
{
  "method": "POST",
  "url": "https://your-domain.com/api/n8n/upload-invoice-pdf",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "invoice_id": "{{ $json.invoice_id }}",
    "pdf_data": "{{ $json.pdf_base64 }}",
    "client_name": "{{ $json.client_name }}"
  }
}
```

### Input Data Format
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "pdf_data": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo...",
  "client_name": "John Doe"
}
```

### Success Response
```json
{
  "success": true,
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_name": "John Doe",
  "pdf_url": "https://your-project.supabase.co/storage/v1/object/public/invoices/invoice-550e8400-e29b-41d4-a716-446655440000.pdf",
  "file_path": "invoice-550e8400-e29b-41d4-a716-446655440000.pdf",
  "file_size": 245760,
  "message": "PDF uploaded successfully and invoice updated"
}
```

## 🔧 Method 2: Direct Supabase API (Advanced)

### Step 1: Upload to Storage
**n8n HTTP Request Node:**
```json
{
  "method": "POST",
  "url": "https://your-project.supabase.co/storage/v1/object/invoices/invoice-{{ $json.invoice_id }}.pdf",
  "headers": {
    "Authorization": "Bearer YOUR_SUPABASE_SERVICE_KEY",
    "Content-Type": "application/pdf",
    "x-upsert": "true"
  },
  "body": "{{ $binary.data }}",
  "bodyContentType": "raw"
}
```

### Step 2: Update Invoice Record
**n8n HTTP Request Node:**
```json
{
  "method": "PATCH",
  "url": "https://your-project.supabase.co/rest/v1/invoices?id=eq.{{ $json.invoice_id }}",
  "headers": {
    "Authorization": "Bearer YOUR_SUPABASE_SERVICE_KEY",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
  },
  "body": {
    "invoice_pdf": "https://your-project.supabase.co/storage/v1/object/public/invoices/invoice-{{ $json.invoice_id }}.pdf"
  }
}
```

## 📋 Complete n8n Workflow Examples

### Example 1: Generate PDF from HTML and Upload

**Workflow Steps:**
1. **Webhook Trigger** - Receives invoice data
2. **HTML Template** - Create invoice HTML
3. **HTML to PDF** - Convert using Puppeteer
4. **Function Node** - Convert to base64
5. **HTTP Request** - Upload via API
6. **Response** - Send confirmation

**Function Node (Convert PDF to Base64):**
```javascript
// Get the PDF binary data
const pdfBinary = $input.first().binary.data;

// Convert to base64
const base64Data = pdfBinary.toString('base64');

return [{
  json: {
    invoice_id: $input.first().json.invoice_id,
    pdf_base64: base64Data,
    client_name: $input.first().json.client_name,
    original_size: pdfBinary.length
  }
}];
```

### Example 2: Upload Existing PDF File

**Workflow Steps:**
1. **Webhook Trigger** - Receives file upload
2. **Function Node** - Process file data
3. **HTTP Request** - Upload to storage
4. **Response** - Confirm upload

**Function Node (Process File Upload):**
```javascript
// Handle file upload from form data
const fileData = $input.first().binary.data;
const fileName = $input.first().json.filename;

// Validate it's a PDF
if (!fileName.toLowerCase().endsWith('.pdf')) {
  throw new Error('Only PDF files are allowed');
}

// Convert to base64
const base64Data = fileData.toString('base64');

return [{
  json: {
    invoice_id: $input.first().json.invoice_id,
    pdf_base64: base64Data,
    filename: fileName,
    file_size: fileData.length
  }
}];
```

## 🛠️ Setup Instructions

### 1. Deploy the API Endpoint
The API endpoint is already created at `/app/api/n8n/upload-invoice-pdf/route.ts`. Deploy your app to make it available.

### 2. Test the Endpoint
```bash
curl -X POST https://your-domain.com/api/n8n/upload-invoice-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "test-123",
    "pdf_data": "JVBERi0xLjQKJdPr6eEK..."
  }'
```

### 3. Configure n8n Workflow

**Basic Upload Workflow:**
```
Webhook → Function (prepare data) → HTTP Request (upload) → Response
```

**Advanced Generation Workflow:**
```
Webhook → HTML Template → Puppeteer (PDF) → Function (base64) → HTTP Request → Response
```

## 🔍 Testing & Debugging

### Test Data for n8n
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "pdf_data": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udERlc2NyaXB0b3IKL0ZvbnROYW1lIC9IZWx2ZXRpY2EKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxMzEgMDAwMDAgbiAKMDAwMDAwMDIwOCAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzY5CiUlRU9G",
  "client_name": "Test Client"
}
```

### Error Handling
Common errors and solutions:

1. **"Invoice not found"** - Ensure the invoice exists in your database
2. **"Invalid base64 PDF data"** - Check your base64 encoding
3. **"PDF file too large"** - Files must be under 10MB
4. **"Failed to upload PDF to storage"** - Check Supabase credentials and bucket setup

### Debugging Tips
- Use n8n's "Execute Workflow" to test with sample data
- Check the n8n logs for detailed error messages
- Verify your Supabase storage bucket is properly configured
- Test the API endpoint directly with curl first

## 🔐 Security Notes

1. **API Endpoint Security**: The endpoint validates invoice existence and file types
2. **File Size Limits**: 10MB maximum file size enforced
3. **File Type Validation**: Only PDF files are accepted
4. **Supabase RLS**: Uses service key to bypass RLS for automation

## 📊 Monitoring

Monitor your uploads by checking:
- Supabase Storage usage in dashboard
- API endpoint logs in Vercel/deployment platform
- n8n workflow execution logs
- Database updates in the invoices table

## 🚀 Production Deployment

1. **Environment Variables**: Set up your Supabase credentials
2. **Storage Bucket**: Ensure the `invoices` bucket exists and is properly configured
3. **API Deployment**: Deploy your app with the new endpoint
4. **n8n Configuration**: Update workflow URLs to production endpoints
5. **Testing**: Run end-to-end tests before going live

This setup provides a robust, scalable solution for uploading invoice PDFs from n8n to your Supabase storage! 🎉
