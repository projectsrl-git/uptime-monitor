document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadMonitors();
        loadIncidents();
        loadGeneralStatistics();
    }
);

const STATUS_CONFIG = {
    up: {
        classes: ["bg-success"],
        text: "UP"
    },
    down: {
        classes: ["bg-danger"],
        text: "DOWN"
    },
    paused: {
        classes: ["bg-warning", "text-dark"],
        text: "PAUSED"
    },
    not_started: {
        classes: ["bg-secondary", "text-dark"],
        text: "NOT STARTED"
    }
};

const searchInput = document.getElementById("search-monitor");
const orderingSelect = document.getElementById("ordering-monitor");
const statusFilter = document.getElementById("status-filter");
const uptimePeriod = document.getElementById("uptime-period");


const statistics = {
    total: document.getElementById("total-monitors"),
    up: document.getElementById("up-monitors"),
    down: document.getElementById("down-monitors"),
    paused: document.getElementById("paused-monitors"),
    notStarted: document.getElementById("not-started-monitors")
};

const elements = {
    monitorList: document.getElementById("monitor-list"),
    monitorTemplate: document.getElementById("monitor-card-template"),
    incidentList: document.getElementById("incident-list"),

    searchInput: document.getElementById("search-monitor"),
    orderingSelect: document.getElementById("ordering-monitor"),
    statusFilter: document.getElementById("status-filter"),
    uptimePeriod: document.getElementById("uptime-period")
};

async function apiFetch(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Errore API: ${response.status}`
        );
    }

    return await response.json();
}


searchInput.addEventListener("input", function () {

    const query = this.value.trim().toLowerCase();

    document.querySelectorAll("#monitor-list .card").forEach(card => {

        const name =
            card.querySelector(".monitor-name")
                .textContent
                .toLowerCase();

        const badgesElement =
            card.querySelector(".monitor-badges");

        const badges =
            badgesElement
                ? badgesElement.textContent.toLowerCase()
                : "";

        const matches =
            name.includes(query) ||
            badges.includes(query);

        card.style.display =
            matches ? "" : "none";
    });
});

orderingSelect.addEventListener(
    "change",
    loadMonitors
);

statusFilter.addEventListener(
    "change",
    loadMonitors
);

uptimePeriod.addEventListener(
    "change",
    async () => {

        await loadMonitors();
        await loadGeneralStatistics();

    }
);


async function loadMonitors() {

    const params = new URLSearchParams();

    if (searchInput.value.trim()) {
        params.set("search", searchInput.value.trim());
    }

    if (orderingSelect.value) {
        params.set("ordering", orderingSelect.value);
    }

    if (statusFilter.value) {
        params.set("status", statusFilter.value);
    }

    const data = await apiFetch(
        `/api/monitors/?${params}`
    );

    const monitors = data;

    await renderMonitors(monitors);
    updateStatistics(monitors);
}

async function renderMonitors(monitors) {
    const container = elements.monitorList;
    const template = elements.monitorTemplate;

    container.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const statsPromises = [];

    monitors.forEach(monitor => {

        const card = template.content.cloneNode(true);

        const cardElement = card.querySelector(".card");

        cardElement.addEventListener("click", () => {
            window.location.href = `/monitor/${monitor.id}/`;
        });

        const name = card.querySelector(".monitor-name");
        const interval = card.querySelector(".monitor-interval");
        const lastCheck = card.querySelector(".monitor-last-check");
        const status = card.querySelector(".monitor-status");
        const badges = card.querySelector(".monitor-badges");

        name.textContent = monitor.name;

        interval.textContent =
            formatInterval(monitor.check_interval_seconds);

        lastCheck.textContent =
            formatLastCheck(monitor.last_check_at);

        setStatusBadge(status, monitor.status);

        if (badges) {

            badges.innerHTML = "";

            if (monitor.badges && monitor.badges.length > 0) {

                monitor.badges.forEach(badge => {

                    const badgeElement =
                        document.createElement("span");

                    badgeElement.className =
                        "badge rounded-pill text-bg-secondary monitor-custom-badge";

                    badgeElement.textContent = badge;

                    badges.appendChild(badgeElement);
                });
            }
        }

        fragment.appendChild(card);

        statsPromises.push(
            loadStats(monitor.id, cardElement, monitor)
        );
    });

    container.appendChild(fragment);

    await Promise.all(statsPromises);
}

function updateStatistics(monitors) {

    const stats = {
        up: 0,
        down: 0,
        paused: 0,
        not_started: 0
    };

    for (const monitor of monitors) {
        if (stats[monitor.status] !== undefined) {
            stats[monitor.status]++;
        }
    }

    statistics.total.textContent = monitors.length;
    statistics.up.textContent = stats.up;
    statistics.down.textContent = stats.down;
    statistics.paused.textContent = stats.paused;
    statistics.notStarted.textContent = stats.not_started;


}

function setStatusBadge(badge, status) {

    badge.className = "badge rounded-pill monitor-status me-2";

    const config = STATUS_CONFIG[status];

    if (config) {
        badge.classList.add(...config.classes);
        badge.textContent = config.text;
        return;
    }

    badge.classList.add("bg-secondary");
    badge.textContent = status.toUpperCase();
}

function formatInterval(seconds) {
    if (seconds < 60) {
        return `check ogni ${seconds}s`;
    }

    const minutes = seconds / 60;
    return `check ogni ${minutes}min`;
}

async function loadStats(id, card, monitor) {

    try {

        const data = await apiFetch(
            `/api/monitors/${id}/uptime/?period=${uptimePeriod.value}`
        );

        setUptimeCircle(
            card,
            data.uptime_percentage
        );

        const responseTime =
            monitor.last_response_time_ms !== null
                ? `${monitor.last_response_time_ms}ms`
                : "N/D";

        card.querySelector(
            ".monitor-response-time"
        ).textContent =
            `ultima risposta: ${responseTime}`;

        return {
            uptime: data.uptime_percentage
        };

    } catch (error) {

        console.error(error);

        card.querySelector(
            ".monitor-response-time"
        ).textContent =
            "ultima risposta: N/D";

        return {
            uptime: null
        };
    }
}

function formatLastCheck(dateString) {
    if (!dateString) {
        return "ultimo check: N/D";
    }

    const seconds = Math.floor(
        (Date.now() - new Date(dateString).getTime()) / 1000
    );

    if (seconds < 60) {
        return `ultimo check: ${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `ultimo check: ${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        const remainingMinutes = minutes % 60;
        return `ultimo check: ${hours}h ${remainingMinutes}m`;
    }

    const days = Math.floor(hours / 24);
    return `ultimo check: ${days}g`;
}

function formatDuration(seconds) {

    if (seconds == null) {
        return "-";
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(
        (seconds % 86400) / 3600
    );
    const minutes = Math.floor(
        (seconds % 3600) / 60
    );
    const secs = seconds % 60;

    const parts = [];

    if (days) {
        parts.push(`${days}d`);
    }

    if (hours) {
        parts.push(`${hours}h`);
    }

    if (minutes) {
        parts.push(`${minutes}m`);
    }

    if (secs && parts.length < 2) {
        parts.push(`${secs}s`);
    }

    return parts.join(" ") || "0s";
}

function setUptimeCircle(card, percentage) {
    const circle = card.querySelector(".circle-progress");
    const text = card.querySelector(".uptime-percentage");
    const periodLabel = card.querySelector(".uptime-period-label");

    periodLabel.textContent = uptimePeriod.value;

    if (percentage === null) {
        text.textContent = "N/D";
        return;
    }

    text.textContent = `${percentage}%`;

    const circumference = 188.4;
    const offset = circumference - (
        circumference * percentage / 100
    );

    circle.style.strokeDashoffset = offset;

    circle.classList.remove(
        "low",
        "medium",
        "high"
    );

    if (percentage < 80) {

        circle.classList.add("low");

    } else if (percentage < 90) {

        circle.classList.add("medium");

    } else {

        circle.classList.add("high");

    }
}

async function loadIncidents() {

    try {

        const data = await apiFetch(
            "/api/incidents/"
        );

        renderIncidents(
            data.results.slice(0, 5)
        );

    } catch (error) {

        console.error(error);

    }
}

function renderIncidents(incidents) {

    const container = elements.incidentList;
    container.innerHTML = "";

    if (incidents.length === 0) {
        container.innerHTML =
            '<small class="text-muted">Nessun incidente</small>';
        return;
    }

    let html = "";

    incidents.forEach((incident, index) => {

        const borderClass =
            index < incidents.length - 1
                ? "border-bottom"
                : "";

        const statusClass =
            incident.is_active
                ? "bg-danger"
                : "bg-success";

        const statusText =
            incident.is_active
                ? "ATTIVO"
                : "RISOLTO";

        html += `
            <div class="${borderClass} incident-item">

                <div class="incident-monitor-name">
                    <span
                        class="incident-status-dot ${incident.is_active
                                ? "active"
                                : "resolved"
                            }"
                        title="${statusText}"
                    ></span>

                    <span class="incident-monitor-name-text">
                        ${incident.monitor_name}
                    </span>
                </div>

                <div class="incident-root-cause">
                    ${incident.root_cause}
                </div>

            </div>
        `;
    });

    container.innerHTML = html;
}

async function loadGeneralStatistics() {

    try {

        const data = await apiFetch(
            `/api/statistics/?period=${uptimePeriod.value}`
        );

        const uptimeElement =
            document.getElementById("stats-uptime");

        uptimeElement.classList.remove(
            "low",
            "medium",
            "high"
        );

        if (data.uptime_percentage === null) {

            uptimeElement.textContent = "N/D";

        } else {

            const percentage =
                data.uptime_percentage;

            uptimeElement.textContent =
                `${percentage.toFixed(2)}%`;

            if (percentage < 80) {

                uptimeElement.classList.add("low");

            } else if (percentage < 90) {

                uptimeElement.classList.add("medium");

            } else {

                uptimeElement.classList.add("high");

            }
        }

        document.getElementById(
            "stats-response"
        ).textContent =
            data.response_time_average_ms !== null
                ? `${Math.round(data.response_time_average_ms)} ms`
                : "N/D";

        document.getElementById(
            "stats-checks"
        ).textContent =
            data.checks.toLocaleString("it-IT");

        document.getElementById(
            "stats-incidents"
        ).textContent =
            data.incidents;

        document.getElementById(
            "stats-downtime"
        ).textContent =
            formatDuration(
                data.downtime_seconds
            );

    } catch (error) {

        console.error(error);

        const uptimeElement =
            document.getElementById("stats-uptime");

        uptimeElement.classList.remove(
            "low",
            "medium",
            "high"
        );

        uptimeElement.textContent = "N/D";

        document.getElementById(
            "stats-response"
        ).textContent = "N/D";

        document.getElementById(
            "stats-checks"
        ).textContent = "N/D";

        document.getElementById(
            "stats-incidents"
        ).textContent = "N/D";

        document.getElementById(
            "stats-downtime"
        ).textContent = "N/D";
    }
}
