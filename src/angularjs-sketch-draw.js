/**
 * Created by Maciek on 2014-06-29.
 */

angular.module('angularjs.sketch.draw', [])
    .directive('mjCanvasDraw', function () {

        var options={

            styleRed:{
                fillStyle:'rgba(255,0,0,0.4)',
                lineCol:'rgba(255,0,0,1)',
                lineWidth:1
            },
            styleGreen:{
                fillStyle:'rgba(26,198,0,0.4)',
                lineCol : 'rgba(26,198,0,1)',
                lineWidth:1
            },
            styleCircle:{
                fillStyle:'rgba(255,255,255,1)',
                lineCol:'rgba(255,0,0,1)',
                lineWidth:1

            }

        }


        var linker=function(scope, element, iAttrs, mjCanvasDrawCtrl){
            mjCanvasDrawCtrl.init(element);
        };

        var controller = function ($scope) {
            var self=this,
                scope=$scope,
                canvas,$canvas, context,
                isPolygonClosed=false,
                allRoomsForNode=null,

                canvasData=scope.canvasData,
                polygonPoints=[],
                anchor=[],
                movePointsStart=[],
                shapePointsOrg=[]; //helper points when moving shape

            // console.log(canvasData,' canvasData')

            //text for object info
            scope.objectInfo={text:''};
            //flag for checking if shape is currently make
            var isCreatingShape=false;


            this.init=function(element){
                self.$element=element;

                //create canvas
                canvas  = self.$element.find('canvas')[0];
                $canvas = angular.element(canvas);
                context = canvas.getContext('2d');




                $canvas.on('click',function(e){
                    self.onCanvasClick(e);
                });

                $canvas.on('mousemove',function(e){
                    self.onCanvasMouseMove(e);
                });

                $canvas.on('mousedown',function(e){

                    self.onCanvasMouseDown(e);
                });
                /* $canvas.on('mouseover',function(e){
                 self.onCanvasMouseOver(e);
                 })*/

                $canvas.on('mouseup',function(e){
                    anchor=[];
                    shapePointsOrg=[];
                    movePointsStart=[];
                    saveImage(canvas);
                })

            };

            //watch if background image is changing
            scope.$watch('bgImg',function(img){

                if(img!=null && img!=undefined){
                    //clear canvas
                    clearAll();

                    scope.imageBgStyle={'background-image':'url('+img.src+')'};
                    //set background  image

    //TODO-mat:when dynamic change canvas size then don't draw shape first time
                    context.canvas.width=scope.imgWidth;
                    context.canvas.height=scope.imgHeight;


                    if(canvasData && canvasData.shape && canvasData.shape.length>0){

                        drawShape(canvasData.shape,options.styleRed);

                    }
                }
                else //reset map
                {

                    clearAll();
                    scope.imageBgStyle={'background-image':''};
                }

            });

            //watch if canvas is editable
            scope.$watch('isEditable',function(value){
                scope.isEditable=value;
            });

            //watch if member is changed
            scope.$watch('canvasData',function(value){

                scope.isEditBtnActive=false;
                scope.displayRooms=false;
                canvasData=value;
                if(!scope.isNurseCall && value!=null) {

                    allRoomsForNode = getRoomsForParentNode();
                }
                else {
                    allRoomsForNode = canvasData;

                    if(allRoomsForNode!==undefined && allRoomsForNode!==null)
                        showRooms();
                    else
                        hideRooms();

                }
            });


            this.onCanvasClick=function(e){
                if(!scope.isEditable)
                    return;

                /*if(isPolygonClosed && scope.isEditBtnActive)
                 clearEditedShape();*/

                if(scope.isEditBtnActive && !isPolygonClosed)
                    editingShape.savePoint(e);
                else if(!scope.isMapLocation)
                    displayShapeInfo(e);

            }


            this.onCanvasMouseMove=function(e){
    //console.log(movePointsStart, !isCreatingShape, anchor);

                if(anchor.length==2 && !isCreatingShape){ //reedit shape

                    var x = getMousePosition(e).x,
                        y = getMousePosition(e).y;

                    if(anchor[0]==0 && anchor[1]==1){
                        canvasData.shape.splice(anchor[0],1,x);
                        canvasData.shape.splice(anchor[1],1,y);
                        canvasData.shape[canvasData.shape.length-2]=x;
                        canvasData.shape[canvasData.shape.length-1]=y;
                    }
                    else{
                        canvasData.shape.splice(anchor[0],1,x);
                        canvasData.shape.splice(anchor[1],1,y);
                    }


                    context.clearRect(0, 0, canvas.width, canvas.height);
                    if(scope.displayRooms){
                        showRooms();
                    }



                    drawShape(canvasData.shape,options.styleRed);

                    drawPointCircles(canvasData.shape,options.styleCircle);
                    /*editingShape.refreshShape(canvasData.shape);

                     context.strokeStyle = options.styleRed.lineCol;
                     context.fillStyle = options.styleRed.fillStyle;*/

                    //editingShape.moveToNextPoint(e);

                }
                else if(movePointsStart.length==2 && !isCreatingShape){ //move shape
                    var xP = getMousePosition(e).x,
                        yP = getMousePosition(e).y,
                        xD=xP-movePointsStart[0],
                        yD=yP-movePointsStart[1];

                    for(var i=0;i<shapePointsOrg.length;i++){
                        if(i%2==0) {
                            canvasData.shape[i]=shapePointsOrg[i]+xD;
                        }
                        else{
                            //var cy=shapePointsOrg[i]+yD
                            canvasData.shape[i]=shapePointsOrg[i]+yD;
                        }
                    }


                    context.clearRect(0, 0, canvas.width, canvas.height);
                    if(scope.displayRooms){
                        showRooms();
                    }

                    drawShape(canvasData.shape,options.styleRed);

                    drawPointCircles(canvasData.shape,options.styleCircle);


                }
                else if(isCreatingShape){ //during creating shape


                    context.clearRect(0, 0, canvas.width, canvas.height);
                    if(scope.displayRooms){
                        showRooms();
                    }

                    editingShape.refreshShape(polygonPoints);

                    context.strokeStyle = options.styleRed.lineCol;

                    editingShape.moveToNextPoint(e);
                }

            }

            /* this.onCanvasMouseOver=function(e){
             var currentX = getMousePosition(e).x,
             currentY=  getMousePosition(e).y;

             var isInPath=context.isPointInPath(currentX,currentY);

             if(isInPath)
             $canvas.css('cursor','move');
             else
             $canvas.css('cursor','default');


             }*/

            this.onCanvasMouseDown=function(e){
                console.log(isPolygonClosed,scope.isEditBtnActive);
                anchor=[];
                movePointsStart=[];
                shapePointsOrg=[];

                if(!scope.isEditable)
                    return;

                if(scope.isEditBtnActive && isPolygonClosed){
                    var currentX = getMousePosition(e).x,
                        currentY=  getMousePosition(e).y,
                        diffX=null,
                        diffY=null;



                    var points=canvasData.shape;
                    /* var diffX=Math.abs((firstX-currentX)/((firstX+currentX)/2))*100,
                     diffY=Math.abs((firstY-currentY)/((firstY+currentY)/2))*100;*/

                    for(var i=0;i<points.length;i++){
                        if(i%2==0) {
                            diffX = Math.abs((points[i]-currentX)/((points[i]+currentX)/2))*100;
                            if(diffX<5)
                                anchor[0]=i;
                        }
                        else {
                            diffY = Math.abs((points[i] - currentY) / ((points[i] + currentY) / 2)) * 100;
                            if(diffY<5 && anchor.length==1) //x and y must be near each other
                                anchor[1]=i;
                            else
                                anchor=[];
                        }

                        if(anchor.length==2){
                            console.log(anchor, ' anchor')
                            return
                        }

                    }

                    var isInPath=context.isPointInPath(currentX,currentY);
                    if(isInPath){
                        movePointsStart=[currentX,currentY];
                        shapePointsOrg=angular.copy(canvasData.shape);
                    }


                }
            }

            var displayShapeInfo=function(e){

                var currentX = getMousePosition(e).x,
                    currentY=  getMousePosition(e).y,
                    shapes = {id:null,rooms:[]};


                if(scope.displayRooms)
                    shapes = angular.copy(allRoomsForNode);


                if(canvasData && canvasData.shape && canvasData.shape.length>0){
                    var editedRoom={shape:canvasData.shape,roomType:canvasData.roomType};

                    shapes.rooms.unshift(editedRoom);
                }

                if(shapes.rooms.length>0)
                {

                    var roomsInOrg=shapes.rooms;

                    for(var figure=0;figure<roomsInOrg.length;figure++)
                    {

                        drawShape(roomsInOrg[figure].shape,null);

                        var isInPath=context.isPointInPath(currentX,currentY);
                        if(isInPath){
                            scope.$apply(function(){
                                scope.objectInfo.text=roomsInOrg[figure].roomType.type;
                            });
                            return;
                        }
                        else{
                            scope.$apply(function(){
                                scope.objectInfo.text='';
                            });
                        }

                    }
                }
            }


            var getMousePosition = function (evt) {

                return {
                    /*x: evt.pageX - canvas.offsetLeft,
                     y: evt.pageY - canvas.offsetTop -50*/
                    x: evt.offsetX,
                    y: evt.offsetY
                };
            };


            var editingShape={
                refreshShape:function(shape){
                    var howMany=shape.length;

                    context.lineWidth = options.styleRed.lineWidth;
                    context.strokeStyle = options.styleRed.lineCol;

                    context.beginPath();
                    context.moveTo(shape[0], shape[1]);


                    for(var i=2;i<howMany;i++){
                        if(i%2==0)
                            var x=shape[i];
                        else
                            var y=shape[i];

                        if(i%2!=0){
                            context.lineTo(x, y);
                            context.stroke();
                        }

                    }
                },
                savePoint:function(evt){
                    //mark that currently is creating shape
                    isCreatingShape=true;

                    var currentX = getMousePosition(evt).x,
                        currentY = getMousePosition(evt).y;

                    polygonPoints.push(currentX);
                    polygonPoints.push(currentY);


                    var firstX=polygonPoints[0],
                        firstY=polygonPoints[1];

                    var diffX=Math.abs((firstX-currentX)/((firstX+currentX)/2))*100,
                        diffY=Math.abs((firstY-currentY)/((firstY+currentY)/2))*100;


                    context.lineWidth = options.styleRed.lineWidth;
                    context.strokeStyle = options.styleRed.lineCol;
                    context.fillStyle = options.styleRed.fillStyle;

                    if(polygonPoints.length>4 && diffX<=5 && diffY<=5){
                        //replace last points of first
                        polygonPoints[polygonPoints.length-2]=firstX;
                        polygonPoints[polygonPoints.length-1]=firstY;
                        polygon.end(polygonPoints);
                        //circle.draw(currentX,currentY);
                        drawPointCircles(polygonPoints,options.styleCircle);
                        isPolygonClosed=true;
                        if(!scope.isMapLocation){
                            saveImage(canvas);
                            var iconUrl=canvasData.roomType.icon;

                        }
                        else{
                            console.log('save location');
                        }
                        isCreatingShape=false;
                        return;
                    }

                    if(polygonPoints.length==4) {
                        polygon.start(polygonPoints);
                        circle.draw(currentX,currentY);
                    }

                    if(polygonPoints.length>4){
                        polygon.draw(currentX,currentY);
                        circle.draw(currentX,currentY);
                    }

                },

                moveToNextPoint:function(e){

                    var howMany=polygonPoints.length;

                    if(howMany>2)
                    {
                        var previousX=polygonPoints[howMany-2];
                        var previousY=polygonPoints[howMany-1];
                    }
                    else
                    {
                        var previousX=polygonPoints[0];
                        var previousY=polygonPoints[1];
                    }
                    context.moveTo(previousX, previousY);

                    var x = getMousePosition(e).x,
                        y = getMousePosition(e).y;

                    context.lineTo(x, y);
                    context.stroke();
                }
            };



            var drawShape=function(shape,options){


                var howMany=shape.length,
                    currentX=null,
                    currentY=null;

                if(options!=null){
                    context.lineWidth = options.lineWidth;
                    context.strokeStyle = options.lineCol;
                    context.fillStyle = options.fillStyle;
                    //set the style of drawing
                    context.lineJoin = 'miter';
                    context.lineCap = 'round';
                }
                else{

                    context.lineWidth = 0;
                    context.strokeStyle = 'transparent';
                    context.fillStyle = 'transparent';
                }

                polygon.start(shape);

                for(var i=4;i<howMany-2;i++){
                    if(i%2==0)
                        currentX=shape[i];
                    else
                        currentY=shape[i];

                    if(i%2!=0)
                        polygon.draw(currentX,currentY);
                }
                polygon.end(shape);

            }

            var drawPointCircles=function(points,options){
                var currentX=null,
                    currentY=null;

                if(options!=null){
                    context.lineWidth = options.lineWidth;
                    context.strokeStyle = options.lineCol;
                    context.fillStyle = options.fillStyle;

                }

                for(var i=0;i<points.length-2;i++){
                    if(i%2==0)
                        currentX=points[i];
                    else
                        currentY=points[i];

                    if(i%2!=0)
                        circle.draw(currentX,currentY);
                }

            }

           /* var drawIconOnShape=function(iconUrl,shape){

                var x= 0,
                    y= 0,
                    howMany=shape.length-2;

                for(var i=0;i<howMany;i++){
                    if(i%2!=0)
                        y=y+parseInt(shape[i]);
                    else
                        x=x+parseInt(shape[i]);
                }
                x=x/(howMany/2);
                y=y/(howMany/2);

                var icon = new Image();
                icon.onload = function(){

                    //scope.$apply(function(){
                    context.drawImage(icon,x,y);
                    //});

                };
                icon.src=iconUrl;
            }*/



            var polygon={
                start:function(points){

                    //context.save();
                    context.beginPath();
                    context.moveTo(points[0], points[1]);
                    context.lineTo(points[2], points[3]);
                    context.stroke();
                },
                draw:function(x,y){
                    context.lineTo(x, y);
                    context.stroke();

                },
                end:function(points){
                    context.lineTo(points[0], points[1]);
                    context.stroke();
                    context.fill();


                }
            }

            var circle={

                draw:function(x,y){

                    context.beginPath();
                    context.arc(x, y, 4, 0, 2 * Math.PI, false);
                    context.fill();
                    context.stroke();

                }
            }

            var clearAll = function () {

                context.clearRect(0, 0, canvas.width, canvas.height);
                polygonPoints=[];
                isPolygonClosed=false;
                //setImage(bgImage);
                scope.displayRooms=false;

                return false;
            };

            var clearEditedShape = function () {

                context.clearRect(0, 0, canvas.width, canvas.height);
                polygonPoints=[];
                canvasData.shape=[];
                isPolygonClosed=false;

                if(scope.displayRooms){
                    showRooms();
                }

                return false;
            };

            var saveImage=function(canvas){
                //var createdShape=canvas.toDataURL();
                polygonPoints=canvasData.shape;
                if(!scope.isMapLocation){
        //            nurseCallSrv.saveRoom(polygonPoints);
                }
            }

            var clearEditedCircle=function(){
                context.clearRect(0, 0, canvas.width, canvas.height);
                if(isPolygonClosed) {
                    drawShape(canvasData.shape, options.styleRed);

                }
                if(scope.displayRooms){
                    showRooms();
                }
            }


            scope.resetPolygon=function(){
                clearEditedShape();
            }

            scope.displayRooms=false;
            scope.toggleRooms=function(){
                scope.displayRooms=!scope.displayRooms;
                if(scope.displayRooms)
                    showRooms();
                else
                    hideRooms();
            }

            scope.isEditBtnActive=false;
            scope.toggleEditMode=function(){
                scope.isEditBtnActive=!scope.isEditBtnActive;
                isPolygonClosed=true;
                if(scope.isEditBtnActive)
                    drawPointCircles(canvasData.shape,options.styleCircle);
                else
                    clearEditedCircle();
            }



            var showRooms=function(){
                // var roomsCollection=getRoomsForParentNode();

                var roomsInOrg=allRoomsForNode.rooms;

                if(roomsInOrg===undefined)
                    return;

                for(var figure=0;figure<roomsInOrg.length;figure++)
                {
                    drawShape(roomsInOrg[figure].shape,options.styleGreen);

                }
            }

            var hideRooms = function () {

                context.clearRect(0, 0, canvas.width, canvas.height);
                if(canvasData && canvasData.shape && canvasData.shape.length>0){
                    drawShape(canvasData.shape,options.styleRed);
                    if(canvasData.roomType && canvasData.roomType.icon){
                       //

                    }

                    if(scope.isEditBtnActive)
                        drawPointCircles(canvasData.shape,options.styleCircle);
                }
                return false;
            };


            var getRoomsForParentNode=function(){
                if(canvasData && canvasData.parentId)
                    return  false;//nurseCallSrv.getRoomsForOrg(canvasData.parentId);
                else return -1;
            }

        };

        return {
            restrict: 'E',
            replace: true,
            scope: {
                //ngModel: '=?',
                src: '@',
                imgWidth: '@',
                imgHeight: '@',
                lineOpacity: '@',
                bgImg:'=',
                isEditable:'=',
                isMapLocation:'=',
                canvasData:"=",
                isNurseCall:'@'
                //saveRoom:"="
            },
            templateUrl: 'template/canvas-draw.html',
            link:linker,
            controller:controller

        };
    });
