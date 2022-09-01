"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = exports.Player = exports.Filtredata = void 0;
const schema_1 = require("@colyseus/schema");
class Filtredata extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.join = false;
        this.lastUpdate = 0;
        this.isMoved = false;
    }
}
__decorate([
    schema_1.type("boolean")
], Filtredata.prototype, "join", void 0);
__decorate([
    schema_1.type("number")
], Filtredata.prototype, "lastUpdate", void 0);
__decorate([
    schema_1.type("boolean")
], Filtredata.prototype, "isMoved", void 0);
exports.Filtredata = Filtredata;
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = this.randCoOrd();
        /*
          @type("number")
          y = this.randCoOrd();
          */
        this.y = 0;
        this.z = 0;
        this.xr = 0;
        this.yr = 0;
        this.color = this.randomColor();
        this.lastUpdate = Date.now();
        this.roomId = "";
        this.count = 0;
        this.isJoined = false;
        this.data = new schema_1.MapSchema();
    }
    randCoOrd() {
        let x = Math.random() * 2 + 1;
        return x *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
    }
    randomColor() {
        var colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
        let x = Math.floor(Math.random() * (5 + 1));
        return colors[x];
    }
}
__decorate([
    schema_1.type("number")
], Player.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "y", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "z", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "xr", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "yr", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "color", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "lastUpdate", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "roomId", void 0);
__decorate([
    schema_1.type("int64")
], Player.prototype, "count", void 0);
__decorate([
    schema_1.type("boolean")
], Player.prototype, "isJoined", void 0);
__decorate([
    schema_1.type({ map: Filtredata })
], Player.prototype, "data", void 0);
exports.Player = Player;
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.playersFromOtherRooms = new schema_1.MapSchema();
        this.clients = 0;
        this.event = '';
        this.clientsOtherRooms = 0;
        this.yCord = 0;
        /*
        moveClient(sessionId:string){
          this.players.forEach((el,key)=>{
            if(key!=sessionId){
              const  data=this.players.get(key).data.get(sessionId);
              data.isMoved=true;
              this.players.get(key).data.set(sessionId,data);
            }
          });
        }*/
    }
    movePlayer(sessionId, x, y, xr, yr, lastUpdate, isClient) {
        if (isClient) {
            this.movePlayerInside(sessionId, x, y, xr, yr, lastUpdate);
        }
        else {
            this.movePlayerFromOtherRoom(sessionId, x, y, xr, yr, lastUpdate);
        }
    }
    // function to move client who belongs to the room
    movePlayerInside(sessionId, x, y, xr, yr, lastUpdate) {
        if (this.players.get(sessionId) != null) {
            this.players.get(sessionId).x = x;
            this.players.get(sessionId).y = y;
            this.players.get(sessionId).xr = xr;
            this.players.get(sessionId).yr = yr;
            this.players.get(sessionId).lastUpdate = lastUpdate;
            this.event = 'move';
        }
    }
    //function to move client who belongs to  other room
    movePlayerFromOtherRoom(sessionId, x, y, xr, yr, lastUpdate) {
        if (this.playersFromOtherRooms.get(sessionId) != null) {
            this.playersFromOtherRooms.get(sessionId).x = x;
            this.playersFromOtherRooms.get(sessionId).y = y;
            this.playersFromOtherRooms.get(sessionId).xr = xr;
            this.playersFromOtherRooms.get(sessionId).yr = yr;
            this.playersFromOtherRooms.get(sessionId).lastUpdate = lastUpdate;
        }
    }
    updateClient(sessionId, isClient) {
        if (isClient) {
            this.players.forEach((el, key) => {
                if (key != sessionId) {
                    const data = new Filtredata();
                    this.players.get(sessionId).data.set(key, data);
                    this.players.get(key).data.set(sessionId, data);
                }
            });
        }
        else {
            this.players.forEach((el, key) => {
                const data = new Filtredata();
                this.playersFromOtherRooms.get(sessionId).data.set(key, data);
            });
        }
    }
}
__decorate([
    schema_1.filterChildren(function (client, key, value, root) {
        // c'est le meme client
        if (client.sessionId == key) {
            return true;
        }
        else {
            const currentPlayer = this.players.get(client.sessionId);
            var data = this.players.get(client.sessionId).data.get(key);
            //check if the player joined the room already
            if (!currentPlayer.data.get(key).join) {
                const data_ = new Filtredata();
                data_.join = true;
                data_.lastUpdate = Date.now();
                this.players.get(client.sessionId).data.set(key, data_);
                return true;
            }
            //the client already joined
            else {
                /* if(value.lastUpdate-data.lastUpdate<0){
                   console.log(value.lastUpdate,data.lastUpdate, value.lastUpdate-data.lastUpdate);
                 }*/
                var a = value.x - currentPlayer.x;
                var b = value.y - currentPlayer.y;
                var distance = (Math.sqrt(a * a + b * b)) <= 2;
                if (distance) {
                    const data_ = new Filtredata();
                    data_.join = true;
                    data_.lastUpdate = Date.now();
                    this.players.get(client.sessionId).data.set(key, data_);
                    return true;
                }
                else {
                    if (Date.now() - data.lastUpdate > 500) {
                        const data_ = new Filtredata();
                        data_.join = true;
                        data_.lastUpdate = Date.now();
                        this.players.get(client.sessionId).data.set(key, data_);
                        console.log(value.x);
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
        }
    }),
    schema_1.type({ map: Player })
], State.prototype, "players", void 0);
__decorate([
    schema_1.filterChildren(function (client, key, value, root) {
        if (client.sessionId == key) {
            return true;
        }
        else {
            const currentPlayer = this.players.get(client.sessionId);
            var data = this.playersFromOtherRooms.get(key).data.get(client.sessionId);
            //check if the player joined the room already
            if (!data.join) {
                const data_ = new Filtredata();
                data_.join = true;
                data_.lastUpdate = Date.now();
                this.playersFromOtherRooms.get(key).data.set(client.sessionId, data_);
                return true;
            }
            //the client already joined
            else {
                var a = value.x - currentPlayer.x;
                var b = value.y - currentPlayer.y;
                var distance = (Math.sqrt(a * a + b * b)) <= 2;
                if (distance) {
                    const data_ = new Filtredata();
                    data_.join = true;
                    data_.lastUpdate = Date.now();
                    this.playersFromOtherRooms.get(key).data.set(client.sessionId, data_);
                    console.log(value.x);
                    return true;
                }
                else {
                    if (Math.abs(value.lastUpdate - data.lastUpdate) > 500) {
                        const data_ = new Filtredata();
                        data_.join = true;
                        data_.lastUpdate = Date.now();
                        this.playersFromOtherRooms.get(key).data.set(client.sessionId, data_);
                        console.log(value.x);
                        return true;
                    }
                    else {
                        console.log(value.x);
                        return false;
                    }
                }
            }
        }
    }),
    schema_1.type({ map: Player })
], State.prototype, "playersFromOtherRooms", void 0);
__decorate([
    schema_1.type("int64")
], State.prototype, "clients", void 0);
__decorate([
    schema_1.type("string")
], State.prototype, "event", void 0);
__decorate([
    schema_1.type("int64")
], State.prototype, "clientsOtherRooms", void 0);
__decorate([
    schema_1.type("int64")
], State.prototype, "yCord", void 0);
exports.State = State;
