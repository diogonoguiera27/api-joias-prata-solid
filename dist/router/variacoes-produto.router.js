"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variacoesProdutoRouter = void 0;
const express_1 = require("express");
const variacoes_produto_controller_1 = require("../controllers/variacoes-produto.controller");
const variacoesProdutoRouter = (0, express_1.Router)();
exports.variacoesProdutoRouter = variacoesProdutoRouter;
variacoesProdutoRouter.post("/", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.criar(request, response);
});
variacoesProdutoRouter.get("/", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.listar(request, response);
});
variacoesProdutoRouter.get("/produto/:produtoId", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.listarPorProduto(request, response);
});
variacoesProdutoRouter.get("/:id", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.buscarPorId(request, response);
});
variacoesProdutoRouter.put("/:id", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.atualizar(request, response);
});
variacoesProdutoRouter.patch("/:id/estoque", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.atualizarEstoque(request, response);
});
variacoesProdutoRouter.patch("/:id/desativar", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.desativar(request, response);
});
variacoesProdutoRouter.patch("/:id/ativar", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.ativar(request, response);
});
variacoesProdutoRouter.delete("/:id", (request, response) => {
    return variacoes_produto_controller_1.variacoesProdutoController.remover(request, response);
});
