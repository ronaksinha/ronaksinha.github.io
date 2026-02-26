// Shared 3-square loader utility.
(function () {
    function createSquare() {
        const square = document.createElement("span");
        square.className = "ui-loader-square";

        const inner = document.createElement("span");
        inner.className = "ui-loader-square-inner";
        square.appendChild(inner);

        return square;
    }

    function mount(target, options) {
        if (!target) {
            return null;
        }

        const label = options && options.label ? String(options.label) : "Loading";
        target.setAttribute("aria-live", "polite");
        target.setAttribute("aria-label", label);

        const existing = target.querySelector(".ui-loader");
        if (existing) {
            return existing;
        }

        target.textContent = "";
        const loader = document.createElement("div");
        loader.className = "ui-loader";
        loader.appendChild(createSquare());
        loader.appendChild(createSquare());
        loader.appendChild(createSquare());
        target.appendChild(loader);
        return loader;
    }

    function setVisible(target, visible) {
        if (!target) {
            return;
        }
        target.classList.toggle("hidden", !visible);
    }

    function enablePullToRefresh(options) {
        const config = options || {};
        const threshold = Number.isFinite(config.threshold) ? Math.max(40, Number(config.threshold)) : 88;
        const maxPull = Number.isFinite(config.maxPull) ? Math.max(threshold, Number(config.maxPull)) : 150;
        const label = config.label ? String(config.label) : "Pull to refresh";
        const onRefresh = typeof config.onRefresh === "function"
            ? config.onRefresh
            : function () { window.location.reload(); };
        const isEnabled = typeof config.isEnabled === "function"
            ? config.isEnabled
            : function () { return true; };

        const host = document.createElement("div");
        host.className = "ui-pull-refresh";
        host.setAttribute("aria-hidden", "true");

        const indicator = document.createElement("div");
        indicator.className = "ui-pull-refresh-indicator";
        host.appendChild(indicator);
        mount(indicator, { label });
        document.body.appendChild(host);

        let startY = 0;
        let pullDistance = 0;
        let dragging = false;
        let refreshing = false;

        function atTop() {
            return (window.scrollY || window.pageYOffset || 0) <= 0;
        }

        function updateDragState(distance) {
            const clamped = Math.max(0, Math.min(maxPull, distance));
            const progress = Math.min(1, clamped / threshold);
            pullDistance = clamped;

            host.classList.add("active");
            host.classList.toggle("ready", progress >= 1);
            host.classList.remove("refreshing");
            indicator.style.opacity = String(Math.max(0.15, progress));
            indicator.style.transform = `translateY(${Math.round(clamped * 0.6)}px) scale(${(0.9 + (progress * 0.1)).toFixed(3)})`;
        }

        function resetDragState() {
            pullDistance = 0;
            host.classList.remove("active", "ready");
            indicator.style.opacity = "";
            indicator.style.transform = "";
        }

        function setRefreshingState() {
            host.classList.add("active", "ready", "refreshing");
            indicator.style.opacity = "1";
            indicator.style.transform = `translateY(${Math.round(threshold * 0.6)}px) scale(1)`;
        }

        function onTouchStart(event) {
            if (refreshing || !isEnabled() || !atTop()) {
                dragging = false;
                return;
            }
            if (!event.touches || event.touches.length !== 1) {
                dragging = false;
                return;
            }
            startY = event.touches[0].clientY;
            dragging = true;
        }

        function onTouchMove(event) {
            if (!dragging || refreshing || !isEnabled()) {
                return;
            }
            if (!event.touches || event.touches.length !== 1) {
                return;
            }
            const dy = event.touches[0].clientY - startY;
            if (dy <= 0) {
                resetDragState();
                return;
            }
            if (!atTop() && dy < 12) {
                return;
            }
            // Prevent default overscroll bounce so the custom loader follows drag.
            event.preventDefault();
            updateDragState(dy);
        }

        function onTouchEnd() {
            if (!dragging) {
                return;
            }
            dragging = false;

            if (refreshing) {
                return;
            }

            if (pullDistance >= threshold && isEnabled()) {
                refreshing = true;
                setRefreshingState();
                Promise.resolve()
                    .then(function () {
                        return onRefresh();
                    })
                    .catch(function () {
                        refreshing = false;
                        resetDragState();
                    });
                return;
            }

            resetDragState();
        }

        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("touchcancel", onTouchEnd, { passive: true });

        return function disablePullToRefresh() {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchcancel", onTouchEnd);
            host.remove();
        };
    }

    window.UiLoader = {
        mount,
        setVisible,
        enablePullToRefresh
    };
})();
