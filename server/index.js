import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { google } from 'googleapis';

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [process.env.CORS_SITE_ACCESS],
    methods: ['GET'],
    optionsSuccessStatus: 200,
  })
);
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const compareUsersRoles = (roles) => {
  let comparedRoles = roles.filter(
    (role) => role === process.env.ONE_FIELD_ROLE_ID || role === process.env.TWO_FIELDS_ROLE_ID
  );
  if (comparedRoles.length) {
    return comparedRoles.includes(process.env.TWO_FIELDS_ROLE_ID) ? 'twoFields' : 'oneField';
  }
  return;
};

// ! GOOGLESHEETS INIT

const initGoogleSheets = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  const client = await auth.getClient();
  return [google.sheets({ version: 'v4', auth: client }), auth];
};

const [googleSheets, auth] = await initGoogleSheets();

// ! GOOGLESHEETS INIT

app.get('/api/update', async (req, res) => {
  try {
    const responseJsonChecker = (json) => {
      if (json.status >= 300 && json.status !== 400) {
        res.status(json.status).send();
        return;
      }
      return json.json();
    };

    const { accessToken } = req.query;
    let user, hasRole;

    if (accessToken && accessToken.split(' ')[0] === 'Bearer') {
      await fetch(`https://discordapp.com/api/v6/users/@me/guilds/${process.env.GUILD_ID}/member`, {
        headers: {
          authorization: accessToken,
        },
      })
        .then(responseJsonChecker)
        .then((response) => {
          if (!response) return;
          if (response.error) return res.status(400).send(response);
          user = response.user;
          hasRole = compareUsersRoles(response.roles);
        })
        .catch((err) => console.error(err));

      if (!user) return res.status(401).send();
    } else {
      return res.status(401).send();
    }

    return res.status(200).send({ user, hasRole });
  } catch (err) {
    return res.status(500).send();
  }
});

app.get('/api/save', async (req, res) => {
  try {
    const handleJsonCheck = (json) => {
      if (json.status >= 300) {
        res.status(json.status).send();
        return;
      }
      return json.json();
    };

    const { accessToken, firstText, secondText } = req.query;
    let user, hasRole;

    if (accessToken && accessToken.split(' ')[0] === 'Bearer') {
      await fetch(`https://discordapp.com/api/v6/users/@me/guilds/${process.env.GUILD_ID}/member`, {
        headers: {
          authorization: accessToken,
        },
      })
        .then(handleJsonCheck)
        .then((response) => {
          if (!response) return;
          user = response.user;
          hasRole = compareUsersRoles(response.roles);
        });

      if (!user) return res.status(401).send();
    } else {
      return res.status(401).send();
    }

    if (!hasRole || (hasRole === 'oneField' && !firstText) || (hasRole === 'twoFields' && !firstText && !secondText)) {
      return res.status(400).send("Don't have permissions or missed fields");
    }

    const spreadsheetId = process.env.SPREADSHEET_ID;

    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: process.env.SPREADSHEET_NAME,
    });

    if (getRows.data.values.find((row) => row[0] === `${user.username}#${user.discriminator}`)) {
      return res.status(400).send('User already registered');
    }

    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: `${process.env.SPREADSHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[`${user.username}#${user.discriminator}`, firstText, secondText]],
      },
    });

    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send('Something broke');
  }
});

app.get('/api', async ({ query }, res) => {
  try {
    const handleJsonCheck = (json) => {
      if (json.status >= 300 && json.status !== 400) {
        res.status(json.status).send();
        return;
      }
      return json.json();
    };

    const { code } = query;
    let oauthData, user, hasRole;

    if (code) {
      oauthData = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.REDIRECT_URI,
          scope: 'identify guilds guilds.members.read',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
        .then(handleJsonCheck)
        .then((response) => response)
        .catch((err) => console.error(err));
    }

    if (oauthData?.error) {
      return res.status(400).send(oauthData);
    }
    if (oauthData?.access_token) {
      await fetch(`https://discordapp.com/api/v6/users/@me/guilds/${process.env.GUILD_ID}/member`, {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      })
        .then(handleJsonCheck)
        .then((response) => {
          user = response.user;
          hasRole = compareUsersRoles(response.roles);
        })
        .catch((err) => console.error(err));

      if (!user) return res.status(401).send();
    } else {
      return res.status(500).send();
    }

    return res.status(200).send({ user, hasRole, accessToken: `${oauthData.token_type} ${oauthData.access_token}` });
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});

app.listen(process.env.PORT, () => {
  console.log(`[SERVER] Started ${process.env.PORT}`);
});
