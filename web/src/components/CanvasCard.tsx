import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LockClosedIcon, GlobeIcon, StackIcon } from '@radix-ui/react-icons'
import { formatDistanceToNow } from 'date-fns'
import type { Canvas } from '@/lib/api'

interface CanvasCardProps {
  canvas: Canvas
}

export function CanvasCard({ canvas }: CanvasCardProps) {
  const { id, title, createdAt, updatedAt, blocksCount, isPublic } = canvas

  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{title || 'Untitled Canvas'}</CardTitle>
          {isPublic ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500 text-white ml-2">
              <GlobeIcon className="h-3 w-3 mr-1" />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground ml-2">
              <LockClosedIcon className="h-3 w-3 mr-1" />
              Private
            </span>
          )}
        </div>
        <CardDescription>
          Last modified {formatDistanceToNow(new Date(updatedAt || createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex justify-between items-center">
        <div className="flex items-center text-muted-foreground text-sm">
          <StackIcon className="h-4 w-4 mr-1" />
          {blocksCount ?? 0} {blocksCount === 1 ? "block" : "blocks"}
        </div>
        <Link
          to="/canvas/$canvasId"
          params={{ canvasId: id }}
          className="w-1/2"
        >
          <Button variant="outline" className="w-full">
            Open
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
