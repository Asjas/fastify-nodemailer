import type {
  FastifyInstance,
  FastifyPluginCallback,
  HookHandlerDoneFunction,
} from "fastify";
import fastifyPlugin from "fastify-plugin";
import * as nodemailerLib from "nodemailer";
import { TransportOptions, type Transporter } from "nodemailer";
import SMTPPool from "nodemailer/lib/smtp-pool";
import SMTPTransport from "nodemailer/lib/smtp-transport";

declare module "fastify" {
  interface FastifyInstance {
    nodemailer: Transporter;
  }
}

declare namespace nodemailer {
  export const fastifyNodemailerPlugin: FastifyPluginCallback;
  export { fastifyNodemailerPlugin as default };
}

const { createTransport } = nodemailerLib;

interface PooledOptions extends SMTPPool.Options {
  pool: true;
}

interface NonPooledSMTPOptions extends SMTPTransport.Options {
  pool?: false | undefined;
}

type NodemailerOptions =
  | PooledOptions
  | NonPooledSMTPOptions
  | TransportOptions;

function isPooledOptions(options: NodemailerOptions): options is PooledOptions {
  return "pool" in options && options.pool === true;
}

function fastifyNodemailerPlugin(
  fastify: FastifyInstance,
  options: NodemailerOptions,
  done: HookHandlerDoneFunction,
) {
  let transporter: Transporter | null = null;

  try {
    transporter = createTransport(options);
  } catch (err) {
    // Ensure err is treated as an Error or convert it to an Error
    const error = err instanceof Error ? err : new Error(String(err));
    return done(error);
  }

  fastify.decorate("nodemailer", transporter);

  if (isPooledOptions(options)) {
    fastify.addHook("onClose", handleClose);
  }

  done();
}

function handleClose(fastify: FastifyInstance, done: HookHandlerDoneFunction) {
  fastify.nodemailer.close();
  done();
}

export default fastifyPlugin(fastifyNodemailerPlugin, {
  fastify: ">5.0.0",
  name: "@asjas/fastify-nodemailer",
});

module.exports.default = fastifyNodemailerPlugin;
module.exports.fastifyNodemailerPlugin = fastifyNodemailerPlugin;
