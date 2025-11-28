// Touch Trail Effect for Touchscreen Interaction
// Creates visual feedback circles when user touches the screen

document.addEventListener('touchstart', function(e) {
    createTouchTrail(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true});

document.addEventListener('touchmove', function(e) {
    createTouchTrail(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true});

function createTouchTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'touch-trail';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    document.body.appendChild(trail);
    
    // Remove after animation completes
    setTimeout(() => {
        trail.remove();
    }, 600);
}
