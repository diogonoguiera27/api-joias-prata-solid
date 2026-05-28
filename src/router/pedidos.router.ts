import { Router } from "express";
import { pedidosController } from "../controllers/pedidos.controller";

const pedidosRouter = Router();

pedidosRouter.post("/", (request, response) => {
  return pedidosController.criar(request, response);
});

pedidosRouter.get("/", (request, response) => {
  return pedidosController.listar(request, response);
});

pedidosRouter.get("/:id", (request, response) => {
  return pedidosController.buscarPorId(request, response);
});

pedidosRouter.patch("/:id/status", (request, response) => {
  return pedidosController.atualizarStatus(request, response);
});

pedidosRouter.patch("/:id/cancelar", (request, response) => {
  return pedidosController.cancelar(request, response);
});

export { pedidosRouter };
