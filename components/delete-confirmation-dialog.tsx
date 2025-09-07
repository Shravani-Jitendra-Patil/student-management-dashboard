"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useState } from "react"

interface Student {
  id: string
  name: string
  email: string
  course: string
  profileImage?: string
  enrollmentDate: string
}

interface DeleteConfirmationDialogProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (studentId: string) => Promise<void>
}

/**
 * DeleteConfirmationDialog Component
 *
 * Provides a confirmation dialog for deleting students with:
 * - Clear warning about the destructive action
 * - Student information display for verification
 * - Async delete operation with loading state
 * - Error handling for failed deletions
 */
export default function DeleteConfirmationDialog({
  student,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!student) return

    setIsDeleting(true)
    setError(null)

    try {
      // Simulate API delay to demonstrate async operations
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await onConfirm(student.id)
      onClose()
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete student. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setError(null)
      onClose()
    }
  }

  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Student
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The student will be permanently removed from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete all student data.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Student to be deleted:</h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Name:</strong> {student.name}
              </p>
              <p>
                <strong>Email:</strong> {student.email}
              </p>
              <p>
                <strong>Course:</strong> {student.course}
              </p>
              <p>
                <strong>Enrolled:</strong> {new Date(student.enrollmentDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Student
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
