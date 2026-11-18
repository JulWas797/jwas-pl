import { useEffect, useRef } from 'react'
import { playTone } from './audio.js'

const VAPOR_GLYPHS = '.,·-~:;=+*#@'
const CELL_WIDTH = 10
const CELL_HEIGHT = 16
const VAPOR_ALPHAS = [0.06, 0.11, 0.17, 0.25]

export default function BackgroundCanvas({ snakeMode, contentRef, onScoreChange, onExitSnake }) {
  const canvasRef = useRef(null)
  const snakeModeRef = useRef(snakeMode)
  const needsSnakeResetRef = useRef(false)
  const onScoreRef = useRef(onScoreChange)
  const onExitRef = useRef(onExitSnake)

  useEffect(() => {
    if (snakeMode && !snakeModeRef.current) {
      needsSnakeResetRef.current = true
    }
    snakeModeRef.current = snakeMode
  }, [snakeMode])

  useEffect(() => {
    onScoreRef.current = onScoreChange
    onExitRef.current = onExitSnake
  }, [onScoreChange, onExitSnake])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let frameId = 0
    let cols = 0
    let rows = 0
    const mouseCell = { x: -1000, y: -1000 }

    let snake = []
    let direction = { x: 1, y: 0 }
    let directionQueue = []
    let food = { x: 10, y: 10 }
    let lastStepTime = 0
    let score = 0
    let touchStart = null

    const getBlockedBounds = () => {
      const element = contentRef?.current
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return {
        minX: Math.floor(rect.left / CELL_WIDTH) - 1,
        maxX: Math.ceil(rect.right / CELL_WIDTH) + 1,
        minY: Math.floor(rect.top / CELL_HEIGHT) - 1,
        maxY: Math.ceil(rect.bottom / CELL_HEIGHT) + 1,
      }
    }

    const spawnFood = () => {
      const blocked = getBlockedBounds()
      for (let attempt = 0; attempt < 200; attempt++) {
        const fx = 1 + Math.floor(Math.random() * Math.max(1, cols - 2))
        const fy = 1 + Math.floor(Math.random() * Math.max(1, rows - 2))
        const insideText =
          blocked &&
          fx >= blocked.minX &&
          fx <= blocked.maxX &&
          fy >= blocked.minY &&
          fy <= blocked.maxY
        if (insideText) continue
        if (!snake.some((segment) => segment.x === fx && segment.y === fy)) {
          return { x: fx, y: fy }
        }
      }
      return { x: 2, y: 2 }
    }

    const resetSnake = () => {
      const startX = Math.floor(cols / 2)
      const startY = Math.max(2, Math.floor(rows * 0.18))
      snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
        { x: startX - 3, y: startY },
      ]
      direction = { x: 1, y: 0 }
      directionQueue = []
      food = spawnFood()
      score = 0
      needsSnakeResetRef.current = false
      onScoreRef.current?.(0)
    }

    const queueDirection = (dx, dy) => {
      const lastQueued =
        directionQueue.length > 0 ? directionQueue[directionQueue.length - 1] : direction
      if (lastQueued.x === -dx && lastQueued.y === -dy) return
      if (lastQueued.x === dx && lastQueued.y === dy) return
      if (directionQueue.length < 2) {
        directionQueue.push({ x: dx, y: dy })
        playTone(320, 0.018, 'square', 0.018, 260)
      }
    }

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.max(20, Math.floor(window.innerWidth / CELL_WIDTH))
      rows = Math.max(15, Math.floor(window.innerHeight / CELL_HEIGHT))
      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      ctx.textBaseline = 'top'
      if (snake.length === 0) resetSnake()
    }

    const handleMouseMove = (event) => {
      mouseCell.x = event.clientX / CELL_WIDTH
      mouseCell.y = event.clientY / CELL_HEIGHT
    }

    const handleKeyDown = (event) => {
      if (!snakeModeRef.current) return
      const key = event.key.toLowerCase()
      if (key === 'escape') {
        onExitRef.current?.()
        return
      }
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        queueDirection(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        queueDirection(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        queueDirection(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        queueDirection(1, 0)
      }
    }

    const handleTouchStart = (event) => {
      if (!snakeModeRef.current || event.touches.length === 0) return
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }

    const handleTouchMove = (event) => {
      if (snakeModeRef.current) {
        event.preventDefault()
      }
    }

    const handleTouchEnd = (event) => {
      if (!snakeModeRef.current || !touchStart || event.changedTouches.length === 0) return
      const dx = event.changedTouches[0].clientX - touchStart.x
      const dy = event.changedTouches[0].clientY - touchStart.y
      touchStart = null
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
      if (Math.abs(dx) > Math.abs(dy)) {
        queueDirection(dx > 0 ? 1 : -1, 0)
      } else {
        queueDirection(0, dy > 0 ? 1 : -1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    const vaporBuckets = Array.from({ length: VAPOR_ALPHAS.length }, () => [])

    const renderSnake = (time) => {
      if (snake.length === 0 || needsSnakeResetRef.current) {
        resetSnake()
        lastStepTime = time
      }

      if (time - lastStepTime >= 62) {
        lastStepTime = time
        if (directionQueue.length > 0) {
          direction = directionQueue.shift()
        }
        const nextHead = {
          x: (snake[0].x + direction.x + cols) % cols,
          y: (snake[0].y + direction.y + rows) % rows,
        }

        if (snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
          playTone(220, 0.14, 'sawtooth', 0.045, 70)
          resetSnake()
        } else {
          snake.unshift(nextHead)
          if (nextHead.x === food.x && nextHead.y === food.y) {
            score += 1
            onScoreRef.current?.(score)
            playTone(660, 0.04, 'square', 0.035, 990)
            food = spawnFood()
          } else {
            snake.pop()
          }
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      for (let y = 0; y < rows; y += 2) {
        for (let x = 0; x < cols; x += 2) {
          ctx.fillText('·', x * CELL_WIDTH, y * CELL_HEIGHT)
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
      ctx.fillText('*', food.x * CELL_WIDTH, food.y * CELL_HEIGHT)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      for (let i = 1; i < snake.length; i++) {
        ctx.fillText('o', snake[i].x * CELL_WIDTH, snake[i].y * CELL_HEIGHT)
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillText('@', snake[0].x * CELL_WIDTH, snake[0].y * CELL_HEIGHT)
    }

    const renderVapor = (time) => {
      const t = time * 0.00035
      for (let i = 0; i < vaporBuckets.length; i++) {
        vaporBuckets[i].length = 0
      }

      const glyphCount = VAPOR_GLYPHS.length

      for (let y = 0; y < rows; y++) {
        const ny = y * 0.075
        for (let x = 0; x < cols; x++) {
          const nx = x * 0.05

          const warpX =
            nx +
            1.6 * Math.sin(ny * 1.4 - t * 1.3) +
            0.9 * Math.cos((nx + ny) * 0.9 + t * 0.9)
          const warpY =
            ny +
            t * 0.85 +
            1.5 * Math.cos(nx * 1.3 + t * 1.1) +
            0.8 * Math.sin((nx - ny) * 1.1 - t * 1.2)

          let value =
            Math.sin(warpX * 1.5 + t) * 0.45 +
            Math.cos(warpY * 1.4 - t * 0.8) * 0.35 +
            Math.sin(warpX * 0.8 - warpY * 1.1 + t * 1.4) * 0.2

          const dx = x - mouseCell.x
          const dy = y - mouseCell.y
          const distSq = dx * dx + dy * dy
          if (distSq < 180) {
            const dist = Math.sqrt(distSq)
            value += Math.sin(dist * 0.6 - t * 4) * (1 - dist / 13.4) * 0.45
          }

          if (value > 0.08) {
            const normalized = Math.min(1, (value - 0.08) / 0.82)
            const curved = normalized * normalized
            const glyphIdx = Math.min(glyphCount - 1, Math.floor(curved * glyphCount))
            const bucketIdx = Math.min(VAPOR_ALPHAS.length - 1, Math.floor(curved * VAPOR_ALPHAS.length))
            vaporBuckets[bucketIdx].push(VAPOR_GLYPHS[glyphIdx], x * CELL_WIDTH, y * CELL_HEIGHT)
          }
        }
      }

      for (let b = 0; b < VAPOR_ALPHAS.length; b++) {
        const list = vaporBuckets[b]
        if (list.length === 0) continue
        ctx.fillStyle = `rgba(255, 255, 255, ${VAPOR_ALPHAS[b]})`
        for (let i = 0; i < list.length; i += 3) {
          ctx.fillText(list[i], list[i + 1], list[i + 2])
        }
      }
    }

    const renderFrame = (time) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (snakeModeRef.current) {
        renderSnake(time)
      } else {
        renderVapor(time)
      }
      frameId = requestAnimationFrame(renderFrame)
    }

    frameId = requestAnimationFrame(renderFrame)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [contentRef])

  return <canvas ref={canvasRef} className="vapor-bg" aria-hidden="true" />
}
