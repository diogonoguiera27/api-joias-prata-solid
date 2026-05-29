"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const produtos_router_1 = require("./router/produtos.router");
const categorias_router_1 = require("./router/categorias.router");
const variacoes_produto_router_1 = require("./router/variacoes-produto.router");
const imagens_produto_router_1 = require("./router/imagens-produto.router");
const movimentacoes_estoque_router_1 = require("./router/movimentacoes-estoque.router");
const clientes_router_1 = require("./router/clientes.router");
const carrinhos_router_1 = require("./router/carrinhos.router");
const pedidos_router_1 = require("./router/pedidos.router");
const pagamentos_router_1 = require("./router/pagamentos.router");
const cupons_router_1 = require("./router/cupons.router");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (request, response) => {
    return response.json({
        message: "API Joias e Prata SOLID Lab funcionando",
    });
});
app.use("/categorias", categorias_router_1.categoriasRouter);
app.use("/produtos", produtos_router_1.produtosRouter);
app.use("/variacoes-produto", variacoes_produto_router_1.variacoesProdutoRouter);
app.use("/imagens-produto", imagens_produto_router_1.imagensProdutoRouter);
app.use("/movimentacoes-estoque", movimentacoes_estoque_router_1.movimentacoesEstoqueRouter);
app.use("/clientes", clientes_router_1.clientesRouter);
app.use("/carrinhos", carrinhos_router_1.carrinhosRouter);
app.use("/pedidos", pedidos_router_1.pedidosRouter);
app.use("/pagamentos", pagamentos_router_1.pagamentosRouter);
app.use("/cupons", cupons_router_1.cuponsRouter);
const port = process.env.PORT || 3333;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
