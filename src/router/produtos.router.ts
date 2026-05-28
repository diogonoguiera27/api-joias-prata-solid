import { Router } from "express";
import { produtosController } from "../controllers/produtos.controller";

const produtosRouter = Router();

produtosRouter.post("/", (request, response) => {
  return produtosController.criar(request, response);
});

produtosRouter.get("/", (request, response) => {
  return produtosController.listar(request, response);
});

produtosRouter.get("/slug/:slug", (request, response) => {
  return produtosController.buscarPorSlug(request, response);
});

produtosRouter.get("/:id", (request, response) => {
  return produtosController.buscarPorId(request, response);
});

produtosRouter.put("/:id", (request, response) => {
  return produtosController.atualizar(request, response);
});

produtosRouter.patch("/:id/desativar", (request, response) => {
  return produtosController.desativar(request, response);
});

produtosRouter.patch("/:id/ativar", (request, response) => {
  return produtosController.ativar(request, response);
});

produtosRouter.delete("/:id", (request, response) => {
  return produtosController.remover(request, response);
});

export { produtosRouter };
