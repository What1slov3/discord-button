# DOCUMENATION

#### CLIENT

First, you need to register/login the [Discord app](https://discord.com/developers/applications 'Discord Developer Portal')

- Login with your discord account
- Click on "New Application" at the top right corner and enter a name
- Click OAuth2 at the left side
- In General add a redirect url on created app
- Click to URL Generator
- Check the boxes next to identify, guilds, guilds.members.read, select added redirect and copy link
- populate the "config" variable file in the /client/static/js folder, index.js file    
  Structure:

```json
{
  "redirectUrl": "NEED TO PASTE REDIRECT URL",
  "oauthUrl": "NEED TO PASTE OAUTH LINK",
  "serverUrl": "FOR EXAMPLE: http://localhost:3000"
}
```

#### SERVER

You must have Node.js installed to work of >17.0.0 version
Enter in /server directory in console

```
  npm i
```

- Watch the small part (0:30-4:40) of the great [guide](https://www.youtube.com/watch?v=PFJNJQCU_lo&ab_channel=JamesGrimshaw 'Youtube guide') so that you make credentials to work with your Google Spreadsheet
- Create/populate the credentials.json and paste all data from the downloaded file Google Spreadsheets
- Activate developer mode in Discord settings so you can copy IDs
- Create/populate the .env file in the ./server folder  
  Structure:

```
  PORT=port on which the server will be running
  CLIENT_ID=APPLICATION ID on the Discord Developer Portal in General Information
  CLIENT_SECRET=CLIENT SECRET on the Discord Developer Portal in OAuth2/General
  GUILD_ID=Your discord server ID which can be found in the server settings in widget tab
  ONE_FIELD_ROLE_ID=Role ID to only one field, can be found in the list of roles, in the drop-down menu, click Copy ID
  TWO_FIELDS_ROLE_ID=Role ID to two fields, can be found in the list of roles, in the drop-down menu, click Copy ID
  REDIRECT_URI=URI that you added in Discord OAuth2 redirect
  SPREADSHEET_ID=Google Spreadsheet ID, https://docs.google.com/spreadsheets/d/YOUR_ID_WILL_BE_HERE_IN_A_BROWSER/edit
  SPREADSHEET_NAME=Google Spreadsheet name, can be founded at the bottom of the page
  CORS_SITE_ACCESS=URL of the site (in this case, where the application will be located) that can make requests to the server in full format (http(-s)://www.somesite.com)
```
After, enter this one

```
  npm start
```
Congratulations, your app should work