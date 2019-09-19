const { parse: parseUrl } = require("url");
const cookie = require("cookie");

const { STATICKIT_URL, STATICKIT_CLIENT_ID, ROOT_URL } = process.env;

module.exports = (req, res) => {
  console.log(process.env);

  const { query } = parseUrl(req.url, true);
  if (!query.next) {
    res.writeHead(403);
    res.end("Query param next is required");
    return;
  }

  const state = `state_${Math.random()}`;
  const callbackUrl = `${ROOT_URL}/callback`;
  const redirectUrl = `${STATICKIT_URL}/oauth/authorize?client_id=${STATICKIT_CLIENT_ID}&redirect_uri=${callbackUrl}&state=${state}&scope=read+write&response_type=code`;
  const context = { next: query.next, state };

  res.writeHead(302, {
    Location: redirectUrl,
    "Set-Cookie": cookie.serialize("sk-context", JSON.stringify(context), {
      path: "/"
    })
  });

  res.end("Redirecting...");
};
