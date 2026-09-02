let currentPeriod = "24h";
const REFRESH_INTERVAL_MS = 5000;
let refreshTimer = null;
let lastMonitorsSnapshot = null;
let lastTotalsSnapshot = null;

async function refreshStatus() {
    await Promise.all([
        loadMonitors(),
        loadTotalUptimes(),
    ]);
}

function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(async () => {
        try {
            await refreshStatus();
        } catch (error) {
            console.error("Errore aggiornamento automatico", error);
        }
    }, REFRESH_INTERVAL_MS);
}

document.addEventListener("DOMContentLoaded", () => {

    refreshStatus();
    startAutoRefresh();

    document
        .querySelectorAll(".statistics-period")
        .forEach(button => {

            button.addEventListener("click", async () => {

                document
                    .querySelectorAll(".statistics-period")
                    .forEach(btn => {
                        btn.classList.remove("active");
                    });

                button.classList.add("active");

                currentPeriod =
                    button.dataset.period;

                await refreshStatus();

            });

        });

});


async function apiFetch(url) {

    const response = await fetch(url, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Errore API: ${response.status}`
        );
    }

    return await response.json();
}


async function loadMonitors() {

    const container =
        document.getElementById(
            "monitor-status-list"
        );

    if (lastMonitorsSnapshot === null) {
        container.innerHTML =
            '<div class="p-3 text-muted">Caricamento...</div>';
    }

    try {

        const monitors = await apiFetch(
            "/api/monitors/"
        );

        updateStatusSummary(monitors);

        const results = await Promise.all(
            monitors.map(async monitor => {

                try {

                    const uptime = await apiFetch(
                        `/api/monitors/${monitor.id}/uptime/?period=${currentPeriod}`
                    );

                    return {
                        ...monitor,
                        uptime: uptime.uptime_percentage
                    };

                } catch (error) {

                    console.error(error);

                    return {
                        ...monitor,
                        uptime: null
                    };

                }

            })
        );

        const snapshot = JSON.stringify(
            results.map(monitor => ({
                id: monitor.id,
                name: monitor.name,
                status: monitor.status,
                uptime: monitor.uptime,
            }))
        );

        if (snapshot !== lastMonitorsSnapshot) {
            lastMonitorsSnapshot = snapshot;
            renderMonitors(results);
        }

    } catch (error) {

        console.error(error);

        if (lastMonitorsSnapshot === null) {
            container.innerHTML =
                '<div class="p-3 text-muted">Errore caricamento monitor</div>';
        }

    }
}


function renderMonitors(monitors) {

    const container =
        document.getElementById(
            "monitor-status-list"
        );

    container.innerHTML = "";

    if (monitors.length === 0) {

        container.innerHTML = `
            <div class="col">
                <div class="text-muted">
                    Nessun monitor
                </div>
            </div>
        `;

        return;
    }

    const fragment =
        document.createDocumentFragment();

    monitors.forEach(monitor => {

        const column =
            document.createElement("div");

        const card =
            document.createElement("div");

        card.className =
            "card shadow-sm h-100 monitor-status-card";


        const body =
            document.createElement("div");

        body.className =
            "card-body monitor-status-body";


        const row =
            document.createElement("div");

        row.className =
            "monitor-status-row";


        const nameContainer =
            document.createElement("div");

        nameContainer.className =
            "monitor-status-name";


        const status =
            document.createElement("span");

        status.className =
            "monitor-status-dot";


        if (monitor.status === "up") {

            status.classList.add("status-up");

        } else if (monitor.status === "down") {

            status.classList.add("status-down");

        } else if (monitor.status === "paused") {

            status.classList.add("status-paused");

        } else {

            status.classList.add("status-not-started");
        }


        const name =
            document.createElement("span");

        name.className =
            "monitor-status-name-text";

        name.textContent =
            monitor.name;


        const uptime =
            document.createElement("span");

        uptime.className =
            "monitor-status-uptime";


        if (monitor.uptime === null) {

            uptime.textContent = "N/D";

        } else {

            uptime.textContent =
                `${monitor.uptime.toFixed(2)}%`;

            if (monitor.uptime < 80) {

                uptime.classList.add("uptime-low");

            } else if (monitor.uptime < 90) {

                uptime.classList.add("uptime-medium");

            } else {

                uptime.classList.add("uptime-high");
            }
        }


        nameContainer.appendChild(status);
        nameContainer.appendChild(name);

        row.appendChild(nameContainer);
        row.appendChild(uptime);

        body.appendChild(row);
        card.appendChild(body);
        column.appendChild(card);

        fragment.appendChild(column);

    });

    container.appendChild(fragment);
}


function updateStatusSummary(monitors) {

    const titleElement =
        document.getElementById("status-title");

    const summaryElement =
        document.getElementById("status-summary");

    if (!titleElement || !summaryElement) {
        return;
    }

    const total = monitors.length;

    const up = monitors.filter(
        monitor => monitor.status === "up"
    ).length;

    const down = monitors.filter(
        monitor => monitor.status === "down"
    ).length;

    const paused = monitors.filter(
        monitor => monitor.status === "paused"
    ).length;

    const notStarted = monitors.filter(
        monitor => monitor.status === "not_started"
    ).length;


    titleElement.classList.remove(
        "status-operational",
        "status-warning",
        "status-danger"
    );


    if (
        total > 0 &&
        up === total
    ) {

        titleElement.textContent =
            "Tutto operativo";

        titleElement.classList.add(
            "status-operational"
        );

        summaryElement.textContent =
            "Tutti i sistemi stanno funzionando correttamente";

        return;
    }


    if (down > 0) {

        titleElement.textContent =
            "Problemi rilevati";

        titleElement.classList.add(
            "status-danger"
        );

    } else {

        titleElement.textContent =
            "Stato dei sistemi";

        titleElement.classList.add(
            "status-warning"
        );
    }


    const parts = [];

    parts.push(
        `${up} di ${total} operativi`
    );

    if (down > 0) {
        parts.push(
            `${down} non operativi`
        );
    }

    if (paused > 0) {
        parts.push(
            `${paused} in pausa`
        );
    }

    if (notStarted > 0) {
        parts.push(
            `${notStarted} non avviati`
        );
    }


    summaryElement.textContent =
        parts.join(" · ");
}

async function loadTotalUptimes() {

    const periods = [
        "24h",
        "7d",
        "30d",
        "365d"
    ];

    const results = await Promise.all(
        periods.map(period =>
            apiFetch(
                `/api/statistics/?period=${period}`
            )
        )
    );

    const snapshot = JSON.stringify(
        results.map(result => result.uptime_percentage)
    );

    if (snapshot === lastTotalsSnapshot) {
        return;
    }

    lastTotalsSnapshot = snapshot;

    periods.forEach((period, index) => {

        const element =
            document.getElementById(
                `uptime-${period}`
            );

        const uptime =
            results[index].uptime_percentage;

        if (uptime === null) {

            element.textContent = "N/D";

            return;
        }

        element.textContent =
            `${uptime.toFixed(2)}%`;

        element.classList.remove(
            "uptime-low",
            "uptime-medium",
            "uptime-high"
        );

        if (uptime < 80) {

            element.classList.add("uptime-low");

        } else if (uptime < 90) {

            element.classList.add("uptime-medium");

        } else {

            element.classList.add("uptime-high");
        }
    });
}