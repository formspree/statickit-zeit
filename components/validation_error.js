const { htm } = require("@zeit/integration-utils");

function errorFor(field, errors = []) {
  return errors.find(e => {
    return e.field == field;
  });
}

module.exports = ({ field, prefix, errors }) => {
  const error = errorFor(field, errors);

  if (error) {
    return htm`
      <Box color="red" fontWeight="bold" fontSize="13px" marginTop="4px">
        <P>${prefix} ${error.message}</P>
      </Box>
    `;
  } else {
    return htm`<Box></Box>`;
  }
};
