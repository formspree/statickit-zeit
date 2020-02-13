const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");
const ValidationError = require("../components/validation_error");

const { STATICKIT_URL } = process.env;

module.exports = ({ pageData }) => {
  const docsUrl = `${STATICKIT_URL}/docs`;

  return htm`
    <Page>
      <Box padding="64px" textAlign="center">
        <Box paddingBottom="16px">
          <H1>Your site is ready to configure!</H1>
        </Box>
        <Box fontWeight="bold">
          <Link href=${docsUrl}>Get started →</Link>
        </Box>
      </Box>
    </Page>
  `;
};
