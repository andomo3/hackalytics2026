# LANDING PAGE STYLING - EXACT IMPLEMENTATION

## CRITICAL: This is the EXACT LandingPage.tsx code. Copy it VERBATIM.

### Problem
The landing page styling is not showing correctly. The agent must implement EXACTLY this code with NO modifications.

---

## STEP 1: DELETE the existing /components/LandingPage.tsx

Use the delete tool to remove the current broken version.

---

## STEP 2: CREATE /components/LandingPage.tsx with this EXACT code:

```tsx
import { motion } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Hero Title */}
        <motion.h1
          className="font-mono text-8xl font-bold mb-6"
          style={{
            color: '#00ffff',
            textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)'
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          SAFETRANSIT
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="font-mono text-2xl text-emerald-400 mb-16"
          style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          World Cup 2026 Tactical Command Center
        </motion.p>

        {/* Start Button */}
        <motion.button
          onClick={onEnter}
          className="font-mono text-2xl font-bold px-12 py-5 border-2 rounded-lg"
          style={{
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            color: '#00ffff',
          }}
          whileHover={{
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          ENTER COMMAND CENTER
        </motion.button>
      </div>
    </div>
  );
}
```

---

## CRITICAL STYLING DETAILS

### The cyan glow effect on title:
```tsx
style={{
  color: '#00ffff',
  textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)'
}}
```

### The green glow on subtitle:
```tsx
className="font-mono text-2xl text-emerald-400 mb-16"
style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }}
```

### The button with cyan border and glow:
```tsx
style={{
  borderColor: '#00ffff',
  backgroundColor: 'rgba(0, 255, 255, 0.1)',
  color: '#00ffff',
}}
whileHover={{
  backgroundColor: 'rgba(0, 255, 255, 0.2)',
  boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
  scale: 1.05,
}}
```

---

## VERIFICATION CHECKLIST

After creating the file, verify:

1. ✅ Title "SAFETRANSIT" is cyan (#00ffff) with double glow
2. ✅ Title uses `text-8xl` for huge size
3. ✅ Subtitle is emerald-400 with green glow
4. ✅ Button has cyan border with hover glow effect
5. ✅ All animations use Motion from 'motion/react'
6. ✅ NO Tailwind classes for colors - uses inline styles
7. ✅ NO modifications to the code above

---

## WHY THIS WORKS

- **Inline styles override Tailwind**: The `style={{}}` prop ensures exact colors
- **textShadow creates glow**: Multiple shadow layers create the retro terminal glow
- **Motion hover states**: `whileHover` creates interactive glow on button
- **Large text sizes**: `text-8xl` and `text-2xl` for impact

---

## FINAL NOTE

Do NOT:
- Add any extra divs or wrappers
- Modify the color values
- Change the animation timings
- Remove the inline styles
- Add any Tailwind color classes that conflict

DO:
- Copy this EXACT code
- Use inline styles exactly as shown
- Keep all Motion props identical
- Maintain the spacing (mb-6, mb-16)
