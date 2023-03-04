require('dotenv').config();

// Import Google APIs and set up OAuth2 client
const { google } = require('googleapis');
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
}, (err, res) => {
    if (err) return console.error('Error getting timezone:', err);

    const timezone = res.data.value;

    // Get the current time in the timezone of the calendar
    const eventStartTime = DateTime.now().setZone(timezone);
    const eventEndTime = DateTime.now().setZone(timezone).plus({ hours: 1 });
    
    const event = {
        summary: 'Test Event',
    
        description: 'This is a test event created by a Node.js script',
        start: {
            dateTime: eventStartTime.toISO(),
            timeZone: timezone
        },
        end: {
            dateTime: eventEndTime.toISO(),
            timeZone: timezone
        },
        colorId: 1
    };

    console.log(
        `Event will be from ${eventStartTime.toISODate()} to ${eventEndTime.toISODate()} and will last for ${
            Math.round((eventEndTime - eventStartTime) / 1000 / 60) // convert to minutes
        } minutes.`
    );

    calendar.freebusy.query(
        {
            resource: {
                timeMin: eventStartTime,
                timeMax: eventEndTime,
                items: [{ id: 'primary' }],
                timeZone: 'Europe/Berlin'
            }
        },
        (err, res) => {
            // Check for errors in our query and log them if they exist.
            if (err) return console.error('Free Busy Query Error: ', err);
    
            // Create an array of all events on our calendar during that time.
            const eventArr = res.data.calendars.primary.busy;
    
            // Check if event array is empty which means we are not busy
            if (eventArr.length === 0)
                // If we are not busy create a new calendar event.
                return calendar.events.insert(
                    { calendarId: 'primary', resource: event },
                    err => {
                        // Check for errors and log them if they exist.
                        if (err) return console.error('Error Creating Calender Event:', err);
                        // Else log that the event was created.
                        return console.log('Calendar event successfully created.');
                    }
                );
    
            // If event array is not empty log that we are busy.
            console.log(JSON.stringify(res.data))
            return console.log(`Sorry I'm busy...`);
        }
    );
});