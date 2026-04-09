document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
    }
});
