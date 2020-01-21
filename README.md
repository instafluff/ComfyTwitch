# ComfyTwitch
Comfiest Way to Add Serverless Twitch Authentication

**ComfyTwitch** lets you integrate Twitch authentication for websites without a server ***SUPER EASILY*** in just a few lines of code.

## Instafluff ##
> *Like these projects? The best way to support my open-source projects is by becoming a Comfy Sponsor on GitHub!*

> https://github.com/sponsors/instafluff

> *Come and hang out with us at the Comfiest Corner on Twitch!*

> https://twitch.tv/instafluff

## Instructions ##

#### Prequisites
1. Create a Twitch application from [https://dev.twitch.tv/console/apps/create](https://dev.twitch.tv/console/apps/create) to generate a Twitch Client ID

2. Add an OAuth Redirect URL to your Twitch application for the authentication to redirect the user to afterwards. A local example would look like: `http://localhost:8800/index.html`

#### Website

1. Download  `comfytwitch.min.js` from the `web` folder and add into every page you need authenticated:
```javascript
<script src="comfytwitch.min.js"></script>
```

2.
```html
<html>
    <head>
        <script src="comfytwitch.min.js"></script>
    </head>
    <body>
        <script type="text/javascript">
            const clientId = "YOUR-CLIENT-ID";
            const baseUrl = window.location.origin;

            ComfyTwitch.Check()
            .then( result => {
                if( result ) {
                    // Logged In
                }
                else {
                    // Logged Out
                }
            });
        </script>
    </body>
</html>
```

3. Add Twitch Log-In by calling `ComfyTwitch.Login()` on a button click or through a separate page, passing in the Client ID, the same Redirect URI as set in your Twitch application, and the [Twitch Permission Scopes](https://dev.twitch.tv/docs/authentication/#scopes) you need:
```javascript
ComfyTwitch.Login( "YOUR-CLIENT-ID", `http://localhost:8800/index.html`, [ "user:read:email" ] );
```

4. Add Twitch Log-out by calling `ComfyTwitch.Logout()`

## Additional Functions ##

 - **GetUser**`( clientId, userId )`
    - Retrieve a Twitch user's information
```javascript
let user = await ComfyTwitch.GetUser( "YOUR-CLIENT-ID", "TWITCH-USER-ID" );
```
