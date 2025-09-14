# @asjas/fastify-nodemailer

A Fastify plugin to integrate [Nodemailer](https://nodemailer.com/) for sending emails. This plugin allows you to share a single Nodemailer transporter instance across your Fastify server, simplifying email functionality in your application.

## Features

- Seamless integration with Fastify's plugin system.
- Share a single Nodemailer transporter across your server.
- Support for SMTP connection pooling for improved performance.
- Compatibility with Fastify's encapsulation for multiple transports.
- TypeScript support for type-safe development.

## Install

```bash
npm i --save-exact @asjas/fastify-nodemailer
```

## Compatibility

The plugin supports the following `Fastify` and `Nodemailer` versions.

NPM Version | Branch | Fastify | Nodemailer | End of support
--------|--------|---------|------------|---------------
1.x | [main](https://github.com/asjas/fastify-nodemailer) | 5.x | 7.x | TBD

## Usage

Register the plugin with your Fastify server and provide Nodemailer transport options. The options passed to `register` are forwarded to Nodemailer's `createTransport` function. Refer to the [Nodemailer documentation](https://nodemailer.com/usage/) for detailed configuration options.

### Example

```js
import Fastify from 'fastify';
import fastifyNodemailerPlugin from '@asjas/fastify-nodemailer';

const fastify = Fastify();

fastify.register(fastifyNodemailerPlugin, {
  host: 'smtp.example.com',
  port: 587,
  secure: false, // Use true for port 465, false for other ports
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password',
  },
});

// Example route to send an email
fastify.post('/send-email', async (request, reply) => {
  try {
    const info = await fastify.nodemailer.sendMail({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email!',
    });
    return { message: 'Email sent', info };
  } catch (err) {
    fastify.log.error('Error sending email:', err);
    reply.status(500).send({ error: 'Failed to send email' });
  }
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running on http://localhost:3000');
});
```

## Connection Pooling

For applications sending multiple emails, you can enable SMTP connection pooling to improve performance by reusing connections. Configure pooling by setting `pool: true` and related options:

```js
fastify.register(fastifyNodemailerPlugin, {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password',
  },
  pool: true, // Enable connection pooling
  maxConnections: 5, // Maximum concurrent connections (default: 5)
  maxMessages: 50, // Maximum messages per connection (default: 100)
  rateLimit: 5, // Maximum 5 emails per second
  rateDelta: 1000, // Rate limit window (1 second)
});
```

See the [Nodemailer SMTP documentation](https://nodemailer.com/smtp/pooled/) for more details on pooling options.

## Multiple Transports

Thanks to Fastify's [encapsulation](https://www.fastify.io/docs/latest/Reference/Encapsulation/), you can register multiple instances of the plugin with different transporters in separate contexts. For example:

```js
fastify.register(async (instance) => {
  instance.register(fastifyNodemailerPlugin, {
    host: 'smtp.service1.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user1@service1.com',
      pass: 'password1',
    },
  });
  instance.post('/send-email-service1', async (request, reply) => {
    // Use service1 transporter
    await instance.nodemailer.sendMail({ /* email options */ });
  });
});

fastify.register(async (instance) => {
  instance.register(fastifyNodemailerPlugin, {
    host: 'smtp.service2.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user2@service2.com',
      pass: 'password2',
    },
  });
  instance.post('/send-email-service2', async (request, reply) => {
    // Use service2 transporter
    await instance.nodemailer.sendMail({ /* email options */ });
  });
});
```

## License

Licensed under [MIT](./LICENSE).
