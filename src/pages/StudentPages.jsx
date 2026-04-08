import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, CheckCircle, PlayCircle, FileCheck, FileText, Loader2, Download, MessageSquare, UploadCloud, ArrowLeft } from '../components/Icons.jsx';
import { api } from '../services/api.js';
import { AuthContext, NotificationContext } from '../context/Contexts.jsx';
import { Button, Card, Badge, Input } from '../components/UI.jsx';

export const Dashboard = ({ onNavigate }) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [myCourses, setMyCourses] = useState([]);

  useEffect(() => {
    if (user.role === 'admin') api.getStats().then(setStats);
    else api.getStudentEnrollments(user.id).then(setMyCourses);
  }, [user]);

  if (user.role === 'admin') {
    if (!stats) return <Loader2 className="animate-spin centered-loader" />;
    return (
      <div className="page-container">
        <h1 className="page-title">Admin Overview</h1>
        <div className="stats-grid">
          <Card className="stat-card">
             <div className="stat-label">Students</div>
             <div className="stat-value">{stats.totalStudents}</div>
          </Card>
          <Card className="stat-card">
             <div className="stat-label">Courses</div>
             <div className="stat-value">{stats.totalCourses}</div>
          </Card>
          <Card className="stat-card">
             <div className="stat-label">Active Enrollments</div>
             <div className="stat-value">{stats.activeEnrollments}</div>
          </Card>
        </div>
        <div className="action-cards-grid">
           <div className="action-card action-card-blue" onClick={() => onNavigate('admin-courses')}>
              <h3>Manage Courses & Content</h3>
              <p>Create new courses, add lessons, create assignments, and grade submissions.</p>
           </div>
           <div className="action-card action-card-purple" onClick={() => onNavigate('admin-students')}>
              <h3>Students Register</h3>
              <p>View list of all registered students and their details.</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Learning</h1>
        <Button onClick={() => onNavigate('student-browse')}>Browse Catalog</Button>
      </div>
      {myCourses.length === 0 ? (
        <div className="empty-state">
           <BookOpen style={{ height: '3rem', width: '3rem' }} />
           <p>You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {myCourses.map(e => {
            const computedProgress = Math.round((e.completedItems ? e.completedItems.length : 0) / (e.course?.content?.length || 1) * 100);
            return (
            <Card key={e.id} className="course-card">
               <div className="course-card-header">
                  <h3>{e.course.title}</h3>
               </div>
               <div className="course-card-body">
                  <div>
                    <div className="progress-row">
                      <span>Progress</span>
                      <span>{Math.min(computedProgress, 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(computedProgress, 100)}%` }}></div>
                    </div>
                  </div>
                  <Button onClick={() => onNavigate(`classroom/${e.courseId}`)}>Continue Learning</Button>
               </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const StudentBrowse = ({ onNavigate }) => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);

  useEffect(() => { 
    const fetchData = async () => {
      const allCourses = await api.getCourses();
      const myEnrollments = await api.getStudentEnrollments(user.id);
      setCourses(allCourses);
      setEnrolledIds(myEnrollments.map(e => String(e.course.id)));
    };
    fetchData();
  }, [user.id]);

  const handleEnroll = async (id) => { 
    try { 
      await api.enroll(user.id, id); 
      addNotification('Enrolled successfully!'); 
      setEnrolledIds(prev => [...prev, String(id)]);
    } catch(e) { 
      addNotification(e.message, 'error'); 
    } 
  };

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="back-btn">
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>
      <h1 className="page-title">Browse Courses</h1>
      <div className="browse-grid">
        {courses.map(c => {
          const isEnrolled = enrolledIds.includes(String(c.id));
          return (
            <Card key={c.id} className="browse-card">
              <div className="browse-card-body">
                <Badge>{c.category}</Badge>
                <h3>{c.title}</h3>
                <p className="desc">{c.description}</p>
              </div>
              <div className="browse-card-footer">
                <div className="browse-card-footer-inner">
                  <span>{c.content ? c.content.length : 0} Lessons</span>
                  {isEnrolled ? (
                    <Button variant="secondary" disabled className="enrolled-btn">
                      <CheckCircle size={16} /> Enrolled
                    </Button>
                  ) : (
                    <Button onClick={() => handleEnroll(c.id)}>Enroll Now</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const Classroom = ({ courseId, onNavigate }) => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const [course, setCourse] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);
  const [submission, setSubmission] = useState('');
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  


  useEffect(() => {
    const load = async () => {
      const c = await api.getCourse(courseId);
      const enrollments = await api.getStudentEnrollments(user.id);
      const myEnrollment = enrollments.find(e => String(e.courseId) === String(courseId));
      const subs = await api.getMySubmissions(user.id);
      
      setCourse(c);
      if (c && c.content && c.content.length > 0) setActiveItem(c.content[0]);
      if (myEnrollment) setCompletedItems(myEnrollment.completedItems || []);
      setMySubmissions(subs);
      setLoading(false);
    };
    load();
  }, [courseId, user.id]);

  const handleComplete = async () => {
    await api.updateProgress(user.id, courseId, activeItem.id);
    setCompletedItems([...completedItems, activeItem.id]);
    addNotification('Lesson marked as complete!');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { 
        addNotification("File too large (Limit: 50MB).", "error");
        return;
      }
      try {
        const fileUrl = await api.uploadFile(file);
        setSubmission(fileUrl);
      } catch (error) {
        addNotification("Failed to upload file", "error");
      }
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submission) return;
    try {
      await api.submitAssignment(user.id, activeItem.id, submission);
      
      if (!completedItems.includes(activeItem.id)) {
        await api.updateProgress(user.id, courseId, activeItem.id);
        setCompletedItems([...completedItems, activeItem.id]);
      }

      addNotification('Assignment submitted successfully!');
      const subs = await api.getMySubmissions(user.id);
      setMySubmissions(subs);
    } catch(e) {
      addNotification(e.message, "error");
    }
  };




  const getEmbedUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
      const url = new URL(rawUrl);
      if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        if (url.pathname === '/watch') {
          const videoId = url.searchParams.get('v');
          if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      if (url.hostname === 'youtu.be') {
        const videoId = url.pathname.slice(1);
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch(e) {}
    return rawUrl; // Pass through natively if already embedded or different source
  };

  if (loading) return <div className="centered-loader"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div style={{ padding: '2rem' }}>Course not found.</div>;

  const activeSubmission = mySubmissions.find(s => s.assignmentId === activeItem?.id);

  return (
    <div className="classroom-layout">
      <div className="classroom-sidebar">
        <div className="sidebar-header">
          <button onClick={() => onNavigate('dashboard')} className="sidebar-back-link">← Back to Dashboard</button>
          <h2 className="sidebar-title">{course.title}</h2>
          <div className="sidebar-progress">
            <div className="sidebar-progress-fill" style={{ width: `${Math.round((completedItems.length / (course.content ? course.content.length : 1)) * 100)}%` }}></div>
          </div>

        </div>
        <div style={{ flex: 1 }}>
          {(course.content || []).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={`sidebar-item ${activeItem?.id === item.id ? 'active' : ''}`}
            >
              <div className="icon">
                {completedItems.includes(item.id) ? <CheckCircle size={18} style={{ color: '#22c55e' }} /> : 
                 (item.type === 'video' ? <PlayCircle size={18} /> : (item.type === 'assignment' ? <FileCheck size={18} /> : <FileText size={18} />))}
              </div>
              <div>
                <p className="item-title">{item.title}</p>
                <p className="item-type">{item.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="classroom-content">
        <div className="classroom-content-inner">
           {activeItem ? (
             <Card style={{ padding: '2rem' }}>
               <div className="content-header">
                 <div>
                   <Badge color={activeItem.type === 'assignment' ? 'purple' : (activeItem.type === 'pdf' ? 'red' : 'blue')}>{activeItem.type}</Badge>
                   <h1 className="content-title">{activeItem.title}</h1>
                 </div>
               </div>

               <div style={{ marginBottom: '0.5rem' }}>
                 {/* VIDEO PLAYER */}
                 {activeItem.type === 'video' && (
                   <div className="video-container">
                     <iframe 
                        src={getEmbedUrl(activeItem.url)} 
                        title={activeItem.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                     ></iframe>
                   </div>
                 )}
                 
                 {/* PDF VIEWER / DOWNLOADER */}
                 {activeItem.type === 'pdf' && (
                   <div className="pdf-viewer">
                     <iframe
                       src={activeItem.url}
                       title={activeItem.title}
                       width="100%"
                       height="600px"
                       style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: '#f1f5f9' }}
                     ></iframe>
                     <a 
                       href={activeItem.url} 
                       download={`${activeItem.title}.pdf`}
                       className="pdf-download-btn"
                     >
                       <Download size={18} /> Download Copy
                     </a>
                   </div>
                 )}
                 
                 {activeItem.type === 'text' && <p className="text-content">{activeItem.body}</p>}
                 
                 {/* ASSIGNMENT LOGIC */}
                 {activeItem.type === 'assignment' && (
                   <div className="assignment-box">
                     <h3>Instructions</h3>
                     <p className="desc">{activeItem.description}</p>
                     
                     {!activeSubmission ? (
                        <div style={{ marginTop: '1rem' }}>
                          <label className="form-label">Upload Assignment (PDF)</label>
                          <div className="file-upload-area">
                              <input type="file" accept="application/pdf" onChange={handleFileUpload} id="assignment-upload" />
                              <label htmlFor="assignment-upload" className="file-upload-label">
                                <UploadCloud size={32} />
                                <span>Click to upload PDF</span>
                              </label>
                              {submission && submission.length > 0 && (
                                 <p className="file-selected">
                                   <CheckCircle size={12}/> PDF Selected
                                 </p>
                              )}
                          </div>
                          <div className="upload-actions">
                             <Button onClick={handleSubmitAssignment} disabled={!submission}>Submit Assignment</Button>
                          </div>
                        </div>
                     ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div className="submitted-badge">
                           <CheckCircle size={20} /> Assignment Submitted
                         </div>
                         {activeSubmission.grade ? (
                           <div className="grade-card">
                              <h4>Instructor Feedback</h4>
                              <div className="grade-row">
                                <span>Grade:</span>
                                <Badge color={activeSubmission.grade >= 50 ? 'green' : 'red'}>{activeSubmission.grade} / 100</Badge>
                              </div>
                              <p className="feedback-text">"{activeSubmission.feedback || 'No written feedback.'}"</p>
                           </div>
                         ) : (
                            <div className="pending-text">Pending grading by instructor...</div>
                         )}
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* MARK COMPLETE BUTTON */}
               {activeItem.type !== 'assignment' && !completedItems.includes(activeItem.id) && (
                 <div style={{ marginTop: '1.5rem' }}>
                   <Button onClick={handleComplete}>Mark as Completed</Button>
                 </div>
               )}
             </Card>
           ) : <div className="select-lesson">Select a lesson from the sidebar to begin.</div>}
        </div>
      </div>


    </div>
  );
};