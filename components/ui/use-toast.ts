"use client"

import { toast as sonnerToast } from "sonner"

type ToastAction = {
  label: string
  onClick: () => void
}

type ToastOptions = {
  title?: string
  description?: string
  action?: ToastAction
  duration?: number
  variant?: "default" | "destructive" | "success"
}

const toast = (options: ToastOptions | string) => {
  if (typeof options === "string") {
    return sonnerToast(options)
  }

  const { title, description, action, duration, variant = "default" } = options

  if (variant === "destructive") {
    return sonnerToast.error(title || description || "Error", {
      description: title && description ? description : undefined,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  }

  if (variant === "success") {
    return sonnerToast.success(title || description || "Success", {
      description: title && description ? description : undefined,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  }

  return sonnerToast(title || description || "Notification", {
    description: title && description ? description : undefined,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  })
}

const useToast = () => {
  return {
    toast,
  }
}

export { useToast, toast }

