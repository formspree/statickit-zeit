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

const NewSitePage = require("../pages/new_site");
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
        sites(first: 100) {
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
              site {
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
        mutation CreateSite(
          $name: String!
        ) {
          createSite(name: $name) {
            success
            errors {
              field
              message
              code
            }
            site {
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
          $siteId: ID!
          $name: String!
        ) {
          createForm(
            siteId: $siteId, 
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

  if (payload.action === "disconnect") {
    delete metadata.skTokenInfo;
    await zeitClient.setMetadata(metadata);
  }

  if (!metadata.skTokenInfo) {
    if (payload.query.code) {
      await completeOAuthProcess({ payload, zeitClient, metadata });
    } else {
      const nextUrl = encodeURIComponent(payload.installationUrl);
      const connectUrl = `${ROOT_URL}/connect?next=${nextUrl}`;

      return htm`
        <Page>
          <Box border="1px solid #eaeaea" borderRadius="8px" padding="64px" textAlign="center" background="white">
            <Box paddingBottom="16px">
              <H1>Connect StaticKit to your ZEIT account</H1>
            </Box>
            <Box fontWeight="bold">
              <Link href=${connectUrl}>Connect Now →</Link>
            </Box>
          </Box>
        </Page>
      `;
    }
  }

  const tokenInfo = metadata.skTokenInfo;

  if (payload.action === "createSite") {
    const mutation = await createSite(tokenInfo, payload.clientState);

    if (!mutation.data.createSite.success) {
      const pageData = await getPageData(tokenInfo);

      return htm`
        <Page>
          <${NewSitePage} pageData=${pageData} errors=${mutation.data.createSite.errors} />
        </Page>
      `;
    }
  }

  if (payload.action === "createForm") {
    const mutation = await createForm(tokenInfo, payload.clientState);

    if (!mutation.data.createForm.success) {
      const pageData = await getPageData(tokenInfo);

      const site = pageData.data.sites.edges.find(edge => {
        return edge.node.id == payload.clientState.siteId;
      }).node;

      return htm`
        <Page>
          <${NewFormPage} pageData=${pageData} site=${site} errors=${mutation.data.createForm.errors} />
        </Page>
      `;
    }
  }

  const pageData = await getPageData(tokenInfo);

  if (pageData.data.sites.edges.length == 0) {
    return htm`
      <Page>
        <${NewSitePage} pageData=${pageData} errors=${[]} />
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
