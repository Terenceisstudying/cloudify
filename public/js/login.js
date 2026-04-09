import { bindPasswordToggles } from './utils/passwordToggle.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    errorMessage.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem('adminToken', data.token);
            window.location.href = '/admin.html';
        } else {
            errorMessage.textContent = data.message || 'Invalid email or password. Please try again.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});

bindPasswordToggles();
