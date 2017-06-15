/*
 * Author: Robert Molnar 2
 */


function DraggableItem(item, v) {
	this.item = item;
	this.v = v.newCopy();
	this.validLocation = false;
}


// --------------------------------------------------------------------------------------------------------------------
// -- GuideLines Class --

/** This is where the restrictions, guidelines, and calculations happens here.
*/
function GuideLines() {	
	/** List of Item. From Database table Item. */
	this.ltItems = [];

	/** List of BuildWith items. From Database table work_item_buildwith. */
	this.ltBuildWithItems = [];

	/** The WorkShed that is currently being worked on. */
	this.workShed = null;

	/** This is the selected wall currently being worked on. */
	this.selectedWall = null;

	/** This is the selected item currently being worked on. */
	this.selectedItem = null;	

	/** This is the drag-and-drop item. */
	this.dragAndDrop = null;

	// The x,y position in shedbuilder coordinates for the viewer 0,0 position.
	this.view_zero_shedbuilder_x = 0;
	this.view_zero_shedbuilder_y = 0;

	/** @return the Item for a given itemId or null if not.
	*/
	this.getItem = function(itemId) {
		for (var i = 0; i < this.ltItems.length; i++) {
			var item = this.ltItems[i];
			if (item.id == itemId) 
				return item;
		};

		return null;
	};
}

/** @return a list of field names for the advance view to show for the selected item. Or empty if nothing selected.
*/
GuideLines.prototype.getSelectedAvanceVisibleFields = function() {
	if (this.selectedItem != null)
		return this.selectedItem.item.getSelectedAvanceVisibleFields();
	return new Array();
};


/** @return  1: Can be dragged onto selected wall.
 *			-1: There is not enough free space available.
 *          -2: Item cannot be used for wall. 
 */
GuideLines.prototype.getValidDragAndDropOperation = function(itemId) {

	if (this.selectedWall == null)
		return -2;

	// TODO - HACKING TO ALLOW ALL ITEMS.
//	if (this.selectedWall.isValidatedItem(itemId))
		return 1;

//	return -2;
};

/** This will center the selected item.
*/
GuideLines.prototype.onCenterSelectedItem = function() {
	if (this.selectedItem != null) {
		this.selectedWall.centerItem(this.selectedItem);
	}	
};

/** This will update the selected item's degrees.
*/
GuideLines.prototype.onUpdateSelectedItemDegrees = function(degrees) {
	if (this.selectedItem != null)
		this.selectedItem.setOffsetDegrees(degrees);
};

/** This will delete the selected item.
*/
GuideLines.prototype.onDeleteSelectedItem = function() {
	if (this.selectedItem != null) {
		this.selectedWall.deleteItem(this.selectedItem);

		// Convert the deleted item into a WorkItemBuildWith item.
		var workItem = this.selectedItem.toWorkItemBuildWith();
		this.ltBuildWithItems.push(workItem);
		this.selectedItem = null;

		// Hide the submit button.
	   $('#btn_submit_item').hide("slow");
	}
};

/** handles mouse dragging for 2d viewer.
*/
GuideLines.prototype.onMousedrag2D = function(v, vDiff) {
	if (this.dragAndDrop != null) {
		this.dragAndDrop.v.x = v.x;
		this.dragAndDrop.v.y = v.y;

		// Snap the item onto the wall if close enough!
		var wallLine = this.selectedWall.line;

		var rect = wallLine.makeRectAroundLine(1.0, 2.0);
		if (rect.isHit(v)) {			
			this.dragAndDrop.v = wallLine.getClosestPoint(v);
			if (this.dragAndDrop.item.item.isLoft())
				this.dragAndDrop.v = this.workShed.loftWall.getLoftUpdatedDragPosition(this.dragAndDrop, this.selectedWall, this.workShed.length);

			this.dragAndDrop.validLocation = this.isValidDragItemLocation();
		} else
			this.dragAndDrop.validLocation = false;

		return;
	}

	// Drag that selected item around.
	if (this.selectedItem != null) {
		this.selectedItem.onMousedrag(this.selectedWall.line, vDiff, this.workShed.length);
		this.selectedItem.validLocation = this.isValidItemLocation(this.selectedItem, this.selectedItem.offset_width_left);
	}
}

/** handles mouse down for 2d viewer.
*/
GuideLines.prototype.onMousedown2D = function(v) {

	// Was a drag-and-drop item clicked on? If so than make it into a dragged item.
	var dragAndDropItem = this.getDragAndDropItem(v);
	if (dragAndDropItem != null) {
		this.dragAndDrop = new DraggableItem(dragAndDropItem, v);
		return;
	}

	// Make sure the previously selected are unselected.
	if (this.selectedWall != null)
		this.selectedWall.selected = false;
	if (this.selectedItem != null)
		this.selectedItem.selected = false;
	this.selectedWall = null;
	this.selectedItem = null;

	// Did the user click on something to be selected?
	var selected = this.workShed.getSelected(v);
	if (selected.wall != null) {
		this.selectedWall = selected.wall;
		this.selectedWall.selected = true;
		if (selected.item != null) {
			this.selectedItem = selected.item;
			this.selectedItem.setSavedOffsetPosition();
			this.selectedItem.selected = true;
			this.selectedItem.validLocation = true;
		}
	}

}

/** Handles mouse up for 2d viewer.
*/
GuideLines.prototype.onMouseup2D = function(v) {
	// If dragging an item then either attach it to the wall or get rid of it.
	if (this.dragAndDrop != null) {

		// If item is a hit for the wall than add it to the wall.
		var wallLine = this.selectedWall.line;
		var rect = wallLine.makeRectAroundLine(1.0, 2.0);
		if (rect.isHit(v) && this.isValidDragItemLocation()) {

			var workItem = null;
			if (this.dragAndDrop.item.item.isLoft())
				workItem = this.workShed.loftWall.addDragItem(this.dragAndDrop, this.workShed.length);
			else
				workItem = this.selectedWall.addDragItem(this.dragAndDrop, this.workShed.length);
			this.dragAndDrop.workItem = workItem;

			// Now remove the WorkItemBuildWith.
			for (var i=0; i < this.ltBuildWithItems.length; i++) {
				if (this.ltBuildWithItems[i] == this.dragAndDrop.item) {
					this.ltBuildWithItems.splice(i, 1);

					// Turn on the submit button.
					if (this.ltBuildWithItems.length == 0) {
					   $('#btn_submit_item').show("slow");
					}

					break;
				}
			}
		}

		this.dragAndDrop = null;
		return;
	} else if (this.selectedItem != null) {

		// check to see if item can be placed where it is at. If not then move it back.
		if (!this.isValidItemLocation(this.selectedItem, this.selectedItem.offset_width_left)) {
			this.selectedItem.resetToSavedPosition();
		}

	}

}

/** @return true if the drag item is in a valid location on the selected wall.
*/
GuideLines.prototype.isValidDragItemLocation = function() {

	if (this.dragAndDrop.item.item.isLoft()) { // Loft is a special case as they are only connected to the back wall and only lofts should be compared against other lofts.
		var offset_width_left = this.workShed.loftWall.getLoftDragItemOffsetWidthLeft(this.dragAndDrop, this.workShed.length);
		return this.isValidItemLocation(this.dragAndDrop.item, offset_width_left);

	} else if (this.selectedWall != null) {
		var offset_width_left = this.selectedWall.getDragItemOffsetWidthLeft(this.dragAndDrop);
		return this.isValidItemLocation(this.dragAndDrop.item, offset_width_left);
	}

	return false;
};

/** @return true if the DragItem or WorkItem is in a valid location on the selected wall.
*/
GuideLines.prototype.isValidItemLocation = function(dragOrWorkItem, offset_width_left) {

	if (dragOrWorkItem.item.isLoft()) { // Loft is a special case as they are only connected to the back wall and only lofts should be compared against other lofts.
		return this.workShed.loftWall.isValidLoftLocation(dragOrWorkItem, offset_width_left);

	} else if (this.selectedWall != null) {
		return this.selectedWall.isValidItemLocation(dragOrWorkItem, offset_width_left);
	}

	return false;
};

/** This will see if the drag-and-drop item was clicked on and if so will return the item.
 * @return the drag-and-drop item or null if none were selected.
*/
GuideLines.prototype.getDragAndDropItem = function(v) {

	// Does a click fall within the drag-and-drop.
	for (var i=0; i < this.ltBuildWithItems.length; i++) {
		var x = this.view_zero_shedbuilder_x + 1.0;
		var y = this.view_zero_shedbuilder_y + 1.0 + i*1.5;	

		var v1 = new RTVector2D(x, y);
		var v2 = new RTVector2D(x+7.0, y);
		var v3 = new RTVector2D(x+7.0, y+1);
		var v4 = new RTVector2D(x, y+1);

		var rect = new RTRect();
		rect.init(v1, v2, v3, v4);

		if (rect.isHit(v)) {
			return this.ltBuildWithItems[i];
		}
	}

	return null;
};

/** This will load in all data needed from the database.
 * @param callBackFunc is the function to call back once json data is loaded.
*/
GuideLines.prototype.loadFromDB = function(callBackFunc) {

	var self = this;
	$.getJSON("/order/StepDiagram/loadShed", function (data) {
		// Load in the items.		
		data.items.map(function (dataJson) {
			var item = new Item();
			item.loadFromDB(dataJson);
			self.ltItems.push(item);
		});

		// Load in the buildwith items.
		data.buildwith.map(function (dataJson) {
			var buildwith = new WorkItemBuildWith();
			buildwith.loadFromDB(dataJson);
			buildwith.item = self.getItem(buildwith.item_id);
			if (buildwith.item == null)
				console.log("Unable to find work item: " + buildwith.item_id);

			self.ltBuildWithItems.push(buildwith);

		});

		// Load the WorkShed, WorkWall, and WorkItem in.
  		self.workShed = new WorkShed();
  		self.workShed.loadFromDB(data.workShed);

  		// Set the Item in the WorkItem values.
  		self.workShed.ltWorkWalls.map(function (workWall) {
  			workWall.ltWorkItems.map(function (workItem) {
  				var item = self.getItem(workItem.itemId);
  				if (item == null)
  					console.log("Unable to find item: " + workItem.itemId);
  				workItem.item = item;
  			});
  		});

  		// Set the Item in the WorkWall lists.
  		self.workShed.ltWorkWalls.map(function (workWall) {
  			workWall.ltWorkItems.map(function (workItem) {
  				var item = self.getItem(workItem.itemId);
  				if (item == null)
  					console.log("Unable to find work item: " + workItem.itemId);
  				workItem.item = item;
  			});

  			workWall.ltValidItems.map(function (validItem) {
  				var item = self.getItem(validItem.itemId);
  				if (item == null)
  					console.log("Unable to find valid item: " + validItem.itemId);
  				validItem.item = item;
  			});
  		});

		// Turn on the submit button.
		if (self.ltBuildWithItems.length == 0) {
		   $('#btn_submit_item').show("slow");
		}

  		// Fire up the render functino.
  		callBackFunc();
	});
}

/** This will save the WorkShed, WorkWall, and WorkItem to the database.
*/
GuideLines.prototype.saveToDB = function(postData) {
	this.workShed.saveToDB(postData);
};

/** This will load in a shed into the workshed and also set up the guidelines for the new shed. 
 * @param shedId: int: shed.id of the shed to load in.
 * @param workshed: WorkShed: The work shed to populate with default settings.
*/
GuideLines.prototype.debugLoad = function(shedId, workshed) {

	var item = newDebugWindow1();
	this.ltItems.push(item);

	var dooritem = newDebugShortHouseDoor1();
	this.ltItems.push(dooritem);

	var dditem = newDebugDoubleDoor();
	this.ltItems.push(dditem);

	var ddshelf = newDebugShelf();
	this.ltItems.push(ddshelf);

	// This will need to load in the shed information from the web server via JSON.

	// Populate the WorkShed, WorkWall, and WorkItem.

	// For now just use hard-coded values until the web server JSON coding is done.
	workshed.shedId = shedId;
	workshed.width = 10.0;
	workshed.length = 20.0;

	var wall1 = new WorkWall(0, -10.0, -5.0, 10.0, -5.0);


	var itemDoor = new WorkItem();
	itemDoor.itemId = 3;
	itemDoor.item = dditem;
	itemDoor.offset_width_left = 2.0;
	itemDoor.width = 8.0;
	itemDoor.height = 6.0;
	itemDoor.depth = 1.0;

	wall1.ltWorkItems.push(itemDoor);

	var itemShelf = new WorkItem();
	itemShelf.itemId = 4;
	itemShelf.item = ddshelf;
	itemShelf.offset_width_left = 14;
	itemShelf.width = 2.0;
	itemShelf.height = 4.0;
	itemShelf.depth = 2.0;

	wall1.ltWorkItems.push(itemShelf);


	var wall2 = new WorkWall(0, 10.0, -5.0, 10.0, 5.0);

	var workItem1 = new WorkItem();
	workItem1.itemId = 1;
	workItem1.item = item;
	workItem1.offset_width_left = 2.0;
	workItem1.width = 6.0;
	workItem1.height = 8.0;
	workItem1.depth = 0.0;

	wall2.ltWorkItems.push(workItem1);

	var wall3 = new WorkWall(0, 10.0, 5.0, -10.0, 5.0);


	workItem1 = new WorkItem();
	workItem1.itemId = 2;
	workItem1.item = dooritem;
	workItem1.offset_width_left = 4.0;
	workItem1.width = 5.0;
	workItem1.height = 6.0;
	workItem1.depth = 1.0;

	wall3.ltWorkItems.push(workItem1);

	var wall4 = new WorkWall(0, -10.0, 5.0, -10.0, -5.0);

	workshed.ltWorkWalls.push(wall1);
	workshed.ltWorkWalls.push(wall2);
	workshed.ltWorkWalls.push(wall3);
	workshed.ltWorkWalls.push(wall4);
}
