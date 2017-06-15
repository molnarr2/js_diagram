/*
 * Author: Robert Molnar 2
 */

function ValidItem() {
	this.itemId = 0;  // Item.id
	this.item = null; // Item
}

/** This is the database Item table.
*/
function Item() {
	this.id = 0;
	this.name = "";
	this.short_name = "";
	this.type = "";
	this.height = 0;
	this.width = 0;
	this.depth = 0;
	this.window_height_offset = 0;
	this.paperjs_depth = 0;
}

/** This will load the item data from the JSON.
*/
Item.prototype.loadFromDB = function(data) {
	this.id = parseInt(data.id);
	this.name = data.name;
	this.short_name = data.short_name;
	this.type = data.type;
	this.width = parseFloat(data.width);
	this.height = parseFloat(data.height);
	this.depth = parseFloat(data.depth);
	this.window_height_offset = parseFloat(data.window_height_offset);
	this.paperjs_depth = parseFloat(data.paperjs_depth);
}

Item.prototype.getSelectedAvanceVisibleFields = function() {	

	if (this.isWorkbench())
		return ["degrees"];
	if (this.isLoft())
		return ["width"];		
	return new Array();
};

/** @return true if this item will be drawn in the center of the line.
*/
Item.prototype.isDrawCenter = function() {
	if (this.isHouseDoor() || this.isShelf())
		return false;
	return true;
};

/** @return true if item is a barn door.
*/
Item.prototype.isBarnDoor = function() {
	if (this.type == 'B')
		return true;
	return false;
};

/** @return true if item is a workbench.
*/
Item.prototype.isWorkbench = function() {
	if (this.type == 'C')
		return true;
	return false;
};

/** @return true if item is a frame out.
*/
Item.prototype.isFrameOut = function() {
	if (this.type == 'F')
		return true;
	return false;
};

/** @return true if item is a garage door.
*/
Item.prototype.isGarageDoor = function() {
	if (this.type == 'G')
		return true;
	return false;
};

/** @return true if item is a house door.
*/
Item.prototype.isHouseDoor = function() {
	if (this.type == 'H')
		return true;
	return false;
};

/** @return true if item is a loft.
*/
Item.prototype.isLoft = function() {
	if (this.type == 'L')
		return true;
	return false;
};

/** @return true if item is other.
*/
Item.prototype.isOther = function() {
	if (this.type == 'O')
		return true;
	return false;
};

/** @return true if item is porch post.
*/
Item.prototype.isPorchPost = function() {
	if (this.type == 'P')
		return true;
	return false;
};

/** @return true if item is porch rail.
*/
Item.prototype.isPorchRail = function() {
	if (this.type == 'R')
		return true;
	return false;
};

/** @return true if item is a shelf.
*/
Item.prototype.isShelf = function() {
	if (this.type == 'S')
		return true;
	return false;
};

/** @return true if item is a window.
*/
Item.prototype.isWindow = function() {
	if (this.type == 'W')
		return true;
	return false;
};

function newDebugWindow1() {
	var item = new Item();
	item.id = 1;
	item.type = "W"; // Window
	item.name = "3x2";
	item.height = 2;
	item.width = 3;
	item.depth = 1;
	item.window_height_offset = 4;
	return item;
}

function newDebugShortHouseDoor1() {
	var item = new Item();
	item.id = 2;
	item.type = "H"; // Window
	item.name = "Short Solid\nHouse Door";
	item.height = 6;
	item.width = 5;
	item.depth = 1;
	item.window_height_offset = 0;
	return item;
}

function newDebugDoubleDoor() {
	var item = new Item();
	item.id = 3;
	item.type = "B"; // Window
	item.name = "Double Door";
	item.height = 6;
	item.width = 10;
	item.depth = 1;
	item.window_height_offset = 0;
	return item;
}

function newDebugShelf() {
	var item = new Item();
	item.id = 4;
	item.type = "S"; // Shelf
	item.name = "Shelf";
	item.height = 4;
	item.width = 2;
	item.depth = 2;
	item.window_height_offset = 0;
	return item;
}


