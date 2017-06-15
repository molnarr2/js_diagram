/*
 * Author: Robert Molnar 2
 */

// --------------------------------------------------------------------------------------------------------------------
// -- Advance Class --

function Advance(guidelines) {

	/** Set the GuideLine class. */
	this.guidelines = guidelines;

	this.advancemode = $("#advancedmode");

}

/** This will center the item.
*/
Advance.prototype.centerItem = function() {
	this.guidelines.onCenterSelectedItem();	
};

/**
 * @return true if it deleted the item.
 */
Advance.prototype.deleteItem = function() {
	if (this.guidelines.selectedItem == null)
		return false;

	this.guidelines.onDeleteSelectedItem();
	this.advancemode.hide();

	return true;
};

/** Call this to update the Advance class. This needs to be called when a mouse down happens or mouse up.
*/
Advance.prototype.update = function() {
	if (this.guidelines.selectedItem == null)
		this.advancemode.hide();
	else 
		this.advancemode.show();
};

