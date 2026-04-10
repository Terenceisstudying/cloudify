import { API_BASE, adminFetch } from './api.js';
import { showSuccess, showError } from './notifications.js';
import { currentUser, setCurrentUser } from './state.js';
import { registerView, initRouter } from './router.js';

// Import views
import { loadCancerTypes, initContentView, closeModal, showAddQuestionDialog, addNewQuestion, closeQuestionModal } from './views/contentView.js';
import { loadQuestionBank, initQuestionBankView, closeQbQuestionModal, downloadQuestionBankBackup } from './views/questionBankView.js';
import { loadAssessments, exportAssessmentsCSV, applyAssessmentFilters, clearAssessmentFilters } from './views/assessmentsView.js';
import { loadStatistics } from './views/statisticsView.js';
import { loadAppearance } from './views/appearanceView.js';
import { loadPdpa } from './views/pdpaView.js';
import { loadTranslations } from './views/translationsView.js';
import { loadAdminUsers, initAdminUsersView, showCreateAdminModal, closeAdminModal, downloadAdminUsersBackup } from './views/adminUsersView.js';
import { togglePassword, resetPasswordIcons } from '../utils/passwordToggle.js';
import { openModalA11y, closeModalA11y } from '../utils/modal.js';

// ==================== CURRENT USER ====================

async function loadCurrentUser() {
    try {
        const response = await adminFetch(`${API_BASE}/admin/me`);
        const result = await response.json();
        if (result.success) {
            setCurrentUser(result.data);

            document.getElementById('profileEmail').textContent = result.data.email;
            document.getElementById('profileRole').textContent =
                result.data.role === 'super_admin' ? 'Super Admin' : 'Admin';

            // Hide admin users sidebar item if not super admin
            const adminUsersTab = document.querySelector('.sidebar-item[data-tab="admin-users"]');
            if (adminUsersTab) {
                if (result.data.role !== 'super_admin') {
                    adminUsersTab.style.display = 'none';

                    if (adminUsersTab.classList.contains('active')) {
                        document.querySelector('.sidebar-item[data-tab="content"]').click();
                    }
                } else {
                    adminUsersTab.style.display = 'block';
                }
            }

            if (result.data.requirePasswordReset) {
                setTimeout(() => {
                    showChangePasswordModal(true);
                }, 500);
            }
        }
    } catch (err) {
        console.error('Failed to load current user:', err);
    }
}

// ==================== CHANGE PASSWORD ====================
function showModalError(message) {
    const errorDiv = document.getElementById('change-password-error');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.style.display = message ? 'block' : 'none';
}

// togglePassword imported from utils/passwordToggle.js

function showChangePasswordModal(required = false) {
    const modal = document.getElementById('change-password-modal');
    const modalBody = modal.querySelector('.modal-body');

    showModalError('');
    document.getElementById('change-password-form').reset();
    
    const existingWarning = modal.querySelector('.password-warning');
    if (existingWarning) existingWarning.remove()

    modal.classList.add('active');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.btn-secondary');

    if (required) {
        if (closeBtn) closeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';

        const warningDiv = document.createElement('div');
        warningDiv.className = 'password-warning';
        warningDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 4px; margin-bottom: 20px; color: #856404;';

        const innerDiv = document.createElement('div');
        innerDiv.style.cssText = 'display: flex; align-items: center; gap: 12px;';

        const icon = document.createElement('span');
        icon.style.fontSize = '24px';
        icon.textContent = '\u26A0\uFE0F';

        const textDiv = document.createElement('div');
        const strong = document.createElement('strong');
        strong.style.cssText = 'display: block; margin-bottom: 4px;';
        strong.textContent = 'Password Change Required';
        const span = document.createElement('span');
        span.textContent = 'You must change your password before you can continue using the admin panel.';
        textDiv.appendChild(strong);
        textDiv.appendChild(span);

        innerDiv.appendChild(icon);
        innerDiv.appendChild(textDiv);
        warningDiv.appendChild(innerDiv);

        modalBody.insertBefore(warningDiv, modalBody.firstChild);
    } else {
        if (closeBtn) closeBtn.style.display = 'block';
        if (cancelBtn) cancelBtn.style.display = 'block';
    }

    // Required password change is a gate — not dismissible via Escape. When
    // optional, use the standard dismissible behavior. Trigger is null in
    // required mode (it runs at startup on a forced-reset flag, not from a
    // click), so focus return falls back to document.body.
    openModalA11y(modal, {
        triggerEl: required ? null : document.activeElement,
        dismissible: !required,
        onEscape: required ? undefined : closeChangePasswordModal,
        autoFocus: '#current-password'
    });
}

function closeChangePasswordModal() {
    if (currentUser && currentUser.requirePasswordReset) {
        alert('You must change your password to continue.');
        return;
    }
    const modal = document.getElementById('change-password-modal');
    closeModalA11y(modal);
    modal.classList.remove('active');
    document.getElementById('change-password-form').reset();
    document.querySelectorAll('#change-password-modal input[type="text"]').forEach(input => {
        input.type = 'password';
    });
    resetPasswordIcons(modal);
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('active');
}

function logout() {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/login.html';
}

// Close profile menu when clicking outside
document.addEventListener('click', function (event) {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileMenu = document.getElementById('profileMenu');
    if (profileDropdown && profileMenu && !profileDropdown.contains(event.target)) {
        profileMenu.classList.remove('active');
    }
});

// Handle change password form
document.getElementById('change-password-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    showModalError('');

    if (newPassword !== confirmPassword) {
        showModalError('New passwords do not match');
        return;
    }
    if (newPassword === currentPassword) {
        showModalError('New password must be different from current password');
        return;
    }

    const btn = document.getElementById('change-password-btn');
    btn.disabled = true;
    btn.textContent = 'Changing...';

    try {
        const response = await adminFetch(`${API_BASE}/admin/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        if (currentUser) {
            currentUser.requirePasswordReset = false;
        }

        closeChangePasswordModal();
        document.getElementById('change-password-form').reset();

        const modal = document.getElementById('change-password-modal');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.btn-secondary');
        if (closeBtn) closeBtn.style.display = 'block';
        if (cancelBtn) cancelBtn.style.display = 'block';

        const warning = modal.querySelector('.password-warning');
        if (warning) warning.remove();

        showSuccess('Password changed successfully');

        await loadCurrentUser();
    } catch (err) {
        showModalError(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Change Password';
    }
});

// ==================== BIND DATA-ACTION HANDLERS ====================

const actionHandlers = {
    // App-level actions
    'showChangePasswordModal': () => showChangePasswordModal(),
    'closeChangePasswordModal': () => closeChangePasswordModal(),
    'logout': () => logout(),
    // Content tab
    'refreshCancerTypes': () => loadCancerTypes(),
    'closeModal': () => closeModal(),
    'showAddQuestionDialog': () => showAddQuestionDialog(),
    'addNewQuestion': () => addNewQuestion(),
    'closeQuestionModal': () => closeQuestionModal(),
    // Question Bank tab
    'refreshQuestionBank': () => loadQuestionBank(),
    'downloadQuestionBankBackup': () => downloadQuestionBankBackup(),
    'closeQbQuestionModal': () => closeQbQuestionModal(),
    // Assessments tab
    'refreshAssessments': () => loadAssessments(),
    'exportAssessmentsCSV': () => exportAssessmentsCSV(),
    'clearAssessmentFilters': () => clearAssessmentFilters(),
    // Statistics tab
    'refreshStatistics': () => loadStatistics(),
    // Appearance tab
    'refreshAppearance': () => loadAppearance(),
    // PDPA tab
    'refreshPdpa': () => loadPdpa(),
    // Translations tab
    'refreshTranslations': () => loadTranslations(),
    // Admin Users tab
    'refreshAdminUsers': () => loadAdminUsers(),
    'showCreateAdminModal': () => showCreateAdminModal(),
    'downloadAdminUsersBackup': () => downloadAdminUsersBackup(),
    'closeAdminModal': () => closeAdminModal(),
};

// Bind click handlers for all [data-action] buttons
document.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    if (action === 'togglePassword') {
        // Toggle password buttons — find input ID from closest wrapper
        const inputId = el.closest('.password-input-wrapper').querySelector('.form-control').id;
        el.addEventListener('click', () => togglePassword(inputId, el));
    } else if (action === 'applyAssessmentFilters') {
        // Filter inputs — bind change for selects, input for inputs
        const event = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(event, () => applyAssessmentFilters());
    } else if (actionHandlers[action]) {
        el.addEventListener('click', actionHandlers[action]);
    }
});

// ==================== REGISTER VIEWS ====================

registerView('content', loadCancerTypes);
registerView('question-bank', loadQuestionBank);
registerView('assessments', loadAssessments);
registerView('statistics', loadStatistics);
registerView('appearance', loadAppearance);
registerView('pdpa', loadPdpa);
registerView('translations', loadTranslations);
registerView('admin-users', loadAdminUsers);

// ==================== INIT ====================

initRouter();
initContentView();
initQuestionBankView();
initAdminUsersView(loadCurrentUser);

// Initial load
loadCancerTypes();
loadCurrentUser();
