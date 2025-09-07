/**
 * API Service Layer
 *
 * This module demonstrates several key concepts:
 * 1. **Async/Await**: All API calls use modern async/await syntax
 * 2. **Error Handling**: Comprehensive error handling with custom error types
 * 3. **Event Loop**: Demonstrates setTimeout and Promise-based operations
 * 4. **Retry Logic**: Automatic retry for failed requests
 * 5. **Type Safety**: Full TypeScript integration with proper typing
 */

// API Response Types
export interface Course {
  id: number
  name: string
  description?: string
  duration?: string
  instructor?: string
  enrollmentCount?: number
  isActive?: boolean
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface ApiError {
  message: string
  code: string
  status: number
  timestamp: string
}

// Custom Error Classes
export class NetworkError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "NetworkError"
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * Base API Configuration
 * In a real application, this would come from environment variables
 */
const API_CONFIG = {
  baseUrl: "https://api.mockapi.io/v1", // Mock API base URL
  timeout: 10000, // 10 second timeout
  retryAttempts: 3,
  retryDelay: 1000, // 1 second initial delay
}

/**
 * Utility function to simulate network delay
 * Demonstrates event loop behavior with setTimeout and Promises
 */
const simulateNetworkDelay = (ms = 800): Promise<void> => {
  return new Promise((resolve) => {
    // This setTimeout demonstrates the event loop:
    // 1. The setTimeout is scheduled in the Web APIs
    // 2. The callback is placed in the callback queue after the delay
    // 3. The event loop moves it to the call stack when ready
    setTimeout(() => {
      console.log(`[v0] Network simulation: ${ms}ms delay completed`)
      resolve()
    }, ms)
  })
}

/**
 * Retry utility function
 * Demonstrates advanced async patterns and error handling
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = API_CONFIG.retryAttempts,
  delay: number = API_CONFIG.retryDelay,
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[v0] API attempt ${attempt}/${maxAttempts}`)
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.log(`[v0] Attempt ${attempt} failed:`, error)

      if (attempt === maxAttempts) {
        throw lastError
      }

      // Exponential backoff: delay increases with each retry
      const backoffDelay = delay * Math.pow(2, attempt - 1)
      console.log(`[v0] Retrying in ${backoffDelay}ms...`)

      await new Promise((resolve) => setTimeout(resolve, backoffDelay))
    }
  }

  throw lastError!
}

/**
 * Mock API implementation that simulates real API behavior
 * In a real application, this would make actual HTTP requests
 */
class MockApiClient {
  private courses: Course[] = [
    {
      id: 1,
      name: "HTML Basics",
      description: "Learn the fundamentals of HTML markup language",
      duration: "4 weeks",
      instructor: "Sarah Johnson",
      enrollmentCount: 156,
      isActive: true,
    },
    {
      id: 2,
      name: "CSS Mastery",
      description: "Master CSS styling and responsive design",
      duration: "6 weeks",
      instructor: "Mike Chen",
      enrollmentCount: 203,
      isActive: true,
    },
    {
      id: 3,
      name: "JavaScript Pro",
      description: "Advanced JavaScript concepts and ES6+ features",
      duration: "8 weeks",
      instructor: "Alex Rodriguez",
      enrollmentCount: 189,
      isActive: true,
    },
    {
      id: 4,
      name: "React In Depth",
      description: "Build modern web applications with React",
      duration: "10 weeks",
      instructor: "Emily Davis",
      enrollmentCount: 245,
      isActive: true,
    },
    {
      id: 5,
      name: "Node.js Backend",
      description: "Server-side development with Node.js and Express",
      duration: "8 weeks",
      instructor: "David Kim",
      enrollmentCount: 134,
      isActive: true,
    },
  ]

  /**
   * Simulate fetching courses from an API
   * Demonstrates async/await, error handling, and network simulation
   */
  async fetchCourses(): Promise<ApiResponse<Course[]>> {
    // Simulate network delay
    await simulateNetworkDelay()

    // Simulate occasional API failures (10% chance)
    if (Math.random() < 0.1) {
      throw new NetworkError("Service temporarily unavailable", 503)
    }

    // Simulate validation errors (5% chance)
    if (Math.random() < 0.05) {
      throw new ValidationError("Invalid request parameters")
    }

    return {
      data: this.courses.filter((course) => course.isActive),
      success: true,
      message: "Courses fetched successfully",
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Simulate fetching a single course by ID
   */
  async fetchCourseById(id: number): Promise<ApiResponse<Course | null>> {
    await simulateNetworkDelay(400)

    const course = this.courses.find((c) => c.id === id && c.isActive)

    if (!course) {
      throw new NetworkError(`Course with ID ${id} not found`, 404)
    }

    return {
      data: course,
      success: true,
      message: "Course fetched successfully",
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Simulate creating a new course
   */
  async createCourse(courseData: Omit<Course, "id">): Promise<ApiResponse<Course>> {
    await simulateNetworkDelay(1200)

    // Validate required fields
    if (!courseData.name || courseData.name.trim().length < 3) {
      throw new ValidationError("Course name must be at least 3 characters long")
    }

    const newCourse: Course = {
      ...courseData,
      id: Math.max(...this.courses.map((c) => c.id)) + 1,
      enrollmentCount: 0,
      isActive: true,
    }

    this.courses.push(newCourse)

    return {
      data: newCourse,
      success: true,
      message: "Course created successfully",
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Simulate updating a course
   */
  async updateCourse(id: number, updates: Partial<Course>): Promise<ApiResponse<Course>> {
    await simulateNetworkDelay(900)

    const courseIndex = this.courses.findIndex((c) => c.id === id)

    if (courseIndex === -1) {
      throw new NetworkError(`Course with ID ${id} not found`, 404)
    }

    this.courses[courseIndex] = { ...this.courses[courseIndex], ...updates }

    return {
      data: this.courses[courseIndex],
      success: true,
      message: "Course updated successfully",
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Simulate deleting a course (soft delete)
   */
  async deleteCourse(id: number): Promise<ApiResponse<boolean>> {
    await simulateNetworkDelay(600)

    const courseIndex = this.courses.findIndex((c) => c.id === id)

    if (courseIndex === -1) {
      throw new NetworkError(`Course with ID ${id} not found`, 404)
    }

    // Soft delete - mark as inactive instead of removing
    this.courses[courseIndex].isActive = false

    return {
      data: true,
      success: true,
      message: "Course deleted successfully",
      timestamp: new Date().toISOString(),
    }
  }
}

// Create singleton instance
const apiClient = new MockApiClient()

/**
 * Public API functions with retry logic and error handling
 * These functions demonstrate the complete async/await pattern with proper error handling
 */

export const coursesApi = {
  /**
   * Fetch all active courses
   * Demonstrates: async/await, retry logic, error handling
   */
  async getCourses(): Promise<Course[]> {
    try {
      const response = await withRetry(() => apiClient.fetchCourses())
      console.log("[v0] Courses fetched successfully:", response.data.length, "courses")
      return response.data
    } catch (error) {
      console.error("[v0] Failed to fetch courses after retries:", error)

      if (error instanceof NetworkError) {
        throw new Error(`Network error: ${error.message} (Status: ${error.status})`)
      } else if (error instanceof ValidationError) {
        throw new Error(`Validation error: ${error.message}`)
      } else {
        throw new Error("An unexpected error occurred while fetching courses")
      }
    }
  },

  /**
   * Fetch a single course by ID
   */
  async getCourse(id: number): Promise<Course> {
    try {
      const response = await withRetry(() => apiClient.fetchCourseById(id))
      return response.data!
    } catch (error) {
      console.error(`[v0] Failed to fetch course ${id}:`, error)
      throw error instanceof NetworkError ? error : new Error("Failed to fetch course")
    }
  },

  /**
   * Create a new course
   */
  async createCourse(courseData: Omit<Course, "id">): Promise<Course> {
    try {
      const response = await withRetry(() => apiClient.createCourse(courseData))
      console.log("[v0] Course created successfully:", response.data.name)
      return response.data
    } catch (error) {
      console.error("[v0] Failed to create course:", error)
      throw error instanceof ValidationError ? error : new Error("Failed to create course")
    }
  },

  /**
   * Update an existing course
   */
  async updateCourse(id: number, updates: Partial<Course>): Promise<Course> {
    try {
      const response = await withRetry(() => apiClient.updateCourse(id, updates))
      console.log("[v0] Course updated successfully:", response.data.name)
      return response.data
    } catch (error) {
      console.error(`[v0] Failed to update course ${id}:`, error)
      throw error instanceof NetworkError ? error : new Error("Failed to update course")
    }
  },

  /**
   * Delete a course
   */
  async deleteCourse(id: number): Promise<boolean> {
    try {
      const response = await withRetry(() => apiClient.deleteCourse(id))
      console.log(`[v0] Course ${id} deleted successfully`)
      return response.data
    } catch (error) {
      console.error(`[v0] Failed to delete course ${id}:`, error)
      throw error instanceof NetworkError ? error : new Error("Failed to delete course")
    }
  },
}

/**
 * Health check function to test API connectivity
 * Demonstrates Promise.race for timeout handling
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const healthCheck = coursesApi.getCourses()
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Health check timeout")), 5000))

    // Race between the API call and timeout
    await Promise.race([healthCheck, timeout])
    return true
  } catch (error) {
    console.error("[v0] API health check failed:", error)
    return false
  }
}
