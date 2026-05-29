"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtosRouter = void 0;
const express_1 = require("express");
const produtos_controller_1 = require("../controllers/produtos.controller");
const produtosRouter = (0, express_1.Router)();
exports.produtosRouter = produtosRouter;
produtosRouter.post("/", (request, response) => {
    return produtos_controller_1.produtosController.criar(request, response);
});
produtosRouter.get("/", (request, response) => {
    return produtos_controller_1.produtosController.listar(request, response);
});
produtosRouter.get("/slug/:slug", (request, response) => {
    return produtos_controller_1.produtosController.buscarPorSlug(request, response);
});
produtosRouter.get("/:id", (request, response) => {
    return produtos_controller_1.produtosController.buscarPorId(request, response);
});
produtosRouter.put("/:id", (request, response) => {
    return produtos_controller_1.produtosController.atualizar(request, response);
});
produtosRouter.patch("/:id/desativar", (request, response) => {
    return produtos_controller_1.produtosController.desativar(request, response);
});
produtosRouter.patch("/:id/ativar", (request, response) => {
    return produtos_controller_1.produtosController.ativar(request, response);
});
produtosRouter.delete("/:id", (request, response) => {
    return produtos_controller_1.produtosController.remover(request, response);
});
