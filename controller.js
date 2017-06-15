/*
 * Author: Robert Molnar 2
 */

// --------------------------------------------------------------------------------------------------------------------
// -- Controller Class --

function Controller() {
	// The Views:
	this.viewer2d = null;
	this.view3D = null;

	// Contains what can and cannot be done to a shed. Restrictions, guidelines, and calculations happens here.
	// The in-between between controller and model view.
	this.guidelines = null;

	/** State to keep track of when the mouse is pressed down.
	*/
	this.isMouseDown = false;

	/** The RTVector of the mousedown position. */
	this.vMousedown = null;

	/** This handles the advance mode buttons and text fields. */
	this.advance = null;

	/** This handles the mouse dragging within the 2d viewer.
	*/
	this.onMousedrag2D = function(v, vDiff) {
		this.guidelines.onMousedrag2D(v, vDiff);
		this.viewer2d.render();		
	}

	/** This handles the mouse down within the 2d viewer.
	*/
	this.onMousedown2D = function(v) { 
		// Make sure this is set correctly for the guidelines.
		this.guidelines.view_zero_shedbuilder_x = this.viewer2d.view_zero_shedbuilder_x;
		this.guidelines.view_zero_shedbuilder_y = this.viewer2d.view_zero_shedbuilder_y;

		this.guidelines.onMousedown2D(v);

    	this.advance.update();

		this.viewer2d.render();
	}

	/** This handles the mouse up within the 2d viewer.
	*/
	this.onMouseup2D = function(v) {
		this.guidelines.onMouseup2D(v);

    	this.advance.update();

		this.viewer2d.render();
	}

	// get mouse pos relative to canvas.
	this.getMousePos2D = function(evt) {
	    var rect = this.viewer2d.canvas.getBoundingClientRect();
	    return {
	        x: evt.clientX - rect.left,
	        y: evt.clientY - rect.top
	    };
	}
}

/** Call this to initialize the Controller.
*/
Controller.prototype.init = function() {
	var self = this;

	this.guidelines = new GuideLines();

	this.advance = new Advance(this.guidelines);

	// Initialize the viewer2d.
	this.viewer2d = new Viewer2D(this.guidelines);
	this.viewer2d.init();

	// Set up the mouse events for the 2D view.
	var self = this;
	$(this.viewer2d.canvas).on("mousedown", function(e) {
	    if (self.isMouseDown === false) {
	    	self.isMouseDown = true;

	    	var v = self.viewer2d.canvasToBuilderCoordinates(self.getMousePos2D(e));
	    	self.vMousedown = v;
	    	self.onMousedown2D(v);
	    }
	});

	$(window).on("mouseup", function(e) {
    	var v = self.viewer2d.canvasToBuilderCoordinates(self.getMousePos2D(e));
		self.isMouseDown = false;
		self.onMouseup2D(v);

	});

	$(this.viewer2d.canvas).on("mousemove", function(e) {
		if (self.isMouseDown === true) {
	    	var v = self.viewer2d.canvasToBuilderCoordinates(self.getMousePos2D(e));
	    	var vDiff = RTVector2D.prototype.diff(v, self.vMousedown);
	    	self.onMousedrag2D(v, vDiff);
		}
	});

	$('#btn_delete_item').click(function() {
		self.advance.deleteItem();
		self.viewer2d.render();		
	});

	$('#btn_center_item').click(function() {
		self.advance.centerItem();
		self.viewer2d.render();
	});

	var checkbox_note_checked=0;
	$('#checkbox_note').change(function() {
		if (!checkbox_note_checked) {
			$('#textarea_notes').show('slow');
			checkbox_note_checked = 1;
		} else {
			$('#textarea_notes').hide('hide');
			checkbox_note_checked = 0;
			$('#textarea_notes').val("");
		}


	});

	$('#btn_submit_item').click(function() {

		// Render the canvas as black.
		self.viewer2d.black_mode = true;
		self.viewer2d.render();

		var canvas = document.getElementById('my2dview');
		trimCanvas(canvas);
		var dataURL = canvas.toDataURL();
		var url = $('#btn_submit_item').data("url");

		var postData = {};
		postData.canvasData = dataURL;
		self.guidelines.saveToDB(postData);

		var notes = $('#textarea_notes').val();
		postData.notes = notes;

		$.ajax({
		  type: "POST",
		  url: url,
		  data: postData
		}).done(function(o) {
			// console.log('saved'); 

			// Go to the payment.
			var urlgo = $('#btn_submit_item').data("urlgo");
			location.href = urlgo;
		});

	});

	$(document).keydown(function(e) {
	    if(e.keyCode == 46 || e.keyCode == 8) {
			if (self.advance.deleteItem()) {
				self.viewer2d.render();
	        	e.preventDefault();
	    	}
	    }
	});

	// Initialize the viewer3d.
	this.view3D = new View3D();

	// Load in the data from the database and once loaded then render it.
	this.guidelines.loadFromDB(function() {
		self.viewer2d.render();
	});
};



window.onload = function() {
	// Fire up the controller.
	var controller = new Controller();
	controller.init();
}


// https://github.com/agilgur5/trim-canvas
// Slight modifications.

function trimCanvas (canvas) {
  let context = canvas.getContext('2d')

  let imgWidth = canvas.width
  let imgHeight = canvas.height

  let imgData = context.getImageData(0, 0, imgWidth, imgHeight).data

  // get the corners of the relevant content (everything that's not white)
  let cropTop = scanY(true, imgWidth, imgHeight, imgData)
  let cropBottom = scanY(false, imgWidth, imgHeight, imgData)
  let cropLeft = scanX(true, imgWidth, imgHeight, imgData)
  let cropRight = scanX(false, imgWidth, imgHeight, imgData)

  let cropXDiff = cropRight - cropLeft
  let cropYDiff = cropBottom - cropTop
  
  // get the relevant data from the calculated coordinates
  let trimmedData = context.getImageData(cropLeft, cropTop, cropXDiff,
    cropYDiff)

  // set the trimmed width and height
  canvas.width = cropXDiff
  canvas.height = cropYDiff
  // clear the canvas
  context.clearRect(0, 0, cropXDiff, cropYDiff)
  // place the trimmed data into the cleared canvas to create
  // a new, trimmed canvas
  context.putImageData(trimmedData, 0, 0)
  return canvas // for chaining
}

// returns the RGBA values of an x, y coord of imgData
function getRGBA (x, y, imgWidth, imgData) {
  return {
    red: imgData[(imgWidth * y + x) * 4],
    green: imgData[(imgWidth * y + x) * 4 + 1],
    blue: imgData[(imgWidth * y + x) * 4 + 2],
    alpha: imgData[(imgWidth * y + x) * 4 + 3]
  }
}

function getAlpha (x, y, imgWidth, imgData) {
  return getRGBA(x, y, imgWidth, imgData).alpha
}

// finds the first y coord in imgData that is not white
function scanY (fromTop, imgWidth, imgHeight, imgData) {
  let offset = fromTop ? 1 : -1
  let firstCol = fromTop ? 0 : imgHeight - 1

  // loop through each row
  for (var y = firstCol; fromTop ? (y < imgHeight) : (y > -1); y += offset) {
    // loop through each column
    for (var x = 0; x < imgWidth; x++) {
      // if not white, return col
      if (getAlpha(x, y, imgWidth, imgData)) {
        return y                        
      }      
    }
  }

  // the whole image is white already
  return null
}

// finds the first x coord in imgData that is not white
function scanX (fromLeft, imgWidth, imgHeight, imgData) {
  let offset = fromLeft ? 1 : -1
  let firstRow = fromLeft ? 0 : imgWidth - 1

  // loop through each column
  for (var x = firstRow; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {
    // loop through each row
    for (var y = 0; y < imgHeight; y++) {
      // if not white, return row
      if (getAlpha(x, y, imgWidth, imgData)) {
        return x                        
      }      
    }
  }

  // the whole image is white already
  return null
}




// ---------------------------------------------------------------------------------

// Master list of sheds.
// This is a complete list of all sheds.

// id: unique
// name: barn, economy barn, economy utilty, etc..
// widths: comma delimited valid widths
// depth: comma delimited valid depths
// height: comma delimited valid heights

// ---------------------------------------------------------------------------------

// Master list of items.
// This is a complete list of all items.

// id: unique
// name: name of the item (one for left side and right side porch)
// type: door, window, rail, workbench, shelf, loft, frame out (etc..)
// height:
// width:
// depth:
// window_height_offset:

// ---------------------------------------------------------------------------------

// Master list of wall types.
// This should have a listing of valid items.

// id: unique
// name: name of the wall
// fromx, fromy   (counter-clockwise entered in)
// tox, toy		  (counter-clockwise entered in)

// ---------------------------------------------------------------------------------

// Siding Material

// id: unique
// name:

// ---------------------------------------------------------------------------------

// Exterior Finish

// id: unique
// name:

// ---------------------------------------------------------------------------------

// Trim Color

// id: unique
// name:

// ---------------------------------------------------------------------------------

// Roof Type

// id: unique
// name:

// ---------------------------------------------------------------------------------

// Roof Color

// id: unique
// name:

// ---------------------------------------------------------------------------------

// Floor Treatment

// id: unique
// name:








// An item would contain the following.
// The 3d mesh of the item.
// 

