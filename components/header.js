const { htm } = require("@zeit/integration-utils");

module.exports = ({ viewer }) => htm`
  <Box marginBottom="20px" display="flex" alignItems="center">
    <Box flexGrow="1" color="#666">
      <P>Connected to <B>${viewer.email}</B></P>
    </Box>
    <Button type="secondary" small action="disconnect">Disconnect</Button>
  </Box>
`;
