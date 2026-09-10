document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("monitor-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const data = buildMonitorData(form);

        const monitorId = form.dataset.monitorId;

        let url = form.dataset.apiUrl;
        let method = "POST";

        if (monitorId) {
            url = `${url}${monitorId}/`;
            method = "PATCH";
        }

        const response = await fetch(
            url,
            {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify(data),
            }
        );

        if (response.ok) {
            window.location.href = form.dataset.successUrl;
            return;
        }

        const result = await response.json();

        showErrors(result);
    });

});


function buildMonitorData(form) {

    const formData = new FormData(form);

    return {
        name: formData.get("name"),
        url: formData.get("url"),

        check_interval_seconds: Number(
            formData.get("check_interval_seconds")
        ),

        timeout_seconds: Number(
            formData.get("timeout_seconds")
        ),

        is_active: formData.get("is_active") === "on",

        badges: formData.get("badges")
            .split(",")
            .map(badge => badge.trim())
            .filter(Boolean),

        http_method: formData.get("http_method"),

        follow_redirects:
            formData.get("follow_redirects") === "true",

        ip_version: formData.get("ip_version"),

        accepted_status_codes:
            formData.get("accepted_status_codes")
                .split(",")
                .map(code => code.trim())
                .filter(Boolean),

        request_headers:
            parseHeaders(formData.get("request_headers")),

        request_body:
            formData.get("request_body") || null,

        send_body_as_json:
            formData.get("send_body_as_json") === "on",

        auth_type:
            formData.get("auth_type"),

        auth_username:
            formData.get("auth_username") || "",

        auth_password:
            formData.get("auth_password") || "",

        consecutive_failures_threshold:
            Number(
                formData.get("consecutive_failures_threshold")
            ),

        slow_response_threshold_ms:
            formData.get("slow_response_threshold_ms")
                ? Number(formData.get("slow_response_threshold_ms"))
                : null,
    };
}


function parseHeaders(value) {

    if (!value || !value.trim()) {
        return {};
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
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


function showErrors(errors) {

    console.error(errors);

    alert("Controlla i dati inseriti.");
}