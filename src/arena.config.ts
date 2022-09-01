import Arena from "@colyseus/arena";

import { monitor } from "@colyseus/monitor";
import { MyRoom } from "./rooms/MyRoom";


export default Arena({
    getId: () => "",
    
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        //require('events').EventEmitter.defaultMaxListeners =0;
        gameServer.define(process.env.ROOM_NAME, MyRoom, { maxClients:  process.env.NUM_CLIENT}).enableRealtimeListing();
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
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**s
         * Before before gameServer.listen() is called.
         */
         //require('events').EventEmitter.defaultMaxListeners = 0;
       
    }
});