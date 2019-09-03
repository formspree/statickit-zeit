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
  const href = `${STATICKIT_URL}/forms/${id}`;

  return htm`
    <Box marginBottom="8px" padding="4px" backgroundColor="#fff" borderRadius="8px">
      <Box fontSize="18px" fontWeight="bold"><Link href=${href} target="_blank">${name}</Link></Box> 
    </Box>
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
    const page = await getPageData(metadata.skTokenInfo);

    return htm`
      <Page>
        <Box marginBottom="20px" display="flex" alignItems="center">
          <Box flexGrow="1" color="#666">
            <P>Logged in as <B>${page.data.viewer.email}</B></P>
          </Box>
          <Button type="secondary" small action="disconnect">Sign Out</Button>
        </Box>

        <Box maxWidth="740px" margin="0 auto">
          <Fieldset>
            <FsContent>
              <H2>Create a site</H2>
              <P>Sites are how you organize your components in StaticKit.</P>
              <Box marginTop="16px">
                <Input name="name" label="Site Name" value="" placeholder="e.g. Marketing Site" width="75%" />
              </Box>
            </FsContent>
            <FsFooter display="flex">
              <Box display="flex" flexGrow="1" justifyContent="flex-start">
                <P>Once you create a StaticKit site, you can start creating components.</P>
              </Box>
              <Box display="flex" flexGrow="0" justifyContent="flex-end">
                <Button small action="create-site">Create site</Button>
              </Box>
            </FsFooter>
          </Fieldset>
        </Box>

        <Box>
          ${page.data.forms.edges.map(
            edge =>
              htm`<${FormItem} id=${edge.node.id} name=${edge.node.name} //>`
          )}
        </Box>
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
