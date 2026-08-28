let currentPeriod = "24h";

document.addEventListener("DOMContentLoaded", () => {


    loadMonitors();


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

                await loadMonitors();

            });

        });

});


async function apiFetch(url) {

    const response = await fetch(url);

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

    container.innerHTML =
        '<div class="p-3 text-muted">Caricamento...</div>';


    try {

        const monitors = await apiFetch(
            "/api/monitors/"
        );

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

        renderMonitors(results);

    } catch (error) {

        console.error(error);

        container.innerHTML =
            '<div class="p-3 text-muted">Errore caricamento monitor</div>';

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
            "card shadow-sm h-100";


        const body =
            document.createElement("div");

        body.className =
            "card-body py-2 px-3";


        const row =
            document.createElement("div");

        row.className =
            "d-flex justify-content-between align-items-center gap-2";


        const nameContainer =
            document.createElement("div");

        nameContainer.className =
            "d-flex align-items-center gap-2 text-truncate";


        const status =
            document.createElement("span");

        status.className =
            getStatusClass(monitor.status);

        status.style.width = "8px";
        status.style.height = "8px";
        status.style.minWidth = "8px";
        status.style.borderRadius = "50%";


        const name =
            document.createElement("span");

        name.className =
            "fw-semibold text-truncate";

        name.textContent =
            monitor.name;


        const uptime =
            document.createElement("span");

        uptime.className =
            "fw-semibold text-nowrap";


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


function getStatusClass(status) {

    switch (status) {

        case "up":
            return "bg-success";

        case "down":
            return "bg-danger";

        case "paused":
            return "bg-warning";

        case "not_started":
            return "bg-secondary";

        default:
            return "bg-secondary";
    }
}