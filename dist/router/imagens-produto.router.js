"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagensProdutoRouter = void 0;
const express_1 = require("express");
const imagens_produto_controller_1 = require("../controllers/imagens-produto.controller");
const imagensProdutoRouter = (0, express_1.Router)();
exports.imagensProdutoRouter = imagensProdutoRouter;
imagensProdutoRouter.post("/", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.criar(request, response);
});
imagensProdutoRouter.get("/", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.listar(request, response);
});
imagensProdutoRouter.get("/produto/:produtoId", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.listarPorProduto(request, response);
});
imagensProdutoRouter.get("/:id", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.buscarPorId(request, response);
});
imagensProdutoRouter.put("/:id", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.atualizar(request, response);
});
imagensProdutoRouter.patch("/:id/principal", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.definirPrincipal(request, response);
});
imagensProdutoRouter.delete("/:id", (request, response) => {
    return imagens_produto_controller_1.imagensProdutoController.remover(request, response);
});
