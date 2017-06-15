/*
 * Author: Robert Molnar 2
 */

// --------------------------------------------------------------------------------------------------------------------
// -- Viewer2d Class --


function Viewer2D(guidelines) {

	/** The GuideLines class.
	*/
	this.guidelines = guidelines;

	// The view offset.
	var height = parseInt($("#my2dview").data("height"));
	var width = parseInt($("#my2dview").data("width"));
	this.view_offset_x = 200 + ((width-200) / 2);
	this.view_offset_y = height / 2;
	/** The view scale multiplier
	*/
	this.scale_multiplier = 20;

	// The x,y position in shedbuilder coordinates for the viewer 0,0 position.
	this.view_zero_shedbuilder_x = this.view_offset_x / this.scale_multiplier * -1;
	this.view_zero_shedbuilder_y = this.view_offset_y / this.scale_multiplier * -1;

	/** Force grey. If true then when anything is drawn it will be in grey.
	*/
	this.grey_mode = false;

	/** Force black. If true then when anything is drawn it will be in black.
	*/
	this.black_mode = false;

	/** The canvas which we will use paper.js. 
	*/
	this.canvas = document.getElementById('my2dview'); 
}

/** This will convert from the canvas coordinates to shed builder coordinates.
 * @param canvasPos is the mouse position.
 * @return RTVector2D of the shed builder coordinates.
*/
Viewer2D.prototype.canvasToBuilderCoordinates = function(canvasPos) {

	shedx = (canvasPos.x - this.view_offset_x) / this.scale_multiplier;
	shedy = (canvasPos.y - this.view_offset_y) / this.scale_multiplier;

	return new RTVector2D(shedx, shedy);
}

/** Initialize the Viewer2D.
*/
Viewer2D.prototype.init = function() {
	paper.setup(this.canvas);
}

/** This will render the 2d view.
*/
Viewer2D.prototype.render = function() {
	var workshed = this.guidelines.workShed;

	// clean up the canvas.
	paper.project.activeLayer.removeChildren();

	// Loop throught each wall.
	for (var i=0; i < workshed.ltWorkWalls.length; i++) {
		// Work wall.
		var workwall = workshed.ltWorkWalls[i];

		// Should the wall be greyed out?
		this.grey_mode = false;
		if (this.guidelines.selectedWall != null && workwall != this.guidelines.selectedWall)
			this.grey_mode = true;

		// The wall itself being rendered.		
	//	var path = workwall.line.toPaperLine(250, 250, 20);
	//	path.strokeColor = 'black';

		// Render the measurement for the wall.
		var measurementLine = workwall.line.newCopy();
		measurementLine.moveAway(2.5);
		this.drawMeasurement(measurementLine);
		this.drawMeasurementOutsideItems(workwall, 1.5);
		this.drawMeasurementInsideItems(workwall, -1.5);

		// Dray the wall.
		this.drawWall(workwall);
	}
	this.grey_mode = false;

	this.drawDragableItems(workshed);

	// Draw the view now:
	paper.view.draw();
}

/** This will draw the measurements for a given wall's outside items, ie, anything that cuts a hole into the wall.
 * @param workwall is the working wall to get measurements for.
 * @param scaleAway is the distance away from the wall to draw the measurements.
*/
Viewer2D.prototype.drawMeasurementOutsideItems = function(workwall, distanceAway) {
	// 1.) convert items to a list of start and end points in a 1 dimension list.
	var ltNumbers = workwall.getStartEndPointsForOutsideItems();

	// 2.) using the 1 dimension list draw out lines for each start and end point.

	// points are paired together as start-stop.
	var count = ltNumbers.length / 2;
	if (count == 1)
		return;

	var line = workwall.line;
	for (var i=0; i < count; i++) {
		var startPos = ltNumbers[i*2];
		var endPos = ltNumbers[i*2+1];

		var divLine = line.subLine(startPos, endPos);
		divLine.moveAway(distanceAway);
		this.drawMeasurement(divLine);
	}
};

/** This will draw the measurements for a given wall's inside items, ie, anything that does not cuts a hole into the wall.
 * @param workWall is the working wall to get measurements for.
 * @param scaleAway is the distance away from the wall to draw the measurements.
*/
Viewer2D.prototype.drawMeasurementInsideItems = function(workwall, distanceAway) {
	// 1.) convert items to a list of start and end points in a 1 dimension list.
	var ltNumbers = workwall.getStartEndPointsForInsideItems();

	// 2.) using the 1 dimension list draw out lines for each start and end point.

	// points are paired together as start-stop.
	var count = ltNumbers.length / 2;
	if (count == 1)
		return;

	var line = workwall.line;
	for (var i=0; i < count; i++) {
		var startPos = ltNumbers[i*2];
		var endPos = ltNumbers[i*2+1];

		var divLine = line.subLine(startPos, endPos);
		divLine.moveAway(distanceAway);
		this.drawMeasurement(divLine);
	}
};

/** This will render the dragable items.
*/
Viewer2D.prototype.drawDragableItems = function() {
	var workshed = this.guidelines.workShed;

	// Draw all items.
	for (var i=0; i < this.guidelines.ltBuildWithItems.length; i++) {
		var item = this.guidelines.ltBuildWithItems[i].item;

		var x = this.view_zero_shedbuilder_x + 1.0;
		var y = this.view_zero_shedbuilder_y + 1.0 + i*1.5;	

		var v1 = new RTVector2D(x, y);
		var v2 = new RTVector2D(x+7.0, y);
		var v3 = new RTVector2D(x+7.0, y+1);
		var v4 = new RTVector2D(x, y+1);

		var rect = new RTRect();
		var line = new RTLine(v1, v2);
		rect.init(v1, v2, v3, v4);

		var path = this.toPaperRect(rect);		

		// draw text for the item.
		var ptText = line.getMidPoint();
		ptText.y += 0.70;
		var text = new paper.PointText(this.toPaperPoint(ptText));
		text.justification = 'center';
		text.fillColor = 'black';
		text.content = item.name;

		var ops = this.guidelines.getValidDragAndDropOperation(item.id);
		if (ops == 1) {
			path.strokeColor = 'green';
		} else if (ops == -1) {
			path.strokeColor = 'red';
			text.strokeColor = 'red';			
		} else if (ops == -2) {
			path.strokeColor = '#d6d6d6';
			text.strokeColor = '#d6d6d6';			
		}

		if (this.black_mode) {
			path.strokeColor = 'black';
			text.strokeColor = 'black';
		}
	}

	// Draw the drag-and-drop item.
	if (this.guidelines.dragAndDrop != null) {
		var dragItem = this.guidelines.dragAndDrop;

		// Center of the drag and drop position.
		var v1 = dragItem.v.newCopy();
		var v2 = v1.newCopy();

		if (dragItem.item.item.isLoft()) {
			if (this.guidelines.selectedWall.line.vFromV1toV2.y == 0) {
				if (this.guidelines.selectedWall.line.vFromV1toV2.x > 0) {
					v2.y += workshed.width;
				} else {
					v1.y -= workshed.width;					
				}

			} else if (this.guidelines.selectedWall.line.vFromV1toV2.y > 0) {
				v2.y += workshed.width;
			} else {
				v2.y -= workshed.width;
			}

		} else {
			v2.x += dragItem.item.width * this.guidelines.selectedWall.line.vFromV1toV2.x;
			v2.y += dragItem.item.width * this.guidelines.selectedWall.line.vFromV1toV2.y;			
		}

		var line = new RTLine(v1, v2);

		var color = "red";
		if (dragItem.validLocation)
			color = "green";
		if (this.black_mode)
			color = "black";

		if (dragItem.item.item.isLoft()) {
			this.drawLoftV2(dragItem.item.item, line, 0, dragItem.item.width, color, 1);
		} else
			this.drawItem(dragItem.item.item, line, color);
	}
};


Viewer2D.prototype.drawWall = function(workwall) {
	var ltNumbers = [];
	var line = workwall.line;

	// This function has 3 steps.
	// 1.) convert items to a list of start and end points in a 1 dimension list.
	// 2.) using the 1 dimension list draw out lines for each start and end point.
	// 3.) draw out the items.

	// 1.) convert items to a list of start and end points in a 1 dimension list.

	// Working on a 1 dimensional line.

	// Add in the start and end points.
	ltNumbers.push(0);
	ltNumbers.push(line.getLength());

	// Get the start and end points of the items on the wall.
	for (var i=0; i < workwall.ltWorkItems.length; i++) {
		var workitem = workwall.ltWorkItems[i];
		if (workitem.item.isLoft()) {
			continue;
		}
		ltNumbers.push(workitem.offset_width_left);
		ltNumbers.push(workitem.offset_width_left+workitem.width);
	}
	ltNumbers.sort(function(a,b) {
		return b - a;
	});

	// 2.) using the 1 dimension list draw out lines for each start and end point.

	// points are paired together as start-stop.
	var count = ltNumbers.length / 2;
	for (var i=0; i < count; i++) {
		var startPos = ltNumbers[i*2];
		var endPos = ltNumbers[i*2+1];

		var v1 = line.v1.newCopy();
		var v2 = line.v1.newCopy();

		// Now move the two vertices to the start and stop points.
		v1.x += line.vFromV1toV2.x * startPos;
		v1.y += line.vFromV1toV2.y * startPos;

		v2.x += line.vFromV1toV2.x * endPos;
		v2.y += line.vFromV1toV2.y * endPos;

		// Now draw out the line.
		var divLine = new RTLine(v2, v1);
		var path = this.toPaperLine(divLine);
		if (workwall.selected)
			path.strokeColor = 'green';
		if (this.grey_mode)
			path.strokeColor = 'grey';
		if (this.black_mode)
			path.strokeColor = 'black';
		path.strokeWidth = 3;
		path.strokeCap = 'round';

		// Draw out the measurement line for this as well.
		if (count > 1) {
			divLine.moveAway(1.5);
			// this.drawMeasurement(divLine);
		}
	}

	// 3.) draw out the work items.
	for (var i=0; i < workwall.ltWorkItems.length; i++) {
		this.drawWorkItem(workwall, workwall.ltWorkItems[i]);
	}
};
 
/** This will draw out the item.
 * @param workWall is the WorkWall that has the WorkItem that needs to be drawn.
 * @param workItem is the WorkItem that needs to be drawn.
 */
Viewer2D.prototype.drawWorkItem = function(workWall, workItem) {
	var line = workWall.line;

	// Determine the start and end point on the line of the wall to where the window would be drawn.
	var startPos = workItem.offset_width_left;
	var endPos = workItem.offset_width_left+workItem.width;

	var v1 = line.v1.newCopy();
	var v2 = line.v1.newCopy();

	v1.x += line.vFromV1toV2.x * startPos;
	v1.y += line.vFromV1toV2.y * startPos;

	v2.x += line.vFromV1toV2.x * endPos;
	v2.y += line.vFromV1toV2.y * endPos;

	// Set the stroke color.
	var strokeColor = 'black';
	if (workItem.selected) {
		if (workItem.validLocation)
			strokeColor = 'green';
		else
			strokeColor = 'red';
	}
	if (this.grey_mode)
		strokeColor = 'grey';
	if (this.black_mode)
		strokeColor = 'black';


	// This is the item line on the wall.
	var itemLine = new RTLine(v1, v2);

	// For now the loft is a special case.
	if (workItem.item.isLoft()) {
		this.drawLoftV2(workItem.item, line, workItem.offset_width_left, workItem.width, strokeColor, 0);

//		this.drawLoft(line, workItem);
	} else {
		this.drawItem(workItem.item, itemLine, strokeColor);
	}
}

/** This is a special case to draw the loft. The loft is attached to the back wall and is drawn forward using the full length of the wall.
*/
Viewer2D.prototype.drawLoft = function(workWallLine, workItem) {
	var length = this.guidelines.workShed.length;

	// These are the two lines that will be drawn.
	var line1 = workWallLine.newCopy();
	var line2 = workWallLine.newCopy();

	if (workItem.offset_width_left > 0) {
		line1.moveAway(workItem.offset_width_left * -1);
		var path1 = this.toPaperLine(line1);
		path1.dashArray = [10, 10];
	}

	// Draw out the second line if need be.
	if (workItem.offset_width_left + workItem.width + 0.01 < length) {
		line2.moveAway((workItem.offset_width_left + workItem.width) * -1);
		var path2 = this.toPaperLine(line2);
		path2.dashArray = [10, 10];
	}

	// Draw LOFT text.
	var ptText = workWallLine.getMidPoint();
	ptText.addVector(workWallLine.vNormal, (workItem.offset_width_left + workItem.width/2) * -1);

	// draw text for the item.
	var text = new paper.PointText(this.toPaperPoint(ptText));
	text.justification = 'center';
	text.fillColor = 'black';
	text.content = workItem.item.short_name + " " + workItem.width + "'";

	// Draw the measurement line.
	var v1 = workWallLine.getMidPoint();
	var v2 = workWallLine.getMidPoint();

	if (workItem.offset_width_left == 0) {
		v2.addVector(workWallLine.vNormal, (workItem.offset_width_left + workItem.width) * -1);
	} else {
		v2.addVector(workWallLine.vNormal, workItem.offset_width_left * -1);		
	}

	v1.y += 0.8 + (workItem.offset_width_left / 33.0) * 3.5;
	v2.y += 0.8 + (workItem.offset_width_left / 33.0) * 3.5;

	var offsetLabel = 2.0;
//	if (workItem.offset_width_left > 1.0)
//		offsetLabel = 4.0;

	var line = new RTLine(v1, v2);
	this.drawMeasurement(line,  offsetLabel);

}

/** This is a special case to draw the loft. The loft is attached to the back wall and is drawn forward using the full length of the wall.
 * @param item Item. Is the Loft.
 * @param backwallLine RTLine. The line that represents the back wall of the shed. The loft uses this line to draw the loft lines and the measurements from it. 
 * @param strokeColor is the color the stroke should be. 
 * @param distance_from_backwall is the distance from the backwall to the loft.
 * @param loftWidth is the width of the loft.
 * @param forceDrawFirstWall is true if it should draw the first dash wall of the loft. Useful for drag and drop support.
 */
Viewer2D.prototype.drawLoftV2 = function(item, backwallLine, distanceFromBackwall, loftWidth, strokeColor, forceDrawFirstWall) {
	var paperItems = [];

	var length = this.guidelines.workShed.length;

	// These are the two lines that will be drawn.
	var line1 = backwallLine.newCopy();
	var line2 = backwallLine.newCopy();

	if (distanceFromBackwall > 0 || forceDrawFirstWall == 1) {
		line1.moveAway(distanceFromBackwall * -1);
		var path1 = this.toPaperLine(line1);
		path1.dashArray = [10, 10];
		paperItems.push(path1);		
	}

	// Draw out the second line if need be.
	if (distanceFromBackwall + loftWidth + 0.01 < length) {
		line2.moveAway((distanceFromBackwall + loftWidth) * -1);
		var path2 = this.toPaperLine(line2);
		path2.dashArray = [10, 10];
		paperItems.push(path2);
	}

	// Set the color of the paperItems.
	for (var i=0; i < paperItems.length; i++) {
		paperItems[i].strokeColor = strokeColor;
	}

	// Draw LOFT text.
	var ptText = backwallLine.getMidPoint();
	ptText.addVector(backwallLine.vNormal, (distanceFromBackwall + loftWidth/2) * -1);

	// draw text for the item.
	var text = new paper.PointText(this.toPaperPoint(ptText));
	text.justification = 'center';
	text.fillColor = 'black';
	text.content = item.short_name + " " + loftWidth + "'";

	if (this.grey_mode)
		text.fillColor = 'grey';
	if (this.black_mode)
		text.fillColor = 'black';

	// Draw the measurement line.
	var v1 = backwallLine.getMidPoint();
	var v2 = backwallLine.getMidPoint();

	if (distanceFromBackwall == 0) {
		v2.addVector(backwallLine.vNormal, (distanceFromBackwall + loftWidth) * -1);
	} else {
		v2.addVector(backwallLine.vNormal, distanceFromBackwall * -1);		
	}

	v1.y += 0.8 + (distanceFromBackwall / 33.0) * 3.5;
	v2.y += 0.8 + (distanceFromBackwall / 33.0) * 3.5;

	var offsetLabel = 2.0;

	var line = new RTLine(v1, v2);
	this.drawMeasurement(line,  offsetLabel);

}

/** This will draw the item.
 * @param item is the Item.
 * @param itemLine RTLine. Is the Item's line position where it should be drawn at.
 * @param strokeColor is the color the stroke should be.
*/
Viewer2D.prototype.drawItem = function(item, itemLine, strokeColor) {
	var paperItems = [];
	var ptText = itemLine.getMidPoint();

	// Draw out a window.
	if (item.isBarnDoor()) {
		paperItems = this.drawOpenRectangle(itemLine, item.paperjs_depth);

	} else if (item.isWorkbench()) {
		paperItems = this.drawInsideItem(itemLine, item.paperjs_depth);

		// Get the mid point inside the shelf box.
		ptText.x += (itemLine.vNormal.x * -1) * item.paperjs_depth / 4;
		ptText.y += (itemLine.vNormal.y * -1) * item.paperjs_depth / 4;


	} else if (item.isFrameOut()) {
		paperItems = this.drawRectangle(itemLine, item.paperjs_depth);

	} else if (item.isHouseDoor()) {
		paperItems = this.drawHouseDoor(itemLine, item.paperjs_depth);

	} else if (item.isGarageDoor()) {
		paperItems = this.drawOpenRectangle(itemLine, item.paperjs_depth);

	} else if (item.isLoft()) {

	} else if (item.isOther()) {
		paperItems = this.drawRectangle(itemLine, item.paperjs_depth);

	} else if (item.isPorchPost()) {
		paperItems = this.drawRectangle(itemLine, item.paperjs_depth);

	} else if (item.isPorchRail()) {
		paperItems = this.drawRectangle(itemLine, item.paperjs_depth);

	} else if (item.isShelf()) {
		paperItems = this.drawInsideItem(itemLine, item.paperjs_depth);

		// Get the mid point inside the shelf box.
		ptText.x += (itemLine.vNormal.x * -1) * item.paperjs_depth / 4;
		ptText.y += (itemLine.vNormal.y * -1) * item.paperjs_depth / 4;

	} else if (item.isWindow()) {
		paperItems = this.drawRectangle(itemLine, item.paperjs_depth);
	}

	// Set the color of the paperItems.
	for (var i=0; i < paperItems.length; i++) {
		paperItems[i].strokeColor = strokeColor;
	}

	// draw text for the item.
	var text = new paper.PointText(this.toPaperPoint(ptText));
	text.justification = 'center';
	text.fillColor = 'black';
	text.content = item.short_name;

	if (this.grey_mode)
		text.fillColor = 'grey';
	if (this.black_mode)
		text.fillColor = 'black';


	if (itemLine.isVertical())
		text.rotate(90);
	else
		text.position.y += 4.0;
};

/** This will draw a house door.
 */
Viewer2D.prototype.drawHouseDoor = function(itemLine, depth) {
	var paperItems = [];

	var vInside1 = itemLine.v1.newCopy();
	var vInside2 = itemLine.v2.newCopy();

	vInside1.x -= itemLine.vNormal.x * depth;
	vInside1.y -= itemLine.vNormal.y * depth;

	vInside2.x -= itemLine.vNormal.x * depth;
	vInside2.y -= itemLine.vNormal.y * depth;

	var vhandle1 = new RTVector2D((vInside2.x-vInside1.x) * .5, (vInside2.y-vInside1.y) * .5);
	var vhandle2 = new RTVector2D((vInside2.x-itemLine.v2.x) * .5, (vInside2.y-itemLine.v2.y) * .5);

	var path1 = this.toPaperLine(new RTLine(itemLine.v1, vInside1));
	var path2 = this.toPaperCurve(vInside1, vhandle1, vhandle2, itemLine.v2);

	paperItems.push(path1);
	paperItems.push(path2);

	return paperItems;
}

/** This will draw an inside item.
 */
Viewer2D.prototype.drawInsideItem = function(itemLine, depth) {
	var paperItems = [];

	var halfdepth = depth / 2.0;

	var vInside1 = itemLine.v1.newCopy();
	var vInside2 = itemLine.v2.newCopy();

	vInside1.x -= itemLine.vNormal.x * halfdepth;
	vInside1.y -= itemLine.vNormal.y * halfdepth;

	vInside2.x -= itemLine.vNormal.x * halfdepth;
	vInside2.y -= itemLine.vNormal.y * halfdepth;

	var path1 = this.toPaperLine(new RTLine(itemLine.v1, itemLine.v2));
	var path2 = this.toPaperLine(new RTLine(itemLine.v1, vInside1));
	var path3 = this.toPaperLine(new RTLine(itemLine.v2, vInside2));
	var path4 = this.toPaperLine(new RTLine(vInside1, vInside2));

	paperItems.push(path1);
	paperItems.push(path2);
	paperItems.push(path3);
	paperItems.push(path4);

	return paperItems;
}

/** This will draw a rectangle on the item line.
 */
Viewer2D.prototype.drawRectangle = function(itemLine, depth) {
	var paperItems = [];
	var rect = new RTRect();
	rect.initWithLine(itemLine, depth/2);
	paperItems.push(this.toPaperRect(rect));
	return paperItems;
}

/** This will draw a rectangle with open middle sections on the item line.
 */
Viewer2D.prototype.drawOpenRectangle = function(itemLine, depth) {
	var paperItems = [];

	var halfdepth = depth / 2.0;

	var earscale = 0.25;

	// Drawing the following.
	//  ------[      ]---------

	// This is the first [.
	var v1a = itemLine.v1.newCopy();
	var v1b = itemLine.v1.newCopy();
	v1a.x += itemLine.vNormal.x * halfdepth;
	v1a.y += itemLine.vNormal.y * halfdepth;
	v1b.x -= itemLine.vNormal.x * halfdepth;
	v1b.y -= itemLine.vNormal.y * halfdepth;

	// Ears to the first [.
	var v1aa = v1a.newCopy();
	var v1ba = v1b.newCopy();
	v1aa.x += itemLine.vFromV1toV2.x * halfdepth * earscale;
	v1aa.y += itemLine.vFromV1toV2.y * halfdepth * earscale;
	v1ba.x += itemLine.vFromV1toV2.x * halfdepth * earscale;
	v1ba.y += itemLine.vFromV1toV2.y * halfdepth * earscale;

	// This will draw the first [.
	var path1 = this.toPaperLine(new RTLine(v1a, v1b));
	var path2 = this.toPaperLine(new RTLine(v1a, v1aa));
	var path3 = this.toPaperLine(new RTLine(v1b, v1ba));

	// This is the second [.
	var v2a = itemLine.v2.newCopy();
	var v2b = itemLine.v2.newCopy();
	v2a.x += itemLine.vNormal.x * halfdepth;
	v2a.y += itemLine.vNormal.y * halfdepth;
	v2b.x -= itemLine.vNormal.x * halfdepth;
	v2b.y -= itemLine.vNormal.y * halfdepth;

	// Ears to the second [.
	var v2aa = v2a.newCopy();
	var v2ba = v2b.newCopy();
	v2aa.x += itemLine.vFromV2toV1.x * halfdepth * earscale;
	v2aa.y += itemLine.vFromV2toV1.y * halfdepth * earscale;
	v2ba.x += itemLine.vFromV2toV1.x * halfdepth * earscale;
	v2ba.y += itemLine.vFromV2toV1.y * halfdepth * earscale;

	// This will draw the second [.
	var path4 = this.toPaperLine(new RTLine(v2a, v2b));
	var path5 = this.toPaperLine(new RTLine(v2a, v2aa));
	var path6 = this.toPaperLine(new RTLine(v2b, v2ba));


	paperItems.push(path1);
	paperItems.push(path2);
	paperItems.push(path3);
	paperItems.push(path4);
	paperItems.push(path5);
	paperItems.push(path6);

	return paperItems;

}

/** This will draw out the measurement of the wall.
 * @param line is a RTLine. It will be drawn as a measurement.
 * @param offset is the offset from the line's v1 where the text should be drawn. (default in the middle)
 */
Viewer2D.prototype.drawMeasurement = function(line, offset) {

	// Default is to draw in the middle.
	var midPoint = line.getLength() / 2;
    offset = typeof offset !== 'undefined' ? offset : midPoint;

    // Get the text point.
    var textPoint = line.v1.newCopy();
    textPoint.addVector(line.vFromV1toV2, offset);

	// There are 4 steps to this function.
	// 1.) draw out the text.
	// 2.) draw line from v1 to text.
	// 3.) draw line from text to v2.
	// 4.) draw arrowheads at v1 and v2.

	// 1.) draw out the text.

	// Don't draw if line is too small.
	if (line.getLength() < 0.01)
		return;

	// Draw out the measurement text first.
	var midPoint = this.toPaperPoint(textPoint);
	var normal = line.vNormal;

	var text = new paper.PointText(midPoint);
	text.justification = 'center';
	text.fillColor = 'black';
	text.content = line.getLengthFormatted();

	// Get the text width.
	var textWidth = text.bounds.width / this.scale_multiplier;

	if (line.isVertical())
		text.rotate(90);
	else
		text.position.y += 4.0;

	if (this.grey_mode)
		text.fillColor = 'grey';	
	if (this.black_mode)
		text.fillColor = 'black';	

	// Don't show the lines when the length gets too small.
	if (line.getLength() < 3.0)
		return;

	// 2.) draw line from v1 to text.

	// Draw line from measurement to v1 with arrow head at v1.
	// Create a new line, half it, then move v2 toward v1 and draw it out.
	var halfLine1 = line.newCopy();
	halfLine1.setV2(textPoint);
	halfLine1.moveV2(line.vFromV2toV1, 0.8);
	var path1 = this.toPaperLine(halfLine1);

	// 3.) draw line from text to v2.

	// Draw line from measurement to v2 with arrow head at v1.
	// Create a new line, half it, then move v1 toward v2 and draw it out.
	var halfLine2 = line.newCopy();
	halfLine2.setV1(textPoint);
	halfLine2.moveV1(line.vFromV1toV2, textWidth); 
	var path2 = this.toPaperLine(halfLine2);

	// 4.) draw arrowheads at v1 and v2.

	// Draw the arrowheads.
	var arrowhead1 = line.toPaperArrowHeadV1(0.2, this.view_offset_x, this.view_offset_y, this.scale_multiplier);
	var arrowhead2 = line.toPaperArrowHeadV2(0.2, this.view_offset_x, this.view_offset_y, this.scale_multiplier);

	if (this.grey_mode) {
		path1.strokeColor = 'grey';
		path2.strokeColor = 'grey';
		arrowhead1.strokeColor = 'grey';
		arrowhead1.fillColor = 'grey';
		arrowhead2.strokeColor = 'grey';
		arrowhead2.fillColor = 'grey';
	}
	if (this.black_mode) {
		path1.strokeColor = 'black';
		path2.strokeColor = 'black';
		arrowhead1.strokeColor = 'black';
		arrowhead1.fillColor = 'black';
		arrowhead2.strokeColor = 'black';
		arrowhead2.fillColor = 'black';
	}

}

/** This will convert a RTVector2D to a PaperPoint.
 * @param v is a RTVector2D
*/
Viewer2D.prototype.toPaperPoint = function(v) {

	var newx = this.view_offset_x + (v.x * this.scale_multiplier);
	var newy = this.view_offset_y + (v.y * this.scale_multiplier);

	return new paper.Point(newx, newy);	
};

/** http://paperjs.org/reference/curve/
 * This will generate a paper curve.
 * @param v1 and v2 are the RTVector2D points.
 * @param h1 and h2 are the handle of the curve. RTVector2D.
*/
Viewer2D.prototype.toPaperCurve = function(v1, h1, h2, v2) {
	var p1 = this.toPaperPoint(v1);
	var p2 = this.toPaperPoint(v2);
	var ph1 = new paper.Point(h1.x * this.scale_multiplier, h1.y * this.scale_multiplier);
	var ph2 = new paper.Point(h2.x * this.scale_multiplier, h2.y * this.scale_multiplier);

    var r1seg = new paper.Segment(p1, null, ph1);
    var r2seg = new paper.Segment(p2, ph2, null);
    
    var path = new paper.Path(r1seg, r2seg);    
  //  path.fullySelected = true;
    path.strokeColor = 'black'; 

	return path;
};

/** This will convert a RTLine to a PaperPoint.
 * @param line is a RTLine
*/
Viewer2D.prototype.toPaperLine = function(line) {
	var p1 = this.toPaperPoint(line.v1);
	var p2 = this.toPaperPoint(line.v2);

	var path = new paper.Path.Line(p1, p2);
	path.strokeColor = 'black';
	return path;
};

/** This will convert a RTRect to a PaperPoint.
 * @param line is a RTLine
*/
Viewer2D.prototype.toPaperRect = function(rect) {

	var p1 = this.toPaperPoint(rect.v1);
	var p2 = this.toPaperPoint(rect.v2);
	var p3 = this.toPaperPoint(rect.v3);
	var p4 = this.toPaperPoint(rect.v4);

	var path = new paper.Path();
	path.add(p1);
	path.add(p2);
	path.add(p3);
	path.add(p4);
	path.closed = true;
	path.strokeColor = 'black';
	return path;
};


// --------------------------------------------------------------------------------------------------------------------
// -- Viewer3d Class --

function View3D() {

}
