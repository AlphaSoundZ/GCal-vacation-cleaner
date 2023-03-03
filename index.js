require('dotenv').config();

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

const eventStartTime = new Date();
eventStartTime.setDate(eventStartTime.getDay()-1);

const eventEndTime = new Date();
eventEndTime.setDate(eventEndTime.getDay()-1);
eventEndTime.setMinutes(eventEndTime.getMinutes() + 45);

// format start time to readable string
const startTime = eventStartTime.toISOString();
const endTime = eventEndTime.toISOString();

// log date and time and length of event in minutes formatted for calendar
console.log(
    `Event will be from ${startTime} to ${endTime} and will last for ${
        Math.round((eventEndTime - eventStartTime) / 1000 / 60)
    } minutes.`
);

// Create a dummy event for temp testing
const event = {
    summary: 'Test Event',

    description: 'This is a test event created by a Node.js script',
    start: {
        dateTime: eventStartTime
    },
    end: {
        dateTime: eventEndTime
    },
    colorId: 1
};

// Check if we a busy and have an event on our calendar for the same time
calendar.freebusy.query(
    {
        resource: {
            timeMin: eventStartTime,
            timeMax: eventEndTime,
            items: [{ id: 'primary' }]
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
        return console.log("Sorry I'm busy...");
    }
);