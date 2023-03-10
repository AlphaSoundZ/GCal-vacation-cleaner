require('dotenv').config();

// Import Google APIs and set up OAuth2 client
const { google, GoogleApis, calendar_v3 } = require('googleapis');
const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
);
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

const calendar = google.calendar({
    version: 'v3',
    auth: oAuth2Client
});

// Import luxon for date and time handling
const { DateTime } = require('luxon');

// ###############################
main();

// Get timezone from Google Calendar settings
async function main() {
    // Get the timezone
    const timezone = await getCalendarTimezone();

    const calendars = await calendar.calendarList.list(); // Get all calendars

    const selectionCalId = calendars.data.items.find(x => x.summary == process.env.SELECTION_CALENDAR_SUMMARY).id; // Get selection calendar id
    const eventCalId = calendars.data.items.find(x => x.summary == process.env.EVENT_CALENDAR_SUMMARY).id; // Get event calendar id

    const selectionCalEvents = await getEvents({
        calendarId: selectionCalId,
        timeMin: DateTime.now().setZone(timezone).toISO(),
        timeMax: DateTime.now().setZone(timezone).endOf('year').toISO(),
        singleEvents: true,
        orderBy: 'startTime'
    });

    if (selectionCalEvents.length === 0) {
        console.log('No selection events found.');
        return;
    }

    // iterate through selection events
    for (const selectionEvent of selectionCalEvents) {
        const start = selectionEvent.start.dateTime || selectionEvent.start.date;
        const end = selectionEvent.end.dateTime || selectionEvent.end.date;

        // Get events in time range of selection event
        const eventCalEvents = await getEvents({
            calendarId: eventCalId,
            timeMin: new Date(start).toISOString(),
            timeMax:new Date(end).toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        // Events found
        console.log(`Found ${eventCalEvents.length} events in ${selectionEvent.summary}`);

        // delete eventCalEvents
        for (const eventToDel of eventCalEvents) {
            const result = await deleteEvent(eventToDel, eventCalId);
        }
    }
}


function getEvents(params = {}) {
    return new Promise((resolve, reject) => {
        calendar.events.list(params, (err, res) => {
            if (err) return reject('The API returned an error: ' + err);

            const events = res.data.items;

            if (events.length === 0) {
                //console.log('No events found.');
            }

            resolve(events);
        });
    });
}

function getCalendarTimezone() {
    return new Promise((resolve, reject) => {
        calendar.settings.get({ setting: 'timezone' }, (err, res) => {
            if (err) return reject('The API returned an error: ' + err);

            const timezone = res.data.value;

            resolve(timezone);
        });
    });
}

function deleteEvent(event, calendarId) {
    return new Promise((resolve, reject) => {
        calendar.events.delete({ calendarId: calendarId, eventId: event.id }, (err, res) => {
            if (err) return reject('The API returned an error: ' + err);
            
            console.log(`Deleted event ${event.summary}`);
            
            resolve(res);
        });
    });
}