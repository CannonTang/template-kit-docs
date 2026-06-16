document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const breadcrumb = document.getElementById('breadcrumb');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.doc-section');
    const parentItems = document.querySelectorAll('.has-children');
    const clickableCards = document.querySelectorAll('.glass-card.clickable');

    function showSection(sectionId) {
        sections.forEach(s => s.classList.remove('active'));
        const target = document.getElementById('section-' + sectionId);
        if (target) {
            target.classList.add('active');
            target.scrollTop = 0;
        }

        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const parent = activeLink.closest('.has-children');
            if (parent) parent.classList.add('expanded');
            updateBreadcrumb(activeLink);
        }

        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }

    function updateBreadcrumb(link) {
        const parts = [];
        const parentNav = link.closest('.has-children');
        if (parentNav) {
            const parentLink = parentNav.querySelector(':scope > .nav-link span');
            if (parentLink) parts.push(parentLink.textContent);
        }
        parts.push(link.querySelector('span')?.textContent || link.textContent.trim());
        breadcrumb.textContent = parts.join(' / ');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
            history.replaceState(null, '', '#' + section);
        });
    });

    parentItems.forEach(item => {
        const toggle = item.querySelector(':scope > .nav-link');
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const wasExpanded = item.classList.contains('expanded');
            if (!wasExpanded) {
                item.classList.add('expanded');
            } else {
                item.classList.toggle('expanded');
            }
            const section = toggle.dataset.section;
            showSection(section);
            history.replaceState(null, '', '#' + section);
        });
    });

    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const goto = card.dataset.goto;
            if (goto) {
                showSection(goto);
                history.replaceState(null, '', '#' + goto);
            }
        });
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.querySelector('.content').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    const hash = window.location.hash.slice(1);
    if (hash) {
        showSection(hash);
    }
});
