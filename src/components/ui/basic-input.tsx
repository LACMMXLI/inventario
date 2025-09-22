"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BasicInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  placeholder?: string
  className?: string
}

export function BasicInput({ 
  value, 
  onChange, 
  maxLength = 6,
  placeholder = "Ingresa el código",
  className 
}: BasicInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '') // Solo números
    if (newValue.length <= maxLength) {
      onChange(newValue)
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(
        "w-full px-4 py-3 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg",
        "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200",
        "transition-colors duration-200",
        className
      )}
    />
  )
}