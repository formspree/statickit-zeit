const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");

const { STATICKIT_URL } = process.env;

const FormItem = ({ form }) => {
  const href = `${STATICKIT_URL}/sites/${form.site.id}/forms/${form.id}`;

  return htm`
    <Box marginBottom="16px" padding="0 8px" width="50%">
      <Box padding="16px" borderRadius="8px" backgroundColor="white" boxShadow="rgba(0, 0, 0, 0.12) 0px 5px 10px">
        <Box display="flex" paddingBottom="4px" fontWeight="bold">
          <Box flexGrow="1" fontSize="21px">
            <Link href=${href} target="_blank">${form.name}</Link>
          </Box>
          <Box color="#777" fontFamily="monospace" fontSize="14px">
            ${form.id}
          </Box>
        </Box>

        <Box paddingBottom="36px" color="#555" fontSize="14px">
          ${form.site.name}
        </Box>

        <Box color="#777">
          <Link href=${href} target="_blank">View Installation Guide →</Link>
        </Box>
      </Box>
    </Box>
  `;
};

module.exports = ({ pageData }) => {
  const forms = pageData.data.forms.edges.map(edge => {
    return edge.node;
  });

  return htm`
    <${Header} viewer=${pageData.data.viewer} sites=${pageData.data.sites} />

    <Box display="flex" flexWrap="wrap" boxSizing="border-box" margin="0 -8px" minHeight="100px">
      ${forms.map(form => htm`<${FormItem} form=${form} />`)}
    </Box>
  `;
};
