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

            updateUptimeChart(data.uptime);
            updateResponseTimeChart(data.response_time_over_time);
            updateChecksChart(data.checks);
            updateIncidentsChart(data.incidents);

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
            formatMilliseconds(Math.round(responseTime.average_ms));


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
            formatDate(item.date, currentPeriod)
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
                            label: "Uptime",
                            data: values,

                            tension: 0.3,

                            pointRadius: 2,
                            pointHoverRadius: 5,

                            spanGaps: false
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {

                                    const value = context.raw;

                                    if (value === null) {
                                        return "Uptime: nessun dato";
                                    }

                                    return `Uptime: ${value.toFixed(2)}%`;
                                }
                            }
                        },

                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        y: {
                            title: {
                                display: true,
                                text: "Percentuale (%)",
                            },
                            min: 0,
                            max: 100,
                        },

                        x: {
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 12,
                                maxRotation: 0
                            }
                        }
                    }
                }
            }
        );
    }


    function updateResponseTimeChart(data) {

        const canvas = document.getElementById("response-time-chart");

        if (!canvas) {
            return;
        }

        const now = new Date();
        const start = new Date(now);

        if (currentPeriod === "24h") {
            start.setHours(start.getHours() - 24);
        }

        else if (currentPeriod === "7d") {
            start.setDate(start.getDate() - 7);
        }

        else if (currentPeriod === "30d") {
            start.setDate(start.getDate() - 30);
        }

        else if (currentPeriod === "365d") {
            start.setDate(start.getDate() - 365);
        }

        let bucketMilliseconds;

        if (currentPeriod === "24h") {
            bucketMilliseconds = 60 * 60 * 1000;
        }

        else if (currentPeriod === "7d") {
            bucketMilliseconds = 6 * 60 * 60 * 1000;
        }

        else if (currentPeriod === "30d") {
            bucketMilliseconds = 24 * 60 * 60 * 1000;
        }

        else {
            bucketMilliseconds = 7 * 24 * 60 * 60 * 1000;
        }

        const labels = [];
        const values = [];

        let current = new Date(start);

        while (current < now) {

            const bucketEnd = new Date(
                current.getTime() + bucketMilliseconds
            );

            const item = data.find(item => {

                const itemDate = new Date(item.date);

                return (
                    itemDate >= current &&
                    itemDate < bucketEnd
                );
            });

            labels.push(
                formatDate(current.toISOString(), currentPeriod)
            );

            values.push(
                item ? item.average_ms : null
            );

            current = bucketEnd;
        }

        if (responseTimeChart) {
            responseTimeChart.destroy();
        }

        responseTimeChart = new Chart(canvas, {
            type: "line",

            data: {
                labels: labels,

                datasets: [{
                    label: "Response time",
                    data: values,
                    tension: 0.3,
                    fill: false,
                    spanGaps: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,

                        title: {
                            display: true,
                            text: "Millisecondi (ms)"
                        }
                    },
                    
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }


    function updateChecksChart(data) {

        const canvas = document.getElementById("checks-chart");

        if (!canvas) {
            return;
        }

        const now = new Date();
        const start = new Date(now);

        if (currentPeriod === "24h") {
            start.setHours(start.getHours() - 24);
        }

        else if (currentPeriod === "7d") {
            start.setDate(start.getDate() - 7);
        }

        else if (currentPeriod === "30d") {
            start.setDate(start.getDate() - 30);
        }

        else if (currentPeriod === "365d") {
            start.setDate(start.getDate() - 365);
        }

        let bucketMilliseconds;

        if (currentPeriod === "24h") {
            bucketMilliseconds = 60 * 60 * 1000;
        }

        else if (currentPeriod === "7d") {
            bucketMilliseconds = 6 * 60 * 60 * 1000;
        }

        else if (currentPeriod === "30d") {
            bucketMilliseconds = 24 * 60 * 60 * 1000;
        }

        else {
            bucketMilliseconds = 7 * 24 * 60 * 60 * 1000;
        }

        const labels = [];
        const successfulValues = [];
        const failedValues = [];

        let current = new Date(start);

        while (current < now) {

            const bucketEnd = new Date(
                current.getTime() + bucketMilliseconds
            );

            const item = data.find(item => {

                const itemDate = new Date(item.date);

                return (
                    itemDate >= current &&
                    itemDate < bucketEnd
                );
            });

            labels.push(
                formatDate(
                    current.toISOString(),
                    currentPeriod
                )
            );

            successfulValues.push(
                item ? item.successful : null
            );

            failedValues.push(
                item ? item.failed : null
            );

            current = bucketEnd;
        }

        if (checksChart) {
            checksChart.destroy();
        }

        checksChart = new Chart(canvas, {
            type: "bar",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Riusciti",
                        data: successfulValues
                    },
                    {
                        label: "Falliti",
                        data: failedValues
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        },

                        title: {
                            display: true,
                            text: "Check"
                        }
                    },

                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }


    function updateIncidentsChart(data) {

        const canvas = document.getElementById("incidents-chart");

        if (!canvas) {
            return;
        }

        const now = new Date();
        const start = new Date(now);

        if (currentPeriod === "24h") {
            start.setHours(start.getHours() - 24);
        }

        else if (currentPeriod === "7d") {
            start.setDate(start.getDate() - 7);
        }

        else if (currentPeriod === "30d") {
            start.setDate(start.getDate() - 30);
        }

        else if (currentPeriod === "365d") {
            start.setDate(start.getDate() - 365);
        }

        let bucketMilliseconds;

        if (currentPeriod === "24h") {
            bucketMilliseconds = 60 * 60 * 1000;
        }

        else if (currentPeriod === "7d") {
            bucketMilliseconds = 6 * 60 * 60 * 1000;
        }

        else if (currentPeriod === "30d") {
            bucketMilliseconds = 24 * 60 * 60 * 1000;
        }

        else {
            bucketMilliseconds = 7 * 24 * 60 * 60 * 1000;
        }

        const labels = [];
        const values = [];

        let current = new Date(start);

        while (current < now) {

            const bucketEnd = new Date(
                current.getTime() + bucketMilliseconds
            );

            let count = 0;

            data.forEach(item => {

                const itemDate = new Date(item.date);

                if (
                    itemDate >= current &&
                    itemDate < bucketEnd
                ) {
                    count += item.count;
                }
            });

            labels.push(
                formatDate(
                    current.toISOString(),
                    currentPeriod
                )
            );

            values.push(count);

            current = bucketEnd;
        }

        if (incidentsChart) {
            incidentsChart.destroy();
        }

        incidentsChart = new Chart(canvas, {
            type: "bar",

            data: {
                labels: labels,

                datasets: [{
                    label: "Incidenti",
                    data: values,

                    backgroundColor: "rgba(220, 53, 69, 0.7)",
                    borderColor: "rgba(220, 53, 69, 1)",
                    borderWidth: 1
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        },

                        title: {
                            display: true,
                            text: "Incidenti"
                        }
                    },

                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }


    function formatDate(dateString, period) {

        const date = new Date(dateString);

        if (period === "24h") {

            return date.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit"
            });

        }

        if (period === "7d" || period === "30d") {

            return date.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short"
            });

        }

        if (period === "365d") {

            return date.toLocaleDateString("it-IT", {
                month: "short",
                year: "numeric"
            });

        }

        return date.toLocaleDateString("it-IT");
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