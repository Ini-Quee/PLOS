import { useNavigate } from 'react-router-dom';
import './Bookshelf.css';

const JOURNALS = [
  {
    id: 'daily',
    title: 'Daily Diary',
    emoji: '📖',
    gradient: 'linear-gradient(145deg, #E88FA8, #B05070)',
  },
  {
    id: 'dreams',
    title: 'Dream Log',
    emoji: '🌙',
    gradient: 'linear-gradient(145deg, #88BAE8, #4878B8)',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    emoji: '🌿',
    gradient: 'linear-gradient(145deg, #90D090, #408040)',
  },
  {
    id: 'ideas',
    title: 'Ideas',
    emoji: '💡',
    gradient: 'linear-gradient(145deg, #D4B070, #8A6030)',
  },
  {
    id: 'goals',
    title: 'Goals',
    emoji: '🎯',
    gradient: 'linear-gradient(145deg, #C088D0, #703890)',
  },
];

export default function Bookshelf() {
  const navigate = useNavigate();

  function openJournal(journalId) {
    // Navigate to journal page with the specific journal type
    navigate(`/journal/${journalId}`);
  }

  return (
    <div className="bookshelf-container">
      <h2 className="bookshelf-title">My Journals</h2>
      
      <div className="bookshelf">
        {JOURNALS.map((journal) => (
          <div
            key={journal.id}
            className="book-wrap"
            onClick={() => openJournal(journal.id)}
          >
            <div className="book" style={{ background: journal.gradient }}>
              <div className="book-spine"></div>
              <div className="book-inner-title">
                <span className="book-emoji">{journal.emoji}</span>
                {journal.title}
              </div>
            </div>
            <div className="book-label">{journal.title}</div>
          </div>
        ))}

        {/* Add new journal button */}
        <div className="book-wrap">
          <div
            className="book-add"
            onClick={() => alert('New journal coming soon!')}
          >
            <span className="book-add-icon">＋</span>
            <span className="book-add-label">New Journal</span>
          </div>
          <div className="book-label">New</div>
        </div>
      </div>
    </div>
  );
}