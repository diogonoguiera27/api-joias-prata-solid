"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carrinhosRouter = void 0;
const express_1 = require("express");
const carrinhos_controller_1 = require("../controllers/carrinhos.controller");
const carrinhosRouter = (0, express_1.Router)();
exports.carrinhosRouter = carrinhosRouter;
carrinhosRouter.post("/", (request, response) => {
    return carrinhos_controller_1.carrinhosController.criar(request, response);
});
carrinhosRouter.get("/", (request, response) => {
    return carrinhos_controller_1.carrinhosController.listar(request, response);
});
carrinhosRouter.get("/:id", (request, response) => {
    return carrinhos_controller_1.carrinhosController.buscarPorId(request, response);
});
carrinhosRouter.post("/:id/itens", (request, response) => {
    return carrinhos_controller_1.carrinhosController.adicionarItem(request, response);
});
carrinhosRouter.patch("/:id/itens/:itemId", (request, response) => {
    return carrinhos_controller_1.carrinhosController.atualizarQuantidadeItem(request, response);
});
carrinhosRouter.delete("/:id/itens/:itemId", (request, response) => {
    return carrinhos_controller_1.carrinhosController.removerItem(request, response);
});
carrinhosRouter.delete("/:id/limpar", (request, response) => {
    return carrinhos_controller_1.carrinhosController.limpar(request, response);
});
carrinhosRouter.patch("/:id/abandonar", (request, response) => {
    return carrinhos_controller_1.carrinhosController.abandonar(request, response);
});
