"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesRouter = void 0;
const express_1 = require("express");
const clientes_controller_1 = require("../controllers/clientes.controller");
const clientesRouter = (0, express_1.Router)();
exports.clientesRouter = clientesRouter;
clientesRouter.post("/", (request, response) => {
    return clientes_controller_1.clientesController.criar(request, response);
});
clientesRouter.get("/", (request, response) => {
    return clientes_controller_1.clientesController.listar(request, response);
});
clientesRouter.get("/:id", (request, response) => {
    return clientes_controller_1.clientesController.buscarPorId(request, response);
});
clientesRouter.put("/:id", (request, response) => {
    return clientes_controller_1.clientesController.atualizar(request, response);
});
clientesRouter.delete("/:id", (request, response) => {
    return clientes_controller_1.clientesController.remover(request, response);
});
