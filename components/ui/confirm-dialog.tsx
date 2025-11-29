"use client"

import * as React from "react"
import { Button } from "./button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description: string
    variant?: "default" | "destructive"
    onConfirm: () => void
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const confirm = React.useCallback(
    (options: {
      title: string
      description: string
      variant?: "default" | "destructive"
    }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          ...options,
          onConfirm: () => resolve(true),
        })
      })
    },
    []
  )

  const ConfirmComponent = React.useCallback(
    () => (
      <ConfirmDialog
        {...state}
        onOpenChange={(open) => {
          setState((prev) => ({ ...prev, open }))
          if (!open) state.onConfirm()
        }}
      />
    ),
    [state]
  )

  return { confirm, ConfirmDialog: ConfirmComponent }
}
