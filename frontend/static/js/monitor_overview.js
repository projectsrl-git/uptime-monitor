document.addEventListener("DOMContentLoaded", () => {

    let currentPeriod = "24h";

    loadStatistics(currentPeriod);


    document.querySelectorAll(".statistics-period").forEach(button => {

        button.addEventListener("click", () => {

            const period = button.dataset.period;

            currentPeriod = period;

            updatePeriodButtons(button);

            loadStatistics(period);

        });

    });


    async function loadStatistics(period) {

        try {

            const response = await fetch(
                `/api/monitors/${monitorId}/statistics/?period=${period}`
            );

            if (!response.ok) {
                throw new Error(
                    `Errore API: ${response.status}`
                );
            }

            const data = await response.json();

            updateSummary(data.summary);
            updateResponseTime(data.response_time);

        } catch (error) {

            console.error(
                "Errore caricamento statistiche:",
                error
            );

        }
    }


    function updateSummary(summary) {

        document.getElementById(
            "uptime-percentage"
        ).textContent =
            summary.uptime_percentage !== null
                ? `${summary.uptime_percentage}%`
                : "-";


        document.getElementById(
            "downtime"
        ).textContent =
            formatDowntime(summary.downtime_seconds);


        document.getElementById(
            "checks"
        ).textContent =
            summary.checks;


        document.getElementById(
            "incidents"
        ).textContent =
            summary.incidents;
    }


    function updateResponseTime(responseTime) {

        document.getElementById(
            "response-time-min"
        ).textContent =
            formatMilliseconds(responseTime.min_ms);


        document.getElementById(
            "response-time-average"
        ).textContent =
            formatMilliseconds(responseTime.average_ms);


        document.getElementById(
            "response-time-max"
        ).textContent =
            formatMilliseconds(responseTime.max_ms);
    }


    function formatMilliseconds(value) {

        if (value === null || value === undefined) {
            return "-";
        }

        return `${value} ms`;
    }


    function formatDowntime(seconds) {

        if (seconds === null || seconds === undefined) {
            return "-";
        }

        if (seconds === 0) {
            return "0 secondi";
        }

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];

        if (days > 0) {
            parts.push(`${days}g`);
        }

        if (hours > 0) {
            parts.push(`${hours}h`);
        }

        if (minutes > 0) {
            parts.push(`${minutes}m`);
        }

        if (remainingSeconds > 0) {
            parts.push(`${remainingSeconds}s`);
        }

        return parts.join(" ");
    }

    function updatePeriodButtons(activeButton) {

        document.querySelectorAll(".statistics-period").forEach(button => {

            button.classList.remove("btn-primary");
            button.classList.add("btn-outline-primary");

        });

        activeButton.classList.remove("btn-outline-primary");
        activeButton.classList.add("btn-primary");
    }

});