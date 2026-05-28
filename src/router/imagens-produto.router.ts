import { Router } from "express";
import { imagensProdutoController } from "../controllers/imagens-produto.controller";

const imagensProdutoRouter = Router();

imagensProdutoRouter.post("/", (request, response) => {
  return imagensProdutoController.criar(request, response);
});

imagensProdutoRouter.get("/", (request, response) => {
  return imagensProdutoController.listar(request, response);
});

imagensProdutoRouter.get("/produto/:produtoId", (request, response) => {
  return imagensProdutoController.listarPorProduto(request, response);
});

imagensProdutoRouter.get("/:id", (request, response) => {
  return imagensProdutoController.buscarPorId(request, response);
});

imagensProdutoRouter.put("/:id", (request, response) => {
  return imagensProdutoController.atualizar(request, response);
});

imagensProdutoRouter.patch("/:id/principal", (request, response) => {
  return imagensProdutoController.definirPrincipal(request, response);
});

imagensProdutoRouter.delete("/:id", (request, response) => {
  return imagensProdutoController.remover(request, response);
});

export { imagensProdutoRouter };
