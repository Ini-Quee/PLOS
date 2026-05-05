/**
 * BlockEditor — Rich block-based editor for journal Blank Page.
 * Blocks: paragraph, heading, bullet, numbered, checkbox, divider.
 * Stored as pageFields.blocks → persisted to API → survives refresh.
 * Feels like Notion / Word — add blocks with the + button or / slash.
 */
import { useState, useRef, useEffect, useCallback } from 'react';

const BLOCK_TYPES = [
  { type: 'paragraph', icon: '¶', label: 'Text' },
  { type: 'heading',   icon: 'H', label: 'Heading' },
  { type: 'bullet',    icon: '•', label: 'Bullet list' },
  { type: 'numbered',  icon: '1.', label: 'Numbered list' },
  { type: 'checkbox',  icon: '☐', label: 'To-do' },
  { type: 'divider',   icon: '—', label: 'Divider' },
];

function newBlock(type = 'paragraph', text = '') {
  return { id: crypto.randomUUID(), type, text, checked: false };
}

function Block({ block, index, total, accent, textColor, onUpdate, onAdd, onDelete, onKeyDown }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && block._focus) {
      ref.current.focus();
      const len = ref.current.value?.length || 0;
      ref.current.setSelectionRange(len, len);
    }
  }, [block._focus]);

  const baseStyle = {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    resize: 'none', fontFamily: 'inherit', color: textColor,
    caretColor: accent, padding: 0,
  };

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', cursor: 'pointer' }}
        onClick={() => onDelete(index)}>
        <div style={{ flex: 1, height: 1, background: `${accent}40` }} />
        <span style={{ fontSize: 10, color: `${accent}60` }}>divider</span>
        <div style={{ flex: 1, height: 1, background: `${accent}40` }} />
      </div>
    );
  }

  if (block.type === 'heading') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '8px 0 4px' }}>
        <textarea
          ref={ref}
          value={block.text}
          placeholder="Heading..."
          rows={1}
          style={{ ...baseStyle, fontSize: 20, fontWeight: 700, lineHeight: '1.3', overflow: 'hidden' }}
          onChange={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onUpdate(index, { text: e.target.value }); }}
          onKeyDown={e => onKeyDown(e, index)}
        />
      </div>
    );
  }

  if (block.type === 'bullet') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '2px 0' }}>
        <span style={{ color: accent, fontSize: 18, lineHeight: '24px', flexShrink: 0, marginTop: 2 }}>•</span>
        <textarea
          ref={ref}
          value={block.text}
          placeholder="List item..."
          rows={1}
          style={{ ...baseStyle, fontSize: 14, lineHeight: '24px', overflow: 'hidden' }}
          onChange={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onUpdate(index, { text: e.target.value }); }}
          onKeyDown={e => onKeyDown(e, index)}
        />
      </div>
    );
  }

  if (block.type === 'numbered') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '2px 0' }}>
        <span style={{ color: accent, fontSize: 13, fontWeight: 700, lineHeight: '24px', flexShrink: 0, marginTop: 1, minWidth: 18 }}>
          {index + 1}.
        </span>
        <textarea
          ref={ref}
          value={block.text}
          placeholder="List item..."
          rows={1}
          style={{ ...baseStyle, fontSize: 14, lineHeight: '24px', overflow: 'hidden' }}
          onChange={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onUpdate(index, { text: e.target.value }); }}
          onKeyDown={e => onKeyDown(e, index)}
        />
      </div>
    );
  }

  if (block.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '3px 0' }}>
        <div
          onClick={() => onUpdate(index, { checked: !block.checked })}
          style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 3, cursor: 'pointer',
            border: `2px solid ${block.checked ? accent : 'rgba(255,255,255,0.3)'}`,
            background: block.checked ? accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {block.checked && <span style={{ fontSize: 10, color: '#0a0a14', fontWeight: 700 }}>✓</span>}
        </div>
        <textarea
          ref={ref}
          value={block.text}
          placeholder="To-do item..."
          rows={1}
          style={{
            ...baseStyle, fontSize: 14, lineHeight: '24px', overflow: 'hidden',
            textDecoration: block.checked ? 'line-through' : 'none',
            opacity: block.checked ? 0.5 : 1,
          }}
          onChange={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onUpdate(index, { text: e.target.value }); }}
          onKeyDown={e => onKeyDown(e, index)}
        />
      </div>
    );
  }

  // Default: paragraph
  return (
    <div style={{ margin: '2px 0' }}>
      <textarea
        ref={ref}
        value={block.text}
        placeholder={index === 0 ? 'Start writing, or press + to add a block...' : 'Write here...'}
        rows={1}
        style={{ ...baseStyle, fontSize: 15, lineHeight: '26px', overflow: 'hidden' }}
        onChange={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onUpdate(index, { text: e.target.value }); }}
        onKeyDown={e => onKeyDown(e, index)}
      />
    </div>
  );
}

export default function BlockEditor({ value, onChange, accent = '#C8955C', textColor = '#1a1008' }) {
  // value is an array of block objects stored in pageFields.blocks
  const [blocks, setBlocks] = useState(() => {
    if (Array.isArray(value) && value.length > 0) return value;
    return [newBlock('paragraph')];
  });
  const [showMenu, setShowMenu] = useState(null); // index of block showing menu
  const [showTypeMenu, setShowTypeMenu] = useState(null); // index to insert after

  // Sync incoming value when page reloads from API
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setBlocks(value);
    }
  }, [value]);

  const emit = useCallback((next) => {
    setBlocks(next);
    onChange(next);
  }, [onChange]);

  function updateBlock(index, patch) {
    const next = blocks.map((b, i) => i === index ? { ...b, ...patch } : b);
    emit(next);
  }

  function addBlock(afterIndex, type = 'paragraph') {
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, { ...newBlock(type), _focus: true });
    emit(next);
    setShowTypeMenu(null);
    setShowMenu(null);
  }

  function deleteBlock(index) {
    if (blocks.length === 1) {
      emit([newBlock('paragraph')]);
      return;
    }
    const next = blocks.filter((_, i) => i !== index);
    // Focus previous block
    if (next[index - 1]) next[index - 1] = { ...next[index - 1], _focus: true };
    emit(next);
  }

  function handleKeyDown(e, index) {
    const block = blocks[index];

    // Enter on empty bullet/numbered/checkbox → convert to paragraph
    if (e.key === 'Enter' && !e.shiftKey && block.text === '' && block.type !== 'paragraph') {
      e.preventDefault();
      const next = blocks.map((b, i) => i === index ? { ...newBlock('paragraph'), _focus: true } : b);
      emit(next);
      return;
    }

    // Enter → new block of same type (except heading → paragraph)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const nextType = block.type === 'heading' ? 'paragraph' : block.type;
      addBlock(index, nextType);
      return;
    }

    // Backspace on empty block → delete it
    if (e.key === 'Backspace' && block.text === '' && block.type !== 'divider') {
      e.preventDefault();
      deleteBlock(index);
      return;
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: 400 }}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          style={{ position: 'relative', padding: '1px 0' }}
          onMouseEnter={() => setShowMenu(index)}
          onMouseLeave={() => { setShowMenu(null); setShowTypeMenu(null); }}
        >
          {/* Block handle + add button (visible on hover) */}
          {showMenu === index && (
            <div style={{
              position: 'absolute', left: -48, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {/* + button */}
              <div
                onClick={() => setShowTypeMenu(showTypeMenu === index ? null : index)}
                style={{
                  width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
                  background: `${accent}22`, border: `1px solid ${accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: accent, fontWeight: 700,
                  userSelect: 'none',
                }}
              >+</div>
              {/* ⋮ drag handle (visual only) */}
              <div style={{ fontSize: 12, color: `${accent}60`, cursor: 'grab', userSelect: 'none' }}>⠿</div>
            </div>
          )}

          {/* Block type menu */}
          {showTypeMenu === index && (
            <div style={{
              position: 'absolute', left: -200, top: 0, zIndex: 100,
              background: 'rgba(14,14,28,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '6px 0', minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {BLOCK_TYPES.map(bt => (
                <div
                  key={bt.type}
                  onClick={() => addBlock(index, bt.type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 12, color: accent, minWidth: 16, textAlign: 'center' }}>{bt.icon}</span>
                  <span>{bt.label}</span>
                </div>
              ))}
            </div>
          )}

          <Block
            block={block}
            index={index}
            total={blocks.length}
            accent={accent}
            textColor={textColor}
            onUpdate={updateBlock}
            onAdd={addBlock}
            onDelete={deleteBlock}
            onKeyDown={handleKeyDown}
          />
        </div>
      ))}

      {/* Toolbar at bottom */}
      <div style={{
        marginTop: 20, paddingTop: 14,
        borderTop: `1px solid ${accent}20`,
        display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        {BLOCK_TYPES.map(bt => (
          <button
            key={bt.type}
            onClick={() => addBlock(blocks.length - 1, bt.type)}
            title={`Add ${bt.label}`}
            style={{
              padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${accent}40`,
              color: accent, fontSize: 11, fontWeight: 600,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>{bt.icon}</span>
            <span>{bt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
