# Rain Video Setup Guide

## 📁 Directory Structure
```
public/videos/
└── rain/
    ├── zen-garden.mp4
    ├── window-drops.mp4
    ├── city-street.mp4
    ├── forest.mp4
    └── building.mp4
```

## 🌧️ Rain Video Requirements

### Criteria for All Videos:
- ✅ **No people** in the video
- ✅ **Outdoor perspective** (immersive, like you're IN the rain, not watching from inside)
- ✅ **Calm, light rain** (not heavy storms or downpours)
- ✅ **Buildings/architecture + rain** OR nature scenes with rain
- ✅ **Resolution:** 1920x1080 (HD) minimum
- ✅ **Duration:** 10-30 seconds (will loop seamlessly)
- ✅ **Format:** MP4 (H.264 codec recommended)
- ✅ **File size:** < 10MB per video (for performance)

## 🎥 Recommended Free Video Sources

### 1. **Pixabay** (https://pixabay.com/videos/)
- Free for commercial use
- No attribution required
- Search terms: "rain", "rain window", "rain city", "zen garden rain", "rain drops"
- Download in 1920x1080 resolution

### 2. **Pexels** (https://www.pexels.com/videos/)
- Free for commercial use
- No attribution required
- Good search: "rain window", "rain street", "rain building"
- Note: Download videos (don't use direct URLs - they expire)

### 3. **Videvo** (https://www.videvo.net/)
- Mix of free and paid
- Filter by "Free" and "No attribution"
- Great rain footage

### 4. **Mixkit** (https://mixkit.co/free-stock-video/)
- Completely free
- High quality rain videos
- Search: "rain", "rainfall", "wet city"

## 📥 How to Add Videos

### Step 1: Download Videos
1. Visit one of the free video sources above
2. Search for rain videos matching the criteria
3. Download in **1920x1080 MP4 format**
4. Rename according to the scene:
   - `zen-garden.mp4` - Rain on zen garden/Japanese garden
   - `window-drops.mp4` - Rain drops on window glass (close-up)
   - `city-street.mp4` - Rain on city streets (nighttime preferred)
   - `forest.mp4` - Rain in forest/trees
   - `building.mp4` - Rain on buildings/architecture

### Step 2: Optimize Videos (Optional but Recommended)
Use HandBrake or FFmpeg to compress:
```bash
# Using FFmpeg (if installed)
ffmpeg -i input.mp4 -vcodec h264 -crf 28 -preset slow -vf scale=1920:1080 output.mp4
```

### Step 3: Place in Directory
Copy your videos to: `public/videos/rain/`

### Step 4: Enable Video Mode
In `wallpaperScenes.js`, the scenes are already configured with `use_video_if_exists: true`.  
Once you add videos to the folder, the component will automatically detect and use them!

## 🔄 How It Works

The system:
1. **Checks if video exists** at the specified path
2. **Falls back to Unsplash photos** if video is missing
3. **Applies Ken Burns zoom effect** (subtle zoom/pan)
4. **Loops seamlessly**
5. **Pauses when tab is hidden** (saves performance)

## 🎨 Video Specifications by Scene

### 1. Zen Garden Rain (`zen-garden.mp4`)
- **Style:** Japanese zen garden, rocks, bamboo
- **Mood:** Peaceful, meditative
- **Rain:** Light, gentle
- **Angle:** Ground level or slightly above

### 2. Window Raindrops (`window-drops.mp4`)
- **Style:** Close-up of rain drops on glass
- **Mood:** Cozy, intimate
- **Background:** Blurred city lights or nature (bokeh effect)
- **Angle:** Macro/close-up

### 3. City Street Rain (`city-street.mp4`)
- **Style:** Urban street with rain reflections
- **Mood:** Calm, introspective
- **Time:** Night/evening (neon lights reflecting)
- **Angle:** Street level, outdoor perspective

### 4. Forest Rain (`forest.mp4`)
- **Style:** Rain falling through trees/leaves
- **Mood:** Natural, refreshing
- **Rain:** Light to medium
- **Angle:** Looking up through canopy or forest path

### 5. Building Rain (`building.mp4`)
- **Style:** Rain on modern or traditional architecture
- **Mood:** Contemplative, urban
- **Elements:** Rooftops, walls, architectural details
- **Angle:** Outdoor, architectural perspective

## ⚡ Performance Tips

- Keep videos under 10MB each
- Use H.264 codec (best browser compatibility)
- Test playback in browser before finalizing
- Videos auto-pause when user switches tabs

## 🚀 Future Seasons

This same structure will be used for:
- `videos/snow/` - Winter/snow scenes
- `videos/autumn/` - Autumn leaves
- `videos/spring/` - Cherry blossoms, fresh rain
- `videos/summer/` - Beach, tropical scenes

---

**Current Status:** Video infrastructure is ready! Just add the video files to enable them.  
**Fallback:** System uses beautiful Unsplash photos until videos are added.
