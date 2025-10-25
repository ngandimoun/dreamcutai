"use client"

import { LibraryHeader } from "@/components/library-header"
import { LibraryGrid } from "@/components/library-grid"

export function LibraryInterface() {
  return (
    <div className="space-y-6">
      <LibraryHeader />
      <LibraryGrid />
    </div>
  )
}
