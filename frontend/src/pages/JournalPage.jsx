import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './JournalPage.css';
import api from '../lib/api';
import BlockEditor from '../components/journal/BlockEditor';

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
  wellness: {
    label: '🌸 Wellness',
    color: '#22B8CF',
    bgClass: 'bg-wellness',
    templates: ['Blank Page', 'Daily Wellness', 'Mood Tracker', 'Symptoms Diary', 'Fitness Log', 'Habit Tracker', 'Sleep Log']
  },
  goals: {
    label: '🎯 Goals',
    color: '#4A9EFF',
    bgClass: 'bg-goals',
    templates: ['Blank Page', 'Year Vision', 'Quarterly Plan', 'Weekly Wins', 'Project Board', 'Milestone Log', 'Vision Map']
  },
  business: {
    label: '💡 Business',
    color: '#F5A623',
    bgClass: 'bg-business',
    templates: ['Blank Page', 'Morning Pages', 'Brain Dump', 'Project Board', 'Milestone Log', 'Vision Map', 'Accountability Log']
  }
};

const STICKERS = {
  personal: ['📝', '💌', '🌸', '☀️', '🌙', '💭', '🦋', '🌿', '✨', '❤️', '🎵', '🌈', '📸', '🕊️', '🌺', '💐', '🌻', '🎉', '🥰', '🍃'],
  spiritual: ['🙏', '✝️', '📖', '🕯️', '🌟', '🕊️', '💜', '⭐', '🌅', '🌿', '🙌', '💫', '🌸', '📿', '✨', '🌙', '🫶', '📜', '🌾', '🏛️'],
  budget: ['💰', '💳', '📊', '🏦', '💵', '🎯', '📈', '🛒', '🏠', '✅', '🔐', '💡', '🎁', '📉', '🌱', '💎', '🏆', '🧾', '💸', '🪙'],
  wellness: ['💊', '🩺', '🧘', '💧', '🥗', '❤️', '🌡️', '🏃', '😴', '🧬', '🍎', '💪', '🌿', '🩹', '🧠', '🌸', '⚕️', '🥦', '🫶', '🫁'],
  goals: ['🎯', '🚀', '🏆', '⭐', '💡', '🌟', '🗺️', '🧭', '🔑', '💪', '📋', '✅', '🏅', '🌱', '🎉', '💫', '🔥', '🎊', '🌈', '🦅'],
  business: ['💡', '📊', '🏢', '🤝', '💰', '📈', '🚀', '🔑', '💼', '📋', '✅', '🏆', '🎯', '💫', '🌟', '🔥', '⚡', '🎊', '🦅', '💎']
};

const ALL_STICKERS = ['😊', '😢', '😤', '🤩', '😌', '🥺', '😴', '🤔', '❤️', '💔', '✨', '🔥', '💯', '🎉', '🌸', '🌿', '🍃', '☀️', '🌙', '⭐', '🎵', '📸', '🎨', '📝', '💌', '🌈', '🦋', '🕊️', '🌺', '🌻', '🙏', '💪', '🏆', '🎯', '🚀', '💡', '🔑', '🌟', '💫', '✅', '📖', '🍎', '💧', '🥗', '😴', '🧘', '❤️‍🔥', '🫶', '🌊', '🏔️', '🦋', '🎪', '🌄', '🌠', '🎭', '🌊', '⛰️', '🌻', '🦚', '🌺'];

// ─── JOURNAL PAGE COMPONENT ───────────────────────────────────────────────────
export default function JournalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'personal';
  const initialTemplate = searchParams.get('template') || null;
  const initialDate = searchParams.get('date') || null;

  // Resolve template index from ?template= query param
  const resolvedTmplIndex = (() => {
    if (!initialTemplate || !JOURNALS[initialType]) return 0;
    const idx = JOURNALS[initialType].templates.findIndex(
      t => t.toLowerCase() === decodeURIComponent(initialTemplate).toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  })();

  const [journal, setJournal] = useState(initialType);
  const [tmpl, setTmpl] = useState(resolvedTmplIndex);
  const [paper, setPaper] = useState('lined');
  const [pageColor, setPageColor] = useState('#fdf8ef'); // Custom page color
  const [accent, setAccent] = useState(JOURNALS[initialType]?.color || '#F5A623');
  const [items, setItems] = useState([]);
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate + 'T00:00:00') : new Date());
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

  const canvasRef       = useRef(null);
  const recognitionRef  = useRef(null);

  // ── Live page fields: loaded from API, saved on blur ──────────────────────────
  // pageFields holds the current named-field values for the active template.
  // Lumi writes here via the API; the user edits here; both paths autosave.
  const [pageFields, setPageFields]     = useState({});
  const [pageEntryId, setPageEntryId]   = useState(null);  // UUID from DB (null = new)
  const [fieldsDirty, setFieldsDirty]   = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const saveTimerRef = useRef(null);

  const templateName = JOURNALS[journal]?.templates[tmpl] || 'Blank Page';
  const todayISO = currentDate.toISOString().slice(0, 10);

  // Load fields whenever journal type or template changes
  const loadPageFields = useCallback(async () => {
    try {
      const res = await api.get('/journal/pages', {
        params: { journal_type: journal, template_name: templateName, date: todayISO },
      });
      const entry = res.data?.entries?.[0];
      if (entry) {
        setPageFields(entry.fields || {});
        setItems(Array.isArray(entry.fields?._items) ? entry.fields._items : []);
        setPageEntryId(entry.id);
      } else if (journal === 'budget' && templateName === 'Daily Expenses') {
        // Pre-populate from budget_entries for today (two-way sync)
        try {
          const budgetRes = await api.get('/budget/entries', { params: { days: 1, type: 'expense', limit: 50 } });
          const today = new Date().toISOString().slice(0, 10);
          const todayEntries = (budgetRes.data?.entries || []).filter(e => e.entry_date === today);
          if (todayEntries.length > 0) {
            const rows = todayEntries.map(e => ({
              description: e.note || e.category || '',
              category: e.category || 'other',
              amount: String(e.amount),
            }));
            setPageFields({ rows });
          } else {
            setPageFields({});
          }
        } catch {
          setPageFields({});
        }
        setPageEntryId(null);
      } else {
        setPageFields({});
        setItems([]);
        setPageEntryId(null);
      }
    } catch {
      // offline / not yet created — start empty
      setPageFields({});
      setItems([]);
      setPageEntryId(null);
    }
  }, [journal, templateName, todayISO]);

  useEffect(() => { loadPageFields(); }, [loadPageFields]);

  // Autosave debounced — fires 1.5s after last keystroke
  const saveFields = useCallback(async (fields) => {
    try {
      const res = await api.post('/journal/pages', {
        journal_type: journal,
        template_name: templateName,
        entry_date: todayISO,
        fields,
        source: 'user',
      });
      if (res.data?.queued) {
        setSavedOffline(true);
      } else {
        setPageEntryId(res.data?.entry?.id || null);
        setSavedOffline(false);
      }
      setFieldsDirty(false);
    } catch (err) {
      console.error('Page fields save error:', err.message);
    }
  }, [journal, templateName, todayISO]);

  // Helper called by every textarea/input in templates
  const setField = useCallback((key, value) => {
    setPageFields(prev => {
      const next = { ...prev, [key]: value };
      // Debounced save
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveFields(next), 1500);
      setFieldsDirty(true);
      return next;
    });
  }, [saveFields]);

  // Helper for array fields (e.g. Daily Expenses rows, Habit Tracker checks)
  const setFieldRow = useCallback((key, index, subKey, value) => {
    setPageFields(prev => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...arr[index], [subKey]: value };
      const next = { ...prev, [key]: arr };
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveFields(next), 1500);
      setFieldsDirty(true);
      return next;
    });
  }, [saveFields]);

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

  // ─── STICKERS, NOTES & PHOTOS (persisted into the page's fields._items) ─────────
  const fileInputRef = useRef(null);

  // Save placed items into the page's fields JSONB so they survive reload.
  const persistItems = (nextItems) => {
    setItems(nextItems);
    api.post('/journal/pages', {
      journal_type: journal,
      template_name: templateName,
      entry_date: todayISO,
      fields: { ...pageFields, _items: nextItems },
      source: 'user',
    }).then(res => { if (res.data?.entry?.id) setPageEntryId(res.data.entry.id); })
      .catch(() => {});
  };

  const placeSticker = (emoji) => {
    const item = { type: 'sticker', emoji, x: Math.random() * 280 + 40, y: Math.random() * 200 + 100, id: Date.now() };
    persistItems([...items, item]);
  };

  const addSticky = () => {
    const colors = ['#FFF176', '#A5D6A7', '#80DEEA', '#EF9A9A', '#CE93D8', '#FFCC80'];
    const item = { type: 'sticky', color: colors[Math.floor(Math.random() * colors.length)], x: 50 + Math.random() * 120, y: 80 + Math.random() * 120, text: '', id: Date.now() };
    persistItems([...items, item]);
  };

  // Real photo: open the picker, read the chosen image as a data URL, place it.
  const addPhoto = () => fileInputRef.current?.click();
  const onPhotoSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert('Please choose an image under 4 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const item = { type: 'photo', src: reader.result, x: 100 + Math.random() * 150, y: 100 + Math.random() * 150, id: Date.now() };
      persistItems([...items, item]);
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (id) => persistItems(items.filter(i => i.id !== id));
  const clearStickers = () => persistItems([]);
  const undoLast = () => persistItems(items.slice(0, -1));

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

  // ─── LUMI AI — routes through backend with full shared context ───────────────
  const sendToLumi = async () => {
    const msg = lumiInput.trim();
    if (!msg) return;
    setLumiInput('');
    setLumiResponse('✨ Lumi is thinking…');

    try {
      const { default: api } = await import('../lib/api');

      // Route through the main /lumi/message endpoint.
      // The backend calls buildUserContext() before answering, so this Lumi instance
      // sees the exact same budget entries, habits, and schedule as TalkToLumi does.
      const res = await api.post('/lumi/message', {
        text: msg,
        source: 'journal',
      });
      const data = res.data;
      const reply = data.message || "I'm here. Tell me more.";
      setLumiResponse(reply);

      // If Lumi logged budget entries, add green sticky notes for each one
      if (data.savedItems?.length > 0) {
        data.savedItems.forEach((item, i) => {
          if (item.type === 'budget_entry') {
            setItems(prev => [...prev, {
              type: 'sticky',
              color: '#A5D6A7',
              x: 50 + Math.random() * 100,
              y: 80 + i * 60 + Math.random() * 40,
              text: `💰 ${item.label}`,
              id: Date.now() + i,
            }]);
          }
          if (item.type === 'workout_note') {
            setItems(prev => [...prev, {
              type: 'sticky',
              color: '#B3E5FC',
              x: 60 + Math.random() * 100,
              y: 160 + i * 60 + Math.random() * 40,
              text: `💪 ${item.label}`,
              id: Date.now() + i + 100,
            }]);
          }
        });
      }

      // If Lumi needs confirmation (journal draft), add a yellow sticky draft
      if (data.needsConfirmation && data.pendingState?.content) {
        setItems(prev => [...prev, {
          type: 'sticky',
          color: '#FFF9C4',
          x: 60 + Math.random() * 80,
          y: 120 + Math.random() * 80,
          text: `📝 Draft: ${data.pendingState.content.slice(0, 180)}`,
          id: Date.now() + 200,
        }]);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setLumiResponse('Session expired — please log in again.');
      } else {
        setLumiResponse("I'm having trouble connecting. Check your network and try again.");
        console.error('Journal Lumi error:', err);
      }
    }
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

  // ─── SAVE — flushes pageFields + mood/water immediately ─────────────────────
  const savePage = async () => {
    const fields = {
      ...pageFields,
      ...(mood ? { mood } : {}),
      ...(water ? { water } : {}),
    };
    clearTimeout(saveTimerRef.current);
    await saveFields(fields);
    // Visual confirmation without a blocking alert
    const toast = document.createElement('div');
    toast.textContent = savedOffline ? '✓ Saved offline · will sync' : '✓ Page saved';
    Object.assign(toast.style, {
      position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
      background:'rgba(0,212,170,0.15)', border:'1px solid rgba(0,212,170,0.3)',
      color:'#00d4aa', padding:'10px 22px', borderRadius:'10px', fontSize:'13px',
      fontWeight:'600', zIndex:'9999', fontFamily:'Inter, sans-serif',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
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
    // templateName is already in state — use the state version (not a local re-derive)
    const _templateName = JOURNALS[journal].templates[tmpl];

    // Blank page — rich block editor, persisted via pageFields.blocks
    if (tmpl === 0) {
      const hasLumiContent = Object.keys(pageFields).length > 0;
      const labelColor = getLabelColor();
      return (
        <div style={{ position: 'relative', minHeight: '100%', paddingLeft: 4 }}>
          {hasLumiContent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(165,180,252,0.08)',
              border: '1px solid rgba(165,180,252,0.15)',
            }}>
              <span style={{ fontSize: 13 }}>✨</span>
              <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)', fontStyle: 'italic' }}>
                Lumi filled this page · {fieldsDirty ? 'saving…' : savedOffline ? 'saved offline' : 'saved'}
              </span>
            </div>
          )}
          <BlockEditor
            value={Array.isArray(pageFields.blocks) ? pageFields.blocks : []}
            onChange={(blocks) => setField('blocks', blocks)}
            accent={accent}
            textColor={getTextColor()}
          />
        </div>
      );
    }

    // Template-specific content — wrapped with Lumi indicator if AI-populated
    const templateContent = (() => {
      switch (journal) {
        case 'personal':  return renderPersonalTemplate(_templateName, isDark);
        case 'spiritual': return renderSpiritualTemplate(_templateName, isDark);
        case 'budget':    return renderBudgetTemplate(_templateName, isDark);
        case 'wellness':  return renderWellnessTemplate(_templateName, isDark);
        case 'goals':     return renderGoalsTemplate(_templateName, isDark);
        case 'business':  return renderGoalsTemplate(_templateName, isDark);
        default:          return null;
      }
    })();

    const hasLumiContent = Object.keys(pageFields).length > 0;
    const labelColor = getLabelColor();

    return (
      <>
        {hasLumiContent && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(165,180,252,0.08)',
            border: '1px solid rgba(165,180,252,0.15)',
          }}>
            <span style={{ fontSize: 13 }}>✨</span>
            <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)', fontStyle: 'italic' }}>
              Lumi filled this page from your conversation
              {fieldsDirty ? ' · saving…' : savedOffline ? ' · saved offline' : ' · saved'}
            </span>
          </div>
        )}
        {templateContent}
      </>
    );
  };

  // ─── TEMPLATE RENDERERS (PERSONAL) ────────────────────────────────────────────
  const renderPersonalTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();

    if (name === 'Classic Diary') {
      const highlights = Array.isArray(pageFields.highlights) ? pageFields.highlights : ['', '', ''];
      return (
        <>
          {renderHeader('Classic Diary', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderLabel("Today's entry", labelColor)}
          <textarea className="tf" placeholder="Dear journal, today I..." rows="6"
            style={{ minHeight: '120px', color: textColor }}
            value={pageFields.entry || ''}
            onChange={e => setField('entry', e.target.value)} />
          {renderDivider(isDark)}
          {renderLabel('3 highlights', labelColor)}
          {[0, 1, 2].map(i => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontSize: '18px' }}>★</span>
              <textarea className="tf" placeholder={`Highlight ${i+1}...`} rows="1"
                style={{ minHeight: '30px', color: textColor }}
                value={highlights[i] || ''}
                onChange={e => {
                  const next = [...highlights];
                  next[i] = e.target.value;
                  setField('highlights', next);
                }} />
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
            <textarea className="tf" placeholder="Type or paste your verse here..." rows="2"
              style={{ minHeight: '50px', color: textColor }}
              value={pageFields.verse || ''}
              onChange={e => setField('verse', e.target.value)} />
          </div>
          {renderLabel('What this means to me', labelColor)}
          <textarea className="tf" placeholder="Reflection..." rows="4"
            style={{ minHeight: '90px', color: textColor }}
            value={pageFields.meaning || ''}
            onChange={e => setField('meaning', e.target.value)} />
          {renderDivider(isDark)}
          {renderLabel('How I will live this today', labelColor)}
          <textarea className="tf" placeholder="Application..." rows="3"
            style={{ minHeight: '70px', color: textColor }}
            value={pageFields.application || ''}
            onChange={e => setField('application', e.target.value)} />
          {renderDivider(isDark)}
          <div style={{ background: 'rgba(0,0,0,.04)', borderRadius: '8px', padding: '10px' }}>
            {renderLabel('Prayer', labelColor)}
          </div>
          <textarea className="tf" placeholder="Lord, today I pray..." rows="3"
            style={{ minHeight: '70px', color: textColor }}
            value={pageFields.prayer || ''}
            onChange={e => setField('prayer', e.target.value)} />
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
          <textarea className="tf" placeholder="Book · Chapter · Verses" rows="1"
            style={{ minHeight: '32px', color: textColor }}
            value={pageFields.passage || ''}
            onChange={e => setField('passage', e.target.value)} />
          {renderDivider(isDark)}
          {renderLabel('Study notes', labelColor)}
          <textarea className="tf" placeholder="What I'm reading and learning..." rows="10"
            style={{ minHeight: '200px', color: textColor }}
            value={pageFields.study_notes || ''}
            onChange={e => setField('study_notes', e.target.value)} />
          {renderDivider(isDark)}
          {renderLabel('Summary in my own words', labelColor)}
          <textarea className="tf" placeholder="This passage is about..." rows="2"
            style={{ minHeight: '50px', color: textColor }}
            value={pageFields.summary || ''}
            onChange={e => setField('summary', e.target.value)} />
        </>
      );
    }

    if (name === 'Sermon Notes') {
      const points = Array.isArray(pageFields.points) ? pageFields.points : ['', '', ''];
      return (
        <>
          {renderHeader('Sermon Notes', isDark)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              {renderLabel('Speaker', labelColor)}
              <textarea className="tf" placeholder="..." rows="1"
                style={{ minHeight: '30px', color: textColor }}
                value={pageFields.speaker || ''}
                onChange={e => setField('speaker', e.target.value)} />
            </div>
            <div>
              {renderLabel('Scripture', labelColor)}
              <textarea className="tf" placeholder="..." rows="1"
                style={{ minHeight: '30px', color: textColor }}
                value={pageFields.scripture || ''}
                onChange={e => setField('scripture', e.target.value)} />
            </div>
          </div>
          {renderLabel('Main points', labelColor)}
          {[0, 1, 2].map(i => (
            <div key={i} className="bullet-row">
              <span style={{ color: accent, fontWeight: 700, fontSize: '14px' }}>{i+1}.</span>
              <textarea className="tf" placeholder={`Point ${i+1}...`} rows="1"
                style={{ minHeight: '30px', color: textColor }}
                value={points[i] || ''}
                onChange={e => {
                  const next = [...points];
                  next[i] = e.target.value;
                  setField('points', next);
                }} />
            </div>
          ))}
          {renderDivider(isDark)}
          {renderLabel('What I will do with this', labelColor)}
          <textarea className="tf" placeholder="My response and application..." rows="3"
            style={{ minHeight: '70px', color: textColor }}
            value={pageFields.application || ''}
            onChange={e => setField('application', e.target.value)} />
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
      const rows = Array.isArray(pageFields.rows) ? pageFields.rows : Array(6).fill({});
      const totalSpent = rows.reduce((s, r) => {
        const n = parseFloat((r?.amount||'').replace(/[₦,]/g,''));
        return isNaN(n) ? s : s + n;
      }, 0);
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
              {Array.from({ length: Math.max(rows.length, 6) }, (_, i) => (
                <tr key={i}>
                  <td><input type="text" placeholder="..."
                    value={rows[i]?.description || ''}
                    onChange={e => setFieldRow('rows', i, 'description', e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
                  <td><input type="text" placeholder="food / transport / etc"
                    value={rows[i]?.category || ''}
                    onChange={e => setFieldRow('rows', i, 'category', e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
                  <td><input type="text" placeholder="₦..."
                    value={rows[i]?.amount || ''}
                    onChange={e => setFieldRow('rows', i, 'amount', e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: "'Caveat', cursive", fontSize: '15px', color: textColor }} /></td>
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
              <div className="stat-num" style={{ color: '#F87171' }}>
                {totalSpent > 0 ? `₦${totalSpent.toLocaleString('en-NG')}` : '₦0'}
              </div>
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

  // ─── TEMPLATE RENDERERS (WELLNESS covers health + habit, GOALS, BUSINESS) ──────
  const renderWellnessTemplate = (name, isDark) => {
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

    if (name === 'Daily Wellness') {
      return (
        <>
          {renderHeader('Daily Wellness', isDark)}
          {renderMoods(isDark)}
          {renderDivider(isDark)}
          {renderWater()}
          {renderDivider(isDark)}
          {renderLabel('How my body feels today', labelColor)}
          <textarea className="tf" placeholder="Energy level, aches, overall wellness..." rows="3"
            style={{ minHeight: '70px', color: textColor }}
            value={pageFields.body_feeling || ''}
            onChange={e => setField('body_feeling', e.target.value)} />
          {renderDivider(isDark)}
          {renderLabel('What I did for my health today', labelColor)}
          <textarea className="tf" placeholder="Exercise, meals, rest..." rows="3"
            style={{ minHeight: '70px', color: textColor }}
            value={pageFields.health_actions || ''}
            onChange={e => setField('health_actions', e.target.value)} />
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

  const renderGoalsTemplate = (name, isDark) => {
    const textColor = getTextColor();
    const labelColor = getLabelColor();
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
    <div style={{ background: 'transparent', color: 'var(--text)', fontFamily: "'Inter', sans-serif", minHeight: '100vh', padding: '16px' }}>
      {/* Top bar */}
      <div className="journal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => navigate('/dashboard')} style={{ width:28, height:28, borderRadius:8, background:'rgba(200,149,92,0.10)', border:'1px solid rgba(200,149,92,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.4)', flexShrink:0 }} title="Back to Home">◈</div>
          <div className="journal-logo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#C8955C', fontWeight: 700, fontSize: 16 }}>Lumi</span>
            <span style={{ opacity: 0.3 }}>.</span>
          </div>
        </div>
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
              className={`page-canvas tex-${paper}${paper === 'dark' || pageColor === '#1a1a2e' ? ' page-dark' : ''}`}
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
                      {item.src
                        ? <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>+</span>}
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

          {/* Hidden file picker for photos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoSelected}
            style={{ display: 'none' }}
          />

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
