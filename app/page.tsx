"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit, Users, BookOpen, GraduationCap, RefreshCw, AlertCircle, Filter } from "lucide-react"
import StudentForm from "@/components/student-form"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import DynamicAvatar from "@/components/dynamic-avatar"
import { coursesApi, checkApiHealth, type Course } from "@/lib/api"

// Types for our student management system
interface Student {
  id: string
  name: string
  email: string
  course: string
  profileImage?: string
  enrollmentDate: string
}

type SortField = "name" | "email" | "course" | "enrollmentDate"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

export default function StudentManagementDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const fetchCourses = async (showRetryCount = false) => {
    try {
      setLoading(true)
      setError(null)

      if (showRetryCount) {
        setRetryCount((prev) => prev + 1)
      }

      console.log("[v0] Starting course fetch operation...")

      const fetchedCourses = await coursesApi.getCourses()

      setCourses(fetchedCourses)
      setApiHealthy(true)
      setLastFetchTime(new Date())

      console.log("[v0] Course fetch completed successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch courses"
      setError(errorMessage)
      setApiHealthy(false)
      console.error("[v0] Course fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async () => {
    console.log("[v0] Checking API health...")
    const healthy = await checkApiHealth()
    setApiHealthy(healthy)
    console.log("[v0] API health status:", healthy ? "healthy" : "unhealthy")
  }

  useEffect(() => {
    fetchCourses()
    checkHealth()
  }, [])

  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCourse = selectedCourse === "all" || student.course === selectedCourse
      return matchesSearch && matchesCourse
    })

    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "email":
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case "course":
          aValue = a.course.toLowerCase()
          bValue = b.course.toLowerCase()
          break
        case "enrollmentDate":
          aValue = new Date(a.enrollmentDate)
          bValue = new Date(b.enrollmentDate)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [students, searchTerm, selectedCourse, sortField, sortOrder])

  const stats = useMemo(() => {
    const courseStats = courses.map((course) => ({
      course: course.name,
      count: students.filter((student) => student.course === course.name).length,
      enrollmentCount: course.enrollmentCount || 0,
    }))

    return {
      totalStudents: students.length,
      totalCourses: courses.length,
      activeEnrollments: students.length,
      courseStats,
      totalEnrollments: courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0),
    }
  }, [students.length, courses.length, students, courses])

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleAddStudent = async (studentData: Omit<Student, "id" | "enrollmentDate">) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
      enrollmentDate: new Date().toISOString().split("T")[0],
    }

    setStudents((prev) => [...prev, newStudent])
    setIsAddDialogOpen(false)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setIsEditDialogOpen(true)
  }

  const handleUpdateStudent = async (studentData: Omit<Student, "id" | "enrollmentDate">) => {
    if (!editingStudent) return

    const updatedStudent: Student = {
      ...studentData,
      id: editingStudent.id,
      enrollmentDate: editingStudent.enrollmentDate,
    }

    setStudents((prev) => prev.map((student) => (student.id === editingStudent.id ? updatedStudent : student)))

    setIsEditDialogOpen(false)
    setEditingStudent(null)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingStudent(null)
  }

  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (studentId: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== studentId))
    setIsDeleteDialogOpen(false)
    setDeletingStudent(null)
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setDeletingStudent(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-balance">Loading courses from API...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md clean-card">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 text-balance">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              API Error
            </CardTitle>
            <CardDescription className="text-balance">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-balance">
                Unable to connect to the courses API. Please check your connection and try again.
              </AlertDescription>
            </Alert>
            <Button onClick={() => fetchCourses(true)} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground text-balance">
                  Student Management Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground text-balance">
                  Manage your students and their course enrollments 
                </p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Enter student details to add them to the system.</DialogDescription>
                </DialogHeader>
                <StudentForm courses={courses} onSubmit={handleAddStudent} onCancel={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="clean-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="clean-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Courses</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Course offerings</p>
            </CardContent>
          </Card>

          <Card className="clean-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Results</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{filteredAndSortedStudents.length}</div>
              <p className="text-xs text-muted-foreground">Matching criteria</p>
            </CardContent>
          </Card>
        </div>

        <Card className="clean-card mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filter Students</CardTitle>
                <CardDescription className="text-balance">
                  Search and filter students by name, email, or course
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden bg-transparent"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`space-y-4 sm:space-y-0 sm:flex sm:gap-4 ${mobileFiltersOpen ? "block" : "hidden sm:flex"}`}
            >
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="course-filter" className="text-sm font-medium mb-2 block">
                  Filter by Course
                </Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.name}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clean-card">
          <CardHeader>
            <CardTitle className="text-lg">Students ({filteredAndSortedStudents.length})</CardTitle>
            <CardDescription>Manage your student enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAndSortedStudents.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="p-3 sm:p-4 rounded-2xl bg-muted w-fit mx-auto mb-4">
                  <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No students found</h3>
                <p className="text-muted-foreground mb-6 text-balance px-4">
                  {searchTerm || selectedCourse !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Add your first student to get started with the dashboard."}
                </p>
                {searchTerm || selectedCourse !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCourse("all")
                      setMobileFiltersOpen(false)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredAndSortedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-4 sm:gap-0"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <DynamicAvatar
                        name={student.name}
                        email={student.email}
                        profileImage={student.profileImage}
                        className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {student.course}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent flex-1 sm:flex-initial"
                        onClick={() => handleDeleteStudent(student)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Existing code for dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto clean-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Student
            </DialogTitle>
            <DialogDescription className="text-balance">
              Update the student's information below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <StudentForm
              courses={courses}
              onSubmit={handleUpdateStudent}
              onCancel={handleCancelEdit}
              initialData={editingStudent}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        student={deletingStudent}
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
