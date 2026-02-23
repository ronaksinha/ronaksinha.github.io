(function () {
    const minShade = 0;
    const maxShade = 100;
    const minForegroundShade = 20;
    const maxForegroundShade = 245;
    let framePending = false;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    function updateBackgroundFromScroll() {
        const doc = document.documentElement;
        const scrollTop = window.pageYOffset || doc.scrollTop || 0;
        const scrollableHeight = Math.max(doc.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(scrollTop / scrollableHeight, 1);
        const shade = Math.round(minShade + (maxShade - minShade) * progress);
        const contrastBlend = smoothstep(102, 152, shade);
        const foregroundShade = Math.round(
            maxForegroundShade + (minForegroundShade - maxForegroundShade) * contrastBlend
        );
        const mutedShade = foregroundShade > 128
            ? Math.max(foregroundShade - 60, 150)
            : Math.min(foregroundShade + 70, 120);
        const strokeShade = foregroundShade > 128
            ? Math.max(foregroundShade - 95, 120)
            : Math.min(foregroundShade + 95, 150);
        const surfaceTone = foregroundShade > 128 ? 255 : 0;
        const inverseTone = foregroundShade > 128 ? 0 : 255;

        doc.style.setProperty('--scroll-bg-shade', String(shade));
        doc.style.setProperty('--scroll-fg-shade', String(foregroundShade));
        doc.style.setProperty('--scroll-fg-muted-shade', String(mutedShade));
        doc.style.setProperty('--scroll-stroke-shade', String(strokeShade));
        doc.style.setProperty('--scroll-surface-rgb', `${surfaceTone}, ${surfaceTone}, ${surfaceTone}`);
        doc.style.setProperty('--scroll-inverse-rgb', `${inverseTone}, ${inverseTone}, ${inverseTone}`);
        framePending = false;
    }

    function requestUpdate() {
        if (!framePending) {
            framePending = true;
            window.requestAnimationFrame(updateBackgroundFromScroll);
        }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('load', requestUpdate);
    requestUpdate();
})();
