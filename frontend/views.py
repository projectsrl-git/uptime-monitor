from django.shortcuts import render

from monitor.models import Monitor


def home(request):

    monitors = Monitor.objects.all().order_by("name")

    return render(
        request,
        "homepage.html",
        {
            "monitors": monitors,
        },
    )
