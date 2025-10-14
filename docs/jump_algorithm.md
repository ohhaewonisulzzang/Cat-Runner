# Jump Algorithm Documentation

## Overview
Cat Runner uses an **Instant Jump + Hold Enhancement** system.

---

## Core Mechanisms

### 1. Instant Jump Start
- Jump starts **immediately** when spacebar is pressed
- Starts with minimum jump power (minJumpPower = -10)
- No charging required - instant response for fast gameplay

### 2. Hold to Increase Height
- **Holding spacebar** increases jump height
- Maximum hold time: **300ms**
- Maximum jump power: -16
- Smoothly increases upward force proportional to hold time

### 3. No Charging Feature
- Removed charge bar and charge color indicators
- Clean gameplay focused on action

---

## Key Variables

| Variable | Value | Description |
|----------|-------|-------------|
| minJumpPower | -10 | Minimum jump force (instant jump) |
| maxJumpPower | -16 | Maximum jump force (max hold) |
| maxJumpHoldTime | 300ms | Maximum hold time |
| gravity | 0.6 | Gravity acceleration |
| maxJumpHeight | 250px | Maximum jump height limit |

---

## Jump Stages

### Stage 1: Detect Jump Input
```javascript
handleKeyDown(e) {
    if (e.code === 'Space' && this.isGrounded) {
        this.spacePressed = true;
        this.jumpStartTime = Date.now();
        this.startJump(); // Start jump immediately
    }
}
```

### Stage 2: Start Jump Immediately
```javascript
startJump() {
    this.velocityY = this.minJumpPower; // Rise immediately with -10
    this.isGrounded = false;
    this.isJumping = true;
    this.jumpHoldTime = 0;
}
```

### Stage 3: Apply Additional Force While Holding
```javascript
updatePhysics() {
    // While holding spacebar
    if (this.isJumping && this.spacePressed && this.velocityY < 0) {
        const holdDuration = Date.now() - this.jumpStartTime;

        if (holdDuration < this.maxJumpHoldTime) {
            // Calculate target velocity proportional to hold time
            const holdRatio = holdDuration / this.maxJumpHoldTime;
            const additionalPower = (this.maxJumpPower - this.minJumpPower) * holdRatio;
            const targetVelocity = this.minJumpPower + additionalPower;

            // Smoothly increase velocity (by 0.3)
            this.velocityY = Math.max(this.velocityY - 0.3, targetVelocity);
        }
    }

    // Apply gravity
    if (!this.isGrounded) {
        this.velocityY += this.gravity;
    }
}
```

### Stage 4: Release Spacebar
```javascript
handleKeyUp(e) {
    if (e.code === 'Space') {
        this.spacePressed = false; // Stop additional force
    }
}
```

---

## Jump Height Calculation

### Height by Hold Duration

| Hold Time | Jump Power | Expected Height |
|-----------|------------|-----------------|
| 0ms (tap) | -10 | ~80px (short jump) |
| 150ms | -13 | ~140px (medium jump) |
| 300ms+ | -16 | ~210px (max jump) |

### Formula
```
holdRatio = holdDuration / maxJumpHoldTime (0.0 ~ 1.0)
additionalPower = (maxJumpPower - minJumpPower) * holdRatio
targetVelocity = minJumpPower + additionalPower

Example (150ms hold):
holdRatio = 150 / 300 = 0.5
additionalPower = (-16 - (-10)) * 0.5 = -3
targetVelocity = -10 + (-3) = -13
```

---

## Physics Engine Integration

### Gravity System
- Always applies gravity = 0.6 after jump
- During ascent: additional force while holding counteracts gravity
- During descent: only normal gravity applies

### Height Limitation
```javascript
// Set velocity to 0 when max height reached
if (this.y < this.groundY - this.maxJumpHeight) {
    this.y = this.groundY - this.maxJumpHeight;
    this.velocityY = 0;
}
```

### Landing Handling
```javascript
if (this.y >= this.groundY) {
    this.y = this.groundY;
    this.velocityY = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpHoldTime = 0;
}
```

---

## Input Handling

### Keyboard Input
- **Space**: Start jump and hold
- `keydown`: Start jump immediately, start timer
- `keyup`: End hold

### Touch Input (Mobile)
- `touchstart`: Same as keyboard keydown
- `touchend`: Same as keyboard keyup

---

## Debug Information

### getDebugInfo() Output
```javascript
{
    position: "(256, 450)",      // Current position
    velocity: -13.5,             // Current Y velocity
    grounded: false,             // Ground state
    jumping: true,               // Jump state
    holding: true,               // Spacebar hold status
    holdTime: 180                // Hold time (ms)
}
```

---

## Advantages

1. **Instant Response**: Character reacts as soon as spacebar is pressed
2. **Intuitive Control**: Tap for short jump, hold for high jump
3. **Precise Control**: Fine-tune height with hold duration
4. **Clean UI**: Focus on game without charge bar
5. **Mobile Friendly**: Touch input works identically

---

## Improvement Opportunities

1. **Jump Sound**: Add when sound system is implemented
2. **Jump Particles**: Enhance visual feedback
3. **Double Jump**: Additional feature implementation
4. **Variable Tuning**: Fine-tune after playtesting

---

## Version History

### v2.0 (Current)
- Instant jump + hold enhancement system
- Complete removal of charging feature
- Smooth velocity increase (by 0.3)

### v1.0 (Previous)
- Charge-based jump
- Press and release to execute jump
- Charge bar UI display
