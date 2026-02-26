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

    window.UiLoader = {
        mount,
        setVisible
    };
})();
