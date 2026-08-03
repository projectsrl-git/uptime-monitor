document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadMonitors();
        loadIncidents();
    }
);

const searchInput = document.getElementById("search-monitor");
const orderingSelect = document.getElementById("ordering-monitor");
const statusFilter = document.getElementById("status-filter");

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

    const response = await fetch(`/api/monitors/?${params}`);

    if (!response.ok) {
        throw new Error("Errore nel caricamento dei monitor");
    }

    const data = await response.json();
    const monitors = data.results;

    renderMonitors(monitors);
    updateStatistics(monitors);
}

function renderMonitors(monitors) {
    const container = document.getElementById(
        "monitor-list"
    );

    const template = document.getElementById(
        "monitor-card-template"
    );

    container.innerHTML = "";

    monitors.forEach(monitor => {
        const card = template.content.cloneNode(true);

        const cardElement = card.querySelector(".card");

        card.querySelector(
            ".monitor-name"
        ).textContent = monitor.name;

        card.querySelector(
            ".monitor-interval"
        ).textContent = formatInterval(monitor.check_interval_seconds);

        card.querySelector(".monitor-last-check").textContent =
            formatLastCheck(monitor.last_check_at);

        const status = card.querySelector(".monitor-status");
        setStatusBadge(status, monitor.status);

        container.appendChild(card);

        loadStats(monitor.id, cardElement, monitor);
    });
}

function updateStatistics(monitors) {
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

    const not_started = monitors.filter(
        monitor => monitor.status === "not_started"
    ).length;

    document.getElementById(
        "total-monitors"
    ).textContent = total;

    document.getElementById(
        "up-monitors"
    ).textContent = up;

    document.getElementById(
        "down-monitors"
    ).textContent = down;

    document.getElementById(
        "paused-monitors"
    ).textContent = paused;

    document.getElementById(
        "not-started-monitors"
    ).textContent = not_started;
}

function setStatusBadge(badge, status) {
    badge.className = "badge rounded-pill monitor-status me-2";

    switch (status) {
        case "up":
            badge.classList.add("bg-success");
            badge.textContent = "UP";
            break;

        case "down":
            badge.classList.add("bg-danger");
            badge.textContent = "DOWN";
            break;

        case "paused":
            badge.classList.add("bg-warning", "text-dark");
            badge.textContent = "PAUSED";
            break;

        case "not_started":
            badge.classList.add("bg-secondary");
            badge.textContent = "NOT STARTED";
            break;

        default:
            badge.classList.add("bg-secondary");
            badge.textContent = status.toUpperCase();
    }
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
        const response = await fetch(
            `/api/monitors/${id}/uptime/?period=24h`
        );

        if (!response.ok) {
            throw new Error("Errore caricamento uptime");
        }

        const data = await response.json();

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

    if (percentage < 80) {
        circle.style.stroke = "#dc3545";
    } else if (percentage < 90) {
        circle.style.stroke = "#ffc107";
    } else {
        circle.style.stroke = "#17b932";
    }
}

async function loadIncidents() {
    try {
        const response = await fetch("/api/incidents/");

        if (!response.ok) {
            throw new Error("Errore caricamento incidenti");
        }

        const data = await response.json();

        renderIncidents(
            data.results.slice(0, 5)
        );

    } catch (error) {
        console.error(error);
    }
}

function renderIncidents(incidents) {

    const container = document.getElementById("incident-list");
    container.innerHTML = "";

    if (incidents.length === 0) {
        container.innerHTML =
            '<small class="text-muted">Nessun incidente</small>';
        return;
    }

    incidents.forEach((incident, index) => {

        const borderClass =
            index < incidents.length - 1
                ? "border-bottom"
                : "";

        container.innerHTML += `
        <div class="${borderClass} py-2">

            <div class="d-flex justify-content-between align-items-center">
                <strong>${incident.monitor_name}</strong>

                <span class="badge rounded-pill ${incident.is_active ? "bg-danger" : "bg-success"
            }">
                    ${incident.is_active ? "ATTIVO" : "RISOLTO"}
                </span>
            </div>

            <small class="text-muted">
                ${incident.root_cause}
            </small>

        </div>
    `;
    });
}