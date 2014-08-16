angular.module("template/canvas-draw.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/canvas-draw.html",
    "<div class=\"canvas-container height-100\" >\n" +
    "    <div id=\"reset-control\" class=\"custom-ctrl-map\" ng-show=\"isEditable\">\n" +
    "        <button  class=\"reset-btn btn btn-default\" href=\"\" data-ng-click=\"resetPolygon()\"><i class=\"icon-remove\"></i></button>\n" +
    "        <button ng-hide=\"isMapLocation\" ng-class=\"{'active':displayRooms}\" class=\"reset-btn btn btn-default\" data-ng-click=\"toggleRooms()\"><i class=\"icon-building\"></i></button>\n" +
    "        <button  ng-class=\"{'active':isEditBtnActive}\" class=\"reset-btn btn btn-default\" data-ng-click=\"toggleEditMode()\"><i class=\"icon-edit\"></i></button>\n" +
    "        <span ng-hide=\"isMapLocation\" ng-bind=\"objectInfo.text\"></span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"canvas-box height-80\">\n" +
    "        <canvas    ng-style=\"imageBgStyle\" height=\"{{imgHeight}}\" width=\"{{imgWidth}}\" dXata-ng-style=\"{'width':imgWidth,'height':imgHeight}\" hXeight=\"500\" wXidth=\"500\" ></canvas>\n" +
    "    </div>\n" +
    "</div>");
}]);
