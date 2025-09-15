export function extractDateTime(deadline: string | null): { dateTicket: string | null; timeTicket: string | null } {
  if (!deadline) {
    return { dateTicket: null, timeTicket: null }
  }

  try {
    const date = new Date(deadline)
    const dateTicket = date.toISOString().split('T')[0] // YYYY-MM-DD format
    const timeTicket = date.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format
    return { dateTicket, timeTicket }
  } catch (error) {
    console.error('Error parsing deadline:', error)
    return { dateTicket: null, timeTicket: null }
  }
}

export function getUserFullName(user: any): string {
  if (!user) return 'Unknown User'
  
  if (user.full_name && user.full_name.trim()) {
    return user.full_name.trim()
  }
  
  if (user.email) {
    return user.email.split('@')[0]
  }
  
  return 'Unknown User'
}

export function getUserEmail(user: any): string {
  if (!user) return ''
  return user.email || ''
}
