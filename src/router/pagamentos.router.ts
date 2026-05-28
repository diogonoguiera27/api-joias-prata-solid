import { Router } from "express";
import { pagamentosController } from "../controllers/pagamentos.controller";

const pagamentosRouter = Router();

pagamentosRouter.post("/", (request, response) => {
  return pagamentosController.criar(request, response);
});

pagamentosRouter.get("/", (request, response) => {
  return pagamentosController.listar(request, response);
});

pagamentosRouter.get("/:id", (request, response) => {
  return pagamentosController.buscarPorId(request, response);
});

pagamentosRouter.patch("/:id/aprovar", (request, response) => {
  return pagamentosController.aprovar(request, response);
});

pagamentosRouter.patch("/:id/recusar", (request, response) => {
  return pagamentosController.recusar(request, response);
});

pagamentosRouter.patch("/:id/cancelar", (request, response) => {
  return pagamentosController.cancelar(request, response);
});

pagamentosRouter.patch("/:id/reembolsar", (request, response) => {
  return pagamentosController.reembolsar(request, response);
});

export { pagamentosRouter };
