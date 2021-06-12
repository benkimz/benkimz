var sysImage,sx=0,sy=0,syh=700,syw=700,nw=0,nh=0,ox=0,oy=0,vx=250,vy=250,landImage,smarterr="";

function ResetView(l){
	vx=l;vy=l;
}
function DebugCrop(){
	if(smarterr !== ""){
		alert(smarterr);
	}
}
function SelectImage(elm,landing,scale){
  var cropper=this;
  cropper.scale=true;
  elm.onchange=(function (e){
    const file=e.target.files[0];
    const url=URL.createObjectURL(file);
    var img=new Image();
    img.src=url;
    img.onload=(function (){
      var obj=ReDraw(rawCanvas(),img);
	  sysImage=obj.can;
	  landImage=ViewImage(sysImage);
      landing.innerHTML=null;
      landing.appendChild(landImage);
	  var trimmer=new PromptCrop(sysImage,landImage,img,obj.naturalW,obj.naturalH,obj.startX,obj.startY,obj.canW,obj.canH);
	  trimmer.oncrop=function (e){
		  sysImage=e.data;
		  var event=new ReadyEvent(Standardizer(sysImage,obj.canH,scale));
		  if(cropper["on"+"cropped"]){
		    cropper["on"+"cropped"].call(cropper, event);
	      }
	  };
	  var event=new ReadyEvent(Standardizer(sysImage,obj.canH,scale));
	  if(cropper["on"+"cropped"]){
		  cropper["on"+"cropped"].call(cropper, event);
	  }
    });
  });
}

function ReadyEvent(data){
	this.data=data;
	this.type="Crop";
	this.origin="Cropping script";
	this.message="Your image was processed successfully and is ready for next action.";
	this.errors="";
}

function rawCanvas(){
  var canvas=document.createElement("canvas");
  canvas.height=syh;canvas.width=syw;
  var bctx=canvas.getContext("2d");
  bctx.globalCompositeoperation="destination-over";
  bctx.fillStyle="black";
  bctx.fillRect(0,0,canvas.width,canvas.height);
return canvas;
}
function DmObj(x,y,w,h){
  this.stx=x;
  this.sty=y;
  this.cw=w;
  this.ch=h;
}
function CheckDimensions(x,y){if(x == y && x < syw){return new DmObj(0,0,x,x);}if(x == y && x > syw && x < (2*syw)){return new DmObj(((x/2)-(syw/2)),((y/2)-(syh/2)),syw,syh);}if(x < syw && y < syh){if(x > y){return new DmObj(0,0,y,y);}else{return new DmObj(0,0,x,x);}}if(x > syw && x < (2*syw) && y < syh){return new DmObj(((x/2)-(syw/2)),0,y,y);}if(y > syh && y < (2*syh) && x < syw){return new DmObj(0,((y/2)-(syh/2)),x,x);}if(x !== y && x > syw && x < (2*syw) && y > syh && y < (2*syh)){return new DmObj(((x/2)-(syw/2)),((y/2)-(syh/2)),syw,syh);}if(x > (2*syw) && y > (2*syh)){return new DmObj(((x/2)-syw),((y/2)-syh),(syw*2),(syh*2));}}

function ReDraw(canvas,img){
  var ctx=canvas.getContext("2d");
  ctx.globalCompositeoperation="source-over";
  ctx.clearRect(0,0,canvas.width,canvas.height)
  var bctx=canvas.getContext("2d");
  bctx.globalCompositeoperation="destination-over";
  bctx.fillStyle="black";
  bctx.fillRect(0,0,canvas.width,canvas.height);
  nw=img.width;nh=img.height;
  var dimens=CheckDimensions(nw,nh);
  sx=dimens.stx;sy=dimens.sty;
  canvas.height=dimens.ch;canvas.width=dimens.cw;
  ctx.drawImage(img,(0-sx),(0-sy));
  return {"can":canvas,"naturalH":nh,"naturalW":nw,"startX":(0-sx),"startY":(0-sy),"canH":canvas.height,"canW":canvas.width};
}

function ViewImage(img){
  var canvas=document.createElement("canvas");
  canvas.height=vy;canvas.width=vx;
  var ctx=canvas.getContext("2d");
  ctx.globalCompositeoperation="source-over";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
 return canvas;
}


function canMove(x,y){
	this.mtX=x;
	this.mtY=y;
}
var area,prx=0,pry=0,nwx=0,nwy=0,Xchange,Ychange;
function PromptCrop(sysCan,clientCan,img,w,h,ox,oy,cw,ch){
	var crop=this;
if(w == h && w < syw){area=new canMove(false,false);}if(w !== h && w < syw && h < syh){area=new canMove(false,false);}if(w == h && w == syw){area=new canMove(false,false);}if(w > syw && h < syh){area=new canMove(true,false);}if(h > syh && w < syw){area=new canMove(false,true);}if(w > syw && h > syh){area=new canMove(true,true);}
	//MOUSE EVENTS
	clientCan.addEventListener("mousedown",function (){
		clientCan.addEventListener("mousemove",sysImgMove);
	});
	clientCan.addEventListener("mouseup",function (){
		prx=0;pry=0;
		clientCan.removeEventListener("mousemove",sysImgMove);
	});
	clientCan.addEventListener("mouseover",function (){
		prx=0;pry=0;
		clientCan.removeEventListener("mousemove",sysImgMove);
	});
	clientCan.addEventListener("mouseout",function (){
		prx=0;pry=0;
		clientCan.removeEventListener("mousemove",sysImgMove);
	});
	//TOUCH EVENTS
	clientCan.addEventListener("touchstart",function (){
		clientCan.addEventListener("touchmove",sysImgMove);
	});
	clientCan.addEventListener("touchend",function (){
		prx=0;pry=0;
		clientCan.removeEventListener("touchmove",sysImgMove);
	});
	
	function sysImgMove(e){
nwx=((e.clientX-clientCan.offsetLeft)*(syw/vx));nwy=((e.clientY-clientCan.offsetTop)*(syh/vy));if(!nwx){nwx=((e.changedTouches[0].pageX-clientCan.offsetLeft)*(syw/vx));}if(!nwy){nwy=((e.changedTouches[0].pageY-clientCan.offsetTop)*(syh/vy));}if(prx == 0){prx=nwx;}if(pry == 0){pry=nwy;}Xchange=nwx-prx;Ychange=nwy-pry;
		//MINIMUM SLIDING X=-IMGW,Y=-IMGH //MAXIMUM SLIDING X=IMGW-SYW,Y=IMH-SYH
		var ctx1=sysCan.getContext("2d");
		var ctx2=clientCan.getContext("2d");
		ctx1.globalCompositeoperation="source-over";
		ctx2.globalCompositeoperation="source-over";
		//MOVE X 
		if(area.mtX){
			ox=ox+Xchange;
			if(!(ox < (0-w))){
				if(!(ox > (w-syw))){
					if(ox >= 0){
						ox=0;
					}if(ox <= (0-(w-cw))){
						ox=(0-(w-cw));
					}
					ctx1.clearRect(0,0,sysCan.width,sysCan.height);
					ctx2.clearRect(0,0,clientCan.width,clientCan.height);
					ctx1.drawImage(img,ox,oy);
					ctx2.drawImage(sysCan,0,0,vx,vy);
					prx=nwx;
					// // // // //
                    var event=new CropEvent(sysCan);
                    if(crop["oncrop"]){
						crop["oncrop"].call(crop, event);
					}				
					// // // // //
				}else{
					ox=(w-syw);
				}
			}else{
				ox=(0-syw);
			}
		}
		//MOVE Y 
		if(area.mtY){
			oy=oy+Ychange;
			if(!(oy < (0-h))){
				if(!(oy > (h-syh))){
					if(oy >= 0){
						oy=0;
					}if(oy <= (0-(h-ch))){
						oy=(0-(h-ch));
					}
					ctx1.clearRect(0,0,sysCan.width,sysCan.height);
					ctx2.clearRect(0,0,clientCan.width,clientCan.height);
					ctx1.drawImage(img,ox,oy);
					ctx2.drawImage(sysCan,0,0,vx,vy);
					pry=nwy;
					// // // // //
					var event=new CropEvent(sysCan);
                    if(crop["oncrop"]){
						crop["oncrop"].call(crop, event);
                    }}else{oy=(h-syh);}}else{oy=(0-syh);}
		  
		}
	}
}
function CropEvent(data){
	this.data=data;
	this.origin="prompt crop";
	this.type="trimmer";
	this.name="cropper";
}
function Standardizer(data,l,x){
	if(l < x){
		l=l;
	}else{
		l=x;
	}
	var canvas=document.createElement("canvas");
	canvas.height=l;canvas.width=l;
	var ctx=canvas.getContext("2d");
	ctx.globalCompositeoperation="source-over";
	ctx.drawImage(data,0,0,l,l);
 return canvas;
}