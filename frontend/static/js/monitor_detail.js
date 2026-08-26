document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("[data-date]").forEach(element => {

        const date = element.dataset.date;

        element.textContent = formatDate(date);

    });


    // duplica
    const duplicateButton = document.getElementById(
        "duplicate-monitor-btn"
    );

    if (duplicateButton) {

        duplicateButton.addEventListener("click", async () => {

            const monitorId = duplicateButton.dataset.monitorId;

            const confirmed = confirm(
                "Vuoi duplicare questo monitor?"
            );

            if (!confirmed) {
                return;
            }

            const response = await fetch(
                `/api/monitors/${monitorId}/duplicate/`,
                {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                }
            );

            if (response.ok) {
                window.location.href = duplicateButton.dataset.successUrl;
                return;
            }

            alert("Errore durante la duplicazione del monitor.");
        });
    }


    // disattiva
    const deactivateButton = document.getElementById(
        "deactivate-monitor-btn"
    );

    if (deactivateButton) {

        deactivateButton.addEventListener("click", async () => {

            const monitorId = deactivateButton.dataset.monitorId;

            const confirmed = confirm(
                "Sei sicuro di voler disattivare questo monitor?"
            );

            if (!confirmed) {
                return;
            }

            const response = await fetch(
                `/api/monitors/${monitorId}/`,
                {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                }
            );

            if (response.ok) {
                window.location.reload();
                return;
            }

            alert("Errore durante la disattivazione del monitor.");
        });
    }


    // attiva
    const activateButton = document.getElementById(
        "activate-monitor-btn"
    );

    if (activateButton) {

        activateButton.addEventListener("click", async () => {

            const monitorId = activateButton.dataset.monitorId;

            const confirmed = confirm(
                "Vuoi riattivare questo monitor?"
            );

            if (!confirmed) {
                return;
            }

            const response = await fetch(
                `/api/monitors/${monitorId}/activate/`,
                {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                }
            );

            if (response.ok) {
                window.location.reload();
                return;
            }

            alert("Errore durante la riattivazione del monitor.");
        });
    }

    // schede
    const overviewTab = document.getElementById(
        "overview-tab"
    );

    const configurationTab = document.getElementById(
        "configuration-tab"
    );

    const overviewContent = document.getElementById(
        "overview-content"
    );

    const configurationContent = document.getElementById(
        "configuration-content"
    );


    if (
        overviewTab &&
        configurationTab &&
        overviewContent &&
        configurationContent
    ) {

        overviewTab.addEventListener("click", () => {

            overviewContent.classList.remove("d-none");
            configurationContent.classList.add("d-none");

            overviewTab.classList.remove("btn-outline-primary");
            overviewTab.classList.add("btn-primary");

            configurationTab.classList.remove("btn-primary");
            configurationTab.classList.add("btn-outline-primary");

        });


        configurationTab.addEventListener("click", () => {

            configurationContent.classList.remove("d-none");
            overviewContent.classList.add("d-none");

            configurationTab.classList.remove("btn-outline-primary");
            configurationTab.classList.add("btn-primary");

            overviewTab.classList.remove("btn-primary");
            overviewTab.classList.add("btn-outline-primary");

        });

    }

});


function formatDate(date) {

    return new Date(date).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "medium"
    });

}


function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {

            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}