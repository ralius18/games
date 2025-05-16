// aws-config.js
import AWS from 'aws-sdk';
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';

const poolData = {
    Region: 'ap-southeast-2',
    UserPoolId: 'ap-southeast-2_jY2pEqhpn',
    ClientId: 'q2ki9kinlq8arsc65aibuk0ti',
    IdentityPoolId: 'ap-southeast-2:a49cef16-a6df-4312-a1b2-5cc17eaf82e0'
};

const userPool = new CognitoUserPool(poolData);
let cognitoUser = userPool.getCurrentUser();

if (cognitoUser) {
    cognitoUser.getSession((err, session) => {
        const idToken = session.getIdToken().getJwtToken();
        AWS.config.region = 'ap-southeast-2';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: poolData.IdentityPoolId,
            Logins: {
                [`cognito-idp.ap-southeast-2.amazonaws.com/${poolData.UserPoolId}`]: idToken
            }
        });

        AWS.config.credentials.refresh(console.log);
    })
}

export function login(email, password, onSuccess, onFailure) {
    cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
            const idToken = result.getIdToken().getJwtToken();

            AWS.config.region = 'ap-southeast-2';
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: poolData.IdentityPoolId,
                Logins: {
                    [`cognito-idp.ap-southeast-2.amazonaws.com/${poolData.UserPoolId}`]: idToken
                }
            });

            AWS.config.credentials.refresh((err) => {
                if (err) {
                    onFailure(err);
                } else {
                    onSuccess();
                }
            });
        },
        onFailure: onFailure
    });
}

export function logout() {
    if (cognitoUser) {
        cognitoUser.signOut();
        cognitoUser = null;
        AWS.config.credentials.clearCachedId();
        AWS.config.credentials = null;
    }

    window.location.href = '/';
}

export function isLoggedIn() {
    return cognitoUser != null && cognitoUser.getSignInUserSession() != null;
}

export default AWS