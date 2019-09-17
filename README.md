# StaticKit + ZEIT Now Integration

This ZEIT addon connects with a StaticKit account and allows you to create and manage forms from the ZEIT interface.

## Development Environment

Install dependencies:

```
npm install
```

Then, copy the `.env.template` file to `.env` and populate with your local env variables:

```
cp .env.template .env
```

Finally, use `now dev --listen 5005` to boot it up locally.

In production, use Now Secrets to populate the environment variables.
