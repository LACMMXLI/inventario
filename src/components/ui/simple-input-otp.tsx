"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleInputOTPProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  className?: string
}

export function SimpleInputOTP({ 
  value, 
  onChange, 
  maxLength = 6,
  className 
}: SimpleInputOTPProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => {
    console.log("SimpleInputOTP - valor actualizado:", value)
  }, [value])

  const handleChange = (index: number, val: string) => {
    console.log(`handleChange llamado - index: ${index}, val: "${val}", value actual: "${value}"`)
    
    if (val.length > 1) {
      // Handle paste
      const pastedValue = val.slice(0, maxLength - index)
      const newValue = value.slice(0, index) + pastedValue
      console.log(`Paste - newValue: "${newValue}"`)
      onChange(newValue.padEnd(maxLength, ''))
      
      // Focus next input if there is one
      if (index + pastedValue.length < maxLength) {
        inputRefs.current[index + pastedValue.length]?.focus()
      }
    } else if (val === '') {
      // Handle backspace
      const newValue = value.slice(0, index) + value.slice(index + 1)
      console.log(`Backspace - newValue: "${newValue}"`)
      onChange(newValue)
      
      // Focus previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else {
      // Handle single digit input
      const newValue = value.slice(0, index) + val + value.slice(index + 1)
      console.log(`Single digit - newValue: "${newValue}"`)
      onChange(newValue)
      
      // Focus next input
      if (index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, maxLength)
    onChange(pastedData.padEnd(maxLength, ''))
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: maxLength }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg",
            "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200",
            "transition-colors duration-200"
          )}
        />
      ))}
    </div>
  )
}