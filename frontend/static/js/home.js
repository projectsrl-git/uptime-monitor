document.addEventListener(
    "DOMContentLoaded",
    loadMonitors
);


async function loadMonitors() {
    try {
        const response = await fetch(
            "/api/monitors/"
        );

        if (!response.ok) {
            throw new Error(
                "Errore nel caricamento dei monitor"
            );
        }

        const data = await response.json();
        const monitors = data.results;

        renderMonitors(monitors);
        updateStatistics(monitors);

    } catch (error) {
        console.error(error);
    }
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
            ".monitor-url"
        ).textContent = monitor.url;

        card.querySelector(
            ".monitor-interval"
        ).textContent = formatInterval(monitor.check_interval_seconds);

        const status = card.querySelector(".monitor-status");
        setStatusBadge(status, monitor.status);

        container.appendChild(card);

        loadUptime(monitor.id, cardElement);
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

async function loadUptime(id, card) {
    try {
        const response = await fetch(
            `/api/monitors/${id}/uptime/?period=24h`
        );

        if (!response.ok) {
            throw new Error("Errore caricamento uptime");
        }

        const data = await response.json();
          
        card.querySelector(
            ".monitor-uptime"
        ).textContent = data.uptime_percentage !== null
                ? `Uptime 24h: ${data.uptime_percentage}%`
                : "Uptime 24h: N/D";

    } catch (error) {
        console.error(error);

        card.querySelector(
            ".monitor-uptime"
        ).textContent = "Uptime 24h: N/D";
    }
}