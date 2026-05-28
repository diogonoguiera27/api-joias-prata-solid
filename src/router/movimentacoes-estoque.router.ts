import { Router } from "express";
import { movimentacoesEstoqueController } from "../controllers/movimentacoes-estoque.controller";

const movimentacoesEstoqueRouter = Router();

movimentacoesEstoqueRouter.post("/", (request, response) => {
  return movimentacoesEstoqueController.criar(request, response);
});

movimentacoesEstoqueRouter.get("/", (request, response) => {
  return movimentacoesEstoqueController.listar(request, response);
});

movimentacoesEstoqueRouter.get("/variacao/:variacaoId", (request, response) => {
  return movimentacoesEstoqueController.listarPorVariacao(request, response);
});

movimentacoesEstoqueRouter.get("/:id", (request, response) => {
  return movimentacoesEstoqueController.buscarPorId(request, response);
});

export { movimentacoesEstoqueRouter };
