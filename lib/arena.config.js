"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arena_1 = __importDefault(require("@colyseus/arena"));
const monitor_1 = require("@colyseus/monitor");
const MyRoom_1 = require("./rooms/MyRoom");
exports.default = arena_1.default({
    getId: () => "",
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        //require('events').EventEmitter.defaultMaxListeners =0;
        gameServer.define(process.env.ROOM_NAME, MyRoom_1.MyRoom, { maxClients: process.env.NUM_CLIENT }).enableRealtimeListing();
    },
    // options:{presence: new RedisPresence()},
    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        require('events').EventEmitter.defaultMaxListeners = 0;
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });
        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor_1.monitor());
    },
    beforeListen: () => {
        /**s
         * Before before gameServer.listen() is called.
         */
        //require('events').EventEmitter.defaultMaxListeners = 0;
    }
});
