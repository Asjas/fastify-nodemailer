import type {
  FastifyInstance,
  FastifyPluginCallback,
  HookHandlerDoneFunction,
} from "fastify";
import fastifyPlugin from "fastify-plugin";
import nodemailer, { TransportOptions, type Transporter } from "nodemailer";

declare module "fastify" {
  interface FastifyInstance {
    nodemailer: Transporter;
  }
}

declare namespace fastifyNodemailerPlugin {
  export interface NodemailerOptions extends TransportOptions {
    pool?: boolean;
  }

  export const fastifyNodemailerPlugin: FastifyPluginCallback;
  export { fastifyNodemailerPlugin as default };
}

const { createTransport } = nodemailer;

function isPooledOptions(
  options: fastifyNodemailerPlugin.NodemailerOptions,
): boolean {
  return "pool" in options && options.pool === true;
}

function fastifyNodemailer(
  fastify: FastifyInstance,
  options: fastifyNodemailerPlugin.NodemailerOptions,
  done: HookHandlerDoneFunction,
) {
  let transporter: Transporter | null = null;

  try {
    transporter = createTransport(options);
  } catch (err) {
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

export default fastifyPlugin(fastifyNodemailer, {
  fastify: ">5.0.0",
  name: "@asjas/fastify-nodemailer",
});

module.exports.default = fastifyNodemailer;
module.exports.fastifyNodemailer = fastifyNodemailer;
