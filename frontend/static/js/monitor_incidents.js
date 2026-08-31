let currentPage = 1;


document.addEventListener("DOMContentLoaded", () => {

    const orderingSelect =
        document.getElementById("ordering-incident");

    const statusFilter =
        document.getElementById("status-filter");


    orderingSelect.addEventListener(
        "change",
        () => {
            loadIncidents(1);
        }
    );


    statusFilter.addEventListener(
        "change",
        () => {
            loadIncidents(1);
        }
    );


    loadIncidents(1);

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


async function loadIncidents(page = 1) {

    currentPage = page;


    const tableBody =
        document.getElementById(
            "incident-table-body"
        );


    const ordering =
        document.getElementById(
            "ordering-incident"
        ).value;


    const status =
        document.getElementById(
            "status-filter"
        ).value;


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="text-center py-4 text-muted">
                Caricamento...
            </td>
        </tr>
    `;


    const params =
        new URLSearchParams();


    params.set(
        "page",
        page
    );


    if (ordering) {
        params.set(
            "ordering",
            ordering
        );
    }


    if (status) {
        params.set(
            "status",
            status
        );
    }


    try {

        const data = await apiFetch(
            `/api/monitors/${monitorId}/incidents/?${params}`
        );


        renderIncidents(
            data.results
        );


        renderPagination(
            data
        );


    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-4 text-muted">
                    Errore durante il caricamento degli incidenti
                </td>
            </tr>
        `;

    }
}


function renderIncidents(incidents) {

    const tableBody =
        document.getElementById(
            "incident-table-body"
        );


    tableBody.innerHTML = "";


    if (incidents.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-4 text-muted">
                    Nessun incidente trovato
                </td>
            </tr>
        `;

        return;
    }


    const fragment =
        document.createDocumentFragment();


    incidents.forEach(incident => {

        const row =
            document.createElement("tr");


        // ==========================
        // STATO
        // ==========================

        const statusCell =
            document.createElement("td");


        const statusBadge =
            document.createElement("span");


        statusBadge.className =
            "badge rounded-pill";


        if (incident.is_active) {

            statusBadge.classList.add(
                "bg-danger"
            );

            statusBadge.textContent =
                "ATTIVO";

        } else {

            statusBadge.classList.add(
                "bg-success"
            );

            statusBadge.textContent =
                "RISOLTO";
        }


        statusCell.appendChild(
            statusBadge
        );


        // ==========================
        // INIZIO
        // ==========================

        const startedCell =
            document.createElement("td");

        startedCell.textContent =
            formatDate(
                incident.started_at
            );


        // ==========================
        // FINE
        // ==========================

        const endedCell =
            document.createElement("td");

        endedCell.textContent =
            incident.ended_at
                ? formatDate(
                    incident.ended_at
                )
                : "-";


        // ==========================
        // DURATA
        // ==========================

        const durationCell =
            document.createElement("td");

        durationCell.textContent =
            formatDuration(
                incident.duration_seconds
            );


        // ==========================
        // CAUSA
        // ==========================

        const causeCell =
            document.createElement("td");

        causeCell.textContent =
            incident.root_cause
            || "-";


        row.appendChild(statusCell);
        row.appendChild(startedCell);
        row.appendChild(endedCell);
        row.appendChild(durationCell);
        row.appendChild(causeCell);


        fragment.appendChild(row);

    });


    tableBody.appendChild(
        fragment
    );
}


function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "it-IT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


function formatDuration(seconds) {

    if (
        seconds === null ||
        seconds === undefined
    ) {
        return "-";
    }


    if (seconds === 0) {
        return "0s";
    }


    const days =
        Math.floor(
            seconds / 86400
        );


    const hours =
        Math.floor(
            (seconds % 86400) / 3600
        );


    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    const remainingSeconds =
        seconds % 60;


    const parts = [];


    if (days > 0) {
        parts.push(
            `${days}g`
        );
    }


    if (hours > 0) {
        parts.push(
            `${hours}h`
        );
    }


    if (minutes > 0) {
        parts.push(
            `${minutes}m`
        );
    }


    if (
        remainingSeconds > 0 &&
        parts.length < 2
    ) {
        parts.push(
            `${remainingSeconds}s`
        );
    }


    return parts.join(" ");
}


function renderPagination(data) {

    const container =
        document.getElementById(
            "pagination"
        );


    container.innerHTML = "";


    const pageSize = 20;


    const totalPages =
        Math.ceil(
            data.count / pageSize
        );


    if (totalPages <= 1) {
        return;
    }


    const pagination =
        document.createElement("ul");


    pagination.className =
        "pagination";


    function createPageItem(
        label,
        page,
        options = {}
    ) {

        const {
            disabled = false,
            active = false
        } = options;


        const item =
            document.createElement("li");


        item.className =
            "page-item";


        if (disabled) {
            item.classList.add("disabled");
        }


        if (active) {
            item.classList.add("active");
        }


        const link =
            document.createElement("button");


        link.type = "button";

        link.className =
            "page-link";

        link.textContent =
            label;


        if (disabled || active) {

            link.disabled = true;

        } else {

            link.addEventListener(
                "click",
                () => loadIncidents(page)
            );

        }


        item.appendChild(link);

        return item;
    }


    // PRECEDENTE

    pagination.appendChild(
        createPageItem(
            "‹",
            currentPage - 1,
            {
                disabled:
                    currentPage === 1
            }
        )
    );


    const pages = [];


    pages.push(1);


    if (currentPage > 4) {
        pages.push("...");
    }


    const startPage =
        Math.max(
            2,
            currentPage - 2
        );


    const endPage =
        Math.min(
            totalPages - 1,
            currentPage + 2
        );


    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        pages.push(page);
    }


    if (
        currentPage <
        totalPages - 3
    ) {
        pages.push("...");
    }


    if (totalPages > 1) {
        pages.push(totalPages);
    }


    pages.forEach(page => {

        if (page === "...") {

            const item =
                document.createElement("li");


            item.className =
                "page-item disabled";


            const link =
                document.createElement("span");


            link.className =
                "page-link";


            link.textContent =
                "...";


            item.appendChild(link);

            pagination.appendChild(
                item
            );

            return;
        }


        pagination.appendChild(
            createPageItem(
                page,
                page,
                {
                    active:
                        page === currentPage
                }
            )
        );

    });


    // SUCCESSIVA

    pagination.appendChild(
        createPageItem(
            "›",
            currentPage + 1,
            {
                disabled:
                    currentPage === totalPages
            }
        )
    );


    container.appendChild(
        pagination
    );
}