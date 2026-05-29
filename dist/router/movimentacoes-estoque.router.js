"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movimentacoesEstoqueRouter = void 0;
const express_1 = require("express");
const movimentacoes_estoque_controller_1 = require("../controllers/movimentacoes-estoque.controller");
const movimentacoesEstoqueRouter = (0, express_1.Router)();
exports.movimentacoesEstoqueRouter = movimentacoesEstoqueRouter;
movimentacoesEstoqueRouter.post("/", (request, response) => {
    return movimentacoes_estoque_controller_1.movimentacoesEstoqueController.criar(request, response);
});
movimentacoesEstoqueRouter.get("/", (request, response) => {
    return movimentacoes_estoque_controller_1.movimentacoesEstoqueController.listar(request, response);
});
movimentacoesEstoqueRouter.get("/variacao/:variacaoId", (request, response) => {
    return movimentacoes_estoque_controller_1.movimentacoesEstoqueController.listarPorVariacao(request, response);
});
movimentacoesEstoqueRouter.get("/:id", (request, response) => {
    return movimentacoes_estoque_controller_1.movimentacoesEstoqueController.buscarPorId(request, response);
});
