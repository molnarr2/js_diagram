/*
 * Author: Robert Molnar 2
 */

// --------------------------------------------------------------------------------------------------------------------
// -- WorkShed Class --

/** This is the base class for each shed.
*/
function WorkShed() {

	/** Database: work_shed.id. */
	this.id = 0;

	/** Database: shed.id. */
	this.shedId = 0;

	/** The list of walls. */
	this.ltWorkWalls = []; // WorkWall

	/** Width of the shed. */
	this.width = 0;
	/** Length of the shed. */
	this.length = 0;
	/** Height of the shed. */
	this.height = 0;

	/** Wall the lofts would be connected to. */
	this.loftWall = null;
}

/** This will the WorkShed data from the JSON.
*/
WorkShed.prototype.loadFromDB = function(data) {
	this.id = parseInt(data.id);
	this.shedId = parseInt(data.shed_id);
	this.width = parseFloat(data.width);
	this.height = parseFloat(data.height);
	this.length = parseFloat(data.length);

	var self = this;
	data.workWalls.map(function (dataJson) {
		var workWall = new WorkWall();
		workWall.loadFromDB(dataJson);
		self.ltWorkWalls.push(workWall);
	});	

	// Calculate the wall the lofts would be connected to which is the right most wall (largest x value).
	var x = 0;
	for (var i=0; i < this.ltWorkWalls.length; i++) {
		var wall = this.ltWorkWalls[i];
		if ((wall.from.x + wall.to.x) > x) {  // The right wall is connected to others so this guarantees the right wall is choosen.
			this.loftWall = wall;
			x = wall.from.x;
		}
	}

}

/** This will save the WorkShed data to the postData.
*/
WorkShed.prototype.saveToDB = function(postData) {	
	var uniqueId = 0;
	for (var i=0; i < this.ltWorkWalls.length; i++) {
		uniqueId = this.ltWorkWalls[i].saveToDB(postData, uniqueId);
	}
};

/** This will return the wall and item that was selected at the RTVector2D value.
 * @return the wall and item of what was selected or null if nothing was selected.
*/
WorkShed.prototype.getSelected = function(v) {

	// Search each wall for a selected item excluding loft.
	for (var i=0; i < this.ltWorkWalls.length; i++) {
		var item = this.ltWorkWalls[i].getSelectedItem(v, 1);
		if (item != null) {
			return {wall: this.ltWorkWalls[i], item: item};
		}
	}

	// Search the loft wall for any lofts.
	var item = this.loftWall.getSelectedItem(v, 0);
	if (item != null) {
		return {wall: this.loftWall, item: item};
	}

	// Since no items were selected see if just a wall was selected.
	for (var i=0; i < this.ltWorkWalls.length; i++) {
		if (this.ltWorkWalls[i].isHit(v)) {
			return {wall: this.ltWorkWalls[i], item: null};
		}
	}

	return {wall: null, item: null};
}

/** Returns the wall where the lofts will reside.
 * @return the WorkWall where the lofts are at.
 */
WorkShed.prototype.getLoftWall = function() {
	
};

// --------------------------------------------------------------------------------------------------------------------
// -- WorkWall Class --

/** Contains the working wall items.
*/
function WorkWall() {	 

	/** Database: work_wall.id. */
	this.id = 0;

	/** Database: wall.id. */
	this.wallId = 0;

	/** The list of items that are on this wall. */
	this.ltWorkItems = []; // WorkItem
	
	/** The list of items that are valid on this wall. */
	this.ltValidItems = []; // ValidItem

	/** Starting position of the wall. */
	this.from = null;

	/** Ending position of the wall. */
	this.to = null;

	this.line = null;

	/** True if this item is currently selected to work on. */
	this.selected = false;

}

WorkWall.prototype.loadFromDB = function(data) {
	this.id = parseInt(data.id);
	this.wallId = parseInt(data.wall_id);
	this.from = new RTVector2D(parseFloat(data.from_x), parseFloat(data.from_y));
	this.to = new RTVector2D(parseFloat(data.to_x), parseFloat(data.to_y));
	this.line = new RTLine(this.from, this.to);

	var self = this;
	data.workItems.map(function (dataItem) {
		var workItem = new WorkItem();
		workItem.loadFromDB(dataItem);

		self.ltWorkItems.push(workItem);
	});	

	data.validItems.map(function (dataItem) {
		var validItem = new ValidItem();
		validItem.itemId = dataItem.item_id;
		self.ltValidItems.push(validItem);
	});	

}

/** This will save the WorkWall data to the postData.
*/
WorkWall.prototype.saveToDB = function(postData, uniqueId) {
	for (var i=0; i < this.ltWorkItems.length; i++) {
		this.ltWorkItems[i].saveToDB(postData, this.id, uniqueId);
		uniqueId++;
	}
	return uniqueId;
};

/** @return true if the itemId exists in the validated list of items.
*/
WorkWall.prototype.isValidatedItem = function(itemId) {
	for(var i=0; i < this.ltValidItems.length; i++) {
		if (this.ltValidItems[i].item.id == itemId)
			return true;
	}

	return false;
};

/**
 * @param noLoft is true if do not pick up loft. 
 * @return the WorkItem that contains the v within itself or null if no item was selected.
*/
WorkWall.prototype.getSelectedItem = function(v, noLoft) {
	for (var i=0; i < this.ltWorkItems.length; i++) {
		// Skip the loft if need be.
		if (noLoft && this.ltWorkItems[i].item.isLoft())
			continue;

		if (this.ltWorkItems[i].isHit(this.line, v))
			return this.ltWorkItems[i];
	}

	return null;
};

/** @return true if the vector has hit the wall.
*/
WorkWall.prototype.isHit = function(v) {
	return this.line.isHitClose(v);
};

/** Add the drag item to this work wall.
 * @return the WorkItem that was created.
*/
WorkWall.prototype.addDragItem = function(dragItem, shedLength) {
	var workItem = new WorkItem();
	workItem.item = dragItem.item.item;
	workItem.itemId = dragItem.item.id;
	workItem.width = dragItem.item.width;
	workItem.height = dragItem.item.height;
	workItem.depth = dragItem.item.depth;
	workItem.selected = false;

	if (dragItem.item.item.isLoft())
		workItem.offset_width_left = this.getLoftDragItemOffsetWidthLeft(dragItem, shedLength);
	else
		workItem.offset_width_left = this.getDragItemOffsetWidthLeft(dragItem);

	this.ltWorkItems.push(workItem);

	return workItem;
};

/** This will get the offset_width_left for the drag item from this loft wall.
 * @param return offset_width_left value for the drag item for this loft wall.
*/
WorkWall.prototype.getLoftDragItemOffsetWidthLeft = function(dragItem, shedLength) {
	var offset_width_left = 0.0;

	// Simple check the x offset between this wall which will be a vertical wall and the dragItem vertex.
	offset_width_left = Math.abs(dragItem.v.x - this.line.v1.x);

	if (offset_width_left + dragItem.item.width > shedLength) {
		offset_width_left = shedLength - dragItem.item.width;
	}

	return offset_width_left;
};

/** This will get the offset_width_left for the drag item from this work wall.
 * @param return offset_width_left value for the drag item for this work wall.
*/
WorkWall.prototype.getDragItemOffsetWidthLeft = function(dragItem) {
	var offset_width_left = 0.0;

	var parameterT = this.line.getClosestPointT(dragItem.v);

	var length = this.line.getLength();

	return offset_width_left = length * parameterT;
};

/** @return true if the loft DragItem or WorkItem is in a valid location on the loft wall.
*/
WorkWall.prototype.isValidLoftLocation = function(dragOrWorkItem, offset_width_left) {

	// Get the two points of the item to check again. The 0.6666 is 8 inches away from any other item.
	var offset_width_right = offset_width_left + dragOrWorkItem.width;
	// offset_width_left -= 0.6666;

	// Check to see if there are any overlapping points.
	for (var i=0; i < this.ltWorkItems.length; i++) {
		var workItem = this.ltWorkItems[i];
		// Skip the same item for this check.
		if (workItem == dragOrWorkItem)
			continue;
		// Skip anything that is not a loft.
		if (!workItem.item.isLoft())
			continue;

		var x1 = workItem.offset_width_left;
		var x2 = workItem.offset_width_left + workItem.width;

		// Did we get a hit?
		if (!(offset_width_left < x1 && offset_width_right < x1 || offset_width_left > x2 && offset_width_right > x2)) {
			return false;
		}
	}

	return true;
};

/** @return true if the DragItem or WorkItem is in a valid location on the selected wall.
*/
WorkWall.prototype.isValidItemLocation = function(dragOrWorkItem, offset_width_left) {

	var item = dragOrWorkItem.item;

	// Check for end points of the wall.
	var offsetCheckEndPoint = 1.0;
	if (item.isWorkbench() || item.isShelf())
		offsetCheckEndPoint = 0.0;

	if (offset_width_left < offsetCheckEndPoint)
		return false;
	if ((offset_width_left + dragOrWorkItem.width) > (this.line.getLength() - offsetCheckEndPoint))
		return false;

	// Get the two points of the item to check again. The 0.6666 is 8 inches away from any other item.
	var offset_width_right = offset_width_left + dragOrWorkItem.width + 0.6666;
	offset_width_left -= 0.6666;

	// Check to see if there are any overlapping points.
	for (var i=0; i < this.ltWorkItems.length; i++) {
		var workItem = this.ltWorkItems[i];
		// Skip the same item for this check.
		if (workItem == dragOrWorkItem)
			continue;
		// Skip lofts.
		if (workItem.item.isLoft())
			continue;
		// If the drag item is a workbench and the item to test against is a window then skip or vis-versa. (those are valid placements)
		if (item.isWorkbench() && workItem.item.isWindow() || item.isWindow() && workItem.item.isWorkbench())
			continue;

		var x1 = workItem.offset_width_left;
		var x2 = workItem.offset_width_left + workItem.width;

		// Did we get a hit?
		if (!(offset_width_left < x1 && offset_width_right < x1 || offset_width_left > x2 && offset_width_right > x2)) {
			return false;
		}
	}

	return true;
};

/** This will delete the WorkItem from this wall.
*/
WorkWall.prototype.deleteItem = function(item) {
	for (var i=0; i < this.ltWorkItems.length; i++) {
		if (this.ltWorkItems[i] == item) {
			this.ltWorkItems.splice(i, 1);
			return;
		}
	}
};

/** This will center the WorkItem on this wall between the two walls or closest items.
*/
WorkWall.prototype.centerItem = function(item) {

	var ltNumbers;
	if (item.item.isWorkbench() || item.item.isShelf() || item.item.isLoft())
		ltNumbers = this.getStartEndPointsForInsideItems();
	else 
		ltNumbers = this.getStartEndPointsForOutsideItems();

	// Get the one point before the item and the one point after the item.
	var ptBefore = 0;
	var ptAfter = 0;
	for (var i=0; i < ltNumbers.length; i++) {
		if (item.offset_width_left == ltNumbers[i]) {
			// Point before.
			ptBefore = ltNumbers[i-1];
			// Skip the next one as that is the item's end point and get the one after that.
			ptAfter = ltNumbers[i+2];
			break;
		}
	}

	// Now update to the center.
	var new_offset = (ptAfter + ptBefore) / 2 - item.width / 2;
	item.offset_width_left=new_offset;
	item.offset_width_left_saved=new_offset;

};

/** This will return an array of start and end points including 0 and the length of the wall therefore the array will be even.
 * Only items that make a cut out of the wall will be included.
 * @return array of start and end points including 0 and the length of the wall.
*/
WorkWall.prototype.getStartEndPointsForOutsideItems = function() {
	var ltNumbers = Array();

	// Add in the start and end points.
	ltNumbers.push(0);
	ltNumbers.push(this.line.getLength());

	// Get the start and end points of the items that would cut a hole into the wall.
	for (var i=0; i < this.ltWorkItems.length; i++) {
		var workitem = this.ltWorkItems[i];
		if (workitem.item.isWorkbench() || workitem.item.isShelf() || workitem.item.isLoft())		
			continue;
		ltNumbers.push(workitem.offset_width_left);
		ltNumbers.push(workitem.offset_width_left+workitem.width);
	}
	ltNumbers.sort(function(a,b) {
		return a - b;
	});

	return ltNumbers;
};

/** This will return an array of start and end points including 0 and the length of the wall therefore the array will be even.
 * Only items that do not make a cut in the wall will be included.
 * @return array of start and end points including 0 and the length of the wall.
*/
WorkWall.prototype.getStartEndPointsForInsideItems = function() {
	var ltNumbers = Array();

		// Add in the start and end points.
	ltNumbers.push(0);
	ltNumbers.push(this.line.getLength());

	// Get the start and end points of the items that would cut a hole into the wall.
	for (var i=0; i < this.ltWorkItems.length; i++) {
		var workitem = this.ltWorkItems[i];
		if (!(workitem.item.isWorkbench() || workitem.item.isShelf()))
			continue;
		ltNumbers.push(workitem.offset_width_left);
		ltNumbers.push(workitem.offset_width_left+workitem.width);
	}
	ltNumbers.sort(function(a,b) {
		return a - b;
	});

	return ltNumbers;
}

/** NOTE: Assumed only to be called on the lofted wall.
 * @param dragAndDrop is the DragItem.
 * @param selectedWall is the WorkWall that is currently selected.
 */
WorkWall.prototype.getLoftUpdatedDragPosition = function(dragAndDrop, selectedWall, shedLength) {
	// Only walls that the loft will move on should be checked.
	if (selectedWall.line.vFromV1toV2.x == 0) {
		return dragAndDrop.v;
	}

	// Stick it to the end of the shed.
	var x = this.line.v1.x - dragAndDrop.v.x + dragAndDrop.item.width;
	if (x > shedLength) {
		var vNew = dragAndDrop.v.newCopy();
		vNew.x += x - shedLength;
		return vNew;
	}

	return dragAndDrop.v;
};

// --------------------------------------------------------------------------------------------------------------------
// -- WorkItem Class --

/** Contains the item for the working wall.
*/
function WorkItem() {
	/** Database: work_item.id */
	this.id = 0;
	/** Database: item. */
	this.item = null;
	/** Database: item.itemId. */
	this.itemId = 0;
	/** Offset from the left of the wall. Or if the wall is vertical than it is the offset from the top. */
	this.offset_width_left=0;
	this.offset_width_left_saved=0;
	/** For items that also have offset from the bottom of the wall (height offset). */
	this.offset_height=0;
	/** Width of the item. */	
	this.width = 0;
	/** Height of the item. */
	this.height = 0;
	/** Depth of the item. */
	this.depth = 0;
	/** True if this item is currently selected to work on. */
	this.selected = false;
	/** True if current position is valid. */
	this.validLocation = true;
	/** The degree offset this item is from the wall. Only Workbenches can do this. */
	this.offset_degree=0;
}

WorkItem.prototype.loadFromDB = function(data) {
	this.id = parseInt(data.id);
	this.itemId = parseInt(data.item_id);
	this.offset_width_left = parseFloat(data.offset_width_left);
	this.offset_height = parseFloat(data.offset_height);
	this.width = parseFloat(data.width);
	this.height = parseFloat(data.height);
	this.depth = parseFloat(data.depth);
};

/** This will save the WorkWall data to the postData.
*/
WorkItem.prototype.saveToDB = function(postData, workWallId, uniqueId) {	

	var keyItemId = "itemId" + uniqueId;
	var keyOffsetWidthLeft = "offsetWidthLeft" + uniqueId;
	var keyOffsetHeight = "offsetHeight" + uniqueId;
	var keyWidth = "width" + uniqueId;
	var keyHeight = "height" + uniqueId;
	var keyDepth = "depth" + uniqueId;
	var keyWorkWallId = "workWallId" + uniqueId;

	postData[keyItemId] = this.item.id;
	postData[keyOffsetWidthLeft] = this.offset_width_left;
	postData[keyOffsetHeight] = this.offset_height;
	postData[keyWidth] = this.width;
	postData[keyHeight] = this.height;
	postData[keyDepth] = this.depth;
	postData[keyWorkWallId] = workWallId;
};

/** This will convert the WorkItem to a WorkItemBuildWith.
*/
WorkItem.prototype.toWorkItemBuildWith = function(first_argument) {
	var buildWith = new WorkItemBuildWith();
	buildWith.id = 0;
	buildWith.item_id = this.itemId;
	buildWith.work_shed_id = 0;
	buildWith.width = this.width;
	buildWith.height = this.height;
	buildWith.depth = this.depth;
	buildWith.window_height_offset = this.offset_height;
	buildWith.workItem = null;
	buildWith.item = this.item;

	return buildWith;
};

/** This will save the offset position.
 */
WorkItem.prototype.setSavedOffsetPosition = function() {
	this.offset_width_left_saved = this.offset_width_left;
}

/** This will set the current offset back to the saved position.
 */
WorkItem.prototype.resetToSavedPosition = function() {
	this.offset_width_left = this.offset_width_left_saved;
}

/** @return true if RTVector2D is within this work item.
*/
WorkItem.prototype.isHit = function(wallLine, v) {

	// Check for loft area.
	if (this.item.isLoft()) {
		// return false;
		
		var v1 = wallLine.v1.newCopy();
		var v2 = wallLine.v2.newCopy();
		var v3 = wallLine.v1.newCopy();
		var v4 = wallLine.v2.newCopy();

		v1.x -= this.offset_width_left;
		v2.x = v1.x;
		v3.x = v1.x - this.width;
		v4.x = v1.x - this.width;

		var rect = new RTRect();
		rect.init(v1, v2, v4, v3);
		var hit = rect.isHit(v);
		return hit;
	}

	var v1 = this.getStartPointOnWall(wallLine);
	var v2 = this.getEndPointOnWall(wallLine);
	var line = new RTLine(v1, v2);

	// Make a rect of the item.
	var rect = new RTRect();
	rect.initWithLine(line, this.item.paperjs_depth / 2.0)

	// See if v is within that rect of the item.
	var hit = rect.isHit(v);
	return hit;
};

/** @param wallLine is the WorkWall's line which this WorkItem is on.
 * @return the starting point on the WorkWall this WorkItem begins. (from v1 of the wallLine)
 */
WorkItem.prototype.getStartPointOnWall = function(wallLine) {
	var v = wallLine.v1.newCopy();
	v.x += wallLine.vFromV1toV2.x * this.offset_width_left;
	v.y += wallLine.vFromV1toV2.y * this.offset_width_left;

	return v;
};

/** @param wallLine is the WorkWall this WorkItem is on.
 * @return the ending point on the WorkWall this WorkItem ends at. (from v1 of the wallLine)
 */
WorkItem.prototype.getEndPointOnWall = function(wallLine) {
	var v = wallLine.v1.newCopy();
	var endPos = this.offset_width_left+this.width;

	v.x += wallLine.vFromV1toV2.x * endPos;
	v.y += wallLine.vFromV1toV2.y * endPos;

	return v;
};

/** Set the offset degrees for this WorkItem only used by workbench.
*/
WorkItem.prototype.setOffsetDegrees = function(degrees) {
	this.offset_degree = degrees;
};

WorkItem.prototype.onMousedrag = function(wallLine, vDiff, shedLength) {
	if (this.item.isLoft()) {
		this.offset_width_left = this.offset_width_left_saved - vDiff.x;

	} else if (wallLine.isVertical()) {
		if (wallLine.vNormal.x > 0)		
			this.offset_width_left = this.offset_width_left_saved + vDiff.y;
		else
			this.offset_width_left = this.offset_width_left_saved - vDiff.y;
	} else {
		if (wallLine.vNormal.y > 0)		
			this.offset_width_left = this.offset_width_left_saved - vDiff.x;
		else
			this.offset_width_left = this.offset_width_left_saved + vDiff.x;
	}

	// Check for end points of the wall.
	var offsetCheckEndPoint = 1.0;
	if (this.item.isWorkbench() || this.item.isShelf() || this.item.isLoft())
		offsetCheckEndPoint = 0.0;

	var length = wallLine.getLength();
	if (this.item.isLoft())
		length = shedLength;

	if (this.offset_width_left < offsetCheckEndPoint)
		this.offset_width_left = offsetCheckEndPoint;
	if (this.offset_width_left > length - offsetCheckEndPoint - this.width)
		this.offset_width_left = length - offsetCheckEndPoint - this.width;

};

// --------------------------------------------------------------------------------------------------------------------
// -- WorkItemBuildWith Class --

function WorkItemBuildWith() {
	/** Database: work_item_buildwith.id. */
	this.id;
	/** Database: work_item_buildwith.item_id. */
	this.item_id;
	/** Database: work_item_buildwith.work_shed_id. */
	this.work_shed_id;
	/** Database: work_item_buildwith.width. */
	this.width;
	/** Database: work_item_buildwith.height. */
	this.height;
	/** Database: work_item_buildwith.depth. */
	this.depth;
	/** Database: work_item_buildwith.window_height_offset. */
	this.window_height_offset;
	/** this is the work_item it is linked to when placed on the shed itself. A way to keep track if it has been placed or not. */
	this.workItem = null;
	/** Database: item. */
	this.item = null;	
}

WorkItemBuildWith.prototype.loadFromDB = function(data) {
	this.id = parseInt(data.id);
	this.item_id = parseInt(data.item_id);
	this.work_shed_id = parseInt(data.work_shed_id);
	this.width = parseFloat(data.width);
	this.height = parseFloat(data.height);
	this.depth = parseFloat(data.depth);
	this.window_height_offset = parseFloat(data.window_height_offset);
};




