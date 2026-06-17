document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const breadcrumb = document.getElementById('breadcrumb');
    const viewer = document.querySelector('[data-image-viewer]');
    const viewerStage = viewer?.querySelector('.image-viewer-stage');
    const viewerImage = viewer?.querySelector('.image-viewer-image');
    const viewerCloseTargets = viewer?.querySelectorAll('[data-viewer-close]') || [];
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.doc-section');
    const parentItems = document.querySelectorAll('.has-children');
    const clickableCards = document.querySelectorAll('.glass-card.clickable');
    const zoomState = {
        scale: 1,
        minScale: 1,
        maxScale: 6,
        offsetX: 0,
        offsetY: 0,
        panStartX: 0,
        panStartY: 0,
        dragging: false,
        loaded: false
    };

    function renderViewer() {
        if (!viewerImage) return;
        viewerImage.style.transform = `translate(-50%, -50%) translate(${zoomState.offsetX}px, ${zoomState.offsetY}px) scale(${zoomState.scale})`;
    }

    function resetViewerState() {
        zoomState.scale = 1;
        zoomState.offsetX = 0;
        zoomState.offsetY = 0;
        zoomState.dragging = false;
        if (viewerStage) viewerStage.classList.remove('dragging');
        renderViewer();
    }

    function fitViewerImage() {
        if (!viewerImage || !viewerStage) return;
        const naturalWidth = viewerImage.naturalWidth || 1;
        const naturalHeight = viewerImage.naturalHeight || 1;
        const stageWidth = viewerStage.clientWidth || 1;
        const stageHeight = viewerStage.clientHeight || 1;
        zoomState.minScale = Math.min(stageWidth / naturalWidth, stageHeight / naturalHeight, 1);
        zoomState.scale = zoomState.minScale;
        zoomState.offsetX = 0;
        zoomState.offsetY = 0;
        renderViewer();
    }

    function openViewer(src, alt) {
        if (!viewer || !viewerImage) return;
        viewer.classList.add('open');
        viewer.setAttribute('aria-hidden', 'false');
        viewerImage.alt = alt || '';
        viewerImage.src = src;
        resetViewerState();
    }

    function closeViewer() {
        if (!viewer) return;
        viewer.classList.remove('open');
        viewer.setAttribute('aria-hidden', 'true');
        resetViewerState();
        if (viewerImage) viewerImage.removeAttribute('src');
    }

    function attachZoomableImages(root = document) {
        root.querySelectorAll('img').forEach(img => {
            if (img.dataset.zoomBound === '1') return;
            img.dataset.zoomBound = '1';
            if (img.closest('.image-viewer')) return;
            img.classList.add('zoomable-image');
            img.addEventListener('click', () => openViewer(img.src, img.alt));
        });
    }

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

    attachZoomableImages();

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

    // Carousel
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const items = carousel.querySelectorAll('.carousel-item');
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        const nextBtn = carousel.querySelector('.carousel-btn.next');
        const dotsContainer = carousel.querySelector('.carousel-dots');
        const track = carousel.querySelector('.carousel-track');
        let current = 0;
        const itemSizes = new Array(items.length).fill(null);

        items.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `第 ${i + 1} 张`);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });

        function updateTrackHeight(index) {
            const size = itemSizes[index];
            if (!size || !size.width || !size.height) return;
            const containerWidth = carousel.clientWidth;
            if (!containerWidth) return;
            const height = Math.round(containerWidth * (size.height / size.width));
            track.style.height = `${height}px`;
        }

        function syncItemImage(index) {
            const img = items[index].querySelector('img');
            if (!img) return;
            const applySize = () => {
                itemSizes[index] = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                if (index === current) updateTrackHeight(index);
            };

            if (img.complete && img.naturalWidth) {
                applySize();
            } else {
                img.addEventListener('load', applySize, { once: true });
            }
        }

        function goTo(index) {
            items[current].classList.remove('active');
            dotsContainer.children[current].classList.remove('active');
            current = (index + items.length) % items.length;
            items[current].classList.add('active');
            dotsContainer.children[current].classList.add('active');
            updateTrackHeight(current);
        }

        items.forEach((_, i) => syncItemImage(i));
        updateTrackHeight(current);
        prevBtn.addEventListener('click', () => goTo(current - 1));
        nextBtn.addEventListener('click', () => goTo(current + 1));
        window.addEventListener('resize', () => updateTrackHeight(current), { passive: true });
    });

    viewerCloseTargets.forEach(node => {
        node.addEventListener('click', closeViewer);
    });

    window.addEventListener('keydown', (event) => {
        if (!viewer?.classList.contains('open')) return;
        if (event.key === 'Escape') {
            closeViewer();
        }
    });

    viewerImage?.addEventListener('load', () => {
        fitViewerImage();
    });

    viewerStage?.addEventListener('wheel', (event) => {
        if (!viewer?.classList.contains('open')) return;
        event.preventDefault();
        const delta = event.deltaY < 0 ? 1.12 : 0.89;
        const nextScale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, zoomState.scale * delta));
        zoomState.scale = nextScale;
        renderViewer();
    }, { passive: false });

    viewerStage?.addEventListener('pointerdown', (event) => {
        if (!viewer?.classList.contains('open') || event.button !== 0) return;
        zoomState.dragging = true;
        zoomState.panStartX = event.clientX - zoomState.offsetX;
        zoomState.panStartY = event.clientY - zoomState.offsetY;
        viewerStage.setPointerCapture(event.pointerId);
        viewerStage.classList.add('dragging');
    });

    viewerStage?.addEventListener('pointermove', (event) => {
        if (!zoomState.dragging) return;
        zoomState.offsetX = event.clientX - zoomState.panStartX;
        zoomState.offsetY = event.clientY - zoomState.panStartY;
        renderViewer();
    });

    function stopDragging(event) {
        if (!zoomState.dragging) return;
        zoomState.dragging = false;
        viewerStage?.classList.remove('dragging');
        if (event && viewerStage?.hasPointerCapture(event.pointerId)) {
            viewerStage.releasePointerCapture(event.pointerId);
        }
    }

    viewerStage?.addEventListener('pointerup', stopDragging);
    viewerStage?.addEventListener('pointercancel', stopDragging);

    viewer?.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('.image-viewer-shell')) return;
        closeViewer();
    });

    window.addEventListener('resize', () => {
        if (viewer?.classList.contains('open')) {
            fitViewerImage();
        }
    }, { passive: true });
});
