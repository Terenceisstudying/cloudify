const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvg() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    return svg;
}

function createPath(d) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    return path;
}

function createEyeOpenIcon() {
    const svg = createSvg();
    svg.appendChild(createPath('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'));
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '3');
    svg.appendChild(circle);
    return svg;
}

function createEyeClosedIcon() {
    const svg = createSvg();
    svg.appendChild(createPath('M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94'));
    svg.appendChild(createPath('M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19'));
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '1');
    line.setAttribute('y1', '1');
    line.setAttribute('x2', '23');
    line.setAttribute('y2', '23');
    svg.appendChild(line);
    return svg;
}

function setIcon(btn, icon) {
    btn.replaceChildren(icon);
}

export function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    setIcon(btn, isHidden ? createEyeClosedIcon() : createEyeOpenIcon());
    btn.title = isHidden ? 'Hide password' : 'Show password';
}

export function resetPasswordIcons(container) {
    container.querySelectorAll('.toggle-password-btn').forEach(btn => {
        setIcon(btn, createEyeOpenIcon());
    });
}

export function bindPasswordToggles(root = document) {
    root.querySelectorAll('.toggle-password-btn').forEach(btn => {
        const inputId = btn.closest('.password-input-wrapper').querySelector('.form-control').id;
        btn.addEventListener('click', () => togglePassword(inputId, btn));
    });
}
