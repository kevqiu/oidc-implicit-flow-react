import React from 'react';
import Cookies from 'universal-cookie';
import { UserManager } from 'oidc-client';
import jwt_decode from 'jwt-decode'

const AUTHORITY = 'YOUR AUTHORITY HERE (eg. https://your-domain.onelogin.com/oidc)';
const OIDC_CLIENT_ID = 'YOUR CLIENT ID HERE';

const cookies = new Cookies();
let cookieName = 'OneLoginDemoCookie';

class App extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.login = this.login.bind(this);

        let loggedIn = false;

        if (window.location.href.indexOf('#id_token') >= 0) {
            loggedIn = true;
        }

        // OIDC User Manager
        this.userManager = null;

        this.state = {
            loggedIn: loggedIn
        };
    }

    async componentDidMount() {
        let oidcSettings = {
            authority: AUTHORITY,
            client_id: OIDC_CLIENT_ID,
            redirect_uri: window.location.origin,
            post_logout_redirect_uri: window.location.origin,
            response_type: 'id_token token',
            scope: 'openid profile email',
            automaticSilentRenew: true
        };

        // initialize the OIDC UserManager
        this.userManager = new UserManager(oidcSettings);

        // if URL has changed from OneLogin callback, save token in cookie
        if (window.location.href.indexOf('#id_token') >= 0) {
            this.userManager.signinRedirectCallback()
                .then(user => {
                    cookies.set(cookieName, user.id_token, {
                        expires: new Date(user.expires_at * 1000)
                    });
                    this.setState({
                        loggedIn: true
                    });
                }).catch(err => {
                    throw(err);
                });
        }

            this.userManager.signoutRedirectCallback()
                .then(x => {
                    console.log(x);
                    cookies.remove(cookieName);
                    this.setState({
                        loggedIn: false
                    })
                });

        // display token if exists
        let authCookie = cookies.get(cookieName);
        if (authCookie) {
            this.setState({
                loggedIn: true
            });
        }
    }

    login() {
        this.userManager.signinRedirect({state:'some state'})
            .catch(err => {
                throw(err);
            });
    }

    render() {
        let { loggedIn } = this.state;

        let message = loggedIn 
            ? 'State: Logged in!'
            : 'State: Not logged in.'

        let cookie = cookies.get(cookieName);
        return (
            <div>
                <h1>OneLogin Demo</h1>
                <button type='button' onClick={this.login}>Click me to log in!</button>
                <p>{message}</p>
                {
                    cookie 
                        ? <div>
                            <p>Token: {cookie}</p>
                            <p>{JSON.stringify(jwt_decode(cookie))}</p>
                        </div>
                        : null
                }
            </div>
        )
    }
}

export default App;
