import { Logger, ILogObj } from "tslog";

const log: Logger<ILogObj> = new Logger();

log.silly("Hello from logger!");

export { log };
