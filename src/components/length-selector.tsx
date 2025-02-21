"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SummaryLength = "tweet" | "two_sentences" | "bullets" | "brief" | "detailed"

interface LengthSelectorProps {
  value: SummaryLength
  onChange: (value: SummaryLength) => void
}

export function LengthSelector({ value, onChange }: LengthSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select length" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tweet">Tweet (≤140 chars)</SelectItem>
        <SelectItem value="two_sentences">Two Sentences</SelectItem>
        <SelectItem value="bullets">Bullet Points</SelectItem>
        <SelectItem value="brief">Two Paragraphs</SelectItem>
        <SelectItem value="detailed">One Page</SelectItem>
      </SelectContent>
    </Select>
  )
} 