document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadMonitors();

        document
            .getElementById("export-button")
            .addEventListener(
                "click",
                exportData
            );

        document
            .getElementById("monitor-search")
            .addEventListener(
                "input",
                renderMonitors
            );
    }
);


const elements = {

    monitorSearch:
        document.getElementById(
            "monitor-search"
        ),

    monitorList:
        document.getElementById(
            "monitor-list"
        ),

    exportPeriod:
        document.getElementById(
            "export-period"
        ),

    includeSummary:
        document.getElementById(
            "include-summary"
        ),

    includeMonitorSheets:
        document.getElementById(
            "include-monitor-sheets"
        ),

    exportButton:
        document.getElementById(
            "export-button"
        ),

    exportError:
        document.getElementById(
            "export-error"
        )
};


let monitors = [];


/*
 * Mantiene gli ID dei monitor selezionati
 * anche quando la lista viene filtrata.
 */
const selectedMonitorIds = new Set();


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

    try {

        monitors = await apiFetch(
            "/api/monitors/"
        );

        renderMonitors();

    } catch (error) {

        console.error(error);

        elements.monitorList.innerHTML =
            '<span class="text-danger">Errore nel caricamento dei monitor.</span>';
    }
}


function renderMonitors() {

    const query =
        elements.monitorSearch
            .value
            .trim()
            .toLowerCase();


    const filteredMonitors =
        monitors.filter(
            monitor => {

                const name =
                    String(
                        monitor.name || ""
                    ).toLowerCase();

                const badges =
                    Array.isArray(
                        monitor.badges
                    )
                        ? monitor.badges
                        : [];

                const badgesText =
                    badges
                        .join(" ")
                        .toLowerCase();

                const matchesSearch =
                    !query
                    ||
                    name.includes(query)
                    ||
                    badgesText.includes(query);

                return matchesSearch
            }
        );


    let html = `
        <div class="form-check mb-2 export-select-all">
            <input
                class="form-check-input"
                type="checkbox"
                id="select-all-monitors"
            >

            <label
                class="form-check-label fw-semibold"
                for="select-all-monitors"
            >
                Tutti i monitor
            </label>
        </div>
    `;


    if (filteredMonitors.length === 0) {

        html += `
            <div class="text-muted small py-2">
                Nessun monitor trovato.
            </div>
        `;

        elements.monitorList.innerHTML = html;

        updateSelectAllState();

        return;
    }


    filteredMonitors.forEach(
        monitor => {

            const monitorId =
                String(monitor.id);

            const isSelected =
                selectedMonitorIds.has(
                    monitorId
                );

            const badges =
                Array.isArray(
                    monitor.badges
                )
                    ? monitor.badges
                    : [];


            let badgesHtml = "";

            if (badges.length > 0) {

                badgesHtml = `
                    <div class="export-monitor-badges">
                        ${badges.map(
                    badge => `
                                <span class="badge rounded-pill text-bg-secondary">
                                    ${badge}
                                </span>
                            `
                ).join("")}
                    </div>
                `;
            }


            html += `
                <div class="export-monitor-row">

                    <div class="form-check">

                        <input
                            class="form-check-input monitor-checkbox"
                            type="checkbox"
                            value="${monitorId}"
                            id="monitor-${monitorId}"
                            ${isSelected ? "checked" : ""}
                        >

                        <label
                            class="form-check-label export-monitor-label"
                            for="monitor-${monitorId}"
                        >
                            <span class="export-monitor-name">
                                ${monitor.name}
                            </span>

                            ${badgesHtml}
                        </label>

                    </div>

                </div>
            `;
        }
    );


    elements.monitorList.innerHTML = html;


    document
        .querySelectorAll(
            ".monitor-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        const id =
                            checkbox.value;

                        if (checkbox.checked) {

                            selectedMonitorIds.add(
                                id
                            );

                        } else {

                            selectedMonitorIds.delete(
                                id
                            );
                        }

                        updateSelectAllState();
                    }
                );
            }
        );


    const selectAll =
        document.getElementById(
            "select-all-monitors"
        );


    selectAll.addEventListener(
        "change",
        () => {

            if (selectAll.checked) {

                /*
                 * "Tutti i monitor" significa davvero
                 * tutti i monitor, non solo quelli visibili
                 * dopo il filtro.
                 */
                monitors.forEach(
                    monitor => {

                        selectedMonitorIds.add(
                            String(monitor.id)
                        );
                    }
                );

            } else {

                monitors.forEach(
                    monitor => {

                        selectedMonitorIds.delete(
                            String(monitor.id)
                        );
                    }
                );
            }

            renderMonitors();
        }
    );


    updateSelectAllState();
}


function updateSelectAllState() {

    const selectAll =
        document.getElementById(
            "select-all-monitors"
        );

    if (!selectAll) {
        return;
    }

    const allSelected =
        monitors.length > 0
        &&
        monitors.every(
            monitor =>
                selectedMonitorIds.has(
                    String(monitor.id)
                )
        );

    selectAll.checked =
        allSelected;
}


async function exportData() {

    hideExportError();


    const selectedMonitors =
        Array.from(
            selectedMonitorIds
        );


    const includeSummary =
        elements.includeSummary.checked;

    const includeMonitorSheets =
        elements.includeMonitorSheets.checked;

    if (
        selectedMonitors.length === 0
        &&
        !includeSummary
    ) {
        showExportError(
            "Seleziona almeno un monitor oppure abilita il riepilogo generale."
        );

        return;
    }

    if (
        !includeSummary
        &&
        !includeMonitorSheets
    ) {
        showExportError(
            "Seleziona almeno un contenuto da esportare."
        );

        return;
    }


    const params =
        new URLSearchParams();


    params.set(
        "monitor_ids",
        selectedMonitors.join(",")
    );


    params.set(
        "period",
        elements.exportPeriod.value
    );


    params.set(
        "include_summary",
        includeSummary
            ? "true"
            : "false"
    );

    params.set(
        "include_monitor_sheets",
        includeMonitorSheets
            ? "true"
            : "false"
    );


    const originalText =
        elements.exportButton.textContent;


    elements.exportButton.disabled =
        true;

    elements.exportButton.textContent =
        "Esportazione...";


    try {

        const response =
            await fetch(
                `/api/statistics/export/?${params.toString()}`
            );


        if (!response.ok) {

            let message =
                "Errore durante l'esportazione.";


            try {

                const data =
                    await response.json();


                if (data.detail) {
                    message =
                        data.detail;
                }

                if (data.export) {
                    message =
                        data.export;
                }

            } catch (error) {

                console.error(error);
            }


            throw new Error(
                message
            );
        }


        const blob =
            await response.blob();


        const url =
            window.URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            "monitor-statistics.xlsx";


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();


        window.URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(error);

        showExportError(
            error.message
        );


    } finally {

        elements.exportButton.disabled =
            false;

        elements.exportButton.textContent =
            originalText;
    }
}


function showExportError(message) {

    elements.exportError.textContent =
        message;

    elements.exportError.classList.remove(
        "d-none"
    );
}


function hideExportError() {

    elements.exportError.textContent =
        "";

    elements.exportError.classList.add(
        "d-none"
    );
}