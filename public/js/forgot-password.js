document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        const response = await fetch('/api/admin/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.textContent = data.message;

            // In development, show the reset link
            if (data.resetUrl) {
                const wrapper = document.createElement('div');
                wrapper.className = 'reset-link';
                const label = document.createElement('p');
                label.textContent = 'Development Mode - Reset Link:';
                const link = document.createElement('a');
                link.href = data.resetUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = data.resetUrl;
                wrapper.appendChild(label);
                wrapper.appendChild(link);
                successMessage.appendChild(wrapper);
            }

            successMessage.style.display = 'block';
            document.getElementById('email').value = '';
        } else {
            errorMessage.textContent = data.message || 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
    }
});
