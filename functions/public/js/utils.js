//============================================================
// graph visualization (gv)
//------------------------------------------------------------
// this file is for utilitity functions

// convert from degree to radian
gv.utils.degrees_to_radians = function(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// circilar layout: convert angle to x, y position
gv.utils.getXYfromAngle = function(angle, radius, centerx, centery) {
	var x = centerx
	var y = centery

	if(angle>=0 && angle<=90) {
		var angle = gv.utils.degrees_to_radians(angle)
		x = centerx + Math.sin(angle)*radius
		y = centery - Math.cos(angle)*radius
	}
	else if(angle>90 && angle<=180) {
		var angle = 180-angle
		angle = gv.utils.degrees_to_radians(angle)
		x = centerx + Math.sin(angle)*radius
		y = centery + Math.cos(angle)*radius
	}
	else if(angle>180 && angle<=270) {
		var angle = angle-180
		angle = gv.utils.degrees_to_radians(angle)
		x = centerx - Math.sin(angle)*radius
		y = centery + Math.cos(angle)*radius
	}
	else {
		var angle = 360-angle
		angle = gv.utils.degrees_to_radians(angle)
		x = centerx - Math.sin(angle)*radius
		y = centery - Math.cos(angle)*radius
	}
	
	return {'x': x, 'y': y}
}