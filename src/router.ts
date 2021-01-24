import {} from "koa";

export enum RouteError {
  InterfacePathIllegal = "Interface path is not legal",
  ControllerFileNotExist = "Controller file does not exist",
  ControllerNotExist = "Controller does not exist",
  ActionNotExist = "Action does not exist",
  ActionReserved = "Action name is reserved name",
  ServerHasNoOutput = "The server does not have any output",
}

export async function route(ctx: ,path: string) {

}
