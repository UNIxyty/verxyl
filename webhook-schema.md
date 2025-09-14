# Webhook JSON Schema Documentation

## Overview
The ticket management system sends webhooks to notify external systems about ticket events. The webhook URL is configured in the user settings.

## Webhook Request

### Endpoint
- **Method**: POST
- **Content-Type**: application/json

### Request Payload Schema

```json
{
  "ticketAction": "created" | "updated" | "solved" | "deleted",
  "ticket_id": "string",
  "urgency": "low" | "medium" | "high" | "critical",
  "dateTicket": "YYYY-MM-DD" | null,
  "timeTicket": "HH:MM" | null,
  "creatorName": "string",
  "workerName": "string",
  "creatorEmail": "string",
  "workerEmail": "string"
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `ticketAction` | string | The action that triggered the webhook | `"created"` |
| `ticket_id` | string | Unique identifier of the ticket | `"123e4567-e89b-12d3-a456-426614174000"` |
| `urgency` | string | Ticket urgency level | `"high"` |
| `dateTicket` | string\|null | Deadline date in YYYY-MM-DD format | `"2025-01-15"` |
| `timeTicket` | string\|null | Deadline time in HH:MM format | `"14:30"` |
| `creatorName` | string | Full name of ticket creator | `"John Doe"` |
| `workerName` | string | Full name of assigned worker | `"Jane Smith"` |
| `creatorEmail` | string | Email of ticket creator | `"john@company.com"` |
| `workerEmail` | string | Email of assigned worker | `"jane@company.com"` |

### Example Request

```json
{
  "ticketAction": "created",
  "ticket_id": "123e4567-e89b-12d3-a456-426614174000",
  "urgency": "high",
  "dateTicket": "2025-01-15",
  "timeTicket": "14:30",
  "creatorName": "John Doe",
  "workerName": "Jane Smith",
  "creatorEmail": "john@company.com",
  "workerEmail": "jane@company.com"
}
```

## Webhook Response

### Expected Response Format

The webhook endpoint should return a response that indicates whether the user was successfully notified. The system checks the response text for the phrase "User has been notified" (case-insensitive).

### Response Schema

```json
{
  "status": "success" | "error",
  "message": "string",
  "userNotified": boolean,
  "timestamp": "ISO 8601 string"
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | Response status | `"success"` |
| `message` | string | Human-readable message | `"User has been notified via Telegram"` |
| `userNotified` | boolean | Whether user was actually notified | `true` |
| `timestamp` | string | Response timestamp | `"2025-01-10T10:30:00Z"` |

### Example Responses

#### Successful Notification
```json
{
  "status": "success",
  "message": "User has been notified via Telegram",
  "userNotified": true,
  "timestamp": "2025-01-10T10:30:00Z"
}
```

#### Failed Notification
```json
{
  "status": "error",
  "message": "Failed to send notification",
  "userNotified": false,
  "timestamp": "2025-01-10T10:30:00Z"
}
```

#### Simple Text Response (Legacy Support)
```
User has been notified via Telegram
```

## Webhook Events

### Ticket Created
- **Trigger**: When a new ticket is created
- **Action**: `"created"`
- **Data**: All ticket details and user information

### Ticket Updated
- **Trigger**: When a ticket is edited (only allowed once)
- **Action**: `"updated"`
- **Data**: Updated ticket details and user information

### Ticket Solved
- **Trigger**: When a ticket is marked as completed
- **Action**: `"solved"`
- **Data**: Final ticket details and solution information

### Ticket Deleted
- **Trigger**: When a ticket is deleted by its creator
- **Action**: `"deleted"`
- **Data**: Ticket details before deletion

## User Notification Tag

When the webhook response contains the text "User has been notified" (case-insensitive), the system will:

1. Mark the ticket with a "User Notified" tag
2. Display this tag in the ticket list
3. Store the notification status in the database

## Error Handling

### HTTP Status Codes
- **200**: Success - response will be checked for notification status
- **4xx**: Client error - webhook failed
- **5xx**: Server error - webhook failed

### Response Validation
- If response contains "User has been notified" → `userNotified: true`
- If response doesn't contain this phrase → `userNotified: false`
- If webhook fails entirely → `userNotified: false`

## Implementation Notes

1. **Async Processing**: Webhooks are sent asynchronously and don't block ticket creation
2. **Retry Logic**: No automatic retries are implemented - failed webhooks are logged
3. **Security**: Webhook URLs are stored in user settings and should be HTTPS in production
4. **Rate Limiting**: Consider implementing rate limiting on your webhook endpoint
5. **Idempotency**: Webhook endpoints should be idempotent to handle duplicate requests

## Testing

You can test your webhook endpoint using curl:

```bash
curl -X POST https://your-webhook-url.com/endpoint \
  -H "Content-Type: application/json" \
  -d '{
    "ticketAction": "created",
    "ticket_id": "123e4567-e89b-12d3-a456-426614174000",
    "urgency": "high",
    "dateTicket": "2025-01-15",
    "timeTicket": "14:30",
    "creatorName": "John Doe",
    "workerName": "Jane Smith",
    "creatorEmail": "john@company.com",
    "workerEmail": "jane@company.com"
  }'
```

Expected response for successful notification:
```
User has been notified via Telegram
```
