"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, X, Camera } from "lucide-react"

interface Course {
  id: number
  name: string
}

interface Student {
  id: string
  name: string
  email: string
  course: string
  profileImage?: string
  enrollmentDate: string
}

interface FormData {
  name: string
  email: string
  course: string
  profileImage: string
}

interface FormErrors {
  name?: string
  email?: string
  course?: string
  general?: string
}

interface StudentFormProps {
  courses: Course[]
  onSubmit: (student: Omit<Student, "id" | "enrollmentDate">) => Promise<void>
  onCancel: () => void
  initialData?: Student
  isEditing?: boolean
}

/**
 * StudentForm Component
 *
 * This component demonstrates several key React and JavaScript concepts:
 *
 * 1. **Controlled Components**: All form inputs are controlled by React state
 * 2. **Form Validation**: Client-side validation with real-time feedback
 * 3. **Async/Await**: Form submission uses async operations
 * 4. **Event Loop**: Demonstrates setTimeout for simulated API delays
 * 5. **State Management**: Uses useState hook for form state and validation
 * 6. **Error Handling**: Comprehensive error states and user feedback
 */
export default function StudentForm({ courses, onSubmit, onCancel, initialData, isEditing = false }: StudentFormProps) {
  // Form data state - demonstrates controlled components
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    course: initialData?.course || "",
    profileImage: initialData?.profileImage || "",
  })

  // Form validation state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Email validation function
   * Demonstrates regular expressions and string validation
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Form validation function
   * Demonstrates object validation and error accumulation
   */
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    // Name validation - required field
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Email validation - required and format
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Course validation - required selection
    if (!formData.course) {
      newErrors.course = "Please select a course"
    }

    return newErrors
  }

  /**
   * Real-time validation on field blur
   * Demonstrates event handling and immediate feedback
   */
  const handleFieldBlur = (field: keyof FormData) => {
    const fieldErrors = validateForm()
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field],
    }))
  }

  /**
   * Input change handler
   * Demonstrates controlled component pattern and state updates
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  /**
   * File upload validation
   * Demonstrates file handling and validation
   */
  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, GIF, or WebP)"
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB"
    }

    return null
  }

  /**
   * Convert file to base64 for preview and storage
   * Demonstrates FileReader API and Promise handling
   */
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Handle file upload
   * Demonstrates async file processing and error handling
   */
  const handleFileUpload = async (file: File) => {
    setUploadError("")

    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    try {
      const base64String = await convertFileToBase64(file)
      handleInputChange("profileImage", base64String)
    } catch (error) {
      console.error("File upload error:", error)
      setUploadError("Failed to process the image. Please try again.")
    }
  }

  /**
   * Handle file input change
   * Demonstrates file input event handling
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  /**
   * Handle drag and drop events
   * Demonstrates drag and drop API
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  /**
   * Remove uploaded image
   */
  const handleRemoveImage = () => {
    handleInputChange("profileImage", "")
    setUploadError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /**
   * Generate initials from name for fallback avatar
   */
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Form submission handler
   * Demonstrates async/await, error handling, and the event loop
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    const formErrors = validateForm()

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Simulate API delay to demonstrate event loop behavior
      // This setTimeout shows how async operations work with the event loop
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Call the parent component's submit handler
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        course: formData.course,
        profileImage: formData.profileImage,
      })

      // Show success state
      setSubmitSuccess(true)

      // Auto-close after success (demonstrates setTimeout with state updates)
      setTimeout(() => {
        onCancel()
      }, 1000)
    } catch (error) {
      // Error handling - demonstrates try/catch with async operations
      console.error("Form submission error:", error)
      setErrors({
        general: "Failed to save student. Please try again.",
      })
    } finally {
      // Cleanup - demonstrates finally block usage
      setIsSubmitting(false)
    }
  }

  // Success state display
  if (submitSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isEditing ? "Student Updated!" : "Student Added!"}
        </h3>
        <p className="text-muted-foreground">
          {isEditing
            ? "Student information has been updated successfully."
            : "New student has been added to the system."}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error display */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Label className="text-sm font-medium">Profile Picture</Label>

        {/* Current Image Preview */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={formData.profileImage || "/placeholder.svg?height=96&width=96"} alt="Student avatar" />
              <AvatarFallback className="text-lg">{formData.name ? getInitials(formData.name) : "ST"}</AvatarFallback>
            </Avatar>
            {formData.profileImage && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 w-full max-w-sm text-center transition-colors ${
              isDragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isSubmitting}
            />

            <div className="flex flex-col items-center space-y-2">
              <Camera className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Upload Profile Picture</p>
                <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <Alert variant="destructive" className="max-w-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{uploadError}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter student's full name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          onBlur={() => handleFieldBlur("name")}
          className={errors.name ? "border-destructive focus:ring-destructive" : ""}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          onBlur={() => handleFieldBlur("email")}
          className={errors.email ? "border-destructive focus:ring-destructive" : ""}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Course Selection */}
      <div className="space-y-2">
        <Label htmlFor="course" className="text-sm font-medium">
          Course <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.course}
          onValueChange={(value) => handleInputChange("course", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={errors.course ? "border-destructive focus:ring-destructive" : ""}>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.name}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.course && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.course}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-transparent"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-white" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {isEditing ? "Updating..." : "Adding Student..."}
            </>
          ) : isEditing ? (
            "Update Student"
          ) : (
            "Add Student"
          )}
        </Button>
      </div>
    </form>
  )
}
