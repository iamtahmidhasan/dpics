"use client"

import { useMemo, useState } from "react"
import { Image as ImageIcon, Plus, QrCode, Search, Type } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFieldsForTemplateType } from "@/lib/template-engine/fields"
import type { DynamicFieldDefinition, TemplateType } from "@/lib/template-engine/types"

interface FieldsPanelProps {
  type: TemplateType
  onInsertField: (field: DynamicFieldDefinition) => void
}

export function FieldsPanel({ type, onInsertField }: FieldsPanelProps) {
  const [search, setSearch] = useState("")

  const allFields = useMemo(() => getFieldsForTemplateType(type), [type])

  const filteredFields = useMemo(() => {
    if (!search.trim()) return allFields
    const q = search.toLowerCase().trim()
    return allFields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.label.en.toLowerCase().includes(q) ||
        f.label.bn.includes(q) ||
        f.category.toLowerCase().includes(q)
    )
  }, [allFields, search])

  // Group fields by category
  const categories = useMemo(() => {
    const map = new Map<string, DynamicFieldDefinition[]>()
    for (const field of filteredFields) {
      const list = map.get(field.category) || []
      list.push(field)
      map.set(field.category, list)
    }
    return Array.from(map.entries())
  }, [filteredFields])

  const getFieldIcon = (fieldType: DynamicFieldDefinition["type"]) => {
    switch (fieldType) {
      case "image":
        return <ImageIcon className="size-3.5 text-blue-500" />
      case "qr":
        return <QrCode className="size-3.5 text-amber-500" />
      default:
        return <Type className="size-3.5 text-emerald-500" />
    }
  }

  return (
    <div className="flex h-full flex-col space-y-3 p-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search database fields..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No fields match your search
          </div>
        ) : (
          categories.map(([category, fields]) => (
            <div key={category} className="space-y-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-1">
                {fields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => onInsertField(field)}
                    className="group flex w-full items-center justify-between rounded-md border border-border/60 bg-card p-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFieldIcon(field.type)}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-medium text-foreground">
                          {field.label.en}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground font-mono">
                          {`{{${field.key}}}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2">
                      <Badge variant="muted" className="text-[9px] uppercase px-1 py-0">
                        {field.type}
                      </Badge>
                      <Plus className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
