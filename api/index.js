const { withUiHook, htm } = require("@zeit/integration-utils");
const qs = require("querystring");
const fetch = require("node-fetch");

const {
  STATICKIT_URL,
  STATICKIT_API_URL,
  STATICKIT_CLIENT_ID,
  STATICKIT_CLIENT_SECRET,
  ROOT_URL
} = process.env;

const NewAccountPage = require("../pages/new_account");
const NewFormPage = require("../pages/new_form");
const FormsPage = require("../pages/forms");

async function completeOAuthProcess({ payload, zeitClient, metadata }) {
  const url = `${STATICKIT_URL}/oauth/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: qs.stringify({
      client_id: STATICKIT_CLIENT_ID,
      client_secret: STATICKIT_CLIENT_SECRET,
      code: payload.query.code,
      grant_type: "authorization_code",
      redirect_uri: `${ROOT_URL}/callback`
    })
  });

  if (response.status !== 200) {
    throw new Error(
      `Invalid status code on StaticKit token fetching: ${
        response.status
      } error: ${await response.text()}`
    );
  }

  const tokenInfo = await response.json();
  if (tokenInfo.error) {
    throw new Error(`StaticKit OAuth issue: ${tokenInfo.error_description}`);
  }
  metadata.skTokenInfo = tokenInfo;
  await zeitClient.setMetadata(metadata);
}

async function getPageData(tokenInfo) {
  const response = await fetch(`${STATICKIT_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenInfo["access_token"]}`
    },
    body: JSON.stringify({
      query: `{
        viewer {
          email
        }
        accounts(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
        forms(first: 100) {
          edges {
            node {
              id
              name
              account {
                id
                name
              }
            }
          }
        }
      }`
    })
  });

  return response.json();
}

async function createSite(tokenInfo, params) {
  const response = await fetch(`${STATICKIT_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenInfo["access_token"]}`
    },
    body: JSON.stringify({
      query: `
        mutation CreateAccount(
          $name: String!
        ) {
          createAccount(name: $name) {
            success
            errors {
              field
              message
              code
            }
            account {
              id
              name
            }
          }
        }
      `,
      variables: params
    })
  });

  return response.json();
}

async function createForm(tokenInfo, params) {
  const response = await fetch(`${STATICKIT_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenInfo["access_token"]}`
    },
    body: JSON.stringify({
      query: `
        mutation CreateForm(
          $accountId: ID!
          $name: String!
        ) {
          createForm(
            accountId: $accountId, 
            name: $name
          ) {
            success
            errors {
              field
              message
              code
            }
            form {
              id
              name
            }
          }
        }
      `,
      variables: params
    })
  });

  return response.json();
}

module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const metadata = await zeitClient.getMetadata();
  const tokenInfo = metadata.skTokenInfo;

  if (!tokenInfo) {
    if (payload.query.code) {
      await completeOAuthProcess({ payload, zeitClient, metadata });
    } else {
      const nextUrl = encodeURIComponent(payload.installationUrl);
      const connectUrl = `${ROOT_URL}/connect?next=${nextUrl}`;

      return htm`
        <Page>
          <Link href=${connectUrl}>Connect with StaticKit</Link>
        </Page>
      `;
    }
  }

  if (payload.action === "disconnect") {
    delete metadata.skTokenInfo;
    await zeitClient.setMetadata(metadata);
  }

  if (payload.action === "createAccount") {
    const mutation = await createSite(tokenInfo, payload.clientState);

    if (!mutation.data.createAccount.success) {
      const pageData = await getPageData(tokenInfo);

      return htm`
        <Page>
          <${NewAccountPage} pageData=${pageData} errors=${mutation.data.createAccount.errors} />
        </Page>
      `;
    }
  }

  if (payload.action === "createForm") {
    const mutation = await createForm(tokenInfo, payload.clientState);

    if (!mutation.data.createForm.success) {
      const pageData = await getPageData(tokenInfo);

      const account = pageData.data.accounts.edges.find(edge => {
        return edge.node.id == payload.clientState.accountId;
      }).node;

      return htm`
        <Page>
          <${NewFormPage} pageData=${pageData} account=${account} errors=${mutation.data.createForm.errors} />
        </Page>
      `;
    }
  }

  const pageData = await getPageData(tokenInfo);

  if (pageData.data.accounts.edges.length == 0) {
    return htm`
      <Page>
        <${NewAccountPage} pageData=${pageData} errors=${[]} />
      </Page>
    `;
  } else {
    if (pageData.data.forms.edges.length == 0) {
      return htm`
        <Page>
          <${NewFormPage} pageData=${pageData} errors=${[]} />
        </Page>
      `;
    } else {
      return htm`
        <Page>
          <${FormsPage} pageData=${pageData} errors=${[]} />
        </Page>
      `;
    }
  }
});
