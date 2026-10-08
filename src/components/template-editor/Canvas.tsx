"use client"

import * as fabric from "fabric"
import { useEffect, useRef, useState } from "react"
import {
  createFabricObjectFromElement,
  exportCanvasToDesign,
  type FabricCustomObject,
} from "./fabric-adapter"
import type { TemplateDesign } from "@/lib/template-engine/types"

interface CanvasProps {
  design: TemplateDesign
  zoom: number
  onZoomChange?: (newZoom: number) => void
  toolMode?: "select" | "hand"
  onToolModeChange?: (mode: "select" | "hand") => void
  showGrid: boolean
  snapToGrid: boolean
  sampleData?: Record<string, string>
  onSelectionChange: (obj: FabricCustomObject | null) => void
  onDesignChange: (design: TemplateDesign) => void
  onCanvasReady: (canvas: fabric.Canvas) => void
  onImageDimensionsDetected?: (width: number, height: number) => void
}

export function Canvas({
  design,
  zoom,
  onZoomChange,
  toolMode = "select",
  onToolModeChange,
  showGrid,
  snapToGrid,
  sampleData,
  onSelectionChange,
  onDesignChange,
  onCanvasReady,
  onImageDimensionsDetected,
}: CanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const isInitializedRef = useRef(false)

  // Keep refs for callback handlers to prevent stale closures without re-subscribing
  const designRef = useRef(design)
  designRef.current = design
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange
  const sampleDataRef = useRef(sampleData)
  sampleDataRef.current = sampleData
  const onDesignChangeRef = useRef(onDesignChange)
  onDesignChangeRef.current = onDesignChange
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  const snapToGridRef = useRef(snapToGrid)
  snapToGridRef.current = snapToGrid
  const onImageDimensionsDetectedRef = useRef(onImageDimensionsDetected)
  onImageDimensionsDetectedRef.current = onImageDimensionsDetected

  // Tool mode, pan offset and shortcut refs
  const toolModeRef = useRef(toolMode)
  toolModeRef.current = toolMode
  const onToolModeChangeRef = useRef(onToolModeChange)
  onToolModeChangeRef.current = onToolModeChange
  const isSpacePressedRef = useRef(false)

  // 2D Pan Offset state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const panOffsetRef = useRef({ x: 0, y: 0 })
  panOffsetRef.current = panOffset

  // 1. Initialize Fabric Canvas once on mount
  useEffect(() => {
    if (!canvasElRef.current || isInitializedRef.current) return
    isInitializedRef.current = true

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: design.width,
      height: design.height,
      backgroundColor: design.backgroundColor || "#ffffff",
      preserveObjectStacking: true,
      selection: toolModeRef.current !== "hand",
    })

    fabricRef.current = canvas
    onCanvasReady(canvas)

    // Selection listeners
    const handleSelection = () => {
      const active = canvas.getActiveObject() as FabricCustomObject | null
      onSelectionChangeRef.current(active)
    }

    const handleModified = () => {
      const currentDesign = designRef.current
      const updatedDesign = exportCanvasToDesign(canvas, {
        width: currentDesign.width,
        height: currentDesign.height,
        backgroundMediaId: currentDesign.backgroundMediaId,
        backgroundMediaUrl: currentDesign.backgroundMediaUrl,
        backgroundColor: currentDesign.backgroundColor,
      })
      onDesignChangeRef.current(updatedDesign)
    }

    // Snapping logic during movement
    const handleMoving = (e: fabric.TEvent<fabric.TPointerEvent> & { target?: fabric.FabricObject }) => {
      if (!snapToGridRef.current || !e.target) return
      const grid = 20
      e.target.set({
        left: Math.round((e.target.left || 0) / grid) * grid,
        top: Math.round((e.target.top || 0) / grid) * grid,
      })
    }

    canvas.on("selection:created", handleSelection)
    canvas.on("selection:updated", handleSelection)
    canvas.on("selection:cleared", handleSelection)
    canvas.on("object:modified", handleModified)
    canvas.on("object:added", handleModified)
    canvas.on("object:removed", handleModified)
    canvas.on("object:moving", handleMoving)

    // Load initial background image & elements
    const loadInitialState = async () => {
      let frameObj: (fabric.FabricImage & { isTemplateFrame?: boolean }) | null = null

      if (design.backgroundMediaUrl) {
        try {
          const bgImg = (await fabric.FabricImage.fromURL(design.backgroundMediaUrl, {
            crossOrigin: "anonymous",
          })) as fabric.FabricImage & { isTemplateFrame?: boolean }

          const naturalW = bgImg.width || design.width
          const naturalH = bgImg.height || design.height

          if (onImageDimensionsDetectedRef.current) {
            onImageDimensionsDetectedRef.current(naturalW, naturalH)
          }

          bgImg.set({
            left: 0,
            top: 0,
            originX: "left",
            originY: "top",
            scaleX: design.width / naturalW,
            scaleY: design.height / naturalH,
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            hoverCursor: "default",
          })
          bgImg.isTemplateFrame = true
          frameObj = bgImg
        } catch (err) {
          console.warn("Failed to load initial background image:", err)
        }
      }

      const elements = design.elements || []
      const underElements = elements.filter((el) => el.behindTemplate)
      const overElements = elements.filter((el) => !el.behindTemplate)

      // 1. Add under-frame elements first
      for (const el of underElements) {
        const obj = await createFabricObjectFromElement(el, sampleDataRef.current)
        if (obj) {
          canvas.add(obj)
        }
      }

      // 2. Add template frame image in middle
      if (frameObj) {
        canvas.add(frameObj)
      }

      // 3. Add over-frame elements on top
      for (const el of overElements) {
        const obj = await createFabricObjectFromElement(el, sampleDataRef.current)
        if (obj) {
          canvas.add(obj)
        }
      }

      canvas.requestRenderAll()
    }

    loadInitialState()

    return () => {
      canvas.dispose()
      fabricRef.current = null
      isInitializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. React to toolMode changes (Hand vs Select)
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const isHand = toolMode === "hand"
    canvas.selection = !isHand
    canvas.defaultCursor = isHand ? "grab" : "default"
    canvas.hoverCursor = isHand ? "grab" : "move"

    if (isHand) {
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    } else {
      canvas.calcOffset()
    }
  }, [toolMode])

  // 3. React to canvas width/height changes dynamically
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.setDimensions({
      width: design.width,
      height: design.height,
    })

    const frameObj = canvas
      .getObjects()
      .find((o) => (o as FabricCustomObject).isTemplateFrame) as fabric.FabricImage | undefined

    if (frameObj) {
      const naturalW = frameObj.width || design.width
      const naturalH = frameObj.height || design.height
      frameObj.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        scaleX: design.width / naturalW,
        scaleY: design.height / naturalH,
      })
    }

    canvas.requestRenderAll()
  }, [design.width, design.height])

  // 4. React to background media URL changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !isInitializedRef.current) return

    const existingFrame = canvas
      .getObjects()
      .find((o) => (o as FabricCustomObject).isTemplateFrame)
    if (existingFrame) {
      canvas.remove(existingFrame)
    }

    if (!design.backgroundMediaUrl) {
      canvas.requestRenderAll()
      return
    }

    fabric.FabricImage.fromURL(design.backgroundMediaUrl, {
      crossOrigin: "anonymous",
    })
      .then((bgImg) => {
        if (!fabricRef.current) return
        const naturalW = bgImg.width || design.width
        const naturalH = bgImg.height || design.height

        if (onImageDimensionsDetectedRef.current) {
          onImageDimensionsDetectedRef.current(naturalW, naturalH)
        }

        const frameObj = bgImg as fabric.FabricImage & { isTemplateFrame?: boolean }
        frameObj.set({
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          scaleX: design.width / naturalW,
          scaleY: design.height / naturalH,
          selectable: false,
          evented: false,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
          hoverCursor: "default",
        })
        frameObj.isTemplateFrame = true

        // Insert frame above all behindTemplate elements
        const objects = canvas.getObjects() as FabricCustomObject[]
        const firstFrontIndex = objects.findIndex(
          (o) => !o.isTemplateFrame && !o.customData?.behindTemplate
        )
        if (firstFrontIndex !== -1) {
          canvas.insertAt(firstFrontIndex, frameObj)
        } else {
          canvas.add(frameObj)
        }

        canvas.requestRenderAll()
      })
      .catch((err) => {
        console.warn("Failed to update background image:", err)
      })
  }, [design.backgroundMediaUrl, design.width, design.height])

  // 5. React to background color changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.backgroundColor = design.backgroundColor || "#ffffff"
    canvas.requestRenderAll()
  }, [design.backgroundColor])

  // 6. Desktop Mouse Wheel Zoom, Spacebar Shortcuts & Hand Pan Tool (Direct Translation)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isPanning = false
    let startX = 0
    let startY = 0
    let initialPanX = 0
    let initialPanY = 0

    const isHandActive = () =>
      toolModeRef.current === "hand" || isSpacePressedRef.current

    const handleWheel = (e: WheelEvent) => {
      if (!onZoomChangeRef.current) return
      e.preventDefault()

      const step = e.ctrlKey ? 0.02 : 0.05
      const delta = e.deltaY < 0 ? step : -step
      const currentZoom = zoomRef.current
      const nextZoom = Math.min(Math.max(0.15, Math.round((currentZoom + delta) * 100) / 100), 3.0)
      onZoomChangeRef.current(nextZoom)
    }

    const startPan = (clientX: number, clientY: number) => {
      isPanning = true
      startX = clientX
      startY = clientY
      initialPanX = panOffsetRef.current.x
      initialPanY = panOffsetRef.current.y
      container.style.cursor = "grabbing"
      if (fabricRef.current) {
        fabricRef.current.defaultCursor = "grabbing"
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Pan on: Hand tool active OR Middle click (button 1) OR Alt+LeftClick OR Spacebar+LeftClick
      if (
        isHandActive() ||
        e.button === 1 ||
        (e.button === 0 && (e.altKey || isSpacePressedRef.current))
      ) {
        startPan(e.clientX, e.clientY)
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return
      e.preventDefault()
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const nextPan = { x: initialPanX + dx, y: initialPanY + dy }
      panOffsetRef.current = nextPan
      setPanOffset(nextPan)
    }

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false
        const cursor = isHandActive() ? "grab" : "default"
        container.style.cursor = cursor
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = cursor
          fabricRef.current.calcOffset()
        }
      }
    }

    // Touch support for Hand tool / Panning on mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (isHandActive() && e.touches.length === 1) {
        const touch = e.touches[0]
        startPan(touch.clientX, touch.clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPanning || e.touches.length !== 1) return
      const touch = e.touches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const nextPan = { x: initialPanX + dx, y: initialPanY + dy }
      panOffsetRef.current = nextPan
      setPanOffset(nextPan)
    }

    const handleTouchEnd = () => {
      isPanning = false
      if (fabricRef.current) {
        fabricRef.current.calcOffset()
      }
    }

    // Keyboard shortcuts (Space to pan, H for hand tool, V for select tool)
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      if (activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable) {
        return
      }

      if (e.code === "Space" && !e.repeat) {
        isSpacePressedRef.current = true
        container.style.cursor = "grab"
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = "grab"
        }
        e.preventDefault()
      } else if ((e.key === "h" || e.key === "H") && onToolModeChangeRef.current) {
        onToolModeChangeRef.current("hand")
      } else if ((e.key === "v" || e.key === "V") && onToolModeChangeRef.current) {
        onToolModeChangeRef.current("select")
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false
        const cursor = toolModeRef.current === "hand" ? "grab" : "default"
        container.style.cursor = cursor
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = cursor
          fabricRef.current.calcOffset()
        }
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    container.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      container.removeEventListener("mousedown", handleMouseDown, { capture: true })
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const isHand = toolMode === "hand"

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40 p-4 sm:p-8 select-none min-h-0 w-full h-full ${
        isHand ? "cursor-grab" : ""
      }`}
      style={{
        backgroundImage: showGrid
          ? "radial-gradient(circle, var(--border) 1px, transparent 1px)"
          : undefined,
        backgroundSize: showGrid ? "24px 24px" : undefined,
      }}
    >
      <div
        className="relative flex items-center justify-center m-auto shrink-0"
        style={{
          width: `${Math.round(design.width * zoom)}px`,
          height: `${Math.round(design.height * zoom)}px`,
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
          willChange: "transform",
        }}
      >
        <div
          className="relative shadow-2xl rounded-sm overflow-hidden bg-background border border-border/80 shrink-0 origin-center"
          style={{
            width: `${design.width}px`,
            height: `${design.height}px`,
            transform: `scale(${zoom})`,
          }}
        >
          <canvas ref={canvasElRef} />

          {/* Invisible event shield when Hand tool is active to prevent Fabric objects from blocking pan gestures */}
          {isHand && (
            <div className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing" />
          )}
        </div>
      </div>
    </div>
  )
}
