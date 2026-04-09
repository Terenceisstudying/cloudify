const viewLoaders = {};
const loadedTabs = new Set();

export function registerView(tabName, loader) {
    viewLoaders[tabName] = loader;
}

export function invalidateTab(tabName) {
    loadedTabs.delete(tabName);
}

export function invalidateAllTabs() {
    loadedTabs.clear();
}

export function switchToTab(tabName) {
    document.querySelectorAll('.sidebar-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`.sidebar-item[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
    const content = document.getElementById(`${tabName}-tab`);
    if (content) content.classList.add('active');

    if (viewLoaders[tabName] && !loadedTabs.has(tabName)) {
        viewLoaders[tabName]();
        loadedTabs.add(tabName);
    }
}

export function initRouter() {
    document.querySelectorAll('.sidebar-item').forEach(tab => {
        tab.addEventListener('click', () => {
            switchToTab(tab.dataset.tab);
        });
    });
}
