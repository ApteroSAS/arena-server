"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 *
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options
 */
const arena_1 = require("@colyseus/arena");
// Import arena config
const arena_config_1 = __importDefault(require("./arena.config"));
// Create and listen on 2567 (or PORT environment variable.)
//require('events').EventEmitter.prototype._maxListeners = 100;
arena_1.listen(arena_config_1.default);
