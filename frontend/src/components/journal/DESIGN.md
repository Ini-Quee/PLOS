# PLOS Journal Design Document

## Vision
Transform the journal from a bland form into an **immersive digital bookshelf experience** with realistic 3D books, flip animations, and handwriting text effects.

## Core Experience

### 1. Bookshelf View
- **3D bookshelf** with multiple journals displayed as physical books
- Each book has unique **cover design** based on type (Daily, Budget, Planner, etc.)
- **Hover effects**: Books slightly pop out when hovered
- **Selection**: Tap/click to select a book

### 2. Book Opening Animation
- **3D Flip**: Book rotates on Y-axis to open (like real book)
- **Page turn**: Pages fan out slightly as it opens
- **Camera zoom**: Smooth transition from bookshelf to book view
- Duration: 600ms with easing

### 3. Notebook Interior
- **Realistic paper texture** with subtle grain
- **Page binding** visible in center
- **Lined or blank paper** depending on journal type
- **Cream colored paper** for traditional feel

### 4. Voice-to-Text Writing
- **Microphone button** positioned like a pen on paper
- **Hand animation**: SVG hand holding pen that "writes" text
- **Stroke animation**: Text appears letter by letter as if handwritten
- **Sound waves**: Visual indicator when listening

## Journal Types & Designs

### 📓 Daily Journal
- **Cover**: Brown leather texture, gold embossed title
- **Paper**: Cream, slightly aged
- **Lines**: Wide ruled for handwriting
- **Font**: Caveat (handwriting style)

### 💰 Budget Book  
- **Cover**: Green fabric texture, silver clasp
- **Paper**: White, subtle grid pattern
- **Lines**: Column layout for entries
- **Font**: Inter (clean, readable)

### 📋 Life Planner
- **Cover**: Red vintage hardcover
- **Paper**: Cream, calendar layout
- **Lines**: Structured sections
- **Font**: DM Serif Display (elegant)

### 📚 Study Notes
- **Cover**: Blue canvas texture
- **Paper**: White, dot grid
- **Lines**: Cornell note-taking layout
- **Font**: Courier Prime (typewriter)

### 🙏 Prayer Journal
- **Cover**: Black leather, cross emblem
- **Paper**: Cream, verse margin
- **Lines**: Wide ruled with scripture header
- **Font**: DM Serif Display

### 💪 Fitness Log
- **Cover**: Black marble pattern
- **Paper**: White, workout grid
- **Lines**: Exercise tracking columns
- **Font**: Inter (data-focused)

## Animation Specifications

### Book Flip
```
Keyframes:
  0%: rotateY(0deg) scale(1) translateZ(0)
  50%: rotateY(-45deg) scale(1.1) translateZ(50px)
  100%: rotateY(-90deg) scale(1.2) translateZ(100px)

Easing: cubic-bezier(0.4, 0, 0.2, 1)
Duration: 600ms
```

### Hand Writing
```
Text appears: letter by letter
Delay per char: 30ms
Cursor: Blinking pen tip
Hand movement: Follows text position
```

### Page Turn
```
Keyframes:
  0%: rotateY(0deg) 
  100%: rotateY(-180deg)

Shadow: Dynamic based on angle
Curl: Subtle at page corner
```

## Component Structure

```
Journal/
├── components/
│   ├── Bookshelf/
│   │   ├── Bookshelf.jsx       # Main container
│   │   ├── BookSpine.jsx       # Individual book on shelf
│   │   └── Bookshelf.css       # 3D transforms
│   ├── BookViewer/
│   │   ├── BookViewer.jsx      # Open book display
│   │   ├── BookCover.jsx       # Front/back covers
│   │   ├── BookPage.jsx        # Individual pages
│   │   └── PageFlip.jsx        # Page turn animation
│   ├── VoiceWriting/
│   │   ├── VoiceWriter.jsx     # Main writing interface
│   │   ├── HandAnimation.jsx   # SVG hand with pen
│   │   ├── TextAnimator.jsx    # Letter-by-letter reveal
│   │   └── MicrophoneButton.jsx# Voice activation
│   └── Paper/
│       ├── PaperTexture.jsx    # Background textures
│       ├── LinedPaper.jsx      # Line patterns
│       └── GridPaper.jsx       # Grid/dot patterns
├── templates/
│   ├── DailyTemplate.jsx
│   ├── BudgetTemplate.jsx
│   ├── PlannerTemplate.jsx
│   ├── StudyTemplate.jsx
│   ├── PrayerTemplate.jsx
│   └── FitnessTemplate.jsx
└── hooks/
    ├── useBookFlip.js
    ├── useVoiceWriting.js
    └── useHandAnimation.js
```

## Visual Design Tokens

### Paper Colors
- Cream: `#F5F0E8`
- White: `#FFFFFF`
- Aged: `#EDE8DF`

### Ink Colors
- Black: `#1A1A1A`
- Blue: `#1E3A8A`
- Red: `#DC2626`
- Green: `#059669`
- Purple: `#7C3AED`

### Cover Textures (CSS)
```css
/* Leather */
.leather-brown {
  background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
  box-shadow: inset 0 0 50px rgba(0,0,0,0.3);
}

/* Fabric */
.fabric-blue {
  background: #3B82F6;
  background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
}

/* Marble */
.marble-black {
  background: #1a1a1a;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%);
}
```

## Interaction Flow

1. **User opens Journal page**
   - See bookshelf with all journals
   - Books have subtle floating animation

2. **User taps a book**
   - Book lifts off shelf
   - Rotates to face user
   - Opens with page fan
   - Camera "zooms" into book

3. **User taps microphone**
   - Hand with pen appears from side
   - Microphone icon pulses
   - User speaks

4. **Text appears**
   - Hand moves across page
   - Words write out letter by letter
   - Natural handwriting effect
   - Page auto-scrolls if needed

5. **User saves**
   - Book gently closes
   - Returns to shelf
   - Success animation

## Technical Requirements

- CSS 3D transforms for book flip
- Framer Motion or CSS animations
- SVG for hand/pen illustration
- Web Speech API for voice
- Canvas or SVG for handwriting effect
- Local state for page content

## Responsive Behavior

- **Mobile**: Single book view, swipe between books
- **Tablet**: 2-column bookshelf
- **Desktop**: 3-4 column bookshelf with hover effects

## Accessibility

- Voice control for navigation
- High contrast mode
- Reduced motion option
- Screen reader labels
- Keyboard navigation
