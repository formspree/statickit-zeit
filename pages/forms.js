const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");

const { STATICKIT_URL } = process.env;

const FormItem = ({ form }) => {
  const submissionsUrl = `${STATICKIT_URL}/sites/${form.site.id}/forms/${form.id}`;

  return htm`
    <Box marginBottom="16px" padding="0 8px" width="50%">
      <Box padding="21.3333px" borderRadius="8px" backgroundColor="white" boxShadow="rgba(0, 0, 0, 0.12) 0px 5px 10px">
        <Box display="flex" paddingBottom="8px">
          <Box flexGrow="1" fontSize="24px" fontWeight="bold" letterSpacing="-0.5px">${form.name}</Box>
          <Box color="#777" fontFamily="monospace" fontSize="14px">
            ${form.key}
          </Box>
        </Box>

        <Box paddingBottom="42px" color="#555" fontSize="16px">
          ${form.site.name}
        </Box>

        <Box display="flex">
          <Box marginRight="16px">
            <Link href=${submissionsUrl} target="_blank">Submissions</Link>
          </Box>
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
