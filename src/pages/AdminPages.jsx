import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Edit, ClipboardList, PenTool, ArrowLeft, Loader2, FileText, UploadCloud, BarChart2, MessageSquare, Download, Save, Eye } from '../components/Icons.jsx';
import { api } from '../services/api';
import { AuthContext, NotificationContext } from '../context/Contexts';
import { Button, Input, Card, Badge, ConfirmModal, SimpleBarChart } from '../components/UI';

export const AdminStudents = ({ onNavigate }) => {
  const [students, setStudents] = useState([]);
  useEffect(() => { api.getAllUsers().then(users => setStudents(users.filter(u => u.role === 'student'))); }, []);
  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="back-btn">
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>
      <h1 className="page-title">Student Management</h1>
      <Card>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Bio</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td className="name">{s.name}</td>
                  <td className="email">{s.email}</td>
                  <td className="bio">{s.bio || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const AdminCourses = ({ onNavigate }) => {
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '' });
  const { addNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const [deleteModal, setDeleteModal] = useState({ open: false, courseId: null });
  const [deleting, setDeleting] = useState(false);

  const refreshCourses = () => { api.getCourses().then(setCourses); };
  useEffect(() => { refreshCourses(); }, []);

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description) return;
    await api.createCourse({ ...newCourse, instructorId: user.id });
    addNotification('Course created');
    setShowCreateModal(false);
    setNewCourse({ title: '', description: '', category: '' });
    refreshCourses();
  };

  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setDeleteModal({ open: true, courseId: id });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteCourse(deleteModal.courseId);
      addNotification('Course deleted');
      refreshCourses();
      setDeleteModal({ open: false, courseId: null });
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="back-btn">
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>
      <div className="admin-header">
        <h1 className="admin-title">Manage Courses</h1>
        <Button onClick={() => setShowCreateModal(true)}><Plus size={18} /> Create Course</Button>
      </div>

      <div className="admin-course-grid">
        {courses.map(course => (
          <Card key={course.id} className="admin-course-card">
            <div className="admin-course-card-inner">
              <div className="admin-course-info">
                <div className="admin-course-title-row">
                  <h3>{course.title}</h3>
                  <Badge>{course.category}</Badge>
                </div>
                <p className="admin-course-desc">{course.description}</p>
                <div className="admin-course-meta">
                  <span><FileText size={14} /> {course.content ? course.content.length : 0} Items</span>
                </div>
              </div>

              <div className="admin-course-actions">
                <Button variant="secondary" onClick={() => onNavigate(`admin-course-edit/${course.id}`)}>
                  <PenTool size={16} /> Edit
                </Button>
                <Button variant="secondary" onClick={() => onNavigate(`admin-course-submissions/${course.id}`)}>
                  <ClipboardList size={16} /> Subs
                </Button>

                <Button variant="danger" onClick={(e) => openDeleteModal(e, course.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, courseId: null })}
        onConfirm={confirmDelete}
        title="Delete Course?"
        message="Are you sure you want to delete this course?"
        loading={deleting}
      />

      {showCreateModal && (
        <div className="modal-overlay">
          <Card className="modal-card-lg">
            <h2 className="modal-title">Create New Course</h2>
            <Input label="Title" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} required />
            <Input label="Category" value={newCourse.category} onChange={e => setNewCourse({ ...newCourse, category: e.target.value })} />
            <Input multiline label="Description" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} required />
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateCourse}>Create</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const AdminCourseEditor = ({ courseId, onNavigate }) => {
  const { addNotification } = useContext(NotificationContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', type: 'video', url: '', body: '', description: '', duration: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, itemId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getCourse(courseId).then(data => { setCourse(data); setLoading(false); });
  }, [courseId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        addNotification("File too large (Limit: 50MB).", "error");
        return;
      }
      try {
        const url = await api.uploadFile(file);
        setNewItem({ ...newItem, url });
      } catch (error) {
        addNotification("Failed to upload file", "error");
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title) { addNotification('Title is required', 'error'); return; }
    await api.addCourseContent(courseId, newItem);
    addNotification('Item added');
    setCourse(await api.getCourse(courseId));
    setShowAddModal(false);
    setNewItem({ title: '', type: 'video', url: '', body: '', description: '', duration: '' });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteCourseContent(courseId, deleteModal.itemId);
      addNotification('Item deleted');
      setCourse(await api.getCourse(courseId));
      setDeleteModal({ open: false, itemId: null });
    } catch (e) { addNotification(e.message, 'error'); } finally { setDeleting(false); }
  };

  const openDeleteModal = (e, itemId) => {
    e.stopPropagation();
    setDeleteModal({ open: true, itemId });
  };

  if (loading) return <div className="loading-inline"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div style={{ padding: '2rem' }}>Course not found</div>;

  return (
    <div className="container-md" style={{ padding: '2rem 1rem' }}>
      <Button variant="ghost" onClick={() => onNavigate('admin-courses')} className="back-btn">
        <ArrowLeft size={16} /> Back to Courses
      </Button>

      <div className="editor-header">
        <div>
          <h1>{course.title}</h1>
          <p className="subtitle">Edit Content</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Content</Button>
      </div>

      <div className="content-list">
        {(!course.content || course.content.length === 0) ? (
          <div className="empty-content">
            <p>No content yet.</p>
          </div>
        ) : (
          course.content.map((item, idx) => (
            <Card key={item.id} className="content-item">
              <div className="content-item-left">
                <div className="content-item-number">{idx + 1}</div>
                <div className="content-item-info">
                  <div className="content-item-title-row">
                    <span className="content-item-title">{item.title}</span>
                    <Badge color={item.type === 'video' ? 'blue' : (item.type === 'assignment' ? 'purple' : (item.type === 'pdf' ? 'red' : 'green'))}>{item.type}</Badge>
                  </div>
                  <p className="content-item-desc">{item.type === 'video' ? item.url : (item.type === 'text' ? (item.body ? item.body.substring(0, 50) + '...' : '') : item.description)}</p>
                </div>
              </div>
              <div className="content-item-right">
                <Button variant="ghost" className="delete-ghost-btn" onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, itemId: item.id }); }}>
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, itemId: null })} onConfirm={confirmDelete} title="Delete Content?" message="Are you sure?" loading={deleting} />

      {showAddModal && (
        <div className="modal-overlay">
          <Card className="modal-card-lg modal-card-scrollable">
            <h2 className="modal-title">Add New Content</h2>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value, url: '' })}>
                <option value="video">Video Lesson</option>
                <option value="text">Text Lesson</option>
                <option value="assignment">Assignment</option>
                <option value="pdf">PDF Resource</option>
              </select>
            </div>
            <Input label="Title" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
            {newItem.type === 'video' && <><Input label="Video Embed URL" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} /><Input label="Duration" value={newItem.duration} onChange={e => setNewItem({ ...newItem, duration: e.target.value })} /></>}
            {newItem.type === 'text' && <Input multiline label="Lesson Content" value={newItem.body} onChange={e => setNewItem({ ...newItem, body: e.target.value })} />}
            {newItem.type === 'assignment' && <Input multiline label="Instructions" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />}
            {newItem.type === 'pdf' && (
              <div className="form-group">
                <label className="form-label">Upload PDF</label>
                <div className="file-upload-area">
                  <input type="file" accept="application/pdf" onChange={handleFileUpload} id="pdf-upload" />
                  <label htmlFor="pdf-upload" className="file-upload-label">
                    <UploadCloud size={32} />
                    <span>Click to upload PDF (Max 50MB)</span>
                  </label>
                  {newItem.url && <p className="file-selected">File Loaded!</p>}
                </div>
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}><Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAddItem}>Add Item</Button></div>
          </Card>
        </div>
      )}
    </div>
  );
};


export const AdminSubmissions = ({ courseId, onNavigate }) => {
  const { addNotification } = useContext(NotificationContext);
  const [course, setCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingState, setGradingState] = useState({});
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [expandedSubId, setExpandedSubId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const c = await api.getCourse(courseId);
      const s = await api.getSubmissionsForCourse(courseId);
      setCourse(c);
      setSubmissions(s);

      const initialGrading = {};
      s.forEach(sub => { initialGrading[sub.id] = { score: sub.grade || '', feedback: sub.feedback || '' }; });
      setGradingState(initialGrading);
      setLoading(false);
    };
    load();
  }, [courseId]);

  const handleGradeChange = (subId, field, value) => {
    setGradingState(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
  };

  const saveGrade = async (subId) => {
    try {
      const grade = gradingState[subId].score;
      const feedback = gradingState[subId].feedback;
      if (grade === '' || isNaN(grade) || grade < 0 || grade > 100) { addNotification('Invalid score', 'error'); return; }
      await api.gradeSubmission(subId, grade, feedback);
      addNotification('Grade saved successfully');
      setSubmissions(await api.getSubmissionsForCourse(courseId));
      setEditingGradeId(null);
    } catch (e) { addNotification('Failed to save grade', 'error'); }
  };

  if (loading) return <div className="loading"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  if (!course) return <div style={{ padding: '2rem' }}>Course not found</div>;

  const assignments = course?.content?.filter(item => item.type === 'assignment') || [];

  if (!selectedAssignment) {
    return (
      <div className="admin-page animate-fade-in">
        <button className="btn-ghost back-btn" onClick={() => onNavigate('admin-courses')}>
          <ArrowLeft size={16} /> Back to Courses
        </button>
        <div className="admin-header">
          <h1 className="admin-title">Assignments: {course?.title}</h1>
        </div>

        {assignments.length === 0 ? (
          <div className="no-submissions"><p>There are no assignments created for this course yet.</p></div>
        ) : (
          <div className="admin-course-grid">
            {assignments.map(assign => {
              const subsCount = submissions.filter(s => String(s.assignmentId) === String(assign.id)).length;
              return (
                <Card key={assign.id} className="admin-course-card">
                  <div className="admin-course-card-inner">
                    <div className="admin-course-info">
                      <div className="admin-course-title-row">
                        <Badge color="purple">Assignment</Badge>
                        <h3>{assign.title}</h3>
                      </div>
                      <p className="admin-course-desc">{subsCount} Total Submissions</p>
                    </div>
                    <div className="admin-course-actions">
                      <Button onClick={() => setSelectedAssignment(assign)}>View Submissions</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }


  const filteredSubmissions = submissions.filter(s => String(s.assignmentId) === String(selectedAssignment.id));

  return (
    <div className="admin-page animate-fade-in">
      <button className="btn-ghost back-btn" onClick={() => setSelectedAssignment(null)}>
        <ArrowLeft size={16} /> Back to Assignments
      </button>

      <div className="admin-header">
        <h1 className="admin-title">Submissions: {selectedAssignment.title}</h1>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="no-submissions">
          <p>No submissions yet for this assignment.</p>
        </div>
      ) : (
        <div className="submissions-grid">
          {filteredSubmissions.map(sub => {
            const isGraded = sub.grade !== null && sub.grade !== undefined && sub.grade !== "";
            const isEditing = editingGradeId === sub.id;
            const isExpanded = expandedSubId === sub.id;

            return (
              <Card key={sub.id} className="submission-card">
                <div className="submission-header">
                  <div>
                    <h3 className="submission-student-name">{sub.userName || `Student #${sub.userId}`}</h3>
                    <div className="submission-meta">
                      <Badge color="purple">{sub.assignmentTitle || selectedAssignment.title}</Badge>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {!isExpanded && (
                      <Button variant="secondary" onClick={() => setExpandedSubId(sub.id)}>
                        <Eye size={16} style={{ marginRight: '0.4rem' }} /> View Submission
                      </Button>
                    )}
                    {isGraded && !isEditing && (
                      <div className="submission-grade-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="submission-grade-value">{sub.grade}<span>/100</span></div>
                        <Button variant="ghost" onClick={() => setEditingGradeId(sub.id)} className="edit-grade-btn"><Edit size={12} /> Edit</Button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="submission-detail-container animate-fade-in">
                    <div className="submission-content-box" style={{ marginTop: '1.25rem' }}>
                      {sub.content && (sub.content.includes('/api/files/') || sub.content.startsWith('http')) ? (
                        <div>
                          <iframe
                            src={sub.content}
                            title={`Submission by ${sub.userName || sub.userId}`}
                            width="100%"
                            height="600px"
                            style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: '#f1f5f9' }}
                          ></iframe>
                          <a href={sub.content} download={`submission-${sub.userName || sub.userId}.pdf`} className="pdf-download-btn">
                            <Download size={18} /> Download Copy
                          </a>
                        </div>
                      ) : (
                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                          <p className="submission-content-text">{sub.content}</p>
                        </div>
                      )}
                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Button variant="ghost" size="sm" onClick={() => setExpandedSubId(null)}>Hide Content</Button>
                      </div>
                    </div>

                    {(!isGraded || isEditing) && (
                      <div className="grading-area" style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                        <div className="grade-input-group">
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Score (0-100)</label>
                          <input type="number" min="0" max="100" className="form-input" value={gradingState[sub.id]?.score || ''} onChange={(e) => handleGradeChange(sub.id, 'score', e.target.value)} />
                        </div>
                        <div className="grade-feedback-group" style={{ marginTop: '1rem' }}>
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Instructor Feedback</label>
                          <textarea className="form-textarea" value={gradingState[sub.id]?.feedback || ''} onChange={(e) => handleGradeChange(sub.id, 'feedback', e.target.value)} placeholder="Type feedback here..." rows={3} style={{ width: '100%' }} />
                        </div>
                        <div className="grading-actions" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                          {isEditing && <Button variant="ghost" onClick={() => setEditingGradeId(null)}>Cancel</Button>}
                          <Button onClick={() => saveGrade(sub.id)} style={{ padding: '0.75rem 1.5rem' }}>
                            <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Grade
                          </Button>
                        </div>
                      </div>
                    )}

                    {isGraded && !isEditing && sub.feedback && (
                      <div className="written-feedback" style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', borderLeft: '4px solid #3b82f6', fontStyle: 'italic', color: 'var(--text-primary, #e2e8f0)' }}>
                        <strong>Feedback:</strong> "{sub.feedback}"
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
