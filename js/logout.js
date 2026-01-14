function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login.html';
}

// Add logout button to admin panel
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.admin-header');
    if (header) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'btn-logout';
        logoutBtn.onclick = logout;
        header.appendChild(logoutBtn);
    }
});
