import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Get cookie from document.cookie
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) {
            return parts.pop()?.split(';').shift()
          }
          return undefined
        },
        set(name: string, value: string, options: any) {
          // Set cookie with proper options for Chrome compatibility
          let cookieString = `${name}=${value}`
          
          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`
          }
          if (options?.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`
          }
          if (options?.path) {
            cookieString += `; Path=${options.path}`
          } else {
            cookieString += `; Path=/`
          }
          if (options?.domain) {
            cookieString += `; Domain=${options.domain}`
          }
          if (options?.secure) {
            cookieString += `; Secure`
          }
          if (options?.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`
          } else {
            cookieString += `; SameSite=Lax`
          }
          
          document.cookie = cookieString
        },
        remove(name: string, options: any) {
          // Remove cookie by setting it to expire in the past
          const cookieString = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          document.cookie = cookieString
        }
      }
    }
  )
}
