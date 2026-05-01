import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * Projects Page — Project & Task Management
 * Per AGENTS.md Part 6.8
 */
export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newTask, setNewTask] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'personal',
    target_date: '',
  });

  const categories = {
    personal: { label: 'Personal', color: '#9B59B6', icon: '✨' },
    work: { label: 'Work', color: '#C8955C', icon: '💼' },
    learning: { label: 'Learning', color: '#3498DB', icon: '📚' },
    creative: { label: 'Creative', color: '#E74C3C', icon: '🎨' },
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    try {
      await api.post('/projects', form);
      setShowAddModal(false);
      setForm({ name: '', description: '', category: 'personal', target_date: '' });
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
    }
  }

  async function toggleTaskComplete(projectId, taskId, completed) {
    try {
      await api.put(`/projects/tasks/${taskId}`, {
        title: '', // Keep existing title
        is_complete: completed,
      });
      fetchProjects();
      if (selectedProject) {
        const updated = await api.get(`/projects/${projectId}/tasks`);
        setSelectedProject({ ...selectedProject, tasks: updated.data.tasks });
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  }

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim() || !selectedProject) return;

    try {
      await api.post(`/projects/${selectedProject.id}/tasks`, {
        title: newTask,
      });
      setNewTask('');
      const updated = await api.get(`/projects/${selectedProject.id}/tasks`);
      setSelectedProject({ ...selectedProject, tasks: updated.data.tasks });
      fetchProjects();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', color: '#A89880', fontSize: '14px', cursor: 'pointer',
            }}>← Back</button>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: '#F5F0E8' }}>
              Active Projects
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '12px 24px', backgroundColor: '#C8955C', border: 'none', borderRadius: '12px',
            color: '#0D0D0D', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>+ New Project</button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <p style={{ color: '#A89880', fontSize: '18px', fontFamily: "'DM Serif Display', serif" }}>
              No active projects
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {projects.map((project) => {
              const cat = categories[project.category] || categories.personal;
              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  style={{
                    backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
                    padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(245, 166, 35, 0.08)';
                    e.currentTarget.style.borderColor = '#F5A623';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#2E2E2E';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 12px', backgroundColor: `${cat.color}20`, borderRadius: '8px',
                      color: cat.color, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
                    }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ color: project.status === 'active' ? '#4CAF7D' : '#A89880', fontSize: '12px' }}>
                      {project.status}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#F5F0E8', fontSize: '18px', fontWeight: 600 }}>
                    {project.name}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', color: '#6B5F52', fontSize: '14px', lineHeight: 1.5 }}>
                    {project.description || 'No description'}
                  </p>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#A89880', fontSize: '12px' }}>Progress</span>
                      <span style={{ color: '#C8955C', fontSize: '12px', fontWeight: 600 }}>
                        {project.progress_percent || 0}%
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'rgba(16,16,30,0.42)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${project.progress_percent || 0}%`,
                        backgroundColor: cat.color, borderRadius: '3px', transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B5F52' }}>
                    <span>{project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                    {project.target_date && (
                      <span>Due {new Date(project.target_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                  {selectedProject.name}
                </h2>
                <button onClick={() => setSelectedProject(null)} style={{
                  padding: '8px', background: 'transparent', border: 'none', color: '#A89880', fontSize: '20px', cursor: 'pointer'
                }}>✕</button>
              </div>

              {/* Tasks */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#A89880', fontSize: '14px' }}>Tasks</h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    style={{
                      flex: 1, padding: '12px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '8px', color: '#F5F0E8', fontSize: '14px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && addTask(e)}
                  />
                  <button onClick={addTask} style={{
                    padding: '12px 20px', backgroundColor: '#C8955C', border: 'none', borderRadius: '8px',
                    color: '#0D0D0D', fontWeight: 600, cursor: 'pointer'
                  }}>Add</button>
                </div>

                {/* Task list would go here - simplified for now */}
                <p style={{ color: '#6B5F52', textAlign: 'center', padding: '20px' }}>
                  Tasks feature coming soon
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Project Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={createProject} style={{
              backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px', maxWidth: '500px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                New Project
              </h2>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Project name"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#F5F0E8', fontSize: '14px'
                }}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#F5F0E8', fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '8px', color: '#A89880', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '12px', backgroundColor: '#C8955C', border: 'none',
                  borderRadius: '8px', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer'
                }}>Create Project</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
