"use client"

import * as fabric from "fabric"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Toolbar } from "./Toolbar"
import { Canvas } from "./Canvas"
import { ElementsPanel } from "./ElementsPanel"
import { FieldsPanel } from "./FieldsPanel"
import { PropertiesPanel } from "./PropertiesPanel"
import { LayersPanel } from "./LayersPanel"
import { PreviewModal } from "./PreviewModal"
import {
  createFabricObjectFromElement,
  exportCanvasToDesign,
  type FabricCustomObject,
} from "./fabric-adapter"
import type {
  DynamicFieldDefinition,
  MediaTemplateSummary,
  TemplateDesign,
  TemplateType,
} from "@/lib/template-engine/types"

interface TemplateEditorProps {
  initialTemplate: MediaTemplateSummary
  sampleData?: Record<string, string>
}

type SidebarTab = "fields" | "elements" | "layers"

export function TemplateEditor({ initialTemplate, sampleData }: TemplateEditorProps) {
  const router = useRouter()

  const [template, setTemplate] = useState<MediaTemplateSummary>(initialTemplate)
  const [name, setName] = useState(initialTemplate.name)
  const [type, setType] = useState<TemplateType>(initialTemplate.type)
  const [design, setDesign] = useState<TemplateDesign>(initialTemplate.design)
  const [canvasWidth, setCanvasWidth] = useState(initialTemplate.width)
  const [canvasHeight, setCanvasHeight] = useState(initialTemplate.height)

  const [naturalImageSize, setNaturalImageSize] = useState<{
    width: number
    height: number
  } | null>(null)

  // Editor states
  const [activeTab, setActiveTab] = useState<SidebarTab>("fields")
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [selectedObject, setSelectedObject] = useState<FabricCustomObject | null>(null)
  const [canvasObjects, setCanvasObjects] = useState<FabricCustomObject[]>([])
  const [zoom, setZoom] = useState(0.8)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Undo / Redo history
  const [history, setHistory] = useState<TemplateDesign[]>([initialTemplate.design])
  const [historyIndex, setHistoryIndex] = useState(0)

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const canvasAreaRef = useRef<HTMLDivElement>(null)

  // Auto-fit zoom calculation based on available viewport space
  const handleFitZoom = useCallback(() => {
    if (!canvasAreaRef.current) return
    const containerW = canvasAreaRef.current.clientWidth - 64
    const containerH = canvasAreaRef.current.clientHeight - 64
    if (containerW <= 0 || containerH <= 0) return

    const scaleW = containerW / (canvasWidth || 1080)
    const scaleH = containerH / (canvasHeight || 680)
    const optimal = Math.max(0.1, Math.min(scaleW, scaleH, 1.5))
    setZoom(Math.round(optimal * 100) / 100)
  }, [canvasWidth, canvasHeight])

  // Fit zoom on initial load and resize
  useEffect(() => {
    const timer = setTimeout(handleFitZoom, 50)
    window.addEventListener("resize", handleFitZoom)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleFitZoom)
    }
  }, [handleFitZoom, isDrawerOpen])

  const handleCanvasReady = (canvas: fabric.Canvas) => {
    fabricCanvasRef.current = canvas
    setCanvasObjects(canvas.getObjects() as FabricCustomObject[])
  }

  const handleImageDimensionsDetected = (w: number, h: number) => {
    setNaturalImageSize({ width: w, height: h })

    // If template has 0 elements (brand new template), auto-sync with natural image dimensions
    if ((!design.elements || design.elements.length === 0) && (w !== canvasWidth || h !== canvasHeight)) {
      setCanvasWidth(w)
      setCanvasHeight(h)
      setDesign((prev) => ({ ...prev, width: w, height: h }))
      toast.success(`Adapted canvas to image resolution: ${w} × ${h}px`)
    }
  }

  const handleUpdateCanvasDimensions = (newWidth: number, newHeight: number) => {
    setCanvasWidth(newWidth)
    setCanvasHeight(newHeight)
    setDesign((prev) => ({ ...prev, width: newWidth, height: newHeight }))
    setHasUnsavedChanges(true)

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width: newWidth, height: newHeight })
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleAdaptToImageSize = () => {
    if (!naturalImageSize) return
    handleUpdateCanvasDimensions(naturalImageSize.width, naturalImageSize.height)
    toast.success(`Canvas resized to original image: ${naturalImageSize.width} × ${naturalImageSize.height}px`)
  }

  const pushHistory = (newDesign: TemplateDesign) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      return [...trimmed, newDesign]
    })
    setHistoryIndex((prev) => prev + 1)
    setHasUnsavedChanges(true)
  }

  const handleDesignChange = (updatedDesign: TemplateDesign) => {
    setDesign(updatedDesign)
    if (fabricCanvasRef.current) {
      setCanvasObjects(fabricCanvasRef.current.getObjects() as FabricCustomObject[])
    }
  }

  const handleSelectionChange = (obj: FabricCustomObject | null) => {
    setSelectedObject(obj)
  }

  const handleTabClick = (tab: SidebarTab) => {
    if (activeTab === tab) {
      setIsDrawerOpen(!isDrawerOpen)
    } else {
      setActiveTab(tab)
      setIsDrawerOpen(true)
    }
  }

  // --- Insertion Handlers ---
  const handleAddText = async (textType: "heading" | "subheading" | "body") => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const fontSizes = { heading: 36, subheading: 22, body: 14 }
    const fontWeights: Record<string, 400 | 600 | 700> = {
      heading: 700,
      subheading: 600,
      body: 400,
    }

    const newObj = await createFabricObjectFromElement({
      id: `el_txt_${Date.now()}`,
      type: "text",
      content: textType === "heading" ? "Heading Text" : textType === "subheading" ? "Subheading" : "Body text here",
      x: 80,
      y: 80 + canvasObjects.length * 30,
      width: 300,
      height: 50,
      fontFamily: "Inter",
      fontSize: fontSizes[textType],
      fontWeight: fontWeights[textType],
      color: "#0f172a",
      textAlign: "left",
      zIndex: canvasObjects.length + 1,
    })

    if (newObj) {
      canvas.add(newObj)
      canvas.setActiveObject(newObj)
      canvas.renderAll()
      setSelectedObject(newObj)
      pushHistory(exportCanvasToDesign(canvas, design))
    }
  }

  const handleAddShape = async (shapeType: "rectangle" | "circle" | "line") => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let elementData
    if (shapeType === "circle") {
      elementData = {
        id: `el_circ_${Date.now()}`,
        type: "circle" as const,
        x: 100,
        y: 100,
        width: 120,
        height: 120,
        fill: "#3b82f6",
        zIndex: canvasObjects.length + 1,
      }
    } else if (shapeType === "line") {
      elementData = {
        id: `el_line_${Date.now()}`,
        type: "line" as const,
        x: 100,
        y: 100,
        width: 250,
        height: 2,
        color: "#000000",
        strokeWidth: 2,
        zIndex: canvasObjects.length + 1,
      }
    } else {
      elementData = {
        id: `el_rect_${Date.now()}`,
        type: "rectangle" as const,
        x: 100,
        y: 100,
        width: 200,
        height: 120,
        fill: "#3b82f6",
        borderRadius: 8,
        zIndex: canvasObjects.length + 1,
      }
    }

    const newObj = await createFabricObjectFromElement(elementData)
    if (newObj) {
      canvas.add(newObj)
      canvas.setActiveObject(newObj)
      canvas.renderAll()
      setSelectedObject(newObj)
      pushHistory(exportCanvasToDesign(canvas, design))
    }
  }

  const handleAddImage = async (customSrc?: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const newObj = await createFabricObjectFromElement({
      id: `el_img_${Date.now()}`,
      type: "image",
      src:
        customSrc ||
        "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E",
      x: 100,
      y: 100,
      width: 140,
      height: 140,
      objectFit: "cover",
      borderRadius: 12,
      zIndex: canvasObjects.length + 1,
    })

    if (newObj) {
      canvas.add(newObj)
      canvas.setActiveObject(newObj)
      canvas.renderAll()
      setSelectedObject(newObj)
      pushHistory(exportCanvasToDesign(canvas, design))
    }
  }

  const handleAddQRCode = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const newObj = await createFabricObjectFromElement({
      id: `el_qr_${Date.now()}`,
      type: "qr",
      data: "https://dpics.org",
      x: 100,
      y: 100,
      width: 120,
      height: 120,
      color: "#000000",
      backgroundColor: "#ffffff",
      zIndex: canvasObjects.length + 1,
    })

    if (newObj) {
      canvas.add(newObj)
      canvas.setActiveObject(newObj)
      canvas.renderAll()
      setSelectedObject(newObj)
      pushHistory(exportCanvasToDesign(canvas, design))
    }
  }

  const handleInsertField = async (field: DynamicFieldDefinition) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const sampleVal = sampleData?.[field.key] || field.exampleValue

    let elementData
    if (field.type === "image") {
      elementData = {
        id: `el_field_${field.key}_${Date.now()}`,
        type: "image" as const,
        field: field.key,
        src: sampleVal,
        x: 100,
        y: 100,
        width: 160,
        height: 160,
        borderRadius: 80, // circle avatar default
        objectFit: "cover" as const,
        zIndex: canvasObjects.length + 1,
      }
    } else if (field.type === "qr") {
      elementData = {
        id: `el_field_${field.key}_${Date.now()}`,
        type: "qr" as const,
        field: field.key,
        data: sampleVal,
        x: 100,
        y: 100,
        width: 120,
        height: 120,
        color: "#000000",
        backgroundColor: "#ffffff",
        zIndex: canvasObjects.length + 1,
      }
    } else {
      elementData = {
        id: `el_field_${field.key}_${Date.now()}`,
        type: "text" as const,
        field: field.key,
        content: `{{${field.key}}}`,
        x: 100,
        y: 100 + canvasObjects.length * 20,
        width: 280,
        height: 40,
        fontFamily: "Inter",
        fontSize: 22,
        fontWeight: 600 as const,
        color: "#0f172a",
        textAlign: "left" as const,
        zIndex: canvasObjects.length + 1,
      }
    }

    const newObj = await createFabricObjectFromElement(elementData, {
      ...sampleData,
      [field.key]: sampleVal,
    })

    if (newObj) {
      canvas.add(newObj)
      canvas.setActiveObject(newObj)
      canvas.renderAll()
      setSelectedObject(newObj)
      pushHistory(exportCanvasToDesign(canvas, design))
      toast.success(`Added dynamic field {{${field.key}}}`)
    }
  }

  // --- Property Updates ---
  const handleUpdateProperty = (key: string, value: unknown) => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !selectedObject) return

    const custom = selectedObject.customData || { id: "", type: "rectangle" as const }

    if (key === "locked") {
      const locked = Boolean(value)
      selectedObject.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      })
    } else if (key === "field") {
      selectedObject.customData = { ...custom, field: (value as string) || undefined }
    } else if (key === "borderRadius") {
      const radius = Number(value)
      selectedObject.customData = { ...custom, borderRadius: radius }
      if (selectedObject instanceof fabric.Rect) {
        selectedObject.set({ rx: radius, ry: radius })
      }
    } else if (key === "width") {
      selectedObject.set({ scaleX: 1, width: Number(value) })
    } else if (key === "height") {
      selectedObject.set({ scaleY: 1, height: Number(value) })
    } else if (key === "rx") {
      if (selectedObject instanceof fabric.Rect) {
        selectedObject.set({ rx: Number(value), ry: Number(value) })
      }
    } else {
      selectedObject.set(key as keyof fabric.FabricObject, value as never)
    }

    canvas.renderAll()
    setSelectedObject(selectedObject)
    setDesign(exportCanvasToDesign(canvas, design))
    pushHistory(exportCanvasToDesign(canvas, design))
  }

  const handleDuplicate = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !selectedObject) return

    const el = exportCanvasToDesign(canvas, design).elements.find(
      (e) => e.id === selectedObject.customData?.id
    )
    if (!el) return

    const clonedEl = {
      ...el,
      id: `el_${Date.now()}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: canvasObjects.length + 1,
    }

    const clonedObj = await createFabricObjectFromElement(clonedEl, sampleData)
    if (clonedObj) {
      canvas.add(clonedObj)
      canvas.setActiveObject(clonedObj)
      canvas.renderAll()
      setSelectedObject(clonedObj)
      pushHistory(exportCanvasToDesign(canvas, design))
    }
  }

  const handleDelete = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !selectedObject) return

    canvas.remove(selectedObject)
    canvas.discardActiveObject()
    canvas.renderAll()
    setSelectedObject(null)
    pushHistory(exportCanvasToDesign(canvas, design))
  }

  const handleBringForward = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !selectedObject) return
    canvas.bringObjectForward(selectedObject)
    canvas.renderAll()
    pushHistory(exportCanvasToDesign(canvas, design))
  }

  const handleSendBackward = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !selectedObject) return
    canvas.sendObjectBackwards(selectedObject)
    canvas.renderAll()
    pushHistory(exportCanvasToDesign(canvas, design))
  }

  const handleToggleBehindTemplate = (targetObj?: FabricCustomObject, behind?: boolean) => {
    const canvas = fabricCanvasRef.current
    const obj = targetObj || selectedObject
    if (!canvas || !obj) return

    const isBehind = behind !== undefined ? behind : !obj.customData?.behindTemplate

    obj.customData = {
      id: obj.customData?.id || `el_${Date.now()}`,
      type: obj.customData?.type || "rectangle",
      ...obj.customData,
      behindTemplate: isBehind,
    }

    const frameObj = canvas
      .getObjects()
      .find((o) => (o as FabricCustomObject).isTemplateFrame)

    if (isBehind) {
      canvas.sendObjectToBack(obj)
    } else {
      canvas.bringObjectToFront(obj)
    }

    // Keep frameObj placed between all behind objects and all front objects
    if (frameObj) {
      const objects = canvas.getObjects() as FabricCustomObject[]
      const firstFrontIndex = objects.findIndex(
        (o) => !o.isTemplateFrame && !o.customData?.behindTemplate
      )
      const currentFrameIndex = objects.indexOf(frameObj as FabricCustomObject)

      if (firstFrontIndex !== -1 && currentFrameIndex > firstFrontIndex) {
        while (canvas.getObjects().indexOf(frameObj) > firstFrontIndex) {
          canvas.sendObjectBackwards(frameObj)
        }
      }
    }

    canvas.requestRenderAll()
    if (selectedObject === obj) {
      setSelectedObject(obj)
    }
    setCanvasObjects(
      canvas.getObjects().filter((o) => !(o as FabricCustomObject).isTemplateFrame) as FabricCustomObject[]
    )
    const updated = exportCanvasToDesign(canvas, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundMediaId: template.mediaId,
      backgroundMediaUrl: template.media?.url,
    })
    setDesign(updated)
    pushHistory(updated)
    toast.success(
      isBehind
        ? "Element placed behind template frame"
        : "Element placed in front of template frame"
    )
  }

  // --- Save / Persist ---
  const handleSave = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setIsSaving(true)
    const currentDesign = exportCanvasToDesign(canvas, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundMediaId: template.mediaId,
      backgroundMediaUrl: template.media?.url,
    })

    try {
      const res = await fetch(`/api/media/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          width: canvasWidth,
          height: canvasHeight,
          design: currentDesign,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to save template")
      }

      const updated = await res.json()
      setTemplate(updated)
      setHasUnsavedChanges(false)
      toast.success("Template saved successfully!")
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save template"
      toast.error(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <Toolbar
        name={name}
        onNameChange={(val) => {
          setName(val)
          setHasUnsavedChanges(true)
        }}
        type={type}
        onTypeChange={(val) => {
          setType(val)
          setHasUnsavedChanges(true)
        }}
        width={canvasWidth}
        height={canvasHeight}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitZoom={handleFitZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={() => {
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1)
          }
        }}
        onRedo={() => {
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1)
          }
        }}
        onOpenPreview={() => {
          if (fabricCanvasRef.current) {
            const currentDesign = exportCanvasToDesign(fabricCanvasRef.current, {
              width: canvasWidth,
              height: canvasHeight,
              backgroundMediaId: template.mediaId,
              backgroundMediaUrl: template.media?.url,
            })
            setDesign(currentDesign)
          }
          setShowPreviewModal(true)
        }}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Workbench Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sub-Navigation Bar */}
        <aside className="flex w-14 flex-col items-center gap-2 border-r border-border bg-card py-4 z-20 shrink-0">
          <button
            type="button"
            onClick={() => handleTabClick("fields")}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-colors ${
              isDrawerOpen && activeTab === "fields"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Dynamic Database Fields"
          >
            <Database className="size-4" />
            <span>Fields</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("elements")}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-colors ${
              isDrawerOpen && activeTab === "elements"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Static Elements & Shapes"
          >
            <Boxes className="size-4" />
            <span>Elements</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("layers")}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-colors ${
              isDrawerOpen && activeTab === "layers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Layers Order & Lock"
          >
            <Layers className="size-4" />
            <span>Layers</span>
          </button>
        </aside>

        {/* Left Tab Drawer Panel (Collapsible) */}
        {isDrawerOpen && (
          <aside className="w-72 border-r border-border bg-background flex flex-col z-10 shrink-0">
            {activeTab === "fields" && (
              <FieldsPanel
                type={type}
                sampleData={sampleData}
                onInsertField={handleInsertField}
              />
            )}
            {activeTab === "elements" && (
              <ElementsPanel
                onAddText={handleAddText}
                onAddShape={handleAddShape}
                onAddImage={handleAddImage}
                onAddQRCode={handleAddQRCode}
              />
            )}
            {activeTab === "layers" && (
              <LayersPanel
                objects={canvasObjects}
                selectedObject={selectedObject}
                onSelectObject={(obj) => {
                  if (fabricCanvasRef.current) {
                    fabricCanvasRef.current.setActiveObject(obj)
                    fabricCanvasRef.current.renderAll()
                    setSelectedObject(obj)
                  }
                }}
                onToggleVisibility={(obj) => {
                  obj.set("visible", !obj.visible)
                  fabricCanvasRef.current?.renderAll()
                  setCanvasObjects([...canvasObjects])
                }}
                onToggleLock={(obj) => {
                  const locked = !obj.lockMovementX
                  obj.set({
                    lockMovementX: locked,
                    lockMovementY: locked,
                    lockRotation: locked,
                    lockScalingX: locked,
                    lockScalingY: locked,
                  })
                  fabricCanvasRef.current?.renderAll()
                  setCanvasObjects([...canvasObjects])
                }}
                onDeleteObject={(obj) => {
                  fabricCanvasRef.current?.remove(obj)
                  fabricCanvasRef.current?.renderAll()
                  if (selectedObject === obj) setSelectedObject(null)
                }}
                onToggleBehindTemplate={handleToggleBehindTemplate}
              />
            )}
          </aside>
        )}

        {/* Interactive Full Viewport Canvas Area */}
        <main ref={canvasAreaRef} className="flex-1 flex overflow-hidden min-w-0">
          <Canvas
            design={{ ...design, width: canvasWidth, height: canvasHeight }}
            zoom={zoom}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            sampleData={sampleData}
            onSelectionChange={handleSelectionChange}
            onDesignChange={handleDesignChange}
            onCanvasReady={handleCanvasReady}
            onImageDimensionsDetected={handleImageDimensionsDetected}
          />
        </main>

        {/* Right Properties Panel */}
        <aside className="w-80 border-l border-border bg-background flex flex-col z-10 shrink-0">
          <PropertiesPanel
            selectedObject={selectedObject}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            naturalImageWidth={naturalImageSize?.width}
            naturalImageHeight={naturalImageSize?.height}
            onUpdateCanvasDimensions={handleUpdateCanvasDimensions}
            onAdaptToImageSize={handleAdaptToImageSize}
            onUpdateProperty={handleUpdateProperty}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onToggleBehindTemplate={(behind) => handleToggleBehindTemplate(undefined, behind)}
          />
        </aside>
      </div>

      {/* Live Server Preview Modal */}
      {showPreviewModal && (
        <PreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          template={{
            ...template,
            width: canvasWidth,
            height: canvasHeight,
            design: fabricCanvasRef.current
              ? exportCanvasToDesign(fabricCanvasRef.current, {
                  width: canvasWidth,
                  height: canvasHeight,
                  backgroundMediaId: template.mediaId,
                  backgroundMediaUrl: template.media?.url,
                })
              : { ...design, width: canvasWidth, height: canvasHeight },
          }}
        />
      )}
    </div>
  )
}
