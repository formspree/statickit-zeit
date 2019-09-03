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

async function getForms(tokenInfo) {
  const response = await fetch(`${STATICKIT_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenInfo["access_token"]}`
    },
    body: JSON.stringify({
      query: `{
        forms(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`
    })
  });

  return response.json();
}

const FormItem = ({ id, name }) => {
  const href = `https://app.statickit.com/forms/${id}`;

  return htm`
    <LI><Link href=${href} target="_blank">${name}</Link></LI>
  `;
};

module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const metadata = await zeitClient.getMetadata();

  if (payload.action === "disconnect") {
    delete metadata.skTokenInfo;
    await zeitClient.setMetadata(metadata);
  }

  if (!metadata.skTokenInfo && payload.query.code) {
    await completeOAuthProcess({ payload, zeitClient, metadata });
  }

  if (metadata.skTokenInfo) {
    const formQuery = await getForms(metadata.skTokenInfo);

    return htm`
      <Page>
        <P>Connected to StaticKit</P>
        <UL>
          ${formQuery.data.forms.edges.map(
            edge =>
              htm`<${FormItem} id=${edge.node.id} name=${edge.node.name} //>`
          )}
        </UL>
        <Button small action="disconnect">Disconnect</Button>
      </Page>
    `;
  }

  const nextUrl = encodeURIComponent(payload.installationUrl);
  const connectUrl = `${ROOT_URL}/connect?next=${nextUrl}`;

  return htm`
    <Page>
      <Link href=${connectUrl}>Connect with StaticKit</Link>
    </Page>
  `;
});
