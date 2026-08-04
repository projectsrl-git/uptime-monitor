document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadMonitors();
        loadIncidents();
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
        classes: ["bg-secondary"],
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
    const query = this.value.toLowerCase();

    document.querySelectorAll("#monitor-list .card").forEach(card => {
        const title = card.querySelector(".monitor-name")
            .textContent
            .toLowerCase();

        card.style.display = title.includes(query) ? "" : "none";
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
    loadMonitors
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
    
    const monitors = data.results;

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

        const name = card.querySelector(".monitor-name");
        const interval = card.querySelector(".monitor-interval");
        const lastCheck = card.querySelector(".monitor-last-check");
        const status = card.querySelector(".monitor-status");

        name.textContent = monitor.name;
        interval.textContent = formatInterval(monitor.check_interval_seconds);
        lastCheck.textContent = formatLastCheck(monitor.last_check_at);

        setStatusBadge(status, monitor.status);

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

        const responseTime = monitor.last_response_time_ms !== null
            ? `${monitor.last_response_time_ms}ms`
            : "N/D";

        card.querySelector(
            ".monitor-response-time"
        ).textContent =
            `ultima risposta: ${responseTime}`;

    } catch (error) {
        console.error(error);

        card.querySelector(
            ".monitor-stats"
        ).textContent =
            "ultima risposta: N/D";
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

        html += `
        <div class="${borderClass} py-2">

            <div class="d-flex justify-content-between align-items-center">
                <strong>${incident.monitor_name}</strong>

                <span class="badge rounded-pill ${incident.is_active
                ? "bg-danger"
                : "bg-success"
            }">
                    ${incident.is_active
                ? "ATTIVO"
                : "RISOLTO"
            }
                </span>

            </div>

            <small class="text-muted">
                ${incident.root_cause}
            </small>

        </div>
    `;
    });

    container.innerHTML = html;
}