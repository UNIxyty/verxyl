import { SVGProps } from 'react'

export function N8NIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      {...props}
    >
      {/* N8N Logo - Simplified version */}
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1"/>
      <path 
        d="M25 35 L25 65 L35 65 L35 50 L65 50 L65 65 L75 65 L75 35 L65 35 L65 45 L35 45 L35 35 Z" 
        fill="currentColor"
      />
      <circle cx="30" cy="30" r="3" fill="currentColor"/>
      <circle cx="70" cy="30" r="3" fill="currentColor"/>
      <circle cx="30" cy="70" r="3" fill="currentColor"/>
      <circle cx="70" cy="70" r="3" fill="currentColor"/>
    </svg>
  )
}
