import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ emails: { today: 0, this_week: 0 }, contacts: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', category: 'personal', notes: '' });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const response = await api.get('/contacts');
      setContacts(response.data.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get('/contacts/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function addContact(e) {
    e.preventDefault();
    try {
      await api.post('/contacts', form);
      setShowAddModal(false);
      setForm({ name: '', email: '', category: 'personal', notes: '' });
      fetchContacts();
      fetchStats();
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  }

  async function sendEmail(e) {
    e.preventDefault();
    if (!selectedContact) return;
    setSending(true);
    try {
      await api.post('/contacts/send-email', {
        to: selectedContact.email,
        to_name: selectedContact.name,
        subject: emailForm.subject,
        body: emailForm.body,
        contact_id: selectedContact.id,
      });
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
      setSelectedContact(null);
      fetchStats();
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <LivingBackground />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
              borderRadius: '12px', color: '#A89880', fontSize: '14px', cursor: 'pointer',
            }}>← Back</button>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: '#F5F0E8' }}>
              Contacts
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '12px 24px', backgroundColor: '#F5A623', border: 'none', borderRadius: '12px',
            color: '#0D0D0D', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>+ Add Contact</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Contacts', value: stats.contacts || 0, icon: '👥' },
            { label: 'Sent Today', value: stats.emails?.today || 0, icon: '📤' },
            { label: 'Sent This Week', value: stats.emails?.this_week || 0, icon: '📧' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid #2E2E2E',
              padding: '20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#F5A623', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6B5F52', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Contacts List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', backgroundColor: '#1A1A1A',
            borderRadius: '16px', border: '1px solid #2E2E2E'
          }}>
            <p style={{ color: '#A89880', fontSize: '18px', fontFamily: "'DM Serif Display', serif" }}>
              No contacts yet
            </p>
            <p style={{ color: '#6B5F52', fontSize: '14px' }}>
              Add your first contact to start emailing
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
                  padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#242424',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 4px 0', color: '#F5F0E8', fontSize: '16px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </h3>
                  <p style={{ margin: 0, color: '#A89880', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowEmailModal(true);
                  }}
                  style={{
                    padding: '8px 16px', backgroundColor: '#F5A623', border: 'none',
                    borderRadius: '8px', color: '#0D0D0D', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Email
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Contact Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={addContact} style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
              padding: '24px', maxWidth: '500px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                Add Contact
              </h2>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
                  borderRadius: '8px', color: '#A89880', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '12px', backgroundColor: '#F5A623', border: 'none',
                  borderRadius: '8px', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer'
                }}>Add Contact</button>
              </div>
            </form>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && selectedContact && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={sendEmail} style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
              padding: '24px', maxWidth: '600px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                Email {selectedContact.name}
              </h2>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Subject"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                placeholder="Write your email..."
                rows={6}
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8', resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowEmailModal(false)} style={{
                  flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
                  borderRadius: '8px', color: '#A89880', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={sending} style={{
                  flex: 1, padding: '12px', backgroundColor: '#F5A623', border: 'none',
                  borderRadius: '8px', color: '#0D0D0D', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1
                }}>
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
