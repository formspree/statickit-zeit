import { withUiHook } from "@zeit/integration-utils";

let count = 0;

export default withUiHook(({ payload }) => {
  count += 1;
  return `
    <Page>
      <P>Counter: ${count}</P>
      <Button>Count Me</Button>
    </Page>
  `;
});
