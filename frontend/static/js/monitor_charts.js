let currentPeriod = "24h";

let uptimeChart = null;
let responseTimeChart = null;
let checksChart = null;
let incidentsChart = null;


document.addEventListener("DOMContentLoaded", () => {

    loadStatistics(currentPeriod);


    document.querySelectorAll(".statistics-period").forEach(button => {

        button.addEventListener("click", () => {

            currentPeriod = button.dataset.period;

            updatePeriodButtons(button);

            loadStatistics(currentPeriod);

        });

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

        updateUptimeChart(data.uptime);
        updateResponseTimeChart(data.response_time_over_time, data.response_time);
        updateChecksChart(data.checks);
        updateIncidentsChart(data.incidents);

    } catch (error) {

        console.error(
            "Errore caricamento grafici:",
            error
        );

    }
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

                pointRadius: 2,
                pointHoverRadius: 5,

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

                    title: {
                        display: true,
                        text: "Uptime (%)"
                    },

                    ticks: {
                        maxTicksLimit: 11,

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
                        maxTicksLimit: 12,
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


function updateResponseTimeChart(data, responseTime) {

    const canvas = document.getElementById(
        "response-time-chart"
    );

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

    else {
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
            formatDate(
                current.toISOString(),
                currentPeriod
            )
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

            datasets: [

                {
                    label: "Media",
                    data: values,

                    tension: 0.35,

                    pointRadius: 0,
                    pointHoverRadius: 5,

                    borderWidth: 2,

                    spanGaps: false
                },

                {
                    label: "Minimo",
                    data: Array(
                        values.length
                    ).fill(responseTime.min_ms),

                    pointRadius: 0,
                    borderWidth: 1,

                    borderDash: [6, 6],

                    fill: false
                },

                {
                    label: "Massimo",
                    data: Array(
                        values.length
                    ).fill(responseTime.max_ms),

                    pointRadius: 0,
                    borderWidth: 1,

                    borderDash: [6, 6],

                    fill: false
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

            scales: {

                y: {
                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Millisecondi (ms)"
                    },

                    ticks: {
                        maxTicksLimit: 8
                    }
                },

                x: {
                    grid: {
                        display: false
                    },

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
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {

                            if (context.raw === null) {
                                return `${context.dataset.label}: nessun dato`;
                            }

                            return `${context.dataset.label}: ${context.raw} ms`;
                        }
                    }
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

    else {
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

            interaction: {
                intersect: false,
                mode: "index"
            },

            scales: {

                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0,
                        maxTicksLimit: 8
                    },

                    title: {
                        display: true,
                        text: "Numero di check"
                    }
                },

                x: {
                    grid: {
                        display: false
                    },

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
                },

                tooltip: {

                    callbacks: {

                        label: function (context) {

                            if (context.raw === null) {
                                return `${context.dataset.label}: nessun dato`;
                            }

                            return `${context.dataset.label}: ${context.raw}`;
                        }

                    }

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

    if (incidentsChart) {
        incidentsChart.destroy();
    }

    const labels = data.map(item =>
        formatDate(item.date, currentPeriod)
    );

    const values = data.map(item =>
        item.count
    );

    incidentsChart = new Chart(canvas, {

        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Incidenti",
                data: values,

                backgroundColor: "rgba(220, 53, 69, 0.75)",
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
                        precision: 0,
                        maxTicksLimit: 8
                    },

                    title: {
                        display: true,
                        text: "Numero di incidenti"
                    }
                },

                x: {
                    grid: {
                        display: false
                    },

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


function updatePeriodButtons(activeButton) {

    document.querySelectorAll(".statistics-period").forEach(button => {

        button.classList.remove("active");

    });

    activeButton.classList.add("active");
}