const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const moment = require('moment-timezone');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

// Given some known conversation ID (representing a public channel, private channel, DM or group DM)
const channelID = 'test-sachit';

const plToday = () => {
  const today = moment().format('YYYY-MM-DD');
  // Make a request for a user with a given ID
  return axios.get('https://fantasy.premierleague.com/api/bootstrap-static/')
    .then(function (response) {
      // handle success
      const {teams} = response.data;

      return axios.get('https://fantasy.premierleague.com/api/fixtures/')
        .then(function (response) {
          // handle success
          const allEvents = response.data;

          let events = [];
          for (key in allEvents) {
            const event = allEvents[key];
            //  converted to nepal time
            const kickoff_time = moment(event.kickoff_time).format('YYYY-MM-DD hh:mm A');
            if (event.hasOwnProperty('kickoff_time') && kickoff_time.startsWith(today)) {
              event.team_a = teams.find(function(team, index) {
                return team.id == event.team_a;
              });
              event.team_h = teams.find(function(team, index) {
                return team.id == event.team_h;
              });
              // adding nepal timezone
              events.push({
                game: `${event.team_h.name} vs ${event.team_a.name}`,
                time: kickoff_time
              });
            }
          }

          return events;

        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
  }

  (async () => {

    // Post a message to the channel, and await the result.
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    // const result = await web.chat.postMessage({
    //   text: JSON.stringify(plToday()),
    //   channel: channelID,
    // });

    const events = await plToday();

    let text = `This message is generated from Sachit's computer from cli command\n\n`;

    text += `Here's the list of Today's games:\n\n`;

    events.map(event => {
      text += `Game: ${event.game}\nTime: ${event.time}\n\n`
    })

    console.log(text)
    const result = await web.chat.postMessage({
      text: text,
      channel: channelID,
    });

    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully sent today's fixture to channel: ${channelID}`);
  })();