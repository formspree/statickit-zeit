const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");
const ValidationError = require("../components/validation_error");

module.exports = ({ pageData, account, errors }) => {
  return htm`
    ${
      errors.length > 0
        ? htm`<Box marginBottom="16px"><Notice type="error">Uh oh! Check for errors below.</Notice></Box>`
        : ""
    }

    <${Header} viewer=${pageData.data.viewer} />

    <Box paddingBottom="16px" marginBottom="24px" borderBottom="1px solid #eaeaea">
      <H1>${account.name}</H1>
    </Box>

    <Box maxWidth="740px" margin="0 auto">
      <Fieldset>
        <FsContent>
          <H2>Create a form</H2>
          <P>Just give your form a name and you'll be on your way!</P>
          <ClientState accountId=${account.id} />
          <Box marginTop="16px">
            <Input name="name" label="Form Name" value="" placeholder="e.g. Contact Form" width="75%" />
          </Box>
          <${ValidationError} field="name" prefix="Name" errors=${errors} />
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
