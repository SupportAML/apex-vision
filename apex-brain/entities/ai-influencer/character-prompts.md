# Character Design Prompts
Use these in Midjourney v7 to generate candidate faces. Run all of them, pick the best 5 that look like the same person, then we train the LoRA.

## Approved Character Direction (apply to ALL generations)

- **Age:** 27-29 (not early 20s — more mature, more credible)
- **Skin:** Natural medium-brown, realistic texture, subtle imperfections — NOT airbrushed or poreless
- **Features:** Distinctly South Asian — defined brows, broader nose, large dark eyes, full lips, strong cheekbones
- **Figure:** Curvy, fuller bust
- **Vibe:** Warm and confident, not cold or editorial-plastic
- **Never:** Overly flawless skin, Eurocentric features, generic "model" look

## Base Face Generation (Run These First)

### Prompt 1: Hero Portrait
```
stunning young Indian woman, 24 years old, warm brown skin with golden undertone, long dark hair, deep brown eyes, full lips, high cheekbones, beauty mark near her lip, soft natural makeup, golden hour lighting, looking directly at camera with confident slight smile, luxury hotel room background slightly blurred, shot on iPhone 15 Pro, portrait mode, intimate close-up, editorial quality --ar 4:5 --v 7 --s 200
```

### Prompt 2: Full Body Fashion
```
beautiful young Indian woman, 24, warm golden brown skin, long black hair flowing, wearing a fitted black dress, standing in front of a floor-length mirror, luxury apartment, warm ambient lighting, confident relaxed pose, one hand in her hair, candid feel, shot on Canon R5 85mm f/1.4, shallow depth of field --ar 4:5 --v 7 --s 200
```

### Prompt 3: Casual / Morning
```
gorgeous Indian woman, early 20s, dewy glowing skin, no makeup, hair messy and natural, wearing an oversized white shirt, sitting cross-legged on a bed with white sheets, morning sunlight streaming through sheer curtains, holding a coffee cup, looking at camera with sleepy smile, warm and intimate atmosphere, iPhone selfie aesthetic --ar 4:5 --v 7 --s 150
```

### Prompt 4: Glamour / Night Out
```
stunning Indian woman, 24, golden brown skin, smoky eye makeup, dark wavy hair styled elegantly, wearing a deep red silk dress, gold jewelry, standing on a rooftop terrace at night, city lights behind her, warm golden lighting from nearby candles, looking over her shoulder at camera, confident seductive expression, editorial photography --ar 4:5 --v 7 --s 250
```

### Prompt 5: GRWM / Vanity
```
beautiful Indian woman, 24, sitting at a vanity table doing her makeup, wearing a silk robe, hair in a loose bun with strands falling, warm bathroom lighting, mirror reflection visible, various beauty products on the table, focused expression, intimate getting-ready moment, filmed on phone propped up on counter aesthetic --ar 4:5 --v 7 --s 150
```

### Prompt 6: Beach / Travel
```
gorgeous young Indian woman, golden brown skin glistening, long wet dark hair, wearing a simple bikini, walking on a tropical beach at sunset, waves at her feet, looking back at camera over her shoulder with a natural smile, golden hour warm lighting, sand on her skin, shot on 35mm film grain, candid travel photography --ar 4:5 --v 7 --s 200
```

### Prompt 7: Traditional / Cultural
```
beautiful Indian woman, 24, wearing an elegant lehenga in emerald green with gold embroidery, gold jhumka earrings, maang tikka, subtle bindi, hair in a loose side braid with flowers, standing in a marble archway with warm golden light, regal but approachable expression, Vogue India editorial style --ar 4:5 --v 7 --s 250
```

### Prompt 8: Workout / Athletic
```
fit Indian woman, 24, golden brown skin with light sweat, wearing minimal workout clothes, in a modern luxury gym, mid-workout, hair in a high ponytail, toned body, natural lighting, looking at camera with determined expression, candid fitness photography, no filter aesthetic --ar 4:5 --v 7 --s 150
```

## Consistency Test Prompts (Run After Picking the Face, Using --cref)

### Test 1: Different lighting
```
[character reference] sitting in a dimly lit restaurant, candlelight illuminating her face, wearing a low-cut black top, wine glass in hand, intimate dinner date setting --ar 4:5 --v 7 --cref [URL]
```

### Test 2: Different angle
```
[character reference] selfie from slightly above, laying on a white bed, hair spread out, looking up at camera, soft morning light, wearing a tank top, playful expression --ar 4:5 --v 7 --cref [URL]
```

### Test 3: Different outfit
```
[character reference] walking through a Dubai mall in a tailored cream pantsuit, oversized sunglasses pushed up on her head, shopping bags in hand, confident stride, full body shot --ar 4:5 --v 7 --cref [URL]
```

### Test 4: Close-up beauty
```
[character reference] extreme close-up of face, applying lip gloss, dewy skin, pores visible, natural beauty, bathroom mirror selfie, warm lighting --ar 4:5 --v 7 --cref [URL]
```

### Test 5: Pool/water
```
[character reference] in a luxury infinity pool, arms resting on the edge, city skyline behind her, wet hair slicked back, golden hour, looking at camera with relaxed confident expression --ar 4:5 --v 7 --cref [URL]
```

## Notes
- Run each base prompt 4x (Midjourney generates 4 variations per prompt)
- That gives us 32 candidate images across 8 scenarios
- Pick the 5 faces that feel most like the same person
- Those 5 become the seed for the LoRA training set
- Then run 15+ consistency test prompts with --cref to expand the training set to 20 images
- Key features to lock: face shape, skin tone, lip shape, eyebrow arch, nose bridge, beauty mark placement
