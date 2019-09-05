const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");
const ValidationError = require("../components/validation_error");

module.exports = ({ pageData, errors }) => {
  const firstAccount = pageData.data.accounts.edges[0].node;

  return htm`
    ${
      errors.length > 0
        ? htm`<Box marginBottom="16px"><Notice type="error">Uh oh! Check for errors below.</Notice></Box>`
        : ""
    }

    <${Header} viewer=${pageData.data.viewer} />

    <Box maxWidth="740px" margin="0 auto">
      <Fieldset>
        <FsContent>
          <H2>Create a form</H2>
          <P>Just give your form a name and you'll be on your way!</P>

          <Box margin="16px 0">
            <Input name="name" label="Form Name" value="" placeholder="e.g. Contact Form" width="75%" />
            <${ValidationError} field="name" prefix="Name" errors=${errors} />
          </Box>

          <Box fontWeight="500" fontSize="14px" color="black">Site</Box>

          <Select name="accountId" value=${firstAccount.id}>
            ${pageData.data.accounts.edges.map(
              edge =>
                htm`<Option value=${edge.node.id} caption=${edge.node.name} />`
            )}
          </Select>
        </FsContent>
        <FsFooter display="flex">
          <Box display="flex" flexGrow="1" justifyContent="flex-start">
            <P>Choose a descriptive name for your form.</P>
          </Box>
          <Box display="flex" flexGrow="0" justifyContent="flex-end">
            <Button small action="createForm">Create Form</Button>
          </Box>
        </FsFooter>
      </Fieldset>
    </Box>
  `;
};
