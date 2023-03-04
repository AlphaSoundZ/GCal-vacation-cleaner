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

// Get timezone from Google Calendar settings
calendar.settings.get({
    setting: 'timezone'
}, async (err, res) => {
    if (err) return console.error('Error getting timezone:', err);

    const timezone = res.data.value;
    console.log(timezone);

    const calendar_ids = await calendar.calendarList.list();
    const calendar_id = calendar_ids.data.items.find(x => x.summary == process.env.BLOCK_CALENDAR_SUMMARY).id;

    // Get start and end of curretn year
    const start = DateTime.now().setZone(timezone);
    const end = DateTime.now().setZone(timezone).endOf('year');

    // Get Events
    calendar.events.list({
        calendarId: calendar_id,
        timeMin: start.toISO(),
        timeMax: end.toISO(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, res) => {

        if (err) return console.log('The API returned an error: ' + err);

        const events = res.data.items;

        if (events.length) {
            console.log('Upcoming 10 events:');
            events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
            });
        } else {
            console.log('No upcoming events found.');
        }
    });
});