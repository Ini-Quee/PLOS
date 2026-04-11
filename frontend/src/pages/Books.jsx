import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * Books Page — Book Tracker & Reading System
 * Per AGENTS.md Part 6.6
 * User adds books. Speaks reading sessions. Lumi tracks progress and suggests.
 */
export default function Books() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('reading'); // reading | completed

  const [form, setForm] = useState({
    title: '',
    author: '',
    total_pages: '',
    category: 'personal',
  });

  const categories = {
    personal: { label: 'Personal Growth', icon: '🌱' },
    professional: { label: 'Professional', icon: '💼' },
    fiction: { label: 'Fiction', icon: '📖' },
    technical: { label: 'Technical', icon: '⚙️' },
    biography: { label: 'Biography', icon: '👤' },
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    try {
      const response = await api.get('/books');
      setBooks(response.data.books || []);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addBook(e) {
    e.preventDefault();
    try {
      await api.post('/books', {
        ...form,
        total_pages: parseInt(form.total_pages) || 0,
      });
      setShowAddModal(false);
      setForm({ title: '', author: '', total_pages: '', category: 'personal' });
      fetchBooks();
    } catch (err) {
      console.error('Error adding book:', err);
    }
  }

  async function logReadingSession(pages) {
    if (!selectedBook || !pages) return;
    try {
      await api.post(`/books/${selectedBook.id}/sessions`, {
        pages_read: parseInt(pages),
      });
      fetchBooks();
      // Refresh selected book
      const updated = await api.get(`/books/${selectedBook.id}`);
      setSelectedBook(updated.data.book);
    } catch (err) {
      console.error('Error logging session:', err);
    }
  }

  const filteredBooks = books.filter((book) =>
    activeTab === 'reading' ? !book.is_complete : book.is_complete
  );

  // Calculate reading stats
  const totalBooks = books.length;
  const completedBooks = books.filter((b) => b.is_complete).length;
  const totalPagesRead = books.reduce((sum, b) => sum + (b.pages_read || 0), 0);

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
              My Books
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '12px 24px', backgroundColor: '#F5A623', border: 'none', borderRadius: '12px',
            color: '#0D0D0D', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>+ Add Book</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Books', value: totalBooks, icon: '📚' },
            { label: 'Completed', value: completedBooks, icon: '✅' },
            { label: 'Pages Read', value: totalPagesRead.toLocaleString(), icon: '📄' },
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['reading', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                backgroundColor: activeTab === tab ? '#F5A623' : '#242424',
                color: activeTab === tab ? '#0D0D0D' : '#A89880',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {tab === 'reading' ? '📖 Currently Reading' : '✅ Completed'}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : filteredBooks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', backgroundColor: '#1A1A1A',
            borderRadius: '16px', border: '1px solid #2E2E2E'
          }}>
            <p style={{ color: '#A89880', fontSize: '18px', fontFamily: "'DM Serif Display', serif" }}>
              {activeTab === 'reading' ? 'No books currently being read' : 'No completed books yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredBooks.map((book) => {
              const progress = book.total_pages > 0 ? (book.pages_read / book.total_pages) * 100 : 0;
              const cat = categories[book.category] || categories.personal;

              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  style={{
                    backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
                    padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(245, 166, 35, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                    {book.is_complete && <span style={{ fontSize: '20px' }}>✅</span>}
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#F5F0E8', fontSize: '18px', fontWeight: 600 }}>
                    {book.title}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', color: '#A89880', fontSize: '14px' }}>
                    by {book.author || 'Unknown Author'}
                  </p>

                  {!book.is_complete && book.total_pages > 0 && (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#A89880', fontSize: '12px' }}>{Math.round(progress)}%</span>
                          <span style={{ color: '#6B5F52', fontSize: '12px' }}>
                            {book.pages_read}/{book.total_pages} pages
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#2E2E2E', borderRadius: '3px' }}>
                          <div style={{
                            height: '100%', width: `${progress}%`, backgroundColor: '#F5A623',
                            borderRadius: '3px', transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                      <p style={{ margin: 0, color: '#6B5F52', fontSize: '12px' }}>
                        {book.total_pages - book.pages_read} pages remaining
                      </p>
                    </>
                  )}

                  {book.date_completed && (
                    <p style={{ margin: '8px 0 0 0', color: '#4CAF7D', fontSize: '12px' }}>
                      Completed {new Date(book.date_completed).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Book Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={addBook} style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
              padding: '24px', maxWidth: '500px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                Add New Book
              </h2>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Book title"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Author"
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <input
                type="number"
                value={form.total_pages}
                onChange={(e) => setForm({ ...form, total_pages: e.target.value })}
                placeholder="Total pages"
                min="1"
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
                }}>Add Book</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
