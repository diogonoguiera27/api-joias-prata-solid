import { Router } from "express";
import { variacoesProdutoController } from "../controllers/variacoes-produto.controller";

const variacoesProdutoRouter = Router();

variacoesProdutoRouter.post("/", (request, response) => {
  return variacoesProdutoController.criar(request, response);
});

variacoesProdutoRouter.get("/", (request, response) => {
  return variacoesProdutoController.listar(request, response);
});

variacoesProdutoRouter.get("/produto/:produtoId", (request, response) => {
  return variacoesProdutoController.listarPorProduto(request, response);
});

variacoesProdutoRouter.get("/:id", (request, response) => {
  return variacoesProdutoController.buscarPorId(request, response);
});

variacoesProdutoRouter.put("/:id", (request, response) => {
  return variacoesProdutoController.atualizar(request, response);
});

variacoesProdutoRouter.patch("/:id/estoque", (request, response) => {
  return variacoesProdutoController.atualizarEstoque(request, response);
});

variacoesProdutoRouter.patch("/:id/desativar", (request, response) => {
  return variacoesProdutoController.desativar(request, response);
});

variacoesProdutoRouter.patch("/:id/ativar", (request, response) => {
  return variacoesProdutoController.ativar(request, response);
});

variacoesProdutoRouter.delete("/:id", (request, response) => {
  return variacoesProdutoController.remover(request, response);
});

export { variacoesProdutoRouter };
