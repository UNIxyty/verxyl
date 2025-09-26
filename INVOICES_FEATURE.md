# Invoices Feature Documentation

## Overview

The invoices feature allows administrators to create and manage client-facing invoice pages that can be accessed publicly via unique URLs. Each invoice displays project details, main points/problems solved, PDF preview/download, and payment functionality.

## Features

### 🔹 Dynamic Invoice Pages
- **URL Structure**: `your-domain.com/invoices/{invoice_id}`
- **Public Access**: No authentication required for viewing invoices
- **Responsive Design**: Works on all devices

### 🔹 Invoice Content
Each invoice page includes:
1. **Client Information**: Name and company
2. **Project Description**: Detailed project overview
3. **Main Points and Problems**: Key deliverables and issues solved
4. **Invoice PDF**: Preview and download functionality
5. **Payment Button**: Direct link to payment processor

### 🔹 Admin Management
- Create new invoices through admin interface
- List and manage existing invoices
- Access controls (admin-only for management)

## Database Schema

### Invoices Table
```sql
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_company TEXT,
    project_description TEXT NOT NULL,
    project_points_problems TEXT NOT NULL,
    invoice_pdf TEXT, -- URL to PDF in Supabase Storage
    payment_link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Security
- **Row Level Security (RLS)** enabled
- **Public read access** for invoice viewing
- **Admin-only access** for create/update/delete operations

## API Endpoints

### GET /api/invoices
- **Purpose**: List invoices (admin) or get specific invoice (public)
- **Parameters**: 
  - `id`: Get specific invoice (public access)
  - `limit`, `offset`: Pagination for admin listing
- **Authentication**: Required for listing, not required for specific invoice

### POST /api/invoices
- **Purpose**: Create new invoice
- **Authentication**: Admin only
- **Required Fields**:
  - `client_name`
  - `project_description`
  - `project_points_problems`
  - `payment_link`
- **Optional Fields**:
  - `client_company`
  - `invoice_pdf`

## File Structure

```
app/
├── invoices/
│   ├── page.tsx                    # Admin invoice management
│   ├── [invoice_id]/
│   │   └── page.tsx               # Dynamic invoice display
│   └── template/
│       └── page.tsx               # Development template
└── api/
    └── invoices/
        └── route.ts               # Invoice API endpoints
```

## Routes

### Public Routes
- `/invoices/{invoice_id}` - Individual invoice page (public)
- `/invoices/template` - Template page for development

### Admin Routes
- `/invoices` - Invoice management dashboard (admin only)

## Usage

### Creating an Invoice (Admin)

1. Navigate to `/invoices` (requires admin login)
2. Click "Create Invoice"
3. Fill in the form:
   - Client Name (required)
   - Client Company (optional)
   - Project Description (required)
   - Project Points and Problems (required)
   - Invoice PDF URL (optional) - URL to PDF in Supabase Storage
   - Payment Link (required) - Stripe, PayPal, etc.
4. Click "Create Invoice"

### Viewing an Invoice (Public)

1. Access the invoice URL: `your-domain.com/invoices/{invoice_id}`
2. View project details and client information
3. Click on the PDF card to preview the invoice
4. Use the download button to get the PDF
5. Click "Pay Now" to proceed to payment

### PDF Integration

The invoice PDF should be uploaded to Supabase Storage and the public URL should be used in the `invoice_pdf` field. The system will:
- Display a preview modal with the PDF
- Provide a download button
- Handle cases where no PDF is available

### Payment Integration

The `payment_link` field should contain a direct link to your payment processor:
- Stripe Payment Links
- PayPal invoices
- Square invoices
- Custom payment pages

## Development

### Template Page
Access `/invoices/template` to see a fully functional template with placeholder data. This helps with:
- UI/UX development
- Testing responsive design
- Demonstrating functionality to stakeholders

### Database Setup
Run the SQL migration:
```bash
# Execute the SQL file in Supabase SQL Editor
psql -f create-invoices-table.sql
```

### Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

## Deployment

1. **Database Migration**: Run `create-invoices-table.sql` in Supabase
2. **Build**: `npm run build` (already tested and working)
3. **Deploy**: Standard Next.js deployment process

## Security Considerations

1. **Public Access**: Invoice pages are publicly accessible by design
2. **Admin Protection**: Creation and management require admin authentication
3. **URL Privacy**: Invoice IDs are UUIDs (not sequential numbers)
4. **RLS Policies**: Proper row-level security policies in place

## Customization

### Styling
All invoice pages use the existing design system with:
- Dark theme by default
- Responsive components
- Consistent typography and spacing

### Content
Easy to modify:
- Invoice layout and sections
- PDF preview behavior
- Payment button styling
- Client information display

## Testing

### Manual Testing Checklist
- [ ] Create invoice as admin
- [ ] Access invoice via public URL
- [ ] Test PDF preview (if PDF provided)
- [ ] Test PDF download
- [ ] Test payment link redirect
- [ ] Test responsive design on mobile
- [ ] Test template page functionality
- [ ] Verify admin-only access to management

### Error Handling
- Invoice not found (404)
- Missing PDF (graceful degradation)
- Network errors (retry mechanisms)
- Invalid payment links (external validation)

## Future Enhancements

Potential features to add:
- Invoice status tracking (sent, paid, overdue)
- Email notifications
- Invoice templates
- Bulk operations
- Analytics and reporting
- Multi-language support
- Custom branding per client

## Support

For issues or questions:
1. Check the template page for expected behavior
2. Verify database schema matches migration
3. Check API endpoints with proper authentication
4. Review browser console for client-side errors

## Integration Examples

### Supabase Storage for PDFs
```javascript
// Upload PDF to Supabase Storage
const { data, error } = await supabase.storage
  .from('invoices')
  .upload(`invoice-${invoiceId}.pdf`, pdfFile)

// Use the public URL in invoice_pdf field
const publicUrl = supabase.storage
  .from('invoices')
  .getPublicUrl(data.path).data.publicUrl
```

### Stripe Payment Links
```javascript
// Create Stripe Payment Link
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{
    price: 'price_xxx',
    quantity: 1,
  }],
})

// Use paymentLink.url as payment_link in invoice
```

This completes the comprehensive invoices feature implementation!
