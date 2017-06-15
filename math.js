/*
 * Author: Robert Molnar 2
 */

// --------------------------------------------------------------------------------------------------------------------
// -- RTVector2D --

// Represents a vector (ie, point as well).
function RTVector2D(x, y) {
	this.x = x;
	this.y = y;
}

/** This will generate a Paper.Point.
 * @param offset_x is the offset of this line.
 * @param offset_y is the offset of this line.
 * @param scale is the multiplier.
 */
RTVector2D.prototype.toPaperPoint = function(offset_x, offset_y, scale) {
	var newx = offset_x + (this.x * scale);
	var newy = offset_y + (this.y * scale);
	return new paper.Point(newx, newy);	
}

/** This will create a new copy of the RTVector2D.
*/
RTVector2D.prototype.newCopy = function() {
	return new RTVector2D(this.x, this.y);
}

/** This will add the vector v times by the scale.
*/
RTVector2D.prototype.addVector = function(v, scale) {
	this.x += v.x * scale;
	this.y += v.y * scale;
}

/** STATIC: This will diff the v1 - v2 and give the results.
*/
RTVector2D.prototype.diff = function(v1, v2) {
	var v = new RTVector2D(v1.x - v2.x, v1.y - v2.y);
	return v;
}

// --------------------------------------------------------------------------------------------------------------------
// -- RTLine --

// Represents a line. Lines must be genenerate clockwise for math to work correctly.
// @param rtpoint1 is the first RTPoint
// @param rtpoint2 is the second RTPoint
function RTLine(rtvec1, rtvec2) {
	this.v1 = rtvec1;
	this.v2 = rtvec2;

	/** This will normalize the face vector so it is pointing away from the line.
	*/
	this.normalizeFaceVector = function() {

		var x = this.v2.x -this.v1.x;
		var y = this.v2.y - this.v1.y;

		var dist = Math.sqrt(x*x + y*y);

		var xNormal = x / dist;
		var yNormal = y / dist;

		var xFinal = 0;
		var yFinal = 0;

		// Q6, Q8
		if (xNormal == 0) {
			xFinal = yNormal;

		// Q5, Q7
		} else if (yNormal == 0) {
			yFinal -= xNormal;

		// Q1
		} else if (xNormal > 0 && yNormal > 0) {
			xFinal = yNormal;
			yFinal = -xNormal;

		// Q2
		} else if (xNormal > 0 && yNormal < 0) {
			xFinal = yNormal;
			yFinal -= xNormal;

		// Q3
		} else if (xNormal < 0 && yNormal < 0) {
			xFinal = yNormal;
			yFinal = -xNormal;

		// Q4
		} else if (xNormal < 0 && yNormal > 0) {
			xFinal = yNormal;
			yFinal -= xNormal;
		}

		v = new RTVector2D(xFinal, yFinal);

		/*
		// since we are dealing with 90 degree angles we cheat here.
		var diff_x = this.v1.x - this.v2.x;
		var diff_y = this.v1.y - this.v2.y;

		var v;
		if (diff_x < 0.01 && diff_x > -0.01) {
			if (diff_y > 0)
				v = new RTVector2D(-1, 0);
			else
				v = new RTVector2D(1, 0);
		} else {
			if (diff_x > 0)
				v = new RTVector2D(0, 1);
			else
				v = new RTVector2D(0, -1);			
		} */

		return v;
	}

	/** This will normalize the vector towards v1 starting at v2.
	*/
	this.normalizedFromV2toV1 = function() {

		var x = this.v1.x -this.v2.x;
		var y = this.v1.y - this.v2.y;

		var dist = Math.sqrt(x*x + y*y);

		var xNormal = x / dist;
		var yNormal = y / dist;
		return new RTVector2D(xNormal, yNormal);
	}

	/** This will normalize the vector towards v1 starting at v2.
	*/
	this.normalizedFromV1toV2 = function() {

		var x = this.v2.x -this.v1.x;
		var y = this.v2.y - this.v1.y;

		var dist = Math.sqrt(x*x + y*y);

		var xNormal = x / dist;
		var yNormal = y / dist;
		return new RTVector2D(xNormal, yNormal);
	}

	/** This is the vector that is facing away from the line. It is normalized (ie, is a 1 length)
	*/
	this.vNormal = this.normalizeFaceVector();

	/** This is the vector that is going towards the v1 vector from v2.
	*/
	this.vFromV2toV1 = this.normalizedFromV2toV1();

	/** This is the vector that is going towards the v2 vector from v1.
	*/
	this.vFromV1toV2 = this.normalizedFromV1toV2();


}

/** This will return the closest point on the line from the v point.
*/
RTLine.prototype.getClosestPoint = function(v) {
	var t=0.0;

	// Total vector from v1 to v2.
	var x = this.v2.x -this.v1.x;
	var y = this.v2.y - this.v1.y;

	var closestDistance = 52000;

	// Use a parameter(t) math to determine closest point on line.
	for (t=0.0; t < 1.0; t += 0.01) {

		// Get the current spot on the line.
		var x1 = this.v1.x + x * t;
		var y1 = this.v1.y + y * t;

		// Compare the distance, if the distance starts to get larger than stop and use that point it is the closest.
		var xDiff = v.x - x1;
		var yDiff = v.y - y1;
		var dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
		if (dist > closestDistance) {
			t -= 0.01;			
			x1 = this.v1.x + x * t;
			y1 = this.v1.y + y * t;
			return new RTVector2D(x1, y1);
		}
		closestDistance = dist;
	}

	// Use the end point then.
	return this.v2.newCopy();
};

/** This will return the closest parameter(t) point on the line from the v point.
*/
RTLine.prototype.getClosestPointT = function(v) {
	var t=0.0;

	// Total vector from v1 to v2.
	var x = this.v2.x -this.v1.x;
	var y = this.v2.y - this.v1.y;

	var closestDistance = 52000;

	// Use a parameter(t) math to determine closest point on line.
	for (t=0.0; t < 1.0; t += 0.01) {

		// Get the current spot on the line.
		var x1 = this.v1.x + x * t;
		var y1 = this.v1.y + y * t;

		// Compare the distance, if the distance starts to get larger than stop and use that point it is the closest.
		var xDiff = v.x - x1;
		var yDiff = v.y - y1;
		var dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
		if (dist > closestDistance) {
			x1 = this.v1.x + x * t;
			y1 = this.v1.y + y * t;
			return t;
		}
		closestDistance = dist;
	}

	// Use the end point then.
	return 1.0;
};

/** This will create a new copy of the RTLine.
*/
RTLine.prototype.newCopy = function() {
	var newV1 = this.v1.newCopy();
	var newV2 = this.v2.newCopy();

	return new RTLine(newV1, newV2);
}

/** @return true if the RTVector2D exists on this line or is close to it.
*/
RTLine.prototype.isHitClose = function(v) {
	var rect = new RTRect();
	rect.initWithLine(this, 0.5);
	return rect.isHit(v);
};

/** @return true if line is vertical.
*/
RTLine.prototype.isVertical = function() {
	var diff = this.v1.x - this.v2.x;
	if (diff < 0.01 && diff > -0.01)
		return 1;
	return 0;
}

/** This will get the middle point of the line.
 * @return RTVector2D of the middle point of the line.
*/
RTLine.prototype.getMidPoint = function() {
	var mid_x = (this.v1.x + this.v2.x) / 2;
	var mid_y = (this.v1.y + this.v2.y) / 2;
	return new RTVector2D(mid_x, mid_y);
}

/** Set the vector V2.
*/
RTLine.prototype.setV2 = function(v) {
	this.v2.x = v.x;
	this.v2.y = v.y;
}

/** Set the vector V1.
*/
RTLine.prototype.setV1 = function(v) {
	this.v1.x = v.x;
	this.v1.y = v.y;
}

/** This will move V1 using the vector v and scaled at 'scale'.
*/
RTLine.prototype.moveV1 = function(v, scale) {
	this.v1.x += v.x * scale;
	this.v1.y += v.y * scale;
}

/** This will move V2 using the vector v and scaled at 'scale'.
*/
RTLine.prototype.moveV2 = function(v, scale) {
	this.v2.x += v.x * scale;
	this.v2.y += v.y * scale;
}

/** This will move the line by using the vector v and scaled at 'scale'/ */
RTLine.prototype.move = function(v, scale) {
	this.v1.x += v.x * scale;
	this.v1.y += v.y * scale;
	this.v2.x += v.x * scale;
	this.v2.y += v.y * scale;
}

/** This will create a new copy of the line.
*/
RTLine.prototype.newCopy = function() {
	var v1 = this.v1.newCopy();
	var v2 = this.v2.newCopy();
	return new RTLine(v1, v2);
}

/** @return the length of the line.
*/
RTLine.prototype.getLength = function() {
	var x = this.v2.x -this.v1.x;
	var y = this.v2.y - this.v1.y;

	return Math.sqrt(x*x + y*y);
}

/** This will move the line away (ie, using the vNormal's direction)
*/
RTLine.prototype.moveAway = function(scale) {
	this.move(this.vNormal, scale);
};

/** @return the length of the line in feet and inches formatted.
*/
RTLine.prototype.getLengthFormatted = function() {
	var length = this.getLength();

	var realFeet = Math.abs(length);

	var feet = Math.floor(realFeet);
	var inches = Math.round((realFeet - feet) * 12);

	if (inches == 0)
		return feet + "'";
	else if (inches == 12) {
		inches = 0;
		feet += 1;	
		return feet + "'" + inches + "\"";

	} else
		return feet + "'" + inches + "\"";
}

/** This will generate a Paper.Line. default color is black.
 * @param offset_x is the offset of this line.
 * @param offset_y is the offset of this line.
 * @param scale is the multiplier.
 */
RTLine.prototype.toPaperLine = function(offset_x, offset_y, scale) {

	var p1 = this.v1.toPaperPoint(offset_x,offset_y, scale);
	var p2 = this.v2.toPaperPoint(offset_x,offset_y, scale);

	var path = new paper.Path.Line(p1, p2);
	path.strokeColor = 'black';

	return path;
}

/** This will generate a Paper.Path as an arrowhead at V1 and pointing towards V1.
 * @param scale_arrowhead is the multiplier. How big the arrow head will be.
 */
RTLine.prototype.toPaperArrowHeadV1 = function(scale_arrowhead, offset_x, offset_y, scale) {

	// The two vertices that will the fat part of the arrowhead.
	var _v2a = this.v1.newCopy();
	var _v2b = this.v1.newCopy();

	_v2a.x += this.vFromV1toV2.x * scale_arrowhead * 2;
	_v2a.y += this.vFromV1toV2.y * scale_arrowhead * 2;

	_v2b.x += this.vFromV1toV2.x * scale_arrowhead * 2;
	_v2b.y += this.vFromV1toV2.y * scale_arrowhead * 2;

	_v2a.x += this.vNormal.x * scale_arrowhead;
	_v2a.y += this.vNormal.y * scale_arrowhead;

	_v2b.x += this.vNormal.x * scale_arrowhead * -1;
	_v2b.y += this.vNormal.y * scale_arrowhead * -1;

	var p1 = this.v1.toPaperPoint(offset_x,offset_y, scale);
	var p2 = _v2a.toPaperPoint(offset_x,offset_y, scale);
	var p3 = _v2b.toPaperPoint(offset_x,offset_y, scale);

	// Create the Paper.js path that looks like an arrow.
	var path = new paper.Path();

	path.add(p1);
	path.add(p2);
	path.add(p3);
	path.closed = true;
	path.strokeColor = 'black';
	path.fillColor = '#000000';

	return path;
}

/** This will generate a Paper.Path as an arrowhead at V2 and pointing towards V2.
 * @param scale_arrowhead is the multiplier. How big the arrow head will be.
 */
RTLine.prototype.toPaperArrowHeadV2 = function(scale_arrowhead, offset_x, offset_y, scale) {

	// The two vertices that will the fat part of the arrowhead.
	var _v2a = this.v2.newCopy();
	var _v2b = this.v2.newCopy();

	_v2a.x += this.vFromV2toV1.x * scale_arrowhead * 2;
	_v2a.y += this.vFromV2toV1.y * scale_arrowhead * 2;

	_v2b.x += this.vFromV2toV1.x * scale_arrowhead * 2;
	_v2b.y += this.vFromV2toV1.y * scale_arrowhead * 2;

	_v2a.x += this.vNormal.x * scale_arrowhead;
	_v2a.y += this.vNormal.y * scale_arrowhead;

	_v2b.x += this.vNormal.x * scale_arrowhead * -1;
	_v2b.y += this.vNormal.y * scale_arrowhead * -1;

	var p1 = this.v2.toPaperPoint(offset_x,offset_y, scale);
	var p2 = _v2a.toPaperPoint(offset_x,offset_y, scale);
	var p3 = _v2b.toPaperPoint(offset_x,offset_y, scale);

	// Create the Paper.js path that looks like an arrow.
	var path = new paper.Path();

	path.add(p1);
	path.add(p2);
	path.add(p3);
	path.closed = true;
	path.strokeColor = 'black';
	path.fillColor = '#000000';

	return path;
}

/** This will make a rectangle around the line.
 * @param lengthScale is how much the line should grow by first. (ie, this makes the line longer for the rect)
 * @param widthScale is how fat the line should grow by. (ie, this makes the line fatter for the rect)
 * @return RTRect around the line.
 */
RTLine.prototype.makeRectAroundLine = function(lengthScale, widthScale) {

	var v1 = this.v1.newCopy();

	// Grow it out towards v1. (lengthen it)
	v1.x += this.vFromV2toV1.x * lengthScale/2;
	v1.y += this.vFromV2toV1.y * lengthScale/2;

	// Grow it out away from v1. (widen it)
	v1.x += this.vNormal.x * (widthScale/2);
	v1.y += this.vNormal.y * (widthScale/2);

	// Now Grow this to the opposite of where v1. (full width)
	var v2 = v1.newCopy();
	v2.x -= this.vNormal.x * widthScale;
	v2.y -= this.vNormal.y * widthScale;

	var v3 = this.v2.newCopy();

	// Grow it out towards v2. (lengthen it)
	v3.x += this.vFromV1toV2.x * lengthScale/2;
	v3.y += this.vFromV1toV2.y * lengthScale/2;

	// Grow it out away from v2. (widen it)
	v3.x += this.vNormal.x * (widthScale/2);
	v3.y += this.vNormal.y * (widthScale/2);

	// Now Grow this to the opposite of where v2. (full width)
	var v4 = v3.newCopy();
	v4.x -= this.vNormal.x * widthScale;
	v4.y -= this.vNormal.y * widthScale;

	var rect = new RTRect();
	rect.init(v1, v2, v4, v3);
	return rect;
};

/** This will generate a new line that is on this line at the two new end points.
 * @param startPos is the position to start the new line on this line.
 * @param endPos is the position to end the new line on this line.
 * @return new RTLine of the sub line.
*/
RTLine.prototype.subLine = function(startPos, endPos) {
	var v1 = this.v1.newCopy();
	var v2 = this.v1.newCopy();

	// Now move the two vertices to the start and stop points.
	v1.x += this.vFromV1toV2.x * startPos;
	v1.y += this.vFromV1toV2.y * startPos;

	v2.x += this.vFromV1toV2.x * endPos;
	v2.y += this.vFromV1toV2.y * endPos;

	return new RTLine(v1, v2);		
};

// --------------------------------------------------------------------------------------------------------------------
// -- RTLine1D --

function RTLine1D (x1, x2) {
	this.x1 = x1; 
	this.x2 = x2;
}


// --------------------------------------------------------------------------------------------------------------------
// -- RTRect --

function RTRect() {
	// The 4 verticies of the rectangle.
	this.v1 = null;
	this.v2 = null;
	this.v3 = null;
	this.v4 = null;

}

/** This will set the rect based on 4 verticies.
*/
RTRect.prototype.init = function(v1, v2, v3, v4) {
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;
	this.v4 = v4;
}

/** This will build a rectangle from a line and halfWidth from the line.
*/
RTRect.prototype.initWithLine = function(line, halfWidth) {

	this.v1 = line.v1.newCopy();
	this.v2 = line.v1.newCopy();
	this.v3 = line.v2.newCopy();
	this.v4 = line.v2.newCopy();

	this.v1.addVector(line.vNormal, halfWidth * -1);
	this.v2.addVector(line.vNormal, halfWidth);
	this.v3.addVector(line.vNormal, halfWidth);
	this.v4.addVector(line.vNormal, halfWidth * -1);
}

/** @return true if inside of rectangle.
*/
RTRect.prototype.isHit = function(v) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    // https://github.com/substack/point-in-polygon
    // Modified for use in RTRect.
    
    var x = v.x, y = v.y;
    
	var vs = [ [ this.v1.x, this.v1.y ], [ this.v2.x, this.v2.y ], [ this.v3.x, this.v3.y ], [ this.v4.x, this.v4.y ] ];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};
