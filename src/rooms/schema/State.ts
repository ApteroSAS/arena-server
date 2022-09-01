import { Schema,type ,MapSchema,filterChildren} from "@colyseus/schema";
export class Filtredata extends Schema{
  @type("boolean") 
  join=false;
  @type("number") lastUpdate=0;
  @type("boolean")
  isMoved=false;
}
export class Player extends Schema {
  @type("number")
  x = this.randCoOrd();
/*
  @type("number")
  y = this.randCoOrd();
  */
  @type("number")
  y = 0;
   @type("number")
  z = 0;
  @type("number")
  xr=0;
  @type("number")
  yr=0;
  @type("string")
  color=this.randomColor();
  @type("number")
  lastUpdate=Date.now();
  @type("string")
  roomId="";
  @type("int64")
  count=0;
  @type("boolean")
  isJoined=false;
  @type({ map: Filtredata }) data = new MapSchema<Filtredata>();
 
  randCoOrd(){
    let x = Math.random() * 2 + 1;
    return x *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
  }
  randomColor(){
    var colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
    let x=Math.floor(Math.random() * (5 + 1) );
    return colors[x];
  }
}
export class State extends Schema {
  
  @filterChildren(function(this:any,client: any, key: any, value: Player,root:State) {  

    // c'est le meme client
    if(client.sessionId==key){
      return true;
    }

    else{
      const currentPlayer = this.players.get(client.sessionId);
      var data=this.players.get(client.sessionId).data.get(key);
      //check if the player joined the room already
      if(!currentPlayer.data.get(key).join){
        const data_=new Filtredata();
        data_.join=true;
        data_.lastUpdate=Date.now();
        this.players.get(client.sessionId).data.set(key,data_);
        return true;
      }
      //the client already joined
      else{
       /* if(value.lastUpdate-data.lastUpdate<0){
          console.log(value.lastUpdate,data.lastUpdate, value.lastUpdate-data.lastUpdate);
        }*/
          var a = value.x - currentPlayer.x;
          var b = value.y - currentPlayer.y;
          var distance=(Math.sqrt(a * a + b * b)) <=2;
          if(distance)
          {
            const data_=new Filtredata();
            data_.join=true;
            data_.lastUpdate=Date.now();
            this.players.get(client.sessionId).data.set(key,data_);
            return true;
          }
          else{
            if(Date.now()-data.lastUpdate>500){
              const data_=new Filtredata();
              data_.join=true;
              data_.lastUpdate=Date.now();
              this.players.get(client.sessionId).data.set(key,data_);
              console.log(value.x);
              return true;
              }
              else{
                return false;
                }

          }
      }
    }
  })
  @type({ map: Player }) players = new MapSchema<Player>();
  @filterChildren(function(this:any,client: any, key: any, value: Player,root:State) { 
    if(client.sessionId==key){
      return true;
    }
    else{
      const currentPlayer = this.players.get(client.sessionId);
      var data=this.playersFromOtherRooms.get(key).data.get(client.sessionId);
      //check if the player joined the room already
      if(!data.join){
        const data_=new Filtredata();
        data_.join=true;
        data_.lastUpdate=Date.now();
        this.playersFromOtherRooms.get(key).data.set(client.sessionId,data_);
        return true;
      }
      //the client already joined
      else{
          var a = value.x - currentPlayer.x;
          var b = value.y - currentPlayer.y;
          var distance=(Math.sqrt(a * a + b * b)) <=2;
          if(distance)
          {
            const data_=new Filtredata();
            data_.join=true;
            data_.lastUpdate=Date.now();
            this.playersFromOtherRooms.get(key).data.set(client.sessionId,data_);
            console.log(value.x);
            return true;
          }
          else{
            if(Math.abs(value.lastUpdate-data.lastUpdate)>500){
              const data_=new Filtredata();
              data_.join=true;
              data_.lastUpdate=Date.now();
              this.playersFromOtherRooms.get(key).data.set(client.sessionId,data_);
              console.log(value.x);
                return true;
              }
              else{
                console.log(value.x);
                return false;
                }

          }
      }
    }

  })
  @type({ map: Player }) playersFromOtherRooms = new MapSchema<Player>();
  @type("int64") clients=0;
  @type("string") event='';
  @type("int64") clientsOtherRooms=0;
  @type("int64") yCord=0;
  movePlayer(sessionId: string, x: number,y:number,xr:number,yr:number,lastUpdate:number,isClient:boolean){

    if(isClient){
     
      this.movePlayerInside(sessionId,x,y,xr,yr,lastUpdate);
    }
    else{
      this.movePlayerFromOtherRoom(sessionId,x,y,xr,yr,lastUpdate);
    }
  }
  // function to move client who belongs to the room
  movePlayerInside(sessionId: string, x: number,y:number,xr:number,yr:number,lastUpdate:number) {
   if(this.players.get(sessionId)!=null)
    {
      this.players.get(sessionId).x=x;
      this.players.get(sessionId).y=y;
      this.players.get(sessionId).xr=xr;
      this.players.get(sessionId).yr=yr;
      this.players.get(sessionId).lastUpdate=lastUpdate;
      this.event='move';
      
    }
}
 
//function to move client who belongs to  other room
  movePlayerFromOtherRoom (sessionId: string, x: number,y:number,xr:number,yr:number,lastUpdate:number) {
    if(this.playersFromOtherRooms.get(sessionId)!=null)
    {
      this.playersFromOtherRooms.get(sessionId).x=x;
      this.playersFromOtherRooms.get(sessionId).y=y;
      this.playersFromOtherRooms.get(sessionId).xr=xr;
      this.playersFromOtherRooms.get(sessionId).yr=yr;
      this.playersFromOtherRooms.get(sessionId).lastUpdate=lastUpdate;

    }   
  }
  updateClient(sessionId:string,isClient:boolean){
    if(isClient){
      this.players.forEach((el,key)=>{
        if(key!=sessionId){
          const data=new Filtredata();
          this.players.get(sessionId).data.set(key,data);
          this.players.get(key).data.set(sessionId,data);
        }
      });
    }
    else{
      
      this.players.forEach((el,key)=>{
          const data=new Filtredata();
          this.playersFromOtherRooms.get(sessionId).data.set(key,data);
      });
    }

  }
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
