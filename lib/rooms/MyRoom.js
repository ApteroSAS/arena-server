"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const colyseus_1 = require("colyseus");
const State_1 = require("./schema/State");
const timers_1 = require("timers");
class MyRoom extends colyseus_1.Room {
    onCreate(options) {
        this.setState(new State_1.State());
        this.maxClients = options.maxClients;
        const players = this.state.players;
        const roomId = this.roomId;
        // const room=this;
        const data = { players, roomId };
        this.setSeatReservationTime(10000);
        //this.setPatchRate(500);
        this.presence.subscribe('newRoomCreated', (data) => {
            if (this.roomId != data.roomId) {
                let players = new Array();
                let i = 0;
                this.state.players.forEach((value, key) => {
                    // if(data.room.state.playersFromOtherRooms.get(key)==null)
                    //{
                    const player = this.state.players.get(key);
                    const client = { player, key };
                    players.push(client);
                    i++;
                    //}
                });
                const id = this.roomId;
                const createDate = this.listing.createdAt;
                var y = 0;
                if (players[0] != null) {
                    y = players[0].player.y;
                }
                const clients = { players, id, i, createDate, y };
                this.presence.publish('sendDatatoRoom', clients);
            }
        });
        this.presence.subscribe('sendDatatoRoom', (val) => {
            if (this.roomId != val.id) {
                const data = new Date(val.createDate);
                if (data > this.listing.createdAt && this.state.yCord <= val.y) {
                    //console.log('');
                }
                else {
                    this.state.yCord = val.y + 1;
                }
                val.players.forEach((element) => {
                    const player = new State_1.Player();
                    player.x = element.player.x;
                    player.y = element.player.y;
                    player.z = element.player.z;
                    player.xr = element.player.xr;
                    player.yr = element.player.yr;
                    player.color = element.player.color;
                    player.roomId = element.player.roomId;
                    let n;
                    n = timers_1.setTimeout(() => { this.state.playersFromOtherRooms.set(element.key, player); }, 500);
                });
            }
        });
        this.presence.publish('newRoomCreated', data);
        this.presence.subscribe('join', (data) => {
            if (!this.state.playersFromOtherRooms.get(data.sessionId) && this.state.players.get(data.sessionId) == null) {
                const player = new State_1.Player();
                player.x = data.player.x;
                player.y = data.player.y;
                player.z = data.player.z;
                player.xr = data.player.xr;
                player.yr = data.player.yr;
                player.color = data.player.color;
                player.roomId = data.player.roomId;
                player.count = 0;
                let n;
                n = timers_1.setTimeout(() => { this.state.playersFromOtherRooms.set(data.sessionId, player); }, 500);
                this.state.clientsOtherRooms++;
            }
            this.state.updateClient(data.sessionId, this.roomId == data.player.roomId);
        });
        //add the filter decorator in the state to filter sending state using the date
        this.presence.subscribe('update', (data) => {
            this.state.movePlayer(data.sessionId, data.player.x, data.player.y, data.player.xr, data.player.yr, data.player.lastUpdate, this.roomId == data.roomId);
        });
        this.presence.subscribe('leave', (sessionId) => {
            if (this.state.playersFromOtherRooms.get(sessionId) != null) {
                this.state.playersFromOtherRooms.delete(sessionId);
            }
        });
        this.onMessage('move', (client, player) => {
            const sessionId = client.sessionId;
            const roomId = this.roomId;
            const player_r = { player, sessionId, roomId };
            //this.setPatchRate(15);
            // this.state.moveClient(sessionId);
            this.presence.publish('update', player_r);
        });
    }
    onJoin(client, options) {
        //create Player instance
        const player = new State_1.Player();
        let sessionId = client.sessionId;
        player.roomId = this.roomId;
        player.y = this.state.yCord;
        //player.isJoined=true;
        const data = { player, sessionId };
        this.state.clients++;
        this.state.event = 'join';
        this.state.players.set(sessionId, player);
        this.presence.publish('join', data);
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (consented) {
                    throw new Error("consented leave");
                }
                // allow disconnected client to reconnect into this room until 120 seconds
                yield this.allowReconnection(client, 20);
            }
            catch (e) {
                console.log('failed');
                // 20 seconds expired. let's remove the client.
                this.state.players.delete(client.sessionId);
                this.presence.publish('leave', client.sessionId);
            }
        });
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
exports.MyRoom = MyRoom;
