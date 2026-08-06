document.addEventListener("DOMContentLoaded", () => {
    loadIncidents();
});

const searchInput = document.getElementById("search-incident");
const orderingSelect = document.getElementById("ordering-incident");
const statusFilter = document.getElementById("status-filter");

searchInput.addEventListener("input", () => {
    loadIncidents();
});

orderingSelect.addEventListener("change", () => {
    loadIncidents();
});

statusFilter.addEventListener("change", () => {
    loadIncidents();
});


async function loadIncidents(page = 1) {

    const params = new URLSearchParams();

    params.set("page", page);

    if (searchInput.value.trim()) {
        params.set("search", searchInput.value.trim());
    }

    if (orderingSelect.value) {
        params.set("ordering", orderingSelect.value);
    }

    if (statusFilter.value) {
        params.set("status", statusFilter.value);
    }

    const response = await fetch(`/api/incidents/?${params}`);
    const data = await response.json();

    const tbody = document.getElementById("incident-table-body");
    tbody.innerHTML = "";

    data.results.forEach(incident => {

        const started = formatDate(incident.started_at);
        const ended = incident.is_active
            ? "In corso"
            : formatDate(incident.ended_at);

        const duration = incident.is_active
            ? formatDuration(null, incident.started_at)
            : formatDuration(incident.duration_seconds);

        const status = incident.is_active
            ? `<span class="badge rounded-pill bg-danger">ATTIVO</span>`
            : `<span class="badge rounded-pill bg-success">RISOLTO</span>`;

        tbody.innerHTML += `
        <tr>

            <td>
                ${status}
            </td>

            <td class="fw-semibold">
                ${incident.monitor_name}
            </td>

            <td>
                <span class="badge text-bg-secondary">
                    ${formatRootCause(incident.root_cause)}
                </span>
            </td>

            <td class="text-muted">
                ${started}
            </td>

            <td class="text-muted">
                ${ended}
            </td>

            <td class="fw-semibold">
                ${duration}
            </td>

        </tr>
        `;
    });

    renderPagination(data);
}

function formatDate(date) {

    return new Date(date).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "medium"
    });

}

function formatRootCause(cause) {

    return cause
        .replaceAll("_", " ")
        .replace(/\b\w/g, c => c.toUpperCase());

}

function formatDuration(seconds, startedAt) {

    if (seconds == null && startedAt) {
        seconds = Math.floor(
            (Date.now() - new Date(startedAt).getTime()) / 1000
        );
    }

    if (seconds == null) {
        return "-";
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];

    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (secs && parts.length < 2) parts.push(`${secs}s`);

    return parts.join(" ") || "0s";
}

function renderPagination(data) {

    const pagination = document.getElementById("pagination");

    let html = `
    <ul class="pagination">
    `;

    html += `
        <li class="page-item ${!data.previous ? "disabled" : ""}">
            <button class="page-link" onclick="loadIncidents(${data.page - 1})">
                &laquo;
            </button>
        </li>
    `;

    for (let i = 1; i <= data.num_pages; i++) {

        html += `
        <li class="page-item ${i === data.page ? "active" : ""}">
            <button class="page-link" onclick="loadIncidents(${i})">
                ${i}
            </button>
        </li>
        `;
    }

    html += `
        <li class="page-item ${!data.next ? "disabled" : ""}">
            <button class="page-link" onclick="loadIncidents(${data.page + 1})">
                &raquo;
            </button>
        </li>
    `;

    html += "</ul>";

    pagination.innerHTML = html;
}