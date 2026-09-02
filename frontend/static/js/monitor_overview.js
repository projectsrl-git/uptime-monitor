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

        const canvas = document.getElementById("uptime-chart");

        if (!canvas) {
            return;
        }

        const labels = data.map(item =>
            formatDate(item.date, currentPeriod)
        );

        const values = data.map(item =>
            item.uptime_percentage
        );

        if (uptimeChart) {
            uptimeChart.destroy();
        }

        uptimeChart = new Chart(canvas, {
            type: "line",

            data: {
                labels: labels,

                datasets: [{
                    label: "Uptime",
                    data: values,

                    tension: 0.35,

                    fill: true,

                    pointRadius: 0,
                    pointHoverRadius: 4,

                    borderWidth: 2,

                    spanGaps: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                scales: {

                    y: {
                        min: 0,
                        max: 100,

                        ticks: {
                            maxTicksLimit: 5,

                            callback: function (value) {
                                return `${value}%`;
                            }
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        },

                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 6,
                            maxRotation: 0
                        }
                    }

                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                if (context.raw === null) {
                                    return "Uptime: nessun dato";
                                }

                                return `Uptime: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }

                }
            }
        });
    }


    function updateResponseTimeChart(data) {

        const canvas =
            document.getElementById(
                "response-time-chart"
            );

        if (!canvas) {
            return;
        }

        const labels = data.map(item =>
            formatDate(
                item.date,
                currentPeriod
            )
        );

        const values = data.map(item =>
            item.average_ms
        );


        if (responseTimeChart) {
            responseTimeChart.destroy();
        }


        responseTimeChart = new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [{
                        label: "Response time",
                        data: values,

                        tension: 0.35,

                        pointRadius: 0,
                        pointHoverRadius: 4,

                        borderWidth: 2,

                        fill: false,

                        spanGaps: false
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    scales: {

                        y: {
                            beginAtZero: true,

                            ticks: {
                                maxTicksLimit: 5
                            },

                            title: {
                                display: true,
                                text: "Millisecondi (ms)"
                            }
                        },

                        x: {
                            grid: {
                                display: false
                            },

                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 6,
                                maxRotation: 0
                            }
                        }
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function (context) {

                                    if (
                                        context.raw === null
                                    ) {
                                        return "Response time: nessun dato";
                                    }

                                    return (
                                        `Response time: ${context.raw} ms`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
    }


    function updateChecksChart(data) {

        const canvas =
            document.getElementById(
                "checks-chart"
            );

        if (!canvas) {
            return;
        }


        const labels = data.map(item =>
            formatDate(
                item.date,
                currentPeriod
            )
        );


        const successfulValues = data.map(item =>
            item.successful
        );


        const failedValues = data.map(item =>
            item.failed
        );


        if (checksChart) {
            checksChart.destroy();
        }


        checksChart = new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [

                        {
                            label: "Riusciti",

                            data: successfulValues,

                            borderWidth: 0,

                            barPercentage: 0.7,
                            categoryPercentage: 0.8
                        },

                        {
                            label: "Falliti",

                            data: failedValues,

                            borderWidth: 0,

                            barPercentage: 0.7,
                            categoryPercentage: 0.8
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
                                maxTicksLimit: 5,
                                precision: 0
                            },

                            title: {
                                display: true,
                                text: "Check"
                            }
                        },

                        x: {
                            grid: {
                                display: false
                            },

                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 6,
                                maxRotation: 0
                            }
                        }

                    },

                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {

                            callbacks: {

                                label: function (context) {

                                    return (
                                        `${context.dataset.label}: ${context.raw}`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        );
    }


    function updateIncidentsChart(data) {

        const canvas =
            document.getElementById(
                "incidents-chart"
            );

        if (!canvas) {
            return;
        }


        const labels = data.map(item =>
            formatDate(
                item.date,
                currentPeriod
            )
        );


        const values = data.map(item =>
            item.count
        );


        if (incidentsChart) {
            incidentsChart.destroy();
        }


        incidentsChart = new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [{
                        label: "Incidenti",

                        data: values,

                        backgroundColor:
                            "rgba(220, 53, 69, 0.7)",

                        borderColor:
                            "rgba(220, 53, 69, 1)",

                        borderWidth: 0,

                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    scales: {

                        y: {
                            beginAtZero: true,

                            ticks: {
                                maxTicksLimit: 5,
                                precision: 0
                            },

                            title: {
                                display: true,
                                text: "Incidenti"
                            }
                        },

                        x: {
                            grid: {
                                display: false
                            },

                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 6,
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
            }
        );
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

        return `${value}ms`;
    }


    function formatDowntime(seconds) {

        if (seconds === null || seconds === undefined) {
            return "-";
        }

        if (seconds === 0) {
            return "0s";
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