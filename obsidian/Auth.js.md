this is the Auth we are gonna use
Docs: https://authjs.dev

```js
app.use('/auth', async (req, res) => {
  const request = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
  };

  const response = await auth(request, res, {
    providers: [
      CredentialsProvider({
        async authorize(credentials) {
          const user = await getUserByEmail(credentials.email);
          if (user && bcrypt.compareSync(credentials.password, user.password)) {
            return { id: user.id, email: user.email };
          }
          return null;
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      EmailProvider({
        server: {
          host: 'smtp.example.com',
          port: 587,
          auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
          },
        },
        from: process.env.EMAIL_FROM,
      }),
    ],
    callbacks: {
      async session({ session, token }) {
        session.user.id = token.sub;
        return session;
      },
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
  });

  res.status(response.status).set(response.headers).send(response.body);
});
```
