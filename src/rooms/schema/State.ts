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
    return true;
  })
  @type({ map: Player }) players = new MapSchema<Player>();
  @filterChildren(function(this:any,client: any, key: any, value: Player,root:State) { 
      return true;
  })
  @type({ map: Player }) playersFromOtherRooms = new MapSchema<Player>();
  @type("int64") clients=0;
  @type("string") event='';
  @type("int64") clientsOtherRooms=0;
  @type("int64") yCord=0;
  @type({ map: Player }) players2 = new MapSchema<Player>();
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
      this.players2.get(sessionId).x=x;
      this.players2.get(sessionId).y=y;
      this.players2.get(sessionId).xr=xr;
      this.players2.get(sessionId).yr=yr;
      this.players2.get(sessionId).lastUpdate=lastUpdate;      
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
