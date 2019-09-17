const { htm } = require("@zeit/integration-utils");
const Header = require("../components/header");
const ValidationError = require("../components/validation_error");

module.exports = ({ pageData, errors }) => {
  return htm`
    ${
      errors.length > 0
        ? htm`<Box marginBottom="16px"><Notice type="error">Uh oh! Check for errors below.</Notice></Box>`
        : ""
    }

    <${Header} viewer=${pageData.data.viewer} sites=${pageData.data.sites} />

    <Box maxWidth="740px" margin="0 auto">
      <Fieldset>
        <FsContent>
          <H1>Create a site</H1>
          <P>Once you add your site to StaticKit, you can start creating forms.</P>
          
          <Box marginTop="16px">
            <Input name="name" label="Site Name" value="" placeholder="e.g. Marketing Site" width="75%" />
          </Box>
          <${ValidationError} field="name" prefix="Name" errors=${errors} />
        </FsContent>
        <FsFooter display="flex">
          <Box display="flex" flexGrow="1" justifyContent="flex-start">
            <P>Choose a descriptive name for your site.</P>
          </Box>
          <Box display="flex" flexGrow="0" justifyContent="flex-end">
            <Button small action="createSite">Create site</Button>
          </Box>
        </FsFooter>
      </Fieldset>
    </Box>
  `;
};
