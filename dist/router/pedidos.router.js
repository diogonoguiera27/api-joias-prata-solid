"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosRouter = void 0;
const express_1 = require("express");
const pedidos_controller_1 = require("../controllers/pedidos.controller");
const pedidosRouter = (0, express_1.Router)();
exports.pedidosRouter = pedidosRouter;
pedidosRouter.post("/", (request, response) => {
    return pedidos_controller_1.pedidosController.criar(request, response);
});
pedidosRouter.get("/", (request, response) => {
    return pedidos_controller_1.pedidosController.listar(request, response);
});
pedidosRouter.get("/:id", (request, response) => {
    return pedidos_controller_1.pedidosController.buscarPorId(request, response);
});
pedidosRouter.patch("/:id/status", (request, response) => {
    return pedidos_controller_1.pedidosController.atualizarStatus(request, response);
});
pedidosRouter.patch("/:id/cancelar", (request, response) => {
    return pedidos_controller_1.pedidosController.cancelar(request, response);
});
