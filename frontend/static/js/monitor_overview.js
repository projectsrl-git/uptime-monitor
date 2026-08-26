document.addEventListener("DOMContentLoaded", () => {

    let currentPeriod = "24h";

    let uptimeChart = null;
    let responseTimeChart = null;
    let checksChart = null;
    let incidentsChart = null;

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

            updateCharts(data);

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


    function updateCharts(data) {

        updateUptimeChart(data.uptime);

        updateResponseTimeChart(data.response_time_over_time);

        updateChecksChart(data.checks);

        updateIncidentsChart(data.incidents);
    }


    function updateUptimeChart(data) {

        const labels = data.map(item =>
            formatDate(item.date)
        );

        const values = data.map(item =>
            item.uptime_percentage
        );

        if (uptimeChart) {
            uptimeChart.destroy();
        }

        uptimeChart = new Chart(
            document.getElementById("uptime-chart"),
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label: "Uptime %",
                            data: values,
                            tension: 0.3,
                            spanGaps: false
                        }
                    ]
                },

                options: {
                    responsive: true,

                    scales: {
                        y: {
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
        );
    }


    function updateResponseTimeChart(data) {

        const labels = data.map(item =>
            formatDate(item.date)
        );

        const values = data.map(item =>
            item.average_ms
        );

        if (responseTimeChart) {
            responseTimeChart.destroy();
        }

        responseTimeChart = new Chart(
            document.getElementById("response-time-chart"),
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label: "Response time (ms)",
                            data: values,
                            tension: 0.3,
                            spanGaps: false
                        }
                    ]
                },

                options: {
                    responsive: true
                }
            }
        );
    }


    function updateChecksChart(data) {

        const labels = data.map(item =>
            formatDate(item.date)
        );

        const successful = data.map(item =>
            item.successful
        );

        const failed = data.map(item =>
            item.failed
        );

        if (checksChart) {
            checksChart.destroy();
        }

        checksChart = new Chart(
            document.getElementById("checks-chart"),
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label: "Success",
                            data: successful
                        },
                        {
                            label: "Falliti",
                            data: failed
                        }
                    ]
                },

                options: {
                    responsive: true
                }
            }
        );
    }


    function updateIncidentsChart(data) {

        const labels = data.map(item =>
            formatDate(item.date)
        );

        const values = data.map(item =>
            item.count
        );

        if (incidentsChart) {
            incidentsChart.destroy();
        }

        incidentsChart = new Chart(
            document.getElementById("incidents-chart"),
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label: "Incidenti",
                            data: values
                        }
                    ]
                },

                options: {
                    responsive: true,

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }


    function formatDate(date) {

        const value = new Date(date);

        return value.toLocaleString(
            "it-IT",
            {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
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

            button.classList.remove("active");

        });

        activeButton.classList.add("active");
    }

});