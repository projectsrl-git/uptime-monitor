document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("[data-date]").forEach(element => {

        const date = element.dataset.date;

        element.textContent = formatDate(date);

    });

    const durationElement = document.getElementById("incident-duration");

    if (durationElement) {

        const seconds = durationElement.dataset.duration;
        const startedAt = durationElement.dataset.started;

        durationElement.textContent = formatDuration(
            seconds ? Number(seconds) : null,
            startedAt
        );

    }

});


function formatDate(date) {

    return new Date(date).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "medium"
    });

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