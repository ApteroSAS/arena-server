# Arena Colyseus server template
// add the disc

# Features
TypeScript supported

## Technical Documentation

- [Colyseus](https://www.colyseus.io/)
- [Typescript](https://www.typescriptlang.org/docs/)
## Structure

- `index.ts`: main entry point, register an empty room handler.
- `src/rooms/MyRoom.ts`: a room handler to implement  the server logic.
- `src/rooms/schema/MyRoomState.ts`: a schema used in the  room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `ts-node-dev index.ts`
        - `npm test`: runs mocha test suite
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file.
- `arena.env / development.env`:These files are used to manage the environmental variable for your Colyseus Server.arena.env will be loaded by default while hosting on Arena Cloud.
- `Lib`:This folder will only be created after running npm run build for the first time. This will contain the files that need to be uploaded to Arena Cloud.
- `Arena.config.ts `:In this file you can make additional modifications that are required to define both of the room name and the maximum number of the allowed clients into connect to the room.

## Installation

1.Clone the repository
```
git clone https://github.com/ApteroSAS/arena-client.git
```

2.To be able to  run  the server code locally, you'll need to enter to folder, and install the required dependencies first
```
cd my-colyseus-app
npm install
```
3.To configure the server,go to the development.env and  the arena.env  files and  set the room name and the maximum number of the allowed clients to connect into the room.
```typescript
ROOM_NAME=my_room
NUM_CLIENTS=10
```
Go to the Arena.config.ts file and define the ROOM_NAME and the NUM_CLIENTS
```typescript
import Arena from "@colyseus/arena";
import { MyRoom } from "./rooms/MyRoom";
export default Arena({
  getId: () => "",
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer
      .define(process.env.ROOM_NAME, MyRoom, {
        maxClients: process.env.NUM_CLIENT,
      })
      .enableRealtimeListing();
  },
  initializeExpress: (app) => {
    require("events").EventEmitter.defaultMaxListeners = 0;
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {},
});
```
## How to run

```
npm run build
npm run start
```
It will spawn a web socket server, listening on ws://localhost:2657.

## Colyseus Room and State
A Room class is designed to implement server logic, and serve as a communication channel among a group of clients. The rooms are created at the clients request.

```typescript
import { Room, Client } from "colyseus";

export class MyRoom extends Room {
    // When room is initialized
    onCreate (options: any) { 
    //when a client who belongs to this room sends a message with data
    this.onMessage("action",(client:Client,data:any)) {
        console.log(client.sessionId, "sent 'action' message: ", message);
    }
    }
    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any) { 
        console.log(client,"joined!");
    }
    // When a client leaves the room
    onLeave (client: Client, consented: boolean) {    

    }
    //The room is beign destroyed
    //Rooms are disposed automatically when the last client disconnects
    onDispose () { }
}
```
## Room State 
Each room holds its own state. The mutations of the state are synchronized automatically to all connected clients, When the user successfully joins the room, they receive from the from the server the full state.
A client can be connected to multiple rooms.
Each room connection has its own WebSocket connection.
Patches are broadcasted at every 50ms by default,customizable via this.setPatchRate(ms).
```typescript
export class Player extends Schema {
  // the player position
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type("number")
  z = 0;
}
// the room state class
export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
```
## how Colyseus Rooms use the state 
```typescript
import { State,Player} from "./schema/State";
class MyRoom extends Room {

  onCreate(options) {
    // set the room state
    this.setState(new State());
  }

  onJoin(client, options) {
    const sessionId=client.sessionId;
    const player=new Player();
    this.state.players.set(sessionId,client);
  }
}
```

## Sending Messages 
```typescript
export class MyRoom extends Room {
    // When room is initialized
    onCreate (options: any) { 

this.onMessage(client, message) {
    this.broadcast("world!");//Send message send to all clients who belong to this room
    this.send(client, "world!");//Send message to a single client
}
    }
}
```
## Handling reconnection
The allowReconnection callback allows the specified client to reconnect into the room. 
The callback must be used inside onLeave () method.
Reconnection will be cancelled after the time provided.
```typescript
class MyRoom extends Room {
  async onLeave(client, consented: boolean) {
    try {
      if (consented) {
        throw new Error("consented leave"); //room.leave() was called from the client
      }
      await this.allowReconnection(client, 20); //Hold client's sessionId for 20 seconds
      //the client successfully connected
      console.log("Client successfully reconnected!");
    } catch (e) {
      this.state.players.delete(client.sessionId);
      console.log("Could not reconnect."); //if there is no reconnection in 20 s the promise will be rejected
    }
  }
}
```
## Communication between Rooms
Every Room instance, has a presence property, The purpose of  presence is to allow communicating and sharing data between different processes. You may use its API to persist data and communicate between rooms via PUB/SUB.
# Room state
```typescript
export class Player extends Schema {
  // the player position
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type("number")
  z = 0;
}
// the room state class
export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Player }) playersFromOtherRooms = new MapSchema<Player>();
}
```
# Room handler class
```typescript
import { Room, Client } from "colyseus";
import { State, Player } from "./schema/State";
import { setTimeout } from "timers";
export class MyRoom extends Room<State> {
  onCreate(options: any) {
    this.setState(new State());
    const players = this.state.players;
    const roomId = this.roomId;
    const data = { players, roomId };
    //all the rooms will receive the newRoomCreated message
    this.presence.subscribe("newRoomCreated", (data: any) => {
      if (this.roomId != data.roomId) {
        // if its the room that publish the newRoomCreated message
      } else {
        //add your logic
      }
    });
    //when a room is created it publish a  newRoomCreated  message to the others rooms
    //the room sends its clients and id to the other rooms.
    this.presence.publish("newRoomCreated", data);
    //all the rooms will receive the join message
    this.presence.subscribe("join", (data: any) => {
      //add your logic here
    });
    //all the rooms will receive the leave message
    this.presence.subscribe("leave", (sessionId: any) => {
      if (this.state.playersFromOtherRooms.get(sessionId) != null) {
        this.state.playersFromOtherRooms.delete(sessionId);
      }
    });
  }

  onJoin(client: Client, options: any) {
    //create Player instance
    const player = new Player();
    let sessionId = client.sessionId;
    player.roomId = this.roomId;
    const data = { player, sessionId };
    //add the client to the  players map
    this.state.players.set(sessionId, player);
    //this room will publish  a join  message to all other rooms informing them that a client has joined the room.
    this.presence.publish("join", data);
  }

  async onLeave(client: Client, consented: boolean) {
    try {
      if (consented) {
        throw new Error("consented leave");
      }
      await this.allowReconnection(client, 20);
    } catch (e) {
      //delete the player from the players map
      this.state.players.delete(client.sessionId);
      //this room will publish a  leave message to all other rooms informing them that a client has to leave.
      this.presence.publish("leave", client.sessionId);
    }
  }
}

```
## State Filters
// to add 
## Load Test
The loadTest tool is useful when you'd like to battle test your server and see how it is going to perform on a live environment.
# How to run
```
npm run build
npm test 
```
# Usage
The test command requires a few arguments to work:

--script: The custom  worker script the tool is going to use

--endpoint: Your server endpoint (If you want to run your server locally, go to https://github.com/ApteroSAS/arena-server.git,by default uses local server ws://localhost:2567)

--room: Name of the room you'd like to connect to

--numClients: Number of clients you'd like to connect into the room.

# Example 
You'll need two terminal windows open to be able to run this. One for the server, and one for the test:
Connecting 2 clients into a "my_room" room
```
npm test -- --room my_room --numClients 2 --script worker.js
```
