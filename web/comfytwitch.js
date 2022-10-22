function generateNonce() {
    const charset = `0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-_`;
    const result = [];
    window.crypto.getRandomValues(new Uint8Array(32)).forEach(c =>
        result.push(charset[c % charset.length]));
    return result.join("");
}

function checkAuthState() {
    const queryString = new URLSearchParams( location.search );
    const nonce = queryString.get( "state" );
    const storedNonce = window.localStorage.getItem( "comfytwitch_nonce" );
    if( nonce && nonce !== storedNonce ) {
        throw new Error( "Auth State did not match" );
    }
}

async function checkForTwitchToken() {
    return await checkTwitchTokenLocalStorage() || await checkTwitchTokenURL();
}

async function checkTwitchTokenURL() {
    try {
        checkAuthState();
        const queryString = new URLSearchParams( location.search );
        const accessCode = queryString.get( "code" );
        const params = new URLSearchParams( location.hash.replace( "#", "" ) );
        const accessToken = params.get( "access_token" );
        if( accessCode ) {
            if( !comfyTwitchAuth.codeAuthUrl ) {
                throw new Error( "No code grant endpoint set" );
            }
            const tokenData = await fetch( `${comfyTwitchAuth.codeAuthUrl}?code=${accessCode}&redirect=${window.location.origin + window.location.pathname}` ).then( r => r.json() );
            // console.log( tokenData );
            const token = tokenData.access_token;
            const result = await validateTwitchToken( token );
            // console.log( result );
            if( result && result.login ) {
                // Save into localStorage
                localStorage.setItem( "twitchToken", token );
                localStorage.setItem( "refreshToken", tokenData.refresh_token );
                // Replace current URL
                const url = window.location.href.split( "?" )[ 0 ];
                window.location.replace( url );
                result.token = token;
                result.refreshToken = tokenData.refresh_token;
                return result;
            }
        }
        else if( accessToken ) {
            const result = await validateTwitchToken( accessToken );
            if( result && result.login ) {
                // Save into localStorage
                localStorage.setItem( "twitchToken", accessToken );
                // Replace current URL
                const url = window.location.href.split( "#" )[ 0 ];
                window.location.replace( url );
                result.token = accessToken;
                return result;
            }
        }
    }
    catch( err ) {
        console.error( err );
    }
    return null;
}

async function checkTwitchTokenLocalStorage() {
    try {
        // Check local storage
        const accessToken = localStorage.getItem( "twitchToken" );
        const refreshToken = localStorage.getItem( "refreshToken" );
        if( accessToken ) {
            let result = await validateTwitchToken( accessToken );
            if( result && result.login ) {
                result.token = accessToken;
                result.refreshToken = refreshToken;
                return result;
            }
            else if( refreshToken ) {
                // Try refreshing the token
                if( !comfyTwitchAuth.refreshUrl ) {
                    throw new Error( "No refresh endpoint set" );
                }
                const tokenData = await fetch( `${comfyTwitchAuth.refreshUrl}?token=${refreshToken}` ).then( r => r.json() );
                const token = tokenData.access_token;
                const result = await validateTwitchToken( token );
                if( result && result.login ) {
                    // Save into localStorage
                    localStorage.setItem( "twitchToken", token );
                    localStorage.setItem( "refreshToken", tokenData.refresh_token );
                    result.token = token;
                    return result;
                }
            }
        }
    }
    catch( err ) {
        console.error( err );
    }
    return null;
}

async function validateTwitchToken( token ) {
    return await fetch( "https://id.twitch.tv/oauth2/validate", {
        headers: {
            Authorization: `OAuth ${token}`
        }
    } )
    .then( r => r.json() )
    .catch( error => {
        // Auth Failed
        return {
            error: error
        };
    });
}

let comfyTwitchAuth = {
    UserId: 0,
    User: "",
    ClientID: "",
    Token: "",
    RefreshToken: "",
    Scopes: [],
    Logout: function () {
        localStorage.removeItem( "twitchToken" );
    },
    Login: function ( clientId, redirectURI, scopes = [ "user:read:email" ], type = "token" ) {
        const state = generateNonce();
        window.localStorage.setItem( "comfytwitch_nonce", state );
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=${type}&scope=${encodeURIComponent(scopes.join( " " ))}&state=${state}`;
    },
    SetAuthEndpoint: function ( codeToTokenUrl ) {
        comfyTwitchAuth.codeAuthUrl = codeToTokenUrl;
    },
    SetRefreshEndpoint: function ( tokenRefreshUrl ) {
        comfyTwitchAuth.refreshUrl = tokenRefreshUrl;
    },
    Check: async function( redirectURI ) {
        let result = await checkForTwitchToken();
        if( result ) {
            comfyTwitchAuth.ClientID = result.client_id;
            comfyTwitchAuth.UserId = result.user_id;
            comfyTwitchAuth.User = result.login;
            comfyTwitchAuth.Token = result.token;
            comfyTwitchAuth.RefreshToken = result.refreshToken;
            comfyTwitchAuth.Scopes = result.scopes;
        }
        else {
            comfyTwitchAuth.Logout();
            if( redirectURI ) {
                window.location.href = redirectURI;
            }
        }
        return result;
    },
    GetUser: async function( clientId, userId ) {
        return await fetch( `https://api.twitch.tv/helix/users?id=${userId}`, {
            headers: {
                "Client-ID": clientId,
                "Authorization": `Bearer ${comfyTwitchAuth.Token}`,
            }
        } )
        .then( r => r.json() )
        .then( r => {
            if( r[ "data" ].length > 0 ) {
                return r[ "data" ][ 0 ];
            }
            return {};
        })
        .catch( error => {
            // Auth Failed
            return {
                error: error
            };
        });
    },
};

window.ComfyTwitch = comfyTwitchAuth;
