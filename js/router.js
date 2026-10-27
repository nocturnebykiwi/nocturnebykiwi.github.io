
(() => {
    const pageContent = document.getElementById("page-content");
    const validPages = new Set(["home", "about", "rules", "staff"]);

    let navigationId = 0;

    function getPageFromURL() {
        const params = new URLSearchParams(window.location.search);
        const requestedPage = params.get("page") || "home";

        return validPages.has(requestedPage) ? requestedPage : null;
    }

    function updateActiveLink(page) {
        document.querySelectorAll("[data-route]").forEach(link => {
            const active = link.dataset.route === page;

            if (active) {
                link.setAttribute("aria-current", "page");
                link.classList.add("active");
            } else {
                link.removeAttribute("aria-current");
                link.classList.remove("active");
            }
        });
    }

    async function loadPage(page, updateHistory = false) {
        const currentNavigation = ++navigationId;

        if (!validPages.has(page)) {
            pageContent.innerHTML = `
                <section class="error-state">
                    <span class="section-label">404 / LOST IN THE NIGHT</span>
                    <h1>This page remains a mystery.</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a class="button button-primary" href="?page=home"
                       data-route="home">Return Home →</a>
                </section>
            `;

            document.title = "Not Found — Nocturne";
            updateActiveLink("");
            return;
        }

        if (updateHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set("page", page);
            window.history.pushState({ page }, "", url);
        }

        updateActiveLink(page);

        try {
            const response = await fetch(`pages/${page}.html`);

            if (!response.ok) {
                throw new Error(`Unable to load page: ${response.status}`);
            }

            const html = await response.text();

            if (currentNavigation !== navigationId) return;

            pageContent.innerHTML = html;
            document.title = `${page === "home" ? "Home" :
                page.charAt(0).toUpperCase() + page.slice(1)} — Nocturne`;

            pageContent.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: "smooth" });

            document.dispatchEvent(new CustomEvent("nocturne:page-loaded", {
                detail: { page }
            }));
        } catch (error) {
            if (currentNavigation !== navigationId) return;

            console.error(error);

            pageContent.innerHTML = `
                <section class="error-state">
                    <h1>We lost our way.</h1>
                    <p>We couldn't load this page. Please try again.</p>
                    <button class="button button-primary" id="retry-page">
                        Try Again
                    </button>
                </section>
            `;

            document.getElementById("retry-page")
                .addEventListener("click", () => loadPage(page));
        }
    }

    document.addEventListener("click", event => {
        const link = event.target.closest("a[data-route]");

        if (!link) return;

        if (event.ctrlKey || event.metaKey || event.shiftKey ||
            event.altKey || event.button !== 0) {
            return;
        }

        event.preventDefault();

        const page = link.dataset.route;

        loadPage(page, true);

        document.getElementById("site-nav")?.classList.remove("open");
        document.getElementById("menu-toggle")
            ?.setAttribute("aria-expanded", "false");
    });

    window.addEventListener("popstate", () => {
        const page = getPageFromURL();

        if (page) {
            loadPage(page);
        } else {
            loadPage("home");
        }
    });

    const initialPage = getPageFromURL();

    if (initialPage) {
        loadPage(initialPage);
    } else {
        loadPage("home");
    }
})();
