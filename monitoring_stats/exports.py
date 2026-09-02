from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from django.db.models import Avg
from django.utils import timezone

from check.models import Check

from io import BytesIO

from .services import (
    PERIODS,
    get_monitor_statistics,
)


def make_sheet_name(monitor):
    name = str(monitor.name).strip()

    sheet_name = f"M{monitor.id} - {name}"

    return sheet_name[:31]


def make_unique_sheet_name(workbook, monitor):
    base = make_sheet_name(monitor)
    name = base

    counter = 2

    while name in workbook.sheetnames:

        suffix = f" ({counter})"

        name = f"{base[:31 - len(suffix)]}" f"{suffix}"

        counter += 1

    return name


def format_datetime(value):
    if value is None:
        return None

    return timezone.localtime(value).replace(tzinfo=None)


def style_header(sheet, row=1):
    for cell in sheet[row]:

        cell.fill = PatternFill(
            fill_type="solid",
            fgColor="343A40",
        )

        cell.font = Font(
            bold=True,
            color="FFFFFF",
        )

        cell.alignment = Alignment(
            horizontal="center",
            vertical="center",
        )


def build_statistics_workbook(
    monitors,
    period,
    include_summary=True,
    include_monitor_sheets=True,
):
    workbook = Workbook()

    # Elimina il foglio creato automaticamente.
    default_sheet = workbook.active

    if default_sheet is not None:
        workbook.remove(default_sheet)

    now = timezone.now()

    monitor_data = []

    for monitor in monitors:

        statistics = get_monitor_statistics(
            monitor,
            period,
            now,
        )

        monitor_data.append(
            {
                "monitor": monitor,
                "statistics": statistics,
            }
        )

    # ==================================================
    # RIEPILOGO
    # ==================================================

    if include_summary:

        summary = workbook.create_sheet("Riepilogo")

        headers = [
            "Monitor",
            "Status",
            "Uptime",
            "Response medio (ms)",
            "Checks",
            "Checks OK",
            "Checks KO",
            "Incidenti",
            "Downtime (s)",
        ]

        summary.append(headers)

        style_header(summary)

        uptime_values = []

        checks_total = 0
        successful_total = 0
        failed_total = 0
        incidents_total = 0
        downtime_total = 0

        for item in monitor_data:

            monitor = item["monitor"]
            statistics = item["statistics"]

            summary_data = statistics["summary"]

            response_data = statistics["response_time"]

            uptime = summary_data["uptime_percentage"]

            if uptime is not None:
                uptime_values.append(uptime)

            checks_total += summary_data["checks"]

            successful_total += summary_data["successful_checks"]

            failed_total += summary_data["failed_checks"]

            incidents_total += summary_data["incidents"]

            downtime_total += summary_data["downtime_seconds"]

            summary.append(
                [
                    monitor.name,
                    getattr(
                        monitor,
                        "status",
                        "",
                    ),
                    uptime,
                    response_data["average_ms"],
                    summary_data["checks"],
                    summary_data["successful_checks"],
                    summary_data["failed_checks"],
                    summary_data["incidents"],
                    summary_data["downtime_seconds"],
                ]
            )

        # Media generali sui monitor selezionati.
        if uptime_values:
            average_uptime = round(
                sum(uptime_values) / len(uptime_values),
                2,
            )
        else:
            average_uptime = None

        selected_monitor_ids = [item["monitor"].id for item in monitor_data]

        period_start = now - PERIODS[period]

        selected_checks = Check.objects.filter(
            monitor_id__in=selected_monitor_ids,
            executed_at__gte=period_start,
            executed_at__lte=now,
        )

        selected_response_average = selected_checks.aggregate(
            average=Avg("response_time_ms")
        )["average"]

        if selected_response_average is not None:
            selected_response_average = round(
                selected_response_average,
                2,
            )

        total_row = len(monitor_data) + 2

        summary.append(
            [
                "Totale / Media",
                "",
                average_uptime,
                selected_response_average,
                checks_total,
                successful_total,
                failed_total,
                incidents_total,
                downtime_total,
            ]
        )

        for cell in summary[total_row]:

            cell.fill = PatternFill(
                fill_type="solid",
                fgColor="2B3035",
            )

            cell.font = Font(
                bold=True,
            )

        summary.freeze_panes = "A2"

        summary.auto_filter.ref = f"A1:I{total_row - 1}"

        widths = {
            "A": 32,
            "B": 15,
            "C": 15,
            "D": 20,
            "E": 12,
            "F": 12,
            "G": 12,
            "H": 12,
            "I": 18,
        }

        for column, width in widths.items():
            summary.column_dimensions[column].width = width

    # ==================================================
    # SCHEDA SINGOLO MONITOR
    # ==================================================

    if include_monitor_sheets:

        for item in monitor_data:

            monitor = item["monitor"]
            statistics = item["statistics"]

            sheet_name = make_unique_sheet_name(
                workbook,
                monitor,
            )

            sheet = workbook.create_sheet(sheet_name)

            headers = [
                "Data/ora",
                "Uptime",
                "Response medio (ms)",
                "Checks OK",
                "Checks KO",
                "Incidenti",
                "Downtime (s)",
            ]

            sheet.append(headers)

            style_header(sheet)

            response_data = {
                item["date"]: item["average_ms"]
                for item in statistics["response_time_over_time"]
            }

            checks_data = {item["date"]: item for item in statistics["checks"]}

            incidents_data = {item["date"]: item for item in statistics["incidents"]}

            rows = []

            for uptime_item in statistics["uptime"]:

                date = uptime_item["date"]

                check_item = checks_data.get(
                    date,
                    {
                        "successful": 0,
                        "failed": 0,
                    },
                )

                incident_item = incidents_data.get(
                    date,
                    {
                        "count": 0,
                        "downtime_seconds": 0,
                    },
                )

                rows.append(
                    [
                        format_datetime(date),
                        uptime_item["uptime_percentage"],
                        response_data.get(date),
                        check_item["successful"],
                        check_item["failed"],
                        incident_item["count"],
                        incident_item["downtime_seconds"],
                    ]
                )

            for row in rows:
                sheet.append(row)

            if rows:

                for cell in sheet["A"][1:]:
                    cell.number_format = "dd/mm/yyyy hh:mm"

            sheet.freeze_panes = "A2"

            if rows:
                sheet.auto_filter.ref = f"A1:G{len(rows) + 1}"

            widths = {
                "A": 20,
                "B": 15,
                "C": 22,
                "D": 12,
                "E": 12,
                "F": 12,
                "G": 18,
            }

            for column, width in widths.items():
                sheet.column_dimensions[column].width = width

    return workbook


def workbook_to_file_response(workbook):
    output = BytesIO()

    workbook.save(output)

    output.seek(0)

    return output.read()
