import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * Content Planner Page
 * Per AGENTS.md Part 6.9
 * Schedule posts, get notifications, mark as posted
 */
export default function ContentPlanner() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [form, setForm] = useState({
    platform: 'linkedin',
    content: '',
    scheduled_for: '',
    is_memorial: false,
  });

  const platforms = {
    linkedin: { label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    twitter: { label: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
    instagram: { label: 'Instagram', icon: '📷', color: '#E4405F' },
    blog: { label: 'Blog', icon: '✍️', color: '#C8955C' },
  };

  useEffect(() => {
    fetchPosts();
    fetchTemplates();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const response = await api.get('/content/posts');
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTemplates() {
    try {
      const response = await api.get('/content/templates');
      setTemplates(response.data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }

  async function addPost(e) {
    e.preventDefault();
    try {
      await api.post('/content/posts', form);
      setShowAddModal(false);
      setForm({ platform: 'linkedin', content: '', scheduled_for: '', is_memorial: false });
      fetchPosts();
    } catch (err) {
      console.error('Error adding post:', err);
    }
  }

  async function markAsPosted(postId) {
    try {
      await api.post(`/content/posts/${postId}/mark-posted`);
      fetchPosts();
    } catch (err) {
      console.error('Error marking post:', err);
    }
  }

  // Group posts by date
  const postsByDate = posts.reduce((acc, post) => {
    const date = new Date(post.scheduled_for).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});

  const sortedDates = Object.keys(postsByDate).sort((a, b) => new Date(a) - new Date(b));

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
              Content Planner
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '12px 24px', backgroundColor: '#C8955C', border: 'none', borderRadius: '12px',
            color: '#0D0D0D', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>+ Schedule Post</button>
        </div>

        {/* Upcoming posts */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <p style={{ color: '#A89880', fontSize: '18px', fontFamily: "'DM Serif Display', serif" }}>
              No posts scheduled yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sortedDates.map((date) => (
              <div key={date} style={{
                backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px'
              }}>
                <h2 style={{
                  margin: '0 0 16px 0', color: '#A89880', fontSize: '16px',
                  fontFamily: "'Inter', sans-serif", textTransform: 'uppercase'
                }}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {postsByDate[date].map((post) => {
                    const platform = platforms[post.platform] || platforms.linkedin;
                    const isPast = new Date(post.scheduled_for) < new Date();

                    return (
                      <div key={post.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '16px',
                        padding: '16px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '12px',
                        borderLeft: `4px solid ${platform.color}`,
                        opacity: post.status === 'posted' ? 0.6 : 1
                      }}>
                        <span style={{ fontSize: '24px' }}>{platform.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{
                              padding: '2px 8px', backgroundColor: `${platform.color}20`,
                              borderRadius: '4px', color: platform.color, fontSize: '12px',
                              fontWeight: 600
                            }}>
                              {platform.label}
                            </span>
                            {post.is_memorial && (
                              <span style={{
                                padding: '2px 8px', backgroundColor: 'rgba(245, 166, 35, 0.2)',
                                borderRadius: '4px', color: '#C8955C', fontSize: '12px'
                              }}>⭐ Memorial</span>
                            )}
                            {post.status === 'posted' && (
                              <span style={{
                                padding: '2px 8px', backgroundColor: 'rgba(76, 175, 125, 0.2)',
                                borderRadius: '4px', color: '#4CAF7D', fontSize: '12px'
                              }}>✓ Posted</span>
                            )}
                          </div>
                          <p style={{
                            margin: 0, color: '#F5F0E8', fontSize: '14px',
                            whiteSpace: 'pre-wrap', lineHeight: 1.5
                          }}>
                            {post.content}
                          </p>
                          {post.status === 'scheduled' && isPast && (
                            <div style={{ marginTop: '12px' }}>
                              <button onClick={() => markAsPosted(post.id)} style={{
                                padding: '8px 16px', backgroundColor: '#C8955C', border: 'none',
                                borderRadius: '8px', color: '#0D0D0D', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer'
                              }}>
                                ✓ Mark as Posted
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Post Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={addPost} style={{
              backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px', maxWidth: '500px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                Schedule Post
              </h2>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#F5F0E8'
                }}
              >
                {Object.entries(platforms).map(([key, p]) => (
                  <option key={key} value={key}>{p.icon} {p.label}</option>
                ))}
              </select>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="What's on your mind?"
                rows={4}
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#F5F0E8', resize: 'vertical'
                }}
              />
              <input
                type="datetime-local"
                value={form.scheduled_for}
                onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(12,12,24,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#F5F0E8'
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
                }}>Schedule</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
