let currentPage = 1;

let dateFrom = "";
let dateTo = "";

document.addEventListener("DOMContentLoaded", () => {

    const orderingSelect =
        document.getElementById("ordering-check");

    const successFilter =
        document.getElementById("success-filter");

    const fromDate =
        document.getElementById("from-date");

    const toDate =
        document.getElementById("to-date");

    const applyDateFilter =
        document.getElementById("apply-date-filter");

    const clearDateFilter =
        document.getElementById("clear-date-filter");


    orderingSelect.addEventListener(
        "change",
        () => {
            loadChecks(1);
        }
    );


    successFilter.addEventListener(
        "change",
        () => {
            loadChecks(1);
        }
    );


    applyDateFilter.addEventListener(
        "click",
        () => {

            dateFrom = fromDate.value;
            dateTo = toDate.value;

            loadChecks(1);
        }
    );


    clearDateFilter.addEventListener(
        "click",
        () => {

            fromDate.value = "";
            toDate.value = "";

            dateFrom = "";
            dateTo = "";

            loadChecks(1);
        }
    );


    loadChecks(1);

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


async function loadChecks(page = 1) {

    currentPage = page;

    const tableBody =
        document.getElementById(
            "check-table-body"
        );

    const ordering =
        document.getElementById(
            "ordering-check"
        ).value;

    const success =
        document.getElementById(
            "success-filter"
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

    if (dateFrom) {

        params.set(
            "from",
            dateFrom
        );

    }

    if (dateTo) {

        params.set(
            "to",
            dateTo
        );

    }


    if (ordering) {

        params.set(
            "ordering",
            ordering
        );

    }


    if (success) {

        params.set(
            "success",
            success
        );

    }


    try {

        const data = await apiFetch(
            `/api/monitors/${monitorId}/checks/?${params}`
        );


        renderChecks(
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
                    Errore durante il caricamento dei check
                </td>
            </tr>
        `;

    }
}


function renderChecks(checks) {

    const tableBody =
        document.getElementById(
            "check-table-body"
        );

    tableBody.innerHTML = "";


    if (checks.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-4 text-muted">
                    Nessun check trovato
                </td>
            </tr>
        `;

        return;
    }


    const fragment =
        document.createDocumentFragment();


    checks.forEach(check => {

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


        if (check.success) {

            statusBadge.classList.add(
                "bg-success"
            );

            statusBadge.textContent =
                "RIUSCITO";

        } else {

            statusBadge.classList.add(
                "bg-danger"
            );

            statusBadge.textContent =
                "FALLITO";
        }


        statusCell.appendChild(
            statusBadge
        );


        // ==========================
        // DATA / ORA
        // ==========================

        const dateCell =
            document.createElement("td");

        dateCell.textContent =
            formatDate(
                check.executed_at
            );


        // ==========================
        // STATUS CODE
        // ==========================

        const statusCodeCell =
            document.createElement("td");

        statusCodeCell.textContent =
            check.status_code !== null
                ? check.status_code
                : "-";


        // ==========================
        // RESPONSE TIME
        // ==========================

        const responseCell =
            document.createElement("td");

        responseCell.textContent =
            check.response_time_ms !== null
                ? `${check.response_time_ms} ms`
                : "-";


        // ==========================
        // ERRORE
        // ==========================

        const errorCell =
            document.createElement("td");

        errorCell.className =
            "check-error-cell";

        if (check.error_message) {

            errorCell.textContent =
                check.error_message;

            errorCell.title =
                check.error_message;

            errorCell.classList.add(
                "text-danger"
            );

        } else {

            errorCell.textContent =
                "-";
        }


        row.appendChild(statusCell);
        row.appendChild(dateCell);
        row.appendChild(statusCodeCell);
        row.appendChild(responseCell);
        row.appendChild(errorCell);

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
                () => loadChecks(page)
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


    if (currentPage < totalPages - 3) {
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