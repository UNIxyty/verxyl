// Script to fix all webhook calls in database.ts
const fs = require('fs');

// Read the current database.ts file
const content = fs.readFileSync('lib/database.ts', 'utf8');

// Replace all webhook calls with proper error handling
let fixedContent = content;

// Fix the first webhook call (ticket update)
fixedContent = fixedContent.replace(
  /  \/\/ Send webhook for ticket update\n  if \(data\) \{\n    const \{ dateTicket, timeTicket \} = extractDateTime\(data\.deadline\)\n    \n    await sendWebhook\(\{\n      ticketAction: 'updated',\n      ticket_id: data\.id,\n      urgency: data\.urgency,\n      dateTicket,\n      timeTicket,\n      creatorName: getUserFullName\(data\.created_by_user\),\n      workerName: getUserFullName\(data\.assigned_user\),\n      creatorEmail: getUserEmail\(data\.created_by_user\),\n      workerEmail: getUserEmail\(data\.assigned_user\)\n    \}\)\n  \}/g,
  `  // Send webhook for ticket update
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket update')
      const webhookResult = await sendWebhook({
        ticketAction: 'updated',
        ticket_id: data.id,
        urgency: data.urgency,
        dateTicket,
        timeTicket,
        creatorName: getUserFullName(data.created_by_user),
        workerName: getUserFullName(data.assigned_user),
        creatorEmail: getUserEmail(data.created_by_user),
        workerEmail: getUserEmail(data.assigned_user)
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
  }`
);

// Fix the second webhook call (ticket completion)
fixedContent = fixedContent.replace(
  /  \/\/ Send webhook for ticket completion\n  if \(data\) \{\n    const \{ dateTicket, timeTicket \} = extractDateTime\(data\.deadline\)\n    \n    await sendWebhook\(\{\n      ticketAction: 'solved',\n      ticket_id: data\.id,\n      urgency: data\.urgency,\n      dateTicket,\n      timeTicket,\n      creatorName: getUserFullName\(data\.created_by_user\),\n      workerName: getUserFullName\(data\.assigned_user\),\n      creatorEmail: getUserEmail\(data\.created_by_user\),\n      workerEmail: getUserEmail\(data\.assigned_user\)\n    \}\)\n  \}/g,
  `  // Send webhook for ticket completion
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket completion')
      const webhookResult = await sendWebhook({
        ticketAction: 'solved',
        ticket_id: data.id,
        urgency: data.urgency,
        dateTicket,
        timeTicket,
        creatorName: getUserFullName(data.created_by_user),
        workerName: getUserFullName(data.assigned_user),
        creatorEmail: getUserEmail(data.created_by_user),
        workerEmail: getUserEmail(data.assigned_user)
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
  }`
);

// Fix the third webhook call (another ticket update)
fixedContent = fixedContent.replace(
  /  \/\/ Send webhook for ticket update\n  if \(data\) \{\n    const \{ dateTicket, timeTicket \} = extractDateTime\(data\.deadline\)\n    \n    await sendWebhook\(\{\n      ticketAction: 'updated',\n      ticket_id: data\.id,\n      urgency: data\.urgency,\n      dateTicket,\n      timeTicket,\n      creatorName: getUserFullName\(data\.created_by_user\),\n      workerName: getUserFullName\(data\.assigned_user\),\n      creatorEmail: getUserEmail\(data\.created_by_user\),\n      workerEmail: getUserEmail\(data\.assigned_user\)\n    \}\)\n  \}/g,
  `  // Send webhook for ticket update
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket update')
      const webhookResult = await sendWebhook({
        ticketAction: 'updated',
        ticket_id: data.id,
        urgency: data.urgency,
        dateTicket,
        timeTicket,
        creatorName: getUserFullName(data.created_by_user),
        workerName: getUserFullName(data.assigned_user),
        creatorEmail: getUserEmail(data.created_by_user),
        workerEmail: getUserEmail(data.assigned_user)
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
  }`
);

// Fix the fourth webhook call (ticket deletion)
fixedContent = fixedContent.replace(
  /  \/\/ Send webhook for ticket deletion\n  if \(ticketData\) \{\n    const \{ dateTicket, timeTicket \} = extractDateTime\(ticketData\.deadline\)\n    \n    await sendWebhook\(\{\n      ticketAction: 'deleted',\n      ticket_id: ticketData\.id,\n      urgency: ticketData\.urgency,\n      dateTicket,\n      timeTicket,\n      creatorName: getUserFullName\(ticketData\.created_by_user\),\n      workerName: getUserFullName\(ticketData\.assigned_user\),\n      creatorEmail: getUserEmail\(ticketData\.created_by_user\),\n      workerEmail: getUserEmail\(ticketData\.assigned_user\)\n    \}\)\n  \}/g,
  `  // Send webhook for ticket deletion
  if (ticketData) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(ticketData.deadline)
      
      console.log('Sending webhook for ticket deletion')
      const webhookResult = await sendWebhook({
        ticketAction: 'deleted',
        ticket_id: ticketData.id,
        urgency: ticketData.urgency,
        dateTicket,
        timeTicket,
        creatorName: getUserFullName(ticketData.created_by_user),
        workerName: getUserFullName(ticketData.assigned_user),
        creatorEmail: getUserEmail(ticketData.created_by_user),
        workerEmail: getUserEmail(ticketData.assigned_user)
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
  }`
);

// Write the fixed content back
fs.writeFileSync('lib/database.ts', fixedContent);

console.log('Fixed all webhook calls in database.ts');
