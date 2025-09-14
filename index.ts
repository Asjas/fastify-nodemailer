import type { FastifyInstance, HookHandlerDoneFunction } from "fastify";
import fastifyPlugin from "fastify-plugin";
import nodemailer, { TransportOptions, type Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

declare module "fastify" {
  interface FastifyInstance {
    nodemailer: Transporter;
  }
}

const { createTransport } = nodemailer;

type NodemailerOptions = TransportOptions | SMTPTransport.Options;

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

  // Only add the onClose hook if pooling is enabled
  if ("pool" in options && options.pool) {
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
  name: "fastify-nodemailer",
});
