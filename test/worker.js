"use strict";
const { Room, Client } = require("colyseus.js");
const { resolve } = require("path");
const { workerData, parentPort, isMainThread } = require("worker_threads");
// deux cas : le worker gere un seul client , ou bien le worker il gere une salle
const options = {
  endpoint: workerData.endpoint,
  roomName: workerData.roomName,
};
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
async function connect() {
  const tryReconnect = () => {
    console.log("try to reconnect");
    setTimeout(() => connect(), 0);
  };
  let client = new Client(options.endpoint);
  return await client
    .joinOrCreate(options.roomName)
    .then((res) => {
      var message = "join";
      parentPort.postMessage(message);
      return res;
      // return room;
    })
    .catch((e) => {
      console.log("JOIN ERROR", e);
      tryReconnect();
    });
}
try {
  (async () => {
    connect().then(function (room) {
      room.onError(() => {
        var message = "error";
        parentPort.postMessage(message);
        console.log("error");
      });
      room.onLeave(() => {
        var message = "leave";
        parentPort.postMessage(message);
      });
      let x = 0,
        y = 0,
        xr = 0,
        yr = 0;
      room.state.players.onAdd = (player, key) => {
        if (room.sessionId == key) {
          x = player.x;
          y = player.y;
          xr = player.xr;
          yr = player.yr;
        }
      };

      setInterval(function () {
        x = x + 1;
        y=y+0.5;
        //xr=xr+0.01;
        //yr=yr+0.01;
        if (x >= 2) {
          x = x * -1;
        }

        if (y >= 2) {
          y = y * -1;
        }
        room.send("move", {
          x: x,
          y: y,
          xr: xr,
          yr: yr,
          lastUpdate: Date.now(),
        });
      },5000);
      // the value is 15
    });
    /*
room.state.players.onAdd = (player,key) => {
        if (room.sessionId == key) {
             x=player.x;
             y=player.y;
             
             room.send('move',{x:x+0.04,
                y:y+0.04,
                xr:0,
                yr:0,
                });
        }
        
        player.onChange = (changes) => {
            if (room.sessionId == key) {
               // x=changes[0].value;
                //y=changes[1].value;
                let x=player.x;
                let y=player.y;
                if(x>=2){
                    x*=-1;
                }
                if(y>=2){
                    y*=-1;
                }
                
                room.send('move',{x:x+0.04,
                    y:y+0.04,
                    xr:0,
                    yr:0,
                    });
                };
            }   
    }
*/
  })();
} catch (error) {
  console.log("error worker", error);
}
