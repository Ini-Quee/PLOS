import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './JournalPage.css';

// ─── JOURNAL DATA ─────────────────────────────────────────────────────────────
const JOURNALS = {
  personal: {
    label: '🌿 Personal',
    color: '#F5A623',
    bgClass: 'bg-personal',
    templates: ['Blank Page', 'Classic Diary', 'Morning Pages', 'Reflection', 'Brain Dump', 'Gratitude Log', 'Travel Memory']
  },
  spiritual: {
    label: '✝️ Spiritual',
    color: '#7C3AED',
    bgClass: 'bg-spiritual',
    templates: ['Blank Page', 'Daily Devotion', 'Prayer Journal', 'Bible Study', 'Sermon Notes', 'Faith Walk', 'Verse of the Day']
  },
  budget: {
    label: '💰 Budget',
    color: '#10B981',
    bgClass: 'bg-budget',
    templates: ['Blank Page', 'Daily Expenses', 'Weekly Budget', 'Income Tracker', 'Savings Goal', 'Bills Planner', 'Spending Review']
  },
  habit: {
    label: '🔥 Habits',
    color: '#F87171',
    bgClass: 'bg-habit',
    templates: ['Blank Page', 'Habit Tracker', 'Streak Log', 'Routine Planner', 'Morning Ritual', '21-Day Challenge', 'Accountability Log']
  },
  goals: {
    label: '🎯 Goals',
    color: '#4A9EFF',
    bgClass: 'bg-goals',
    templates: ['Blank Page', 'Year Vision', 'Quarterly Plan', 'Weekly Wins', 'Project Board', 'Milestone Log', 'Vision Map']
  },
  health: {
    label: '🌸 Health',
    color: '#22B8CF',
    bgClass: 'bg-health',
    templates: ['Blank Page', 'Daily Wellness', 'Mood Tracker', 'Symptoms Diary', 'Fitness Log', 'Mental Health', 'Sleep Log']
  }
};

const STICKERS = {
  personal: ['📝', '💌', '🌸', '☀️', '🌙', '💭', '🦋', '🌿', '✨', '❤️', '🎵', '🌈', '📸', '🕊️', '🌺', '💐', '🌻', '🎉', '🥰', '🍃'],
  spiritual: ['🙏', '✝️', '📖', '🕯️', '🌟', '🕊️', '💜', '⭐', '🌅', '🌿', '🙌', '💫', '🌸', '📿', '✨', '🌙', '🫶', '📜', '🌾', '🏛️'],
  budget: ['💰', '💳', '📊', '🏦', '💵', '🎯', '📈', '🛒', '🏠', '✅', '🔐', '💡', '🎁', '📉', '🌱', '💎', '🏆', '🧾', '💸', '🪙'],
  habit: ['💪', '🔥', '⚡', '🏃', '🎯', '✅', '🌟', '🏆', '📅', '⏰', '🥗', '💧', '🧘', '😴', '🎽', '🍎', '🧠', '📝', '🌅', '🦁'],
  goals: ['🎯', '🚀', '🏆', '⭐', '💡', '🌟', '🗺️', '🧭', '🔑', '💪', '📋', '✅', '🏅', '🌱', '🎉', '💫', '🔥', '🎊', '🌈', '🦅'],
  health: ['💊', '🩺', '🧘', '💧', '🥗', '❤️', '🌡️', '🏃', '😴', '🧬', '🍎', '💪', '🌿', '🩹', '🧠', '🌸', '⚕️', '🥦', '🫶', '🫁']
};

const ALL_STICKERS = ['😊', '😢', '😤', '🤩', '😌', '🥺', '😴', '🤔', '❤️', '💔', '✨', '🔥', '💯', '🎉', '🌸', '🌿', '🍃', '☀️', '🌙', '⭐', '🎵', '📸', '🎨', '📝', '💌', '🌈', '🦋', '🕊️', '🌺', '🌻', '🙏', '💪', '🏆', '🎯', '🚀', '💡', '🔑', '🌟', '💫', '✅', '📖', '🍎', '💧', '🥗', '😴', '🧘', '❤️‍🔥', '🫶', '🌊', '🏔️', '🦋', '🎪', '🌄', '🌠', '🎭', '🌊', '⛰️', '🌻', '🦚', '🌺'];

// ─── JOURNAL PAGE COMPONENT ───────────────────────────────────────────────────
export default function JournalPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'personal';

  const [journal, setJournal] = useState(initialType);
  const [tmpl, setTmpl] = useState(0);
  const [paper, setPaper] = useState('lined');
  const [pageColor, setPageColor] = useState('#fdf8ef'); // Custom page color
  const [accent, setAccent] = useState(JOURNALS[initialType].color);
  const [items, setItems] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [water, setWater] = useState(3);
  const [mood, setMood] = useState(null);
  const [lumiInput, setLumiInput] = useState('');
  const [lumiResponse, setLumiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);

  // Floating mic state
  const [showFloatingMic, setShowFloatingMic] = useState(false);
  const [floatingMicPosition, setFloatingMicPosition] = useState({ x: 0, y: 0 });
  const [activeField, setActiveField] = useState(null);
  const [isFloatingListening, setIsFloatingListening] = useState(false);

  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

  // Update accent color when journal type changes
  useEffect(() => {
    setAccent(JOURNALS[journal].color);
    document.documentElement.style.setProperty('--j-color', JOURNALS[journal].color);
  }, [journal]);

  // Attach floating mic handlers to all textareas
  useEffect(() => {
    const textareas = document.querySelectorAll('.page-canvas textarea, .page-canvas input[type="text"]');

    textareas.forEach(field => {
      field.addEventListener('focus', handleFieldFocus);
      field.addEventListener('blur', handleFieldBlur);
    });

    return () => {
      textareas.forEach(field => {
        field.removeEventListener('focus', handleFieldFocus);
        field.removeEventListener('blur', handleFieldBlur);
      });
    };
  }, [tmpl, paper, pageColor]);

  // ─── DATE HELPERS ───────────────────────────────────────────────────────────
  const formatFull = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatShort = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const changeDate = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
    setItems([]);
    setWater(3);
    setMood(null);
  };

  const getDayStrip = () => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      days.push({ offset: i, date: d, label: i === 0 ? 'Today' : formatShort(d) });
    }
    return days;
  };

  // ─── DRAG LOGIC ───────────────────────────────────────────────────────────────
  const makeDraggable = (el) => {
    let offsetX, offsetY, isDragging = false;

    const onMouseDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top = (e.clientY - offsetY) + 'px';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  };

  // ─── STICKERS & STICKY NOTES ──────────────────────────────────────────────────
  const placeSticker = (emoji) => {
    const x = Math.random() * 280 + 40;
    const y = Math.random() * 200 + 100;
    const item = { type: 'sticker', emoji, x, y, id: Date.now() };
    setItems([...items, item]);
  };

  const addSticky = () => {
    const colors = ['#FFF176', '#A5D6A7', '#80DEEA', '#EF9A9A', '#CE93D8', '#FFCC80'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = 50 + Math.random() * 120;
    const y = 80 + Math.random() * 120;
    const item = { type: 'sticky', color, x, y, text: '', id: Date.now() };
    setItems([...items, item]);
  };

  const addPhoto = () => {
    const x = 100 + Math.random() * 150;
    const y = 100 + Math.random() * 150;
    const item = { type: 'photo', x, y, id: Date.now() };
    setItems([...items, item]);
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const clearStickers = () => {
    setItems([]);
  };

  const undoLast = () => {
    setItems(items.slice(0, -1));
  };

  // ─── FLOATING MIC HANDLERS ────────────────────────────────────────────────────
  const handleFieldFocus = (e) => {
    const field = e.target;
    const pageCanvas = document.querySelector('.page-canvas');

    if (!pageCanvas) return;

    const fieldRect = field.getBoundingClientRect();
    const canvasRect = pageCanvas.getBoundingClientRect();

    // Get cursor position within the field
    const cursorY = fieldRect.top - canvasRect.top + 10;

    setFloatingMicPosition({
      x: 8, // Close to left margin line
      y: cursorY
    });
    setShowFloatingMic(true);
    setActiveField(field);
  };

  const handleFieldBlur = (e) => {
    // Delay hiding to allow mic click
    setTimeout(() => {
      if (!isFloatingListening) {
        setShowFloatingMic(false);
        setActiveField(null);
      }
    }, 200);
  };

  const startFloatingDictation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isFloatingListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsFloatingListening(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    let interimTranscript = '';

    recognition.onstart = () => {
      setIsFloatingListening(true);
    };

    recognition.onend = () => {
      setIsFloatingListening(false);
      // Auto-restart if still supposed to be listening
      if (isFloatingListening && activeField) {
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };

    recognition.onresult = (event) => {
      interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (activeField) {
        if (finalTranscript) {
          // Append final transcript to field
          const currentValue = activeField.value || '';
          const cursorPos = activeField.selectionStart || currentValue.length;
          const newValue = currentValue.slice(0, cursorPos) + finalTranscript + currentValue.slice(cursorPos);
          activeField.value = newValue;

          // Move cursor after inserted text
          const newCursorPos = cursorPos + finalTranscript.length;
          activeField.setSelectionRange(newCursorPos, newCursorPos);

          // Trigger input event
          const inputEvent = new Event('input', { bubbles: true });
          activeField.dispatchEvent(inputEvent);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsFloatingListening(false);
      }
    };

    recognition.start();
  };

  // ─── LUMI AI ──────────────────────────────────────────────────────────────────
  const sendToLumi = async () => {
    if (!lumiInput.trim()) return;
    setLumiResponse('Lumi is thinking...');
    // TODO: Call /api/lumi/message endpoint
    setTimeout(() => {
      setLumiResponse(`I heard you say: "${lumiInput}". I'll help you add that to your ${journal} journal.`);
      setLumiInput('');
    }, 1000);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setLumiInput(transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  // ─── SAVE ─────────────────────────────────────────────────────────────────────
  const savePage = async () => {
    const data = {
      journal_type: journal,
      template: JOURNALS[journal].templates[tmpl],
      paper_style: paper,
      accent_color: accent,
      items: items,
      date: currentDate.toISOString(),
      content: '', // TODO: Extract content from textareas
      mood,
      water
    };

    console.log('Saving page:', data);
    // TODO: POST /api/journal/entries
    alert('Page saved! (API integration pending)');
  };

  // ─── COLOR HELPERS ────────────────────────────────────────────────────────────
  const getTextColor = () => {
    // Check if custom page color is dark
    const hex = pageColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // If dark background, use light text. If light background, use dark text
    return brightness < 128 ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)';
  };

  const getLabelColor = () => {
    const hex = pageColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness < 128 ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  };

  // ─── RENDER TEMPLATE CONTENT ──────────────────────────────────────────────────
  const renderTemplateContent = () => {
    const isDark = paper === 'dark';
    const templateName = JOURNALS[journal].templates[tmpl];

    // Blank page for all journal types
    if (tmpl === 0) {
      return (
        <div style={{ position: 'relative', minHeight: '100%' }}>
          <textarea
            className="tf blank-page-textarea"
            placeholder="Start writing..."
            style={{
              minHeight: '450px',
              width: '100%',
              color: getTextColor(),
              fontSize: '15px',
              lineHeight: '28px',
              paddingLeft: '70px',
              paddingRight: '20px',
              paddingTop: '10px'
            }}
          />
        </div>
      );
    }

    // Template-specific content
    switch (journal) {
      case 'personal':
        return renderPersonalTemplate(templateName, isDark);
      case 'spiritual':
        return renderSpiritualTemplate(templateName, isDark);
      case 'budget':
        return renderBudgetTemplate(templateName, isDark);
      case 'habit':
        return renderHabitTemplate(templateName, isDark);
      case 'goals':
        return renderGoalsTemplate(templateName, isDark);
      case 'health':
        return renderHealthTemplate(templateName, isDark);
      default:
        return null;
    }
  };

  // ─── TEMPLATE RENDERERS (PERSONAL) ────────────────────────────────────────────
  const renderPersonalTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Classic Diary') {
      return (
        <>
          {renderHeader('Classic Diary', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel("Today's entry", labelColor)}
          <textarea className="tf" placeholder="Dear journal, today I..." rows="6" style={{ minHeight: '120px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('3 highlights', labelColor)}
          {[1, 2, 3].map(i => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontSize: '18px' }}>★</span>
              <textarea className="tf" placeholder={`Highlight ${i}...`} rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderWater()}
        </>
      );
    }

    if (name === 'Morning Pages') {
      return (
        <>
          {renderHeader('Morning Pages', isDark, 'Stream of consciousness')}
          <div style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic', marginBottom: '10px' }}>
            "Just write. Don't think." — Julia Cameron
          </div>
          <textarea className="tf" placeholder="Everything pouring out right now..." rows="12" style={{ minHeight: '260px', color: textColor }} />
          {renderDivider(isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel('One intention for today', labelColor)}
          <textarea className="tf" placeholder="Today I intend to..." rows="2" style={{ minHeight: '50px', color: textColor }} />
        </>
      );
    }

    if (name === 'Reflection') {
      const questions = ['What went well?', 'What would I change?', 'What am I proud of?', 'What am I learning about myself?'];
      return (
        <>
          {renderHeader('Evening Reflection', isDark)}
          {questions.map((q, i) => (
            <div key={i}>
              {renderLabel(q, labelColor)}
              <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '50px', color: textColor }} />
              {renderDivider(isDark)}
            </div>
          ))}
          {renderMoods(isDark)}
          {renderWater()}
        </>
      );
    }

    if (name === 'Brain Dump') {
      return (
        <>
          {renderHeader('Brain Dump', isDark)}
          {renderLabel('Everything on your mind — just dump it:', labelColor)}
          <textarea className="tf" placeholder="Worries, ideas, tasks, feelings, random thoughts... all of it..." rows="8" style={{ minHeight: '180px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Now sort it — what actually matters?', labelColor)}
          {['🔴 Urgent & Important', '🟡 Important, not urgent', '🟢 Can drop or delegate'].map((l, i) => (
            <div key={i} className="bullet-row">
              <span style={{ fontSize: '14px' }}>{l.slice(0, 2)}</span>
              <textarea className="tf" placeholder={l.slice(3) + '...'} rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderMoods(isDark)}
        </>
      );
    }

    if (name === 'Gratitude Log') {
      const hex = pageColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const boxBg = brightness < 128 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';

      return (
        <>
          {renderHeader('Gratitude Log', isDark)}
          <div className="verse-box" style={{ borderLeft: `3px solid ${accent}`, background: boxBg, color: textColor }}>
            "Give thanks in all circumstances." — 1 Thess 5:18
          </div>
          {renderLabel('5 things I\'m grateful for', labelColor)}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontSize: '18px' }}>♥</span>
              <textarea className="tf" placeholder="I am grateful for..." rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderLabel('Someone I want to appreciate today', labelColor)}
          <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '50px', color: textColor }} />
        </>
      );
    }

    if (name === 'Travel Memory') {
      return (
        <>
          {renderHeader('Travel Memory', isDark, 'Memory page')}
          {renderLabel('Location', labelColor)}
          <textarea className="tf" placeholder="Where I am / was..." rows="1" style={{ minHeight: '32px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('The story of this day', labelColor)}
          <textarea className="tf" placeholder="What happened, what I felt, what I want to remember..." rows="6" style={{ minHeight: '140px', color: textColor }} />
        </>
      );
    }

    return null;
  };

  // ─── TEMPLATE RENDERERS (SPIRITUAL) ───────────────────────────────────────────
  const renderSpiritualTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Daily Devotion') {
      const hex = pageColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const boxBg = brightness < 128 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';

      return (
        <>
          {renderHeader('Daily Devotion', isDark)}
          <div className="verse-box" style={{ borderLeft: `3px solid ${accent}`, background: boxBg }}>
            <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', color: labelColor }}>Today's verse</div>
            <textarea className="tf" placeholder="Type or paste your verse here..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          </div>
          {renderLabel('What this means to me', labelColor)}
          <textarea className="tf" placeholder="Reflection..." rows="4" style={{ minHeight: '90px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('How I will live this today', labelColor)}
          <textarea className="tf" placeholder="Application..." rows="3" style={{ minHeight: '70px', color: textColor }} />
          {renderDivider(isDark)}
          <div style={{ background: 'rgba(0,0,0,.04)', borderRadius: '8px', padding: '10px' }}>
            {renderLabel('Prayer', labelColor)}
          </div>
          <textarea className="tf" placeholder="Lord, today I pray..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    if (name === 'Prayer Journal') {
      return (
        <>
          {renderHeader('Prayer Journal', isDark)}
          {['For myself', 'For family', 'For others', 'For the world'].map((category, i) => {
            const hex = pageColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const boxBg = brightness < 128 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';

            return (
              <div key={i} style={{ background: boxBg, borderRadius: '8px', padding: '9px', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px', color: labelColor }}>{category}</div>
                <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '44px', color: textColor }} />
              </div>
            );
          })}
          {renderDivider(isDark)}
          {renderLabel('Answered prayers — praise report!', labelColor)}
          <textarea className="tf" placeholder="What God has done..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    if (name === 'Bible Study') {
      return (
        <>
          {renderHeader('Bible Study', isDark)}
          {renderLabel('Passage', labelColor)}
          <textarea className="tf" placeholder="Book · Chapter · Verses" rows="1" style={{ minHeight: '32px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Study notes', labelColor)}
          <textarea className="tf" placeholder="What I'm reading and learning..." rows="10" style={{ minHeight: '200px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Summary in my own words', labelColor)}
          <textarea className="tf" placeholder="This passage is about..." rows="2" style={{ minHeight: '50px', color: textColor }} />
        </>
      );
    }

    if (name === 'Sermon Notes') {
      return (
        <>
          {renderHeader('Sermon Notes', isDark)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              {renderLabel('Speaker', labelColor)}
              <textarea className="tf" placeholder="..." rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
            <div>
              {renderLabel('Scripture', labelColor)}
              <textarea className="tf" placeholder="..." rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
          </div>
          {renderLabel('Main points', labelColor)}
          {[1, 2, 3].map(i => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontWeight: 700, fontSize: '14px' }}>{i}.</span>
              <textarea className="tf" placeholder={`Point ${i}...`} rows="1" style={{ minHeight: '30px', color: textColor }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderLabel('What I will do with this', labelColor)}
          <textarea className="tf" placeholder="My response and application..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    if (name === 'Faith Walk') {
      return (
        <>
          {renderHeader('Faith Walk', isDark, 'My journey with God')}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel('Where I see God at work today', labelColor)}
          <textarea className="tf" placeholder="..." rows="4" style={{ minHeight: '90px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What I am trusting Him with', labelColor)}
          <textarea className="tf" placeholder="..." rows="3" style={{ minHeight: '70px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('One step of faith I will take', labelColor)}
          <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '50px', color: textColor }} />
        </>
      );
    }

    if (name === 'Verse of the Day') {
      return (
        <>
          {renderHeader('Verse Meditation', isDark)}
          <div className="verse-box" style={{ borderLeft: `3px solid ${accent}`, background: 'rgba(0,0,0,.04)', fontSize: '16px', fontFamily: "'Caveat', cursive" }}>
            <textarea className="tf" placeholder="Write your verse here..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          </div>
          {renderLabel('Write it out in your own words', labelColor)}
          <textarea className="tf" placeholder="In my own words..." rows="3" style={{ minHeight: '70px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What word or phrase stands out?', labelColor)}
          <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('How does this change how I live?', labelColor)}
          <textarea className="tf" placeholder="..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    return null;
  };

  // ─── TEMPLATE RENDERERS (BUDGET) ──────────────────────────────────────────────
  const renderBudgetTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Daily Expenses') {
      return (
        <>
          {renderHeader('Daily Expenses', isDark)}
          <table className="budget-tbl" style={{ marginBottom: '12px' }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i}>
                  <td><input type="text" placeholder="..." style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
                  <td><input type="text" placeholder="..." style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
                  <td><input type="text" placeholder="₦..." style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderDivider(isDark)}
          <div className="stats-mini">
            <div className="stat-box">
              <div className="stat-num" style={{ color: accent }}>₦0</div>
              <div className="stat-lbl">Income</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: '#F87171' }}>₦0</div>
              <div className="stat-lbl">Spent</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: '#10B981' }}>₦0</div>
              <div className="stat-lbl">Saved</div>
            </div>
          </div>
        </>
      );
    }

    if (name === 'Weekly Budget') {
      return (
        <>
          {renderHeader('Weekly Budget', isDark)}
          {renderLabel('Income this week', labelColor)}
          <textarea className="tf" placeholder="Salary, freelance, other..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Fixed expenses', labelColor)}
          <textarea className="tf" placeholder="Rent, bills, subscriptions..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Variable spend', labelColor)}
          <textarea className="tf" placeholder="Food, transport, leisure..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('Savings this week', labelColor)}
          <textarea className="tf" placeholder="How much I set aside..." rows="1" style={{ minHeight: '32px', color: textColor }} />
        </>
      );
    }

    if (name === 'Income Tracker') {
      return (
        <>
          {renderHeader('Income Tracker', isDark)}
          {renderLabel('Income sources this month', labelColor)}
          {['Salary', 'Freelance / Side income', 'Other', 'Total'].map((source, i) => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontWeight: 600, fontSize: '14px', minWidth: '20px' }}>{source === 'Total' ? '=' : '+'}</span>
              <span style={{ flex: 1, fontSize: '14px', opacity: 0.8, minWidth: '100px', color: textColor }}>{source}</span>
              <input type="text" placeholder="₦..." style={{ width: '80px', background: 'transparent', border: 'none', borderBottom: `1px solid ${labelColor}`, fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderLabel('Notes', labelColor)}
          <textarea className="tf" placeholder="..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    if (name === 'Savings Goal') {
      return (
        <>
          {renderHeader('Savings Goal', isDark)}
          {renderLabel('My saving target', labelColor)}
          <textarea className="tf" placeholder="Goal name + amount..." rows="1" style={{ minHeight: '32px', color: textColor }} />
          {renderDivider(isDark)}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.5, marginBottom: '6px' }}>
              <span>₦0 saved</span>
              <span>₦100,000 goal</span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: '35%', background: accent }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: accent, marginTop: '3px' }}>35% complete</div>
          </div>
          {renderLabel('Fill a block each time you save', labelColor)}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{ width: '20px', height: '20px', borderRadius: '3px', background: i < 7 ? accent : 'rgba(0,0,0,.08)', border: `1px solid ${i < 7 ? accent : 'rgba(0,0,0,.1)'}` }}></div>
            ))}
          </div>
        </>
      );
    }

    if (name === 'Bills Planner') {
      return (
        <>
          {renderHeader('Bills Planner', isDark)}
          {renderLabel('Bills this month', labelColor)}
          {['Rent', 'Data / WiFi', 'Electricity', 'Phone', 'Tithe / Offering', 'Other'].map((bill, i) => (
            <div key={i} className="bullet-row" style={{ marginBottom: '8px' }}>
              <span style={{ flex: 1, fontSize: '13px', opacity: 0.8, color: textColor }}>{bill}</span>
              <input type="text" placeholder="Due date" style={{ width: '70px', background: 'transparent', border: 'none', borderBottom: `1px solid ${labelColor}`, fontSize: '12px', marginRight: '8px', color: textColor }} />
              <input type="text" placeholder="₦ amount" style={{ width: '70px', background: 'transparent', border: 'none', borderBottom: `1px solid ${labelColor}`, fontSize: '12px', color: textColor }} />
              <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1.5px solid ${labelColor}`, cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}></div>
            </div>
          ))}
        </>
      );
    }

    if (name === 'Spending Review') {
      return (
        <>
          {renderHeader('Spending Review', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel('How did I do this month?', labelColor)}
          <textarea className="tf" placeholder="Honest reflection..." rows="3" style={{ minHeight: '70px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What I overspent on', labelColor)}
          <textarea className="tf" placeholder="..." rows="2" style={{ minHeight: '50px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What I will do differently', labelColor)}
          <textarea className="tf" placeholder="Next month I will..." rows="2" style={{ minHeight: '50px', color: textColor }} />
        </>
      );
    }

    return null;
  };

  // ─── TEMPLATE RENDERERS (HABIT, GOALS, HEALTH) ───────────────────────────────
  const renderHabitTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Habit Tracker') {
      return (
        <>
          {renderHeader('Habit Tracker', isDark)}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: '10px', opacity: 0.4 }}>Habit</th>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <th key={i} style={{ padding: '4px', fontSize: '10px', opacity: 0.4, textAlign: 'center' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['🙏 Pray', '📖 Read 10 pages', '💧 Drink water', '💪 Exercise', '✍️ Journal'].map((habit, hi) => (
                  <tr key={hi}>
                    <td style={{ padding: '5px 8px', fontSize: '13px', opacity: 0.85, color: textColor }}>{habit}</td>
                    {Array.from({ length: 7 }, (_, di) => (
                      <td key={di} style={{ padding: '3px', textAlign: 'center' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `1.5px solid ${di < 3 ? accent : labelColor}`, background: di < 3 ? accent : 'transparent', margin: '0 auto', cursor: 'pointer' }}></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderDivider(isDark)}
          {renderLabel('Reflection', labelColor)}
          <textarea className="tf" placeholder="How am I doing with my habits?" rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    return renderGenericTemplate(name, isDark, textColor, labelColor);
  };

  const renderGoalsTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();
    return renderGenericTemplate(name, isDark, textColor, labelColor);
  };

  const renderHealthTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Daily Wellness') {
      return (
        <>
          {renderHeader('Daily Wellness', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderWater()}
          {renderDivider(isDark)}
          {renderLabel('How my body feels today', labelColor)}
          <textarea className="tf" placeholder="Energy level, aches, overall wellness..." rows="3" style={{ minHeight: '70px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What I did for my health today', labelColor)}
          <textarea className="tf" placeholder="Exercise, meals, rest..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    if (name === 'Mood Tracker') {
      return (
        <>
          {renderHeader('Mood Tracker', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel('What influenced my mood today?', labelColor)}
          <textarea className="tf" placeholder="People, events, thoughts..." rows="4" style={{ minHeight: '90px', color: textColor }} />
          {renderDivider(isDark)}
          {renderLabel('What would help me feel better?', labelColor)}
          <textarea className="tf" placeholder="..." rows="3" style={{ minHeight: '70px', color: textColor }} />
        </>
      );
    }

    return renderGenericTemplate(name, isDark, textColor, labelColor);
  };

  const renderGenericTemplate = (name, isDark, textColor, labelColor) => {
    return (
      <>
        {renderHeader(name, isDark)}
        {renderLabel('Notes', labelColor)}
        <textarea className="tf" placeholder="Write freely..." rows="12" style={{ minHeight: '260px', color: textColor }} />
      </>
    );
  };

  // ─── HELPER RENDERERS ─────────────────────────────────────────────────────────
  const renderHeader = (title, isDark, subtitle = '') => {
    const titleColor = getTextColor();
    const subColor = getLabelColor();
    return (
      <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: '12px', marginBottom: '14px' }}>
        <div className="page-title-big" style={{ color: titleColor }}>{title}</div>
        <div className="page-date-sub" style={{ color: subColor }}>{formatFull(currentDate)}{subtitle ? ' · ' + subtitle : ''}</div>
      </div>
    );
  };

  const renderMoods = (isDark) => {
    const iconColor = getLabelColor();
    return (
      <>
        <div className="s-label" style={{ color: iconColor }}>How am I feeling?</div>
        <div className="mood-row">
          {['😊', '😌', '😤', '🤩', '😢', '🥱', '💪', '😔'].map((emoji, i) => (
            <button
              key={i}
              className={`mbtn ${mood === i ? 'on' : ''}`}
              onClick={() => setMood(mood === i ? null : i)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </>
    );
  };

  const renderWater = () => {
    return (
      <>
        <div className="s-label">Hydration</div>
        <div className="water-row">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className={`wdrop ${i <= water ? 'full' : ''}`}
              onClick={() => setWater(i)}
            />
          ))}
        </div>
      </>
    );
  };

  const renderLabel = (text, color) => {
    return <div className="s-label" style={{ color }}>{text}</div>;
  };

  const renderDivider = (isDark) => {
    const hex = pageColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const divColor = brightness < 128 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    return <div className="divider" style={{ background: divColor }}></div>;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'transparent', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', padding: '16px' }}>
      {/* Top bar */}
      <div className="journal-topbar">
        <div className="journal-logo">PLOS<span>.</span></div>
        <div className="journal-page-title">Journal</div>
      </div>

      {/* Journal tabs */}
      <div className="jtabs">
        {Object.entries(JOURNALS).map(([key, j]) => (
          <button
            key={key}
            className={`jtab ${journal === key ? 'active' : ''}`}
            style={journal === key ? { background: j.color, borderColor: j.color } : {}}
            onClick={() => {
              setJournal(key);
              setTmpl(0);
              setItems([]);
              setMood(null);
            }}
          >
            {j.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="journal-main">
        {/* Left sidebar */}
        <div className="journal-sidebar">
          {/* Templates */}
          <div className="journal-panel">
            <h3>Page Layout</h3>
            <div className="tmpl-list">
              {JOURNALS[journal].templates.map((t, i) => (
                <div
                  key={i}
                  className={`tmpl ${tmpl === i ? 'active' : ''}`}
                  onClick={() => {
                    setTmpl(i);
                    setItems([]);
                  }}
                >
                  <div className="tmpl-dot"></div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Paper style */}
          <div className="journal-panel">
            <h3>Paper Style</h3>
            <div className="style-row">
              {['lined', 'dotted', 'grid', 'blank', 'kraft', 'dark'].map(s => (
                <button
                  key={s}
                  className={`sbtn ${paper === s ? 'active' : ''}`}
                  onClick={() => setPaper(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div className="journal-panel">
            <h3>Accent Color</h3>
            <div className="color-row">
              {['#F5A623', '#7C3AED', '#22B8CF', '#10B981', '#F87171', '#4A9EFF', '#A78BFA', '#34D399'].map(c => (
                <div
                  key={c}
                  className={`cdot ${accent === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => {
                    setAccent(c);
                    document.documentElement.style.setProperty('--j-color', c);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Page color */}
          <div className="journal-panel">
            <h3>Page Color</h3>
            <div className="color-row">
              {[
                { color: '#fdf8ef', label: 'Cream' },
                { color: '#ffffff', label: 'White' },
                { color: '#f7f4ff', label: 'Lavender' },
                { color: '#f2fbf7', label: 'Mint' },
                { color: '#fff4f7', label: 'Rose' },
                { color: '#f4f4ff', label: 'Sky' },
                { color: '#d4a86a', label: 'Kraft' },
                { color: '#1a1a2e', label: 'Dark' },
                { color: '#a8e6cf', label: 'Green' },
                { color: '#ffd3b6', label: 'Peach' },
                { color: '#ffaaa5', label: 'Coral' },
                { color: '#dcedc1', label: 'Lime' },
              ].map(({ color, label }) => (
                <div
                  key={color}
                  className={`cdot ${pageColor === color ? 'active' : ''}`}
                  style={{ background: color, border: color === '#ffffff' ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
                  onClick={() => setPageColor(color)}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Add to page */}
          <div className="journal-panel">
            <h3>Add to Page</h3>
            <div className="tool-row">
              <button className="tbtn" onClick={addSticky}>📌 Sticky</button>
              <button className="tbtn" onClick={addPhoto}>📸 Photo</button>
              <button className="tbtn" onClick={() => setShowStickerModal(true)}>😊 Sticker</button>
            </div>
            <h3 style={{ marginTop: '8px' }}>Quick Stickers</h3>
            <div className="sq-grid">
              {STICKERS[journal].slice(0, 20).map((s, i) => (
                <div key={i} className="sqbtn" onClick={() => placeSticker(s)}>{s}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Book */}
        <div className="book-wrap">
          {/* Date navigation */}
          <div className="date-nav">
            <button className="dnav-btn" onClick={() => changeDate(-1)}>‹</button>
            <div className="date-label">{formatFull(currentDate)}</div>
            <button className="dnav-btn" onClick={() => changeDate(1)}>›</button>
          </div>

          {/* Day strip */}
          <div className="day-strip">
            {getDayStrip().map((day, i) => (
              <div
                key={i}
                className={`day-chip ${day.offset === 0 ? 'active' : ''}`}
                style={day.offset === 0 ? { background: accent } : {}}
                onClick={() => {
                  if (day.offset !== 0) changeDate(day.offset);
                }}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Page area */}
          <div className="page-area" style={{ position: 'relative' }}>
            <div
              ref={canvasRef}
              className={`page-canvas tex-${paper}`}
              style={{ backgroundColor: pageColor, position: 'relative' }}
            >
              {/* Margin line */}
              {(paper === 'lined' || paper === 'blank') && (
                <div className="margin-line"></div>
              )}

              {/* Template content */}
              {renderTemplateContent()}

              {/* Placed items */}
              {items.map(item => {
                if (item.type === 'sticker') {
                  return (
                    <div
                      key={item.id}
                      className="placed-sticker"
                      style={{ left: item.x, top: item.y }}
                      onDoubleClick={() => removeItem(item.id)}
                      ref={el => el && makeDraggable(el)}
                    >
                      {item.emoji}
                    </div>
                  );
                }
                if (item.type === 'sticky') {
                  return (
                    <div
                      key={item.id}
                      className="sticky-el"
                      style={{
                        background: item.color,
                        left: item.x,
                        top: item.y,
                        transform: `rotate(${(Math.random() - 0.5) * 5}deg)`
                      }}
                      ref={el => el && makeDraggable(el)}
                    >
                      <textarea
                        placeholder="Write a note..."
                        defaultValue={item.text}
                      />
                    </div>
                  );
                }
                if (item.type === 'photo') {
                  return (
                    <div
                      key={item.id}
                      className="photo-slot"
                      style={{
                        position: 'absolute',
                        left: item.x,
                        top: item.y,
                        width: '90px',
                        height: '90px',
                        background: '#fff',
                        border: '8px solid #fff',
                        boxShadow: '2px 3px 10px rgba(0,0,0,0.15)'
                      }}
                      onDoubleClick={() => removeItem(item.id)}
                      ref={el => el && makeDraggable(el)}
                    >
                      +
                    </div>
                  );
                }
                return null;
              })}

              {/* Floating Microphone inside page area */}
              {showFloatingMic && (
                <div
                  style={{
                    position: 'absolute',
                    left: floatingMicPosition.x,
                    top: floatingMicPosition.y,
                    zIndex: 999,
                    pointerEvents: 'all'
                  }}
                >
                  <button
                    onClick={startFloatingDictation}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: isFloatingListening ? '2px solid #F5A623' : '1px solid rgba(245,166,35,0.4)',
                      background: isFloatingListening
                        ? 'radial-gradient(circle, #ffbe4d, #F5A623)'
                        : 'rgba(245,166,35,0.2)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      animation: isFloatingListening ? 'breathe 0.6s infinite' : 'none',
                      boxShadow: isFloatingListening
                        ? '0 0 16px rgba(245,166,35,0.8), 0 2px 8px rgba(0,0,0,0.2)'
                        : '0 2px 6px rgba(0,0,0,0.15)',
                      outline: 'none'
                    }}
                    title={isFloatingListening ? 'Click to stop' : 'Click to dictate'}
                  >
                    {isFloatingListening ? '⏸' : '🎙'}
                  </button>
                  {isFloatingListening && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '38px',
                        background: '#F5A623',
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '9px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      Listening...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="action-bar">
            <button className="abtn" onClick={clearStickers}>Clear stickers</button>
            <button className="abtn" onClick={undoLast}>Undo last</button>
            <span style={{ flex: 1, fontSize: '11px', color: 'var(--muted)' }}>Drag stickers & notes to reposition</span>
            <button className="abtn primary" onClick={savePage}>Save page ↗</button>
          </div>

          {/* Lumi AI bar */}
          <div className="lumi-bar">
            <div className={`lumi-orb ${isListening ? 'listening' : ''}`}></div>
            <input
              className="lumi-input"
              placeholder="Tell Lumi what to add or write for you on this page..."
              value={lumiInput}
              onChange={(e) => setLumiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendToLumi()}
            />
            <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={toggleVoice} title="Voice input">
              🎙️
            </button>
            <button className="send-btn" onClick={sendToLumi} disabled={!lumiInput.trim()}>
              Send
            </button>
          </div>

          {/* Lumi response */}
          {lumiResponse && (
            <div className="lumi-resp">
              {lumiResponse}
            </div>
          )}
        </div>
      </div>

      {/* Sticker modal */}
      {showStickerModal && (
        <div className="modal-bg open" onClick={() => setShowStickerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Choose a sticker</h3>
            <div className="modal-grid">
              {ALL_STICKERS.map((s, i) => (
                <div
                  key={i}
                  className="ms"
                  onClick={() => {
                    placeSticker(s);
                    setShowStickerModal(false);
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={() => setShowStickerModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Floating Microphone */}
      {showFloatingMic && (
        <div
          style={{
            position: 'absolute',
            left: floatingMicPosition.x,
            top: floatingMicPosition.y,
            zIndex: 999,
            pointerEvents: 'all'
          }}
        >
          <button
            onClick={startFloatingDictation}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: isFloatingListening ? '2px solid #F5A623' : '2px solid rgba(245,166,35,0.5)',
              background: isFloatingListening
                ? 'radial-gradient(circle, #ffbe4d, #F5A623)'
                : 'rgba(245,166,35,0.15)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              animation: isFloatingListening ? 'breathe 0.6s infinite' : 'none',
              boxShadow: isFloatingListening
                ? '0 0 20px rgba(245,166,35,0.7), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 4px 12px rgba(0,0,0,0.3)',
            }}
            title={isFloatingListening ? 'Click to stop dictation' : 'Click to start dictation'}
          >
            {isFloatingListening ? '⏸️' : '🎙️'}
          </button>
          {isFloatingListening && (
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#F5A623',
                color: '#000',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              🎤 Listening...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
