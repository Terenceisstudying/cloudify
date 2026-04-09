document.addEventListener('DOMContentLoaded', () => {
    const bgmToggle = document.getElementById('bgm-toggle');
    let isMuted = false;

    if (sessionStorage.getItem('appMuted') === 'true') {
        isMuted = true;
        bgmToggle.textContent = '\uD83D\uDD07';
    } else {
        bgmToggle.textContent = '\uD83D\uDD0A';
    }

    const applyMuteState = () => {
        document.querySelectorAll('audio, video').forEach(media => {
            media.muted = isMuted;
        });
    };

    applyMuteState();

    const observer = new MutationObserver((mutations) => {
        let shouldApply = false;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') {
                    shouldApply = true;
                } else if (node.querySelectorAll && node.querySelectorAll('audio, video').length > 0) {
                    shouldApply = true;
                }
            });
        });
        if (shouldApply) applyMuteState();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const OriginalAudio = window.Audio;
    window.activeAudioObjects = [];
    window.Audio = function(...args) {
        const audio = new OriginalAudio(...args);
        audio.muted = isMuted;
        window.activeAudioObjects.push(audio);
        return audio;
    };

    bgmToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        sessionStorage.setItem('appMuted', isMuted);
        bgmToggle.textContent = isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
        applyMuteState();
        window.activeAudioObjects.forEach(audio => { audio.muted = isMuted; });
    });
});

(() => {
    const hamburger = document.getElementById('hamburger-toggle');
    const dropdown = document.getElementById('top-controls-dropdown');
    if (!hamburger || !dropdown) return;

    const openMenu = () => {
        dropdown.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.querySelector('.hamburger-icon').textContent = '\u2715';
    };

    const closeMenu = () => {
        dropdown.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.querySelector('.hamburger-icon').textContent = '\u2630';
    };

    const isOpen = () => dropdown.classList.contains('open');

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen() ? closeMenu() : openMenu();
    });

    document.addEventListener('click', (e) => {
        if (isOpen() && !dropdown.contains(e.target) && e.target !== hamburger) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
            closeMenu();
            hamburger.focus();
        }
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());
})();
