document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("[data-date]").forEach(element => {

        const date = element.dataset.date;

        element.textContent = formatDate(date);

    });


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