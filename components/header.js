const { htm } = require("@zeit/integration-utils");

module.exports = ({ viewer, sites }) => htm`
  <Box marginBottom="20px" display="flex" alignItems="center" fontSize="13px">
    <Box flexGrow="1" color="#666">
      <P>Connected to <B>${
        viewer.email
      }</B> · <Link action="disconnect">Disconnect</Link></P>
    </Box>

    <Box marginRight="4px" display="flex" alignItems="center">
      <Box>
        <Link href="https://statickit.com/docs" target="_blank">Docs</Link>
      </Box>
      ${
        sites.edges.length > 0
          ? htm`<Box marginLeft="16px"><Button type="secondary" small action="newForm">+ New Form</Button></Box>`
          : ""
      }
    </Box>
  </Box>
`;
