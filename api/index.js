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
              forms(first: 100) {
                edges {
                  node {
                    id
                    name
                  }
                }
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
          $name: String
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

const FormItem = ({ id, name }) => {
  const href = `${STATICKIT_URL}/forms/${id}`;

  return htm`
    <Box marginBottom="8px" padding="4px" backgroundColor="#fff" borderRadius="8px">
      <Box fontSize="18px" fontWeight="bold"><Link href=${href} target="_blank">${name}</Link></Box> 
    </Box>
  `;
};

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

  if (payload.action === "create-account") {
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

  const pageData = await getPageData(tokenInfo);

  switch (pageData.data.accounts.edges.length) {
    case 0:
      return htm`
        <Page>
          <${NewAccountPage} pageData=${pageData} errors=${[]} />
        </Page>
      `;

    case 1:
      const account = pageData.data.accounts.edges[0].node;

      if (account.forms.edges.length == 0) {
        return htm`
          <Page>
            <${NewFormPage} pageData=${pageData} account=${account} errors=${[]} />
          </Page>
        `;
      }

      return htm`
        <Page>
          ${JSON.stringify(account)}
        </Page>
      `;

    default:
      return htm`
        <Page>
          ${JSON.stringify(pageData)}
        </Page>
      `;
  }

  // return htm`
  //   <Page>
  //     ${JSON.stringify(payload)}
  //     <${Header} viewer=${pageData.data.viewer} />

  //     <Box>
  //       ${pageData.data.forms.edges.map(
  //         edge =>
  //           htm`<${FormItem} id=${edge.node.id} name=${edge.node.name} //>`
  //       )}
  //     </Box>
  //   </Page>
  // `;
});
