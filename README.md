# Google Calendar Vacation Cleaner

With this tool you can deactivate repeating appointments in certain time periods.

Example:
You have a holiday calendar and a timetable calendar. You should not have timetable appointments during the holidays. This is where the tool comes into play.

In the ``.env`` file you need to configure the connection to your Google Calendar.
You also need to set the ``SELECTION_CALENDAR_SUMMARY`` that corresponds to the name of the time periods calendar. The ``EVENT_CALENDAR_SUMMARY`` corresponds to the name of the calendar with the appointments.

Run the programm from the root directory of the repo:
``node index.js``
