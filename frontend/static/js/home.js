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

        card.querySelector(
            ".monitor-name"
        ).textContent = monitor.name;

        card.querySelector(
            ".monitor-url"
        ).textContent = monitor.url;

        const status = card.querySelector(
            ".monitor-status"
        );

        status.textContent = monitor.status.toUpperCase();

        status.classList.add(
            getStatusClass(monitor.status)
        );

        container.appendChild(card);
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
}


function getStatusClass(status) {
    switch (status) {
        case "up":
            return "bg-success";

        case "down":
            return "bg-danger";

        case "paused":
            return "bg-secondary";

        case "not_started":
            return "bg-warning";

        default:
            return "bg-secondary";
    }
}