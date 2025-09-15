"use client"

import React from 'react'
import Image from 'next/image'

type LogoProps = {
  className?: string
  title?: string
}

export function Logo({ className = "h-6", title = "Verxyl Tickets" }: LogoProps) {
  // Try to load /logo.svg from public; if it fails at build, fallback to inline SVG
  // Next/Image requires width/height; use a container to control height via className
  const useExternal = true

  if (useExternal) {
    return (
      <span className={className} aria-label={title} role="img" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Image src="/logo.svg" alt={title} width={220} height={40} priority />
      </span>
    )
  }

  // Inline fallback
  return (
    <svg
      className={className}
      viewBox="0 0 220 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <g>
        <rect x="2" y="6" width="46" height="28" rx="6" fill="#0ea5e9" />
        <path d="M10 14h30M10 20h22M10 26h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(58, 9)">
        <path d="M0 0 L6 0 L12 22 L6 22 L0 0Z" fill="#e2e8f0" />
        <path d="M18 0 H26 L22 22 H14 L18 0Z" fill="#e2e8f0" />
        <path d="M32 0 H40 V6 H34 V9 H40 V22 H32 V0Z" fill="#e2e8f0" />
        <path d="M48 0 H56 V22 H48 V0Z" fill="#e2e8f0" />
        <path d="M62 0 H70 L66 10 L70 22 H62 L60 16 L58 22 H50 L56 10 L52 0 H60 L62 6 L64 0Z" fill="#e2e8f0" />
        <path d="M80 0 H88 V8 L92 0 H100 L94 11 L100 22 H92 L88 14 V22 H80 V0Z" fill="#e2e8f0" />
      </g>
    </svg>
  )
}

export default Logo


