document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("[data-date]").forEach(element => {

        const date = element.dataset.date;

        element.textContent = formatDate(date);

    });

});


function formatDate(date) {

    return new Date(date).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "medium"
    });

}