import { Router } from "express";
import { clientesController } from "../controllers/clientes.controller";

const clientesRouter = Router();

clientesRouter.post("/", (request, response) => {
  return clientesController.criar(request, response);
});

clientesRouter.get("/", (request, response) => {
  return clientesController.listar(request, response);
});

clientesRouter.get("/:id", (request, response) => {
  return clientesController.buscarPorId(request, response);
});

clientesRouter.put("/:id", (request, response) => {
  return clientesController.atualizar(request, response);
});

clientesRouter.delete("/:id", (request, response) => {
  return clientesController.remover(request, response);
});

export { clientesRouter };
