"use client"

import * as fabric from "fabric"
import { useEffect, useRef } from "react"
import {
  createFabricObjectFromElement,
  exportCanvasToDesign,
  type FabricCustomObject,
} from "./fabric-adapter"
import type { TemplateDesign } from "@/lib/template-engine/types"

interface CanvasProps {
  design: TemplateDesign
  zoom: number
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

  // 1. Initialize Fabric Canvas once on mount
  useEffect(() => {
    if (!canvasElRef.current || isInitializedRef.current) return
    isInitializedRef.current = true

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: design.width,
      height: design.height,
      backgroundColor: design.backgroundColor || "#ffffff",
      preserveObjectStacking: true,
      selection: true,
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

  // 2. React to canvas width/height changes dynamically
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

  // 3. React to background media URL changes
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

  // 4. React to background color changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.backgroundColor = design.backgroundColor || "#ffffff"
    canvas.requestRenderAll()
  }, [design.backgroundColor])

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-auto bg-muted/40 p-12 select-none min-h-0"
      style={{
        backgroundImage: showGrid
          ? "radial-gradient(circle, var(--border) 1px, transparent 1px)"
          : undefined,
        backgroundSize: showGrid ? "24px 24px" : undefined,
      }}
    >
      <div
        style={{
          width: `${design.width * zoom}px`,
          height: `${design.height * zoom}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded-sm overflow-hidden bg-background border border-border/80 shrink-0"
          style={{
            width: `${design.width}px`,
            height: `${design.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  )
}
