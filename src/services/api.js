import axios from 'axios';

// Directly maps to your running Spring Boot backend.
const apiInstance = axios.create({
  baseURL: 'https://learnhubhosting.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

export const STORAGE_KEYS = {
  SESSION: 'lms_session_v3',
  THEME: 'lms_theme_v3'
};

export const initializeDB = () => {
  console.log("MySQL handles the state now, goodbye localStorage mocking!");
};

export const api = {
  // --- Auth & Users (Wired to our new AuthController.java) ---
  login: async (email, password, recaptchaToken) => {
    try {
      const res = await apiInstance.post('/auth/login', { email, password, recaptchaToken });
      const user = res.data;
      
      const token = btoa(user.id);
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user, token }));
      return user;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data);
      }
      throw new Error('Invalid credentials or verification failed.');
    }
  },

  register: async (name, email, password, role = 'student') => {
    if (!/^[a-zA-Z\s]+$/.test(name)) throw new Error('Invalid Name: Only letters and spaces are allowed.');

    const backendUser = { name, email, password, role };
    const res = await apiInstance.post('/users', backendUser);
    return res.data;
  },

  sendOtp: async (email, name, recaptchaToken) => {
    const res = await apiInstance.post('/auth/send-otp', { email, name, recaptchaToken });
    return res.data;
  },

  verifyOtp: async (email, otp) => {
    const res = await apiInstance.post('/auth/verify-otp', { email, otp });
    return res.data;
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getSession: () => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session).user : null;
    } catch { return null; }
  },

  updateProfile: async (userId, updates) => {
    // Trigger Spring Boot @PutMapping("/{id}")
    const res = await apiInstance.put(`/users/${userId}`, updates);

    const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || '{}');
    if (session && session.user && session.user.id === userId) {
      session.user = { ...session.user, ...res.data };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
    return res.data;
  },

  getAllUsers: async () => {
    // Hits Spring Boot @GetMapping
    const res = await apiInstance.get('/users');
    return res.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We use a separate direct axios call because apiInstance defaults to 'application/json'. 
    // Setting 'multipart/form-data' manually breaks the boundary injection in browsers!
    const res = await axios.post('https://learnhubhosting.onrender.com/api/files/upload', formData);
    return res.data.url; // Returns the URL path to the uploaded file
  },

  // --- Courses & Content (Stubs pointing to where you will build REST endpoints next!) ---
  getCourses: async () => {
    try {
      const res = await apiInstance.get('/courses');
      return res.data;
    } catch (err) {
      console.warn("Course endpoints (GET /api/courses) have not been built in Spring Boot yet!");
      return [];
    }
  },

  getCourse: async (id) => {
    const res = await apiInstance.get(`/courses/${id}`);
    return res.data;
  },

  createCourse: async (courseData) => {
    const res = await apiInstance.post('/courses', {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      userId: courseData.instructorId
    });
    return res.data;
  },

  deleteCourse: async (id) => {
    await apiInstance.delete(`/courses/${id}`);
  },

  // Placeholder methods waiting for new Spring Boot @RestControllers
  addCourseContent: async (courseId, contentItem) => {
    const res = await apiInstance.post('/course-content', { ...contentItem, courseId });
    return res.data;
  },
  deleteCourseContent: async (courseId, contentId) => {
    await apiInstance.delete(`/course-content/${contentId}`);
  },
  enroll: async (userId, courseId) => {
    await apiInstance.post('/enrollments', { userId, courseId });
  },
  getStudentEnrollments: async (userId) => {
    try {
      const res = await apiInstance.get(`/enrollments/student/${userId}`);
      return res.data;
    } catch (e) { return []; }
  },
  updateProgress: async (userId, courseId, itemId) => {
    const res = await apiInstance.put(`/enrollments/progress/${userId}/${courseId}/${itemId}`);
    return res.data;
  },
  submitAssignment: async (userId, assignmentId, content) => {
    const res = await apiInstance.post('/submissions', { userId, assignmentId, content });
    return res.data;
  },
  getSubmissionsForCourse: async (courseId) => {
    const res = await apiInstance.get(`/submissions/course/${courseId}`);
    return res.data;
  },
  getMySubmissions: async (userId) => {
    const res = await apiInstance.get(`/submissions/user/${userId}`);
    return res.data;
  },
  gradeSubmission: async (id, grade, feedback) => {
    const res = await apiInstance.put(`/submissions/${id}/grade`, { grade, feedback });
    return res.data;
  },
  submitFeedback: async () => { },
  getCourseFeedback: async () => [],
  getStats: async () => {
    try {
      const [users, courses] = await Promise.all([
        apiInstance.get('/users'),
        apiInstance.get('/courses')
      ]);
      const students = users.data.filter(u => u.role === 'student');
      // Count enrollments across all students
      let totalEnrollments = 0;
      for (const student of students) {
        try {
          const enrollRes = await apiInstance.get(`/enrollments/student/${student.id}`);
          totalEnrollments += enrollRes.data.length;
        } catch (e) { /* skip */ }
      }
      return {
        totalStudents: students.length,
        totalCourses: courses.data.length,
        activeEnrollments: totalEnrollments
      };
    } catch (e) {
      return { totalStudents: 0, totalCourses: 0, activeEnrollments: 0 };
    }
  }
};
