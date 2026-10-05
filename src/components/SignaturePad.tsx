'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: (type?: string) => string
}

interface SignaturePadProps {
  penColor?: string
  className?: string
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  function SignaturePad({ penColor = 'black', className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasDrawn(false)
      },
      isEmpty() {
        return !hasDrawn
      },
      toDataURL(type = 'image/png') {
        return canvasRef.current?.toDataURL(type) || ''
      },
    }))

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(dpr, dpr)
        }
      }
      resize()
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }, [])

    function getPoint(e: React.TouchEvent | React.MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        }
      }
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      }
    }

    function startDraw(e: React.TouchEvent | React.MouseEvent) {
      e.preventDefault()
      setIsDrawing(true)
      setHasDrawn(true)
      lastPoint.current = getPoint(e)
    }

    function draw(e: React.TouchEvent | React.MouseEvent) {
      if (!isDrawing) return
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !lastPoint.current) return
      const point = getPoint(e)
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(point.x, point.y)
      ctx.strokeStyle = penColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      lastPoint.current = point
    }

    function endDraw() {
      setIsDrawing(false)
      lastPoint.current = null
    }

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '200px', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    )
  }
)

export default SignaturePad
