"use strict";

var CV = CV || {};

CV.Colours = ( function () {

	var gradientColours    = chroma.scale( [ "#EB636F", "#CA73AC", "#7B8EC6", "#109EB1", "#32A17E", "#759B4F", "#A98C41", "#C87D59" ] ).colors( 512, "rgb" );
	var depthColours       = chroma.scale( [ "#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026" ] ).colors( 512, "rgb" );
	var inclinationColours = chroma.scale( [ "yellow", "008ae5" ] ).colors( 128, "rgb" );
	var terrainColours     = chroma.scale( [ "LimeGreen", "white" ] ).colors( 128, "rgb" );
	var surveyColours      = [ 0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a, 0xffff99 ];

	var gradientTexture    = scaleToTexture( gradientColours );
	var depthTexture       = scaleToTexture( depthColours );

	var gradientColoursRGB    = rgbToHex( gradientColours );
	var terrainColoursRGB     = rgbToHex( terrainColours );
	var inclinationColoursRGB = rgbToHex( inclinationColours );
	var surveyColoursRGB      = surveyColours;

	var surveyColoursCSS      = rgbToCSS( surveyColours );

function scaleToTexture ( colours ) {

	var l = colours.length;
	var data = new Uint8Array( l * 3 );

	for ( var i = 0; i < l; i++ ) {

		var c      = colours[ i ];
		var offset = i * 3;

		data[ offset ]     = Math.round( c[0] );
		data[ offset + 1 ] = Math.round( c[1] );
		data[ offset + 2 ] = Math.round( c[2] );

	}

	var texture = new THREE.DataTexture( data, l, 1, THREE.RGBFormat, THREE.UnsignedByteType );

	texture.needsUpdate = true;

	return texture;

}

function rgbToHex ( rgbColours ) {

	var colours = [];

	for ( var i = 0, l = rgbColours.length; i < l; i++ ) {

		var c = rgbColours[ i ];

		colours[ i ] = ( Math.round( c[ 0 ] ) << 16 ) + ( Math.round( c[ 1 ]) << 8 ) + Math.round( c[ 2 ] );

	}

	return colours;

}

function rgbToCSS ( rgbColours ) {

	var colours = [];

	for ( var i = 0, l = rgbColours.length; i < l; i++ ) {

		colours[ i ] = "#" +  rgbColours[ i ].toString( 16 );

	}

	return colours;

}

return {
	surveyColoursCSS:    surveyColoursCSS,
	inclinationColours:  inclinationColoursRGB,
	terrainColours:      terrainColoursRGB,
	gradientColours:     gradientColoursRGB,
	surveyColours:       surveyColoursRGB,
	gradientTexture:     gradientTexture,
	depthTexture:        depthTexture
};

} () ); // end of Colours module

CV.ColourCache = ( function () {

	var white = new THREE.Color( 0xffffff );
	var grey  = new THREE.Color( 0x444444 );
	var red   = new THREE.Color( 0xff0000 );

	// define colors to share THREE.Color objects

	var inclinationColours = createCache( CV.Colours.inclinationColours );
	var terrainColours     = createCache( CV.Colours.terrainColours );
	var gradientColours    = createCache( CV.Colours.gradientColours );
	var surveyColours      = createCache( CV.Colours.surveyColours );

	function createCache ( colours ) {

		var cache = [];

		for ( var i = 0, l = colours.length; i < l; i++ ) {

			cache[i] = new THREE.Color( colours[i] );

		}

		return cache;

	}

	return {
		inclination: inclinationColours,
		terrain:     terrainColours,
		gradient:    gradientColours,
		survey:      surveyColours,
		red:         red,
		white:       white,
		grey:        grey
	};
} ());
"use strict";

var CV = CV || {};

CV.HudObject = function () {};

CV.HudObject.stdWidth  = 40;
CV.HudObject.stdMargin = 5;

CV.HudObject.prototype.removeDomObjects = function () {

	var obj;

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		obj = this.domObjects[ i ];

		obj.parentElement.removeChild( obj );

	}

	this.domObjects = [];

}

CV.HudObject.prototype.setVisibility = function ( visible ) {

	var style;

	this.visible = visible;

	if ( visible ) {

		style = "block";

	} else {

		style = "none";

	}

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		this.domObjects[ i ].style.display = style;

	}

}

// EOF
"use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.SHADING_HEIGHT      = 1;
CV.SHADING_LENGTH      = 2;
CV.SHADING_INCLINATION = 3;
CV.SHADING_CURSOR      = 4;
CV.SHADING_SINGLE      = 5;
CV.SHADING_SURVEY      = 6;
CV.SHADING_OVERLAY     = 7;
CV.SHADING_SHADED      = 8;
CV.SHADING_DEPTH       = 9;
CV.SHADING_PW          = 10;

CV.FEATURE_BOX           = 1;
CV.FEATURE_SELECTION_BOX = 2;
CV.FEATURE_ENTRANCES     = 3;
CV.FEATURE_TERRAIN       = 4;
CV.FACE_WALLS            = 5;
CV.FACE_SCRAPS           = 6;

CV.LEG_CAVE              = 7;
CV.LEG_SPLAY             = 8;
CV.LEG_SURFACE           = 9;

CV.upAxis = new THREE.Vector3( 0, 0, 1 );

CV.toOSref = function ( coordinate ) {

	var easting  = coordinate.x;
	var northing = coordinate.y;

	var firstLetter = "STNOH".charAt( Math.floor( easting / 500000 ) + Math.floor( northing / 500000 ) * 2 );

	var e2 = Math.floor( ( easting  % 500000 ) / 100000 );
	var n2 = Math.floor( ( northing % 500000 ) / 100000 );

	var secondLetter = "VWXYZQRSTULMNOPFGHJKABCDE".charAt( e2 + n2 * 5 );

	var e3 = Math.floor( easting  % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );
	var n3 = Math.floor( northing % 100000 ).toLocaleString( "en-GB", { minimumIntegerDigits: 6, useGrouping: false } );

	return firstLetter + secondLetter + ' ' + e3 + ' ' + n3;

}

CV.padDigits = function ( number, digits ) {

	return Array( Math.max( digits - String( number ).length + 1, 0 ) ).join( 0 ) + number;

}

// EOF
CV.Object3D = function () {};

CV.Object3D.prototype.reverseTraverse = function ( callback ) {

	var children = this.children;

	for ( var i = children.length; i--; ) {

		children[ i ].reverseTraverse( callback );

	}

	callback( this );

};

Object.assign( THREE.Object3D.prototype, CV.Object3D.prototype );

// EOF
//"use strict";

var CV = CV || {};

CV.TreeNode = function ( name, id, parent ) {

	this.name     = name;
	this.id       = id;
	this.parent   = parent;
	this.children = [];

}

CV.Tree = function () {

	this.root  = new CV.TreeNode( "", 0, 0 );
	this.maxId = 0;

}

CV.Tree.prototype.constructor = CV.Tree;

CV.Tree.prototype.addNodeById = function ( name, id, parentId ) {

	var pnode = this.findById( parentId, this.root );

	if ( pnode ) {

		pnode.children.push ( new CV.TreeNode( name, id ) );
		this.maxId = Math.max( this.maxId, id );

		return id;

	}

	return null;

}

CV.Tree.prototype.addNode = function ( name, parentId ) {

	return this.addNodeById( name, ++this.maxId, parentId );

}

CV.Tree.prototype.findById = function ( id, node ) {

	if ( node === undefined ) node = this.root;

	if ( node.id == id ) return node;

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var found = this.findById( id, node.children[ i ] );

		if ( found ) return found;

	}

	return false;

}

CV.Tree.prototype.makeTop = function ( id ) {

	var node = this.findById( id );
	this.root = node;

}

CV.Tree.prototype.addByPath = function ( path, node ) {

	var name = path.shift();
	var next = null;
	var here = null;

	if (node) {

		here = node;

	} else {

		here = this.root;

		if ( name === here.name && path.length === 0 ) {

			return here.id;

		}

	}

	for ( var i = 0, l = here.children.length; i < l; i++ ) {

		var child = here.children[ i ];

		if ( child.name === name ) {

			next = child;

			break;

		}

	}

	if ( next === null ) {

		var next = new CV.TreeNode( name, ++this.maxId, here.id );

		here.children.push( next );  

	}

	if ( path.length ) {

		return this.addByPath( path, next );

	} else {

		return next.id;

	}

}

CV.Tree.prototype.forNodes = function ( doFunc, node ) {

	var root = null;

	if ( node ) {

		root = node;

	} else {

		root = this.root;

	}

	doFunc( root );

	for (var i = 0, l = root.children.length; i < l; i++) {

		this.forNodes(doFunc, root.children[ i ]);

	}

}

CV.Tree.prototype.removeNodes = function ( doFunc, node ) {

	var root = null;

	if (node) {

		root = node;

	} else {

		root = this.root;

	}

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.removeNodes( doFunc, root.children[ i ] );

	}

	doFunc( root );
	root.children = [];

}

CV.Tree.prototype.getSubtreeIds = function ( id, idSet, node ) {

	var root;

	if (!node) {

		root = this.findById( id, this.root );

	} else {

		root = node;

	}

	idSet.add( root.id );

	for ( var i = 0, l = root.children.length; i < l; i++ ) {

		this.getSubtreeIds( id, idSet, root.children[ i ] );

	}

}

CV.Tree.prototype.reduce = function ( name ) {

	// remove single child nodes from top of tree.
	while ( this.root.children.length === 1 ) {

		this.root = this.root.children[ 0 ];

	}

	if ( !this.root.name ) {

		this.root.name = name;

	}

}

CV.Tree.prototype.getRootId = function () {

	return this.root.id;

}

CV.Tree.prototype.getNodeData = function ( id ) {

	var node = this.findById( id, this.root );

	return { name: node.name, id: node.id, noChildren: node.children.length };

}

CV.Tree.prototype.getChildData = function ( id ) {

	var node = this.findById( id, this.root );
	var ret = [];

	for ( var i = 0, l = node.children.length; i < l; i++ ) {

		var child = node.children[ i ];

		ret.push( { name: child.name, id: child.id, noChildren: child.children.length } );

	}

	return ret;

}

CV.Tree.prototype.getIdByPath = function ( path ) {

	var head;
	var node  = this.root;
	var found = true;

	if ( path.length === 0 ) return false;

	// the root node is unnamed at this point
	node = this.root;

	while ( path.length && found ) {

		head = path.shift();
		found = false;

		for ( var i = 0, l = node.children.length; i < l; i++ ) {

			var child = node.children[ i ];

			if ( child.name == head ) {

				node = child;
				found = node.id;

				break;

			}

		}

	}

	return found;

}


// EOF
"use strict";

var CV = CV || {};

CV.AHI = function ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	THREE.Group.call( this );

	this.name = "CV.AHI";
	this.domObjects = [];

	this.lastPitch = 0;

	// artificial horizon instrument
	var globe = new THREE.Group();

	var ring  = new THREE.RingBufferGeometry( stdWidth * 0.9, stdWidth, 20, 4 );
	var sky   = new THREE.SphereBufferGeometry( stdWidth - 10, 20, 20, 0, 2 * Math.PI, 0 , Math.PI / 2 );
	var land  = new THREE.SphereBufferGeometry( stdWidth - 10, 20, 20, 0, 2 * Math.PI, Math.PI / 2, Math.PI / 2 );
	var bar   = new THREE.Geometry();
	var marks = new THREE.Geometry();

	// view orinetation line
	bar.vertices.push( new THREE.Vector3( 4 - stdWidth, 0, stdWidth ) );
	bar.vertices.push( new THREE.Vector3( stdWidth - 4, 0, stdWidth ) );

	// pitch interval marks
	var m1 = new THREE.Vector3(  4, 0, stdWidth - 10 );
	var m2 = new THREE.Vector3( -4, 0, stdWidth - 10 );

	var xAxis = new THREE.Vector3( 1, 0, 0 );

	for ( var i = 0; i < 12; i++ ) {

		var mn1 = m1.clone();
		var mn2 = m2.clone();

		if ( i % 3 === 0 ) {

			mn1.x =  7;
			mn2.x = -7;

		}

		mn1.applyAxisAngle( xAxis, i * Math.PI / 6 );
		mn2.applyAxisAngle( xAxis, i * Math.PI / 6 ); 

		marks.vertices.push( mn1 );
		marks.vertices.push( mn2 );

	}

	var mRing  = new THREE.Mesh( ring, new THREE.MeshBasicMaterial( { color: 0x333333, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mSky   = new THREE.Mesh( sky,  new THREE.MeshPhongMaterial( { color: 0x106f8d, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mLand  = new THREE.Mesh( land, new THREE.MeshPhongMaterial( { color: 0x802100, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mBar   = new THREE.LineSegments( bar,   new THREE.LineBasicMaterial( { color: 0xcccc00 } ) );
	var mMarks = new THREE.LineSegments( marks, new THREE.LineBasicMaterial( { color: 0xffffff } ) );

	mSky.rotateOnAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
	mLand.rotateOnAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
	mMarks.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
	mRing.rotateOnAxis( new THREE.Vector3( 0, 0, 1 ), Math.PI / 8 );

	globe.add( mSky );
	globe.add( mLand );
	globe.add( mMarks );

	this.add( mRing );
	this.add( globe );
	this.add( mBar );

	var offset = stdWidth + stdMargin;

	this.translateX( -3 * offset );
	this.translateY( offset );

	var panel = document.createElement( "div" );

	panel.classList.add( "cv-ahi" );
	panel.textContent = "";

	container.appendChild( panel );

	this.globe = globe;
	this.txt = panel;

	this.domObjects.push( panel );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.AHI.prototype = Object.create( THREE.Group.prototype );

Object.assign( CV.AHI.prototype, CV.HudObject.prototype );

CV.AHI.prototype.contructor = CV.AHI;

CV.AHI.prototype.set = function ( vCamera ) {

	var direction = vCamera.getWorldDirection();

	var pitch = Math.PI / 2 - direction.clone().angleTo( new THREE.Vector3( 0, 0, 1 ) );

	this.globe.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), pitch - this.lastPitch );
	this.lastPitch = pitch;

	this.txt.textContent = Math.round( THREE.Math.radToDeg( pitch ) )  + "\u00B0";

}

// EOF
"use strict";

var CV = CV || {};

CV.AngleScale = function ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	var i, l;

	var geometry = new THREE.RingGeometry( 1, 40, 36, 1, Math.PI, Math.PI );
	var c = [];

	var pNormal = new THREE.Vector3( 1, 0, 0 );
	var hues = CV.Colours.inclinationColours;

	var vertices = geometry.vertices;

	for ( i = 0, l = vertices.length; i < l; i++ ) {

		var legNormal  = vertices[ i ].clone().normalize();
		var dotProduct = legNormal.dot( pNormal );
		var hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( dotProduct ) ) / Math.PI );

		c[ i ] = new THREE.Color( hues[ hueIndex ] );

	}

	var faces = geometry.faces;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		var f = faces[ i ];

		f.vertexColors = [ c[ f.a ], c[ f.b ], c[ f.c ] ];

	}

	geometry.colorsNeedUpdate = true;

	THREE.Mesh.call( this, geometry, new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.VertexColors, side: THREE.FrontSide } ) );

	this.translateY( -height / 2 + 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
	this.translateX(  width / 2 - 40 - 5 );

	this.name = "CV.AngleScale";
	this.domObjects = [];

	var legend = document.createElement( "div" );

	legend.id = "angle-legend";
	legend.textContent = "Inclination";

	container.appendChild( legend );

	this.txt = legend;
	this.domObjects.push( legend );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.AngleScale.prototype = Object.create( THREE.Mesh.prototype );

Object.assign( CV.AngleScale.prototype, CV.HudObject.prototype );

CV.AngleScale.prototype.constructor = CV.AngleScale;

// EOF
"use strict";

var CV = CV || {};

CV.Compass = function ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	THREE.Group.call( this );

	this.name = "CV.Compass";
	this.domObjects = [];

	var cg1 = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 32 );
	var c1  = new THREE.Mesh( cg1, new THREE.MeshBasicMaterial( { color: 0x333333 } ) );

	var cg2 = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
	var c2  = new THREE.Mesh( cg2, new THREE.MeshBasicMaterial( { color: 0xb03a14 } ) );

	var r1 = _makeRose( stdWidth * 0.8, 0.141, 0x581d0a, 0x0c536a );
	var r2 = _makeRose( stdWidth * 0.9, 0.141, 0xb03a14, 0x1ab4e5 );

	r1.rotateZ( Math.PI / 4 );
	r1.merge( r2 );

	var rMesh = new THREE.Mesh( r1, new THREE.MeshBasicMaterial( { vertexColors:THREE.VertexColors, side:THREE.FrontSide } ) );

	this.add( c1 );
	this.add( c2 );
	this.add( rMesh );

	var offset = stdWidth + stdMargin;

	this.translateX( -offset );
	this.translateY(  offset );

	this.lastRotation = 0;

	var panel = document.createElement( "div" );

	panel.classList.add( "cv-compass" );
	panel.textContent = "";

	container.appendChild( panel );

	this.txt = panel;
	this.domObjects.push( panel );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

	// make 'petal' for compass rose
	function _makePetal ( radius, scale, color1, color2 ) {

		var innerR = radius * scale;
		var g = new THREE.Geometry();

		g.vertices.push( new THREE.Vector3( 0, radius, 0 ) );
		g.vertices.push( new THREE.Vector3( innerR ,innerR, 0 ) );
		g.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		g.vertices.push( new THREE.Vector3( -innerR, innerR, 0 ) );

		var f1 = new THREE.Face3( 0, 2, 1, new THREE.Vector3( 0, 0, 1 ), new THREE.Color( color1 ), 0 );  
		var f2 = new THREE.Face3( 0, 3, 2, new THREE.Vector3( 0, 0, 1 ), new THREE.Color( color2 ), 0 );

		g.faces.push( f1 );
		g.faces.push( f2 );

		return g;

	}

	function _makeRose ( radius, scale, color1, color2 ) {

		var p1 = _makePetal( radius, scale, color1, color2 );
		var p2 = p1.clone();
		var p3 = p1.clone();
		var p4 = p1.clone();

		p2.rotateZ( Math.PI / 2 );
		p3.rotateZ( Math.PI );
		p4.rotateZ( Math.PI / 2 * 3 );

		p1.merge( p2 );
		p1.merge( p3 );
		p1.merge( p4 );

		return p1;

	};

}

CV.Compass.prototype = Object.create( THREE.Group.prototype );

Object.assign( CV.Compass.prototype, CV.HudObject.prototype );

CV.Compass.prototype.contructor = CV.Compass;

CV.Compass.prototype.set = function ( vCamera ) {

	var direction = vCamera.getWorldDirection();

	if ( direction.x === 0 && direction.y === 0 ) {

		// FIXME get camera rotation....
		return;

	}

	var dHeading = direction.clone();

	// we are only interested in angle to horizontal plane.
	dHeading.z = 0;

	var a = dHeading.angleTo( new THREE.Vector3( 0, 1, 0 ) );

	if ( dHeading.x >= 0 ) a = 2 * Math.PI - a;

	var degrees = 360 - Math.round( THREE.Math.radToDeg( a ) );

	this.txt.textContent = degrees.toLocaleString( "en-GB", { minimumIntegerDigits: 3 } ) + "\u00B0"; // unicaode degree symbol

	this.rotateOnAxis( new THREE.Vector3( 0, 0, -1 ), a - this.lastRotation );

	this.lastRotation = a;

}

// EOF
"use strict";

var CV = CV || {};

CV.LinearScale = function ( container, viewState ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	this.name = "CV.LinearScale";
	this.domObjects = [];

	var barOffset = 3 * ( stdWidth + stdMargin );
	var barHeight = ( height - barOffset ) / 2;
	var barWidth  = stdWidth / 2;

	var range = viewState.maxHeight - viewState.minHeight;
	var zScale = barHeight / range;

	var geometry = new THREE.PlaneBufferGeometry( barWidth, range );

	// rotate the model to put the plane in the xz plane, covering the range of view height values - the gradient shader works on z values.

	geometry.rotateX( Math.PI / 2 );
	geometry.translate( -barWidth / 2, 0, range / 2 + viewState.minHeight );

	THREE.Mesh.call( this, geometry, CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) );

	var ms = new THREE.Matrix4().makeScale( 1,  1, zScale );

	ms.multiply( new THREE.Matrix4().makeTranslation( width/2 - stdMargin, -height/2 + barOffset - viewState.minHeight * zScale, 0 ) );

	this.applyMatrix( ms );

	// rotate the model in the world view.
	this.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );

	// add labels
	var maxdiv  = document.createElement( "div" );
	var mindiv  = document.createElement( "div" );

	var caption = document.createElement( "div" );

	maxdiv.classList.add( "linear-scale" );
	mindiv.classList.add( "linear-scale" );

	caption.classList.add( "linear-scale-caption" );

	maxdiv.id = "max-div";
	mindiv.id = "min-div";

	caption.id = "linear-caption";

	maxdiv.style.top    = barHeight + "px";
	mindiv.style.bottom = barOffset + "px";

	caption.style.bottom = height - barHeight + "px";

	container.appendChild( maxdiv );
	container.appendChild( mindiv );

	container.appendChild( caption );

	maxdiv.textContent = "---";
	mindiv.textContent = "---";

	caption.textContent = "xxxx";

	this.maxDiv = maxdiv;
	this.minDiv = mindiv;

	this.caption = caption;

	this.domObjects.push( mindiv );
	this.domObjects.push( maxdiv );

	this.domObjects.push( caption );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.LinearScale.prototype = Object.create( THREE.Mesh.prototype );

Object.assign( CV.LinearScale.prototype, CV.HudObject.prototype );

CV.LinearScale.prototype.constructor = CV.LinearScale;

CV.LinearScale.prototype.setRange = function ( min, max, caption ) {

	this.maxDiv.textContent = Math.round( max ) + "m";
	this.minDiv.textContent = Math.round( min ) + "m";

	this.caption.textContent = caption;;

	return this;

}

CV.LinearScale.prototype.setMaterial = function ( material ) {

	this.material = material;

	return this;

}

// EOF
"use strict";

var CV = CV || {};

CV.ProgressDial = function ( container ) {

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	var geometry = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 50 );

	THREE.Mesh.call( this, geometry, new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } ) );

	this.name = "CV.ProgressDial";
	this.domObjects = [];

	var offset = stdWidth + stdMargin;

	this.translateX( -offset * 5 );
	this.translateY(  offset );

	this.rotateOnAxis( new THREE.Vector3( 0, 0, 1 ), Math.PI / 2 );

	this.visible = false;

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.ProgressDial.prototype = Object.create( THREE.Mesh.prototype );

Object.assign( CV.ProgressDial.prototype, CV.HudObject.prototype );

CV.ProgressDial.prototype.contructor = CV.ProgressDial;

CV.ProgressDial.prototype.set = function ( progress ) {

	this.progress = progress;

	var l = Math.min( 100, Math.round( progress ) );
	var faces = this.geometry.faces;

	for ( var i = 0; i < l; i++ ) {

		faces[ 99 - i ].color.set( 0x00ff00 );

	}

	this.geometry.colorsNeedUpdate = true;

}

CV.ProgressDial.prototype.add = function ( progress ) {

	this.set( this.progress + progress );

}

CV.ProgressDial.prototype.start = function () {

	var faces = this.geometry.faces;

	for ( var i = 0; i < 100; i++ ) {

		faces[i].color.set( 0x333333 );

	}

	this.geometry.colorsNeedUpdate = true;
	this.progress = 0;
	this.visible = true;

}

CV.ProgressDial.prototype.end = function () {

	var self = this;

	setTimeout( function () { self.visible = false; }, 500 );

}

// EOF
"use strict";

var CV = CV || {};

CV.ScaleBar = function ( container, hScale, rightMargin ) {

	var leftMargin = 10;

	THREE.Group.call( this );

	this.name = "CV.ScaleBar";
	this.domObjects = [];

	this.hScale        = hScale;
	this.scaleBars     = [];
	this.currentLength = 0;

	this.position.set( -container.clientWidth / 2 +  5,  -container.clientHeight / 2 + leftMargin, 0 );
	this.scaleMax = container.clientWidth - ( leftMargin + rightMargin );

	var legend = document.createElement( "div" );

	legend.classList.add( "scale-legend" );
	legend.textContent = "";

	container.appendChild( legend );

	this.legend = legend;
	this.domObjects.push( legend );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.ScaleBar.prototype = Object.create( THREE.Group.prototype );

Object.assign( CV.ScaleBar.prototype, CV.HudObject.prototype );

CV.ScaleBar.prototype.constructor = CV.ScaleBar;

CV.ScaleBar.prototype.setScale = function ( scale ) {

	var scaleBars = this.scaleBars;
	var length = 0;
	var self   = this;

	var maxVisible = this.scaleMax / ( scale * this.hScale );
	var exponent = Math.ceil( Math.log( maxVisible ) / Math.LN10 ) - 1;
	var rMax     = Math.pow( 10, exponent );
	var maxInc   = maxVisible / rMax;
	var legendText;

	if ( maxInc < 2 ) {

		length = 10;
		exponent = exponent - 1;

	} else if ( maxInc < 5 ) {

		length = 2;

	} else {

		length = 5;

	}

	if ( exponent >= 3 ) {

		legendText = length * Math.pow( 10, exponent - 3) + 'km';

	} else {

		legendText = length * Math.pow( 10, exponent ) + 'm';

	}

	scale = scale * Math.pow( 10, exponent );	

	if ( this.currentLength !== length ) {

		if ( !scaleBars[ length ] ) {

			var bar = _makeScaleBar( length );

			scaleBars[ length ] = bar;
			this.add( bar.mesh );

		}

		if ( this.currentLength > 0 ) {

			scaleBars[ this.currentLength ].mesh.visible = false;

		}

		scaleBars[ length ].mesh.visible = true;
		this.currentLength = length;

	}

	scaleBars[ length ].mesh.scale.x = scale;

	var legend = this.legend;

	legend.style.display = "block";
	legend.style.left = ( scale * scaleBars[ length ].topRight - legend.clientWidth ) + "px";

	legend.textContent = legendText;

	return this;

	function _makeScaleBar ( length ) {

		var height = 4;
		var rLength = length * self.hScale;
		var i, l;

		var bar  = new THREE.PlaneGeometry( rLength, height, length );
		var bar2 = new THREE.PlaneGeometry( rLength, height, length * 10 );
		var line = new THREE.Geometry();

		line.vertices.push( new THREE.Vector3( -rLength / 2, 0, 1 ) );
		line.vertices.push( new THREE.Vector3(  rLength / 2, 0, 1 ) );

		var mBar  = new THREE.Mesh( bar,  new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide } ) );
		var mBar2 = new THREE.Mesh( bar2, new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide } ) );
		var mLine = new THREE.LineSegments( line, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );

		var cRed = new THREE.Color( 0xff0000 );

		for ( i = 0, l = bar.faces.length; i < l; i = i + 4 ) {

			bar.faces[ i ].color   = cRed;
			bar.faces[ i+1 ].color = cRed;

		}

		for ( i = 0, l = bar2.faces.length; i < l; i = i + 4 ) {

			bar2.faces[ i ].color   = cRed;
			bar2.faces[ i+1 ].color = cRed;

		}

		bar.translate( rLength / 2, height + height / 2 + 1, 0 );
		bar2.translate( rLength / 2, height / 2, 0 );
		line.translate( rLength / 2, height, 0 );

		bar.computeBoundingBox();

		var group = new THREE.Group();

		group.add( mBar );
		group.add( mBar2 );
		group.add( mLine );

		return { mesh: group, topRight: bar.boundingBox.max.x };

	}

}

// EOF
"use strict";

var CV = CV || {};

CV.CursorMaterial = function ( type, initialHeight ) {

	THREE.ShaderMaterial.call( this );

	this.defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}

	this.uniforms = {
			uLight:      { value: new THREE.Vector3( -1, -1, 2 ) },
			cursor:      { value: initialHeight },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: new THREE.Color( 0x888888 ) },
			cursorColor: { value: new THREE.Color( 0x00ff00 ) }
		};

	this.vertexShader   = CV.Shaders.cursorVertexShader;
	this.fragmentShader = CV.Shaders.cursorFragmentShader;

	this.type = "CursorMaterial";

	return this;
}


CV.CursorMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.CursorMaterial.prototype.constructor = CV.CursorMaterial;

// EOF
"use strict";

var CV = CV || {};

CV.DepthMapMaterial = function ( minHeight, maxHeight ) {

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) }

		},

		vertexShader:    CV.Shaders.depthMapVertexShader,
		fragmentShader:  CV.Shaders.depthMapFragmentShader,
		depthWrite:      false,
		type:            "CV.DepthMapMaterial"

	} );

	return this;

}

CV.DepthMapMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.DepthMapMaterial.prototype.constructor = CV.DepthMapMaterial;

// EOF
"use strict";

var CV = CV || {};

CV.DepthMaterial = function ( type, limits, texture ) {

	var range   = limits.size();
	var defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		defines.USE_COLOR = true;

	} else {

		defines.SURFACE = true;

	}

	THREE.ShaderMaterial.call( this, {

		uniforms: {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) },

			minX:     { value: limits.min.x },
			minY:     { value: limits.min.y },
			minZ:     { value: limits.min.z },
			scaleX:   { value: 1 / range.x },
			scaleY:   { value: 1 / range.y },
			scaleZ:   { value: 1 / range.z },
			cmap:     { value: CV.Colours.gradientTexture },
			depthMap: { value: texture }

		},

		defines: defines,
		vertexShader: CV.Shaders.depthVertexShader,
		fragmentShader: CV.Shaders.depthFragmentShader
	} );

	this.type = "CV.DepthMaterial";

	return this;

}

CV.DepthMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.DepthMaterial.prototype.constructor = CV.DepthMaterial;

// EOF
"use strict";

var CV = CV || {};

CV.HeightMaterial = function ( type, minHeight, maxHeight ) {

	THREE.ShaderMaterial.call( this );

	this.defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}
	
	this.uniforms = {

			// pseudo light source somewhere over viewer's left shoulder.
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) },

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) },
			cmap:   { value: CV.Colours.gradientTexture }

		};

	this.vertexShader   = CV.Shaders.heightVertexShader;
	this.fragmentShader = CV.Shaders.heightFragmentShader;

	this.type = "CV.HeightMaterial";

	return this;

}

CV.HeightMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.HeightMaterial.prototype.constructor = CV.HeightMaterial;

// EOF
"use strict";

var CV = CV || {};

CV.Materials = ( function () {

var cache = new Map();
var viewState;

function getHeightMaterial ( type ) {

	var name = "height" + type;

	if ( cache.has( name ) ) return cache.get( name );

	var material = new CV.HeightMaterial( type, viewState.minHeight, viewState.maxHeight );

	cache.set(name, material);

	viewState.addEventListener( "newCave",  _updateHeightMaterial );

	return material;

	function _updateHeightMaterial ( event ) {

		var minHeight = viewState.minHeight;
		var maxHeight = viewState.maxHeight;

		material.uniforms.minZ.value = minHeight;
		material.uniforms.scaleZ.value =  1 / ( maxHeight - minHeight );

	}

}

function getDepthMapMaterial () {

	return new CV.DepthMapMaterial( viewState.minHeight, viewState.maxHeight );

}

function getDepthMaterial ( type, limits, texture ) {

	var name = "depth" + type;

	if ( cache.has( name ) ) return cache.get( name );
	
	var material = new CV.DepthMaterial( type, limits, texture );

	cache.set(name, material);

	viewState.addEventListener( "newCave",  _updateDepthMaterial );

	return material;

	function _updateDepthMaterial ( event ) {

		cache.delete( name );

	}

}

function getCursorMaterial ( type, halfWidth ) {

	var name = "cursor" + type;

	if ( cache.has(name) ) return cache.get( name );

	var initialHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

	var material = new CV.CursorMaterial( type, initialHeight );

	cache.set( name, material );

	viewState.addEventListener( "cursorChange",  _updateCursorMaterial );

	return material;

	function _updateCursorMaterial ( event ) {

		var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );

		material.uniforms.cursor.value = cursorHeight;

	}

}

function getLineMaterial () {

	var name = "line";

	if ( cache.has( name ) ) {
		
		return cache.get(name);

	}

	var material = new THREE.LineBasicMaterial( { color: 0xFFFFFF, vertexColors: THREE.VertexColors } );   

	cache.set( name, material );

	return material;

}

function initCache ( viewerViewState ) {

	cache.clear();

	viewState = viewerViewState;

}

return {

	getHeightMaterial:   getHeightMaterial,
	getDepthMapMaterial: getDepthMapMaterial,
	getDepthMaterial:    getDepthMaterial,
	getCursorMaterial:   getCursorMaterial,
	getLineMaterial:     getLineMaterial,
	initCache:           initCache

};


} () );

// EOF
"use strict";

var CV = CV || {};

CV.PWMaterial = function () {

	THREE.ShaderMaterial.call( this, {

		uniforms: {
    		zoom:   new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),
			offset: { value: new THREE.Vector2(1.150, 0.275) },
  			cmap:   { value: CV.Colours.gradientTexture },
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) }
   		 },

		vertexShader: CV.Shaders.pwVertexShader,
		fragmentShader: CV.Shaders.pwFragmentShader

	} );

	this.type = "PWMaterial";

	return this;

	function _updateZoomUniform() {

		this.value += 0.008;

	}

}

CV.PWMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.PWMaterial.prototype.constructor = CV.PWMaterial;

// EOF
"use strict";

CV.TestMaterial = function ( spread ) {

	var i = 1;

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			spread: { value: spread },
			rIn: new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),

		},

		vertexShader:   CV.Shaders.testVertexShader,	
		fragmentShader: CV.Shaders.testFragmentShader,
		vertexColors:   THREE.VertexColors
	} );

	this.type = "CV.TestMaterial";

	return this;

	function _updateZoomUniform() {

		if ( ++i % 5 ) return;
		this.value = Math.random();

	}

}

CV.TestMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.TestMaterial.prototype.constructor = CV.TestMaterial;

// EOF
 "use strict";

var CV = CV || {};

CV.padDigits = function ( number, digits ) {
	
	return Array( Math.max( digits - String( number ).length + 1, 0 ) ).join( 0 ) + number;

}

CV.HeightMapLoader = function ( tileSet, resolution, x, y, loadCallback, errorCallback ) {

	if (!loadCallback) {
		alert("No callback specified");
	}

	var prefix = tileSet.PREFIX + resolution + "M" + tileSet.TILESIZE + "-";

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;
	this.x = x;
	this.y = y;
	this.tileFile = prefix + CV.padDigits( y, 3 ) + "-" + CV.padDigits( x, 3 ) + ".bin";
	this.basedir = tileSet.BASEDIR;

}

CV.HeightMapLoader.prototype.constructor = CV.HeightMapLoader;

CV.HeightMapLoader.prototype.load = function () {

	var self = this;
	var xhr;

	// console.log( "loading: ", this.tileFile );

	xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded);
	xhr.addEventListener( "error", this.errorCallback );

	xhr.open( "GET", this.basedir + this.tileFile );
	xhr.responseType = "arraybuffer"; // Must be after open() to keep IE happy.

	xhr.send();

	return true;

	function _loaded ( request ) {

		if (xhr.status === 200) {

			self.loadCallback( xhr.response, self.x, self.y );

		} else {

			self.errorCallback( xhr.response, self.x, self.y );

		}
	}
}

// EOF
//"use strict";

var CV = CV || {};

CV.NORMAL  = 0;
CV.SURFACE = 1;
CV.SPLAY   = 2;
CV.DIVING  = 3;

CV.Loader = function ( callback, progress ) {

	if (!callback) {

		alert( "No callback specified");

	}

	this.callback = callback;
	this.progress = progress;

}

CV.Loader.prototype.constructor = CV.Loader;

CV.Loader.prototype.parseName = function ( name ) {

	var rev = name.split( "." ).reverse();

	this.extention = rev.shift();
	this.basename  = rev.reverse().join( "." );

	switch ( this.extention ) {

	case '3d':

		this.dataType = "arraybuffer";

		break;

	case 'lox':

		this.dataType = "arraybuffer";

		break;

	default:

		alert( "Cave: unknown response extension [", self.extention, "]" );

	}

}

CV.Loader.prototype.loadURL = function ( cave ) {

	var self     = this;
	var prefix   = "";
	var fileName = cave;
	var xhr;

	// parse file name
	this.parseName( cave );

	// load this file
	var type = this.dataType;

	if (!type) {

		alert( "Cave: unknown file extension [", self.extention, "]");
		return false;

	}

	xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded );
	xhr.addEventListener( "progress", _progress );

	xhr.open( "GET", prefix + cave );

	if (type) {

		xhr.responseType = type; // Must be after open() to keep IE happy.

	}

	xhr.send();

	return true;

	function _loaded ( request ) {

		self.callHandler( fileName, xhr.response );

	}

	function _progress( e ) {

		if ( self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

CV.Loader.prototype.loadFile = function ( file ) {

	var self = this;
	var fileName = file.name;

	this.parseName( fileName );

	var type = this.dataType;

	if (!type) {

		alert( "Cave: unknown file extension [", self.extention, "]");
		return false;

	}

	var fLoader = new FileReader();

	fLoader.addEventListener( "load",     _loaded );
	fLoader.addEventListener( "progress", _progress );

	switch ( type ) {

	case "arraybuffer":

		fLoader.readAsArrayBuffer( file );

		break;

	/*case "arraybuffer":

		fLoader.readAsArrayText( file );

		break;*/

	default:

		alert( "unknown file data type" );
		return false;

	}

	return true;

	function _loaded () {

		self.callHandler( fileName, fLoader.result );

	}

	function _progress( e ) {

		if (self.progress) self.progress( Math.round( 100 * e.loaded / e.total ) );

	}
}

CV.Loader.prototype.callHandler = function( fileName, data) {

	var handler;

	switch ( this.extention ) {

	case '3d':

		handler = new CV.Svx3dHandler( fileName, data );

		break;

	case 'lox':

		handler = new CV.loxHandler( fileName, data );

		break;

	default:

		alert( "Cave: unknown response extension [", this.extention, "]" );
		handler = false;

	}

	this.callback( handler );

}

// EOF
//"use strict";

CV.loxHandler = function ( fileName, dataStream ) {

	this.fileName          = fileName;
	this.entrances         = [];
	this.terrain           = [];
	this.terrainBitmap     = "";
	this.terrainDimensions = {};
	this.scraps            = [];
	this.faults            = [];
	this.lineSegments      = [];
	this.sections          = new Map();
	this.surveyTree        = new CV.Tree();

	var lineSegments = [];
	var xSects       = [];
	var stations     = [];
	var lines        = 0;
	var samples      = 0;
	var self         = this;
	var surveyTree   = this.surveyTree;

	// assumes little endian data ATM - FIXME

	var source = dataStream;
	var pos = 0; // file position
	var dataStart;
	var f = new DataView( source, 0 );
	var l = source.byteLength;

	while ( pos < l ) {

		readChunkHdr();

	}

	this.lineSegments = lineSegments;

	// Drop data to give GC a chance ASAP
	source = null;
	xhr    = null;

	// strip empty/single top nodes of tree
	surveyTree.reduce( "unknown" );

	return;

	// .lox parsing functions

	function readChunkHdr () {

		var m_type     = readUint();
		var m_recSize  = readUint();
		var m_recCount = readUint();
		var m_dataSize = readUint();
		var doFunction;

		// offset of data region for out of line strings/images/scrap data.
		dataStart  = pos + m_recSize;

		switch ( m_type ) {

		case 1:

			doFunction = readSurvey;

			break;

		case 2:

			doFunction = readStation;

			break;

		case 3:

			doFunction = readShot;

			break;

		case 4:

			doFunction = readScrap;

			break;

		case 5:

			doFunction = readSurface;

			break;

		case 6:

			doFunction = readSurfaceBMP;

			break;

		default:

			console.log( "unknown chunk header. type : ", m_type );

		}

		if ( doFunction !== undefined) {

			for ( var i = 0; i < m_recCount; i++ ) {

				doFunction( i );

			}

		}

		skipData( m_dataSize );
	}

	function readUint () {

		var i = f.getUint32( pos, true );

		pos += 4;

		return i;

	}

	function skipData ( i ) {

		pos += i;

	}

	function readSurvey ( i ) {

		var m_id     = readUint();
		var namePtr  = readDataPtr();
		var m_parent = readUint();
		var titlePtr = readDataPtr();

		if (m_parent != m_id && !surveyTree.addNodeById( readString( namePtr ), m_id, m_parent )) {

			console.log( "error constructing survey tree" );

		}

	}

	function readDataPtr() {

		var m_position = readUint();
		var m_size     = readUint();

		return { position: m_position, size: m_size };

	}

	function readString ( ptr ) {

		var bytes = new Uint8Array( source, dataStart + ptr.position, ptr.size );

		return String.fromCharCode.apply( null, bytes );

	}

	function readStation () {

		var m_id       = readUint();
		var m_surveyId = readUint();
		var namePtr    = readDataPtr();

		readDataPtr(); // commentPtr

		var m_flags    = readUint();

		stations[m_id] = readCoords();

		if ( m_flags & 0x02 ) {

			// entrance
			self.entrances.push( { position: stations[m_id], label: readString(namePtr), survey: m_surveyId } );

		}

	}

	function readCoords () {

		var f = new DataView( source, pos );
		var coords = {};

		coords.x = f.getFloat64( 0,  true );
		coords.y = f.getFloat64( 8,  true );
		coords.z = f.getFloat64( 16, true );
		pos +=24;

		return coords;

	}

	function readShot () {

		var m_from = readUint();
		var m_to   = readUint();

		var fromLRUD = readLRUD();
		var toLRUD   = readLRUD();

		var m_flags       = readUint();
		var m_sectionType = readUint();
		var m_surveyId    = readUint();
		var m_threshold   = f.getFloat64( pos, true );
		var type          = CV.NORMAL;

		pos += 8;


		if ( m_flags && 0x01 ) type = CV.SURFACE;
		if ( m_flags && 0x08 ) type = CV.SPLAY;

		if ( m_flags === 0x16 ) {

			xSects[m_from] = fromLRUD;
			xSects[m_to]   = toLRUD;

		}

		lineSegments.push( { from: stations[m_from], to: stations[m_to], type: type, survey: m_surveyId } );

	}

	function readLRUD () {

		var f          = new DataView( source, pos );
		var L		   = f.getFloat64( 0,  true );
		var R		   = f.getFloat64( 8,  true );
		var U		   = f.getFloat64( 16, true );
		var D   	   = f.getFloat64( 24, true );

		pos += 32;

		return { l: L, r: R, u: U, d: D };

	}

	function readScrap () {

		var m_id         = readUint();
		var m_surveyId   = readUint();

		var m_numPoints  = readUint();
		var pointsPtr    = readDataPtr();

		var m_num3Angles = readUint();
		var facesPtr     = readDataPtr();

		var scrap = { vertices: [], faces: [], survey: m_surveyId };
		var lastFace;
		var i;

		for ( i = 0; i < m_numPoints; i++ ) {

			var offset = dataStart + pointsPtr.position + i * 24; // 24 = 3 * sizeof(double)
			var f = new DataView( source, offset );
			var vertex = {};

			vertex.x = f.getFloat64( 0,  true );
			vertex.y = f.getFloat64( 8,  true );
			vertex.z = f.getFloat64( 16, true );

			scrap.vertices.push( vertex );

		}

		// read faces from out of line data area

		for ( i = 0; i < m_num3Angles; i++ ) {

			var offset = dataStart + facesPtr.position + i * 12; // 12 = 3 * sizeof(uint32)
			var f = new DataView( source, offset );
			var face = [];

			face[0] = f.getUint32( 0, true );
			face[1] = f.getUint32( 4, true );
			face[2] = f.getUint32( 8, true );

			// check for face winding order == orientation

			fix_direction: { if ( lastFace !== undefined ) {

				var j;

				for ( j = 0; j < 3; j++ ) { // this case triggers more often than those below.

					if (face[j] == lastFace[(j + 2) % 3] && face[(j + 1) % 3] == lastFace[(j + 3) % 3]) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if (face[j] == lastFace[j] && face[(j + 1) % 3] == lastFace[(j + 1) % 3]) {

						face.reverse();
						break fix_direction;

					}

				}

				for ( j = 0; j < 3; j++ ) {

					if (face[j] == lastFace[(j + 1) % 3] && face[(j + 1) % 3] == lastFace[(j + 2) % 3]) {

						face.reverse();
						break fix_direction;

					}

				}
			}}

			scrap.faces.push( face );
			lastFace = face;
		}

		self.scraps.push( scrap );

	}

	function readSurface () {

		var m_id       = readUint();
		var m_width    = readUint();
		var m_height   = readUint();

		var surfacePtr = readDataPtr(); 
		var m_calib    = readCalibration();

		var ab = source.slice( pos, pos + surfacePtr.size ); // required for 64b alignment

		self.terrain = new Float64Array( ab, 0 );

		self.terrainDimensions.samples = m_width;
		self.terrainDimensions.lines   = m_height;
		self.terrainDimensions.xOrigin = m_calib[0];
		self.terrainDimensions.yOrigin = m_calib[1];
		self.terrainDimensions.xDelta  = m_calib[2];
		self.terrainDimensions.yDelta  = m_calib[5];

	}

	function readCalibration () {

		var f = new DataView( source, pos );
		var m_calib = [];

		m_calib[0] = f.getFloat64( 0,  true );
		m_calib[1] = f.getFloat64( 8,  true );
		m_calib[2] = f.getFloat64( 16, true );
		m_calib[3] = f.getFloat64( 24, true );
		m_calib[4] = f.getFloat64( 32, true );
		m_calib[5] = f.getFloat64( 40, true );

		pos += 48;

		return m_calib;

	}

	function readSurfaceBMP () {

		var m_type      = readUint();
		var m_surfaceId = readUint();

		var imagePtr = readDataPtr();
		var m_calib  = readCalibration();

		self.terrainBitmap = extractImage( imagePtr );
	}

	function extractImage ( imagePtr ) {

		var imgData = new Uint8Array( source, dataStart + imagePtr.position, imagePtr.size );
		var type;

		var b1 = imgData[0];
		var b2 = imgData[1];

		if ( b1 === 0xff && b2 === 0xd8 ) {

			type = "image/jpeg";

		}

		if ( b1 === 0x89 && b2 === 0x50 ) {

			type = "image/png";

		}

		if (!type) {

			return "";

		}

		var blob = new Blob( [imgData], { type: type } );
		var blobURL = URL.createObjectURL( blob );

		return blobURL;

	}
}

CV.loxHandler.prototype.constructor = CV.loxHandler;

CV.loxHandler.prototype.getLineSegments = function () {

	return this.lineSegments;

}

CV.loxHandler.prototype.getSurveyTree = function () {

	return this.surveyTree;

}

CV.loxHandler.prototype.getScraps = function () {

	return this.scraps;

}

CV.loxHandler.prototype.getCrossSections = function () {

	return [];

}

CV.loxHandler.prototype.getEntrances = function () {

	return this.entrances;

}

CV.loxHandler.prototype.getTerrainDimensions = function () {

	return this.terrainDimensions;

}

CV.loxHandler.prototype.getTerrainData = function () {

	// flip y direction 
	var flippedTerrain = [];
	var lines   = this.terrainDimensions.lines;
	var samples = this.terrainDimensions.samples;

	for ( var i = 0; i < lines; i++ ) {

		var offset = ( lines - 1 - i ) * samples;

		for ( var j = 0; j < samples; j++ ) {

			flippedTerrain.push( this.terrain[offset + j] );

		}

	}

	return flippedTerrain;

}

CV.loxHandler.prototype.getTerrainBitmap = function () {

	return this.terrainBitmap;

}

CV.loxHandler.prototype.getFaults = function () {

	return this.chains;

}

CV.loxHandler.prototype.getName = function () {

  return this.fileName;

}

// EOF
//"use strict";

var CV = CV || {};
// Survex 3d file handler

CV.Svx3dHandler = function ( fileName, dataStream ) {

	this.fileName   = fileName;
	this.groups     = [];
	this.entrances  = [];
	this.surface    = [];
	this.xGroups    = [];
	this.surveyTree = new CV.Tree();
	var surveyTree  = this.surveyTree;

	var source    = dataStream;  // file data as arrrayBuffer
	var pos       = 0;	         // file position

	// read file header
	var stdHeader = readLF(); // Survex 3D Image File
	var version   = readLF(); // 3d version
	var title     = readLF(); // Title
	var date      = readLF(); // Date

	console.log( "title: ", title) ;

	this.handleVx( source, pos, Number(version.charAt( 1 ) ) );

	// strip empty/single top nodes of tree and add title as top node name if empty
	surveyTree.reduce( title );

	return;

	function readLF () { // read until Line feed

		var bytes = new Uint8Array( source, 0 );
		var lfString = [];
		var b;

		do {

			b = bytes[pos++];
			lfString.push( b );

		} while ( b != 0x0a && b != 0x00 )

		var s = String.fromCharCode.apply( null, lfString ).trim();

		console.log( s  );

		return s;
	}
}

CV.Svx3dHandler.prototype.constructor = CV.Svx3dHandler;

CV.Svx3dHandler.prototype.handleVx = function ( source, pos, version ) {

	var groups     = this.groups;
	var entrances  = this.entrances;
	var xGroups    = this.xGroups;
	var surveyTree = this.surveyTree;

	var cmd         = [];
	var legs        = [];
	var label       = "";
	var readLabel;
	var fileFlags   = 0;
	var style       = 0;
	var stations    = new Map();
	var lineEnds    = new Set(); // implied line ends to fixnup xsects
	var xSects      = [];
	var sectionId   = 0;

	var data       = new Uint8Array( source, 0 );
	var dataLength = data.length;
	var lastPosition = { x: 0, y:0, z: 0 }; // value to allow approach vector for xsect coord frame
	var i;

	// init cmd handler table withh  error handler for unsupported records or invalid records

	for ( i = 0; i < 256; i++ ) {

		cmd[i] = function ( e ) { console.log ('unhandled command: ', e.toString( 16 ) ); return false; };	

	}

	if ( version === 8 ) {
		// v8 dispatch table start

		cmd[0x00] = cmd_STYLE;
		cmd[0x01] = cmd_STYLE;
		cmd[0x02] = cmd_STYLE;
		cmd[0x03] = cmd_STYLE;
		cmd[0x04] = cmd_STYLE;

		cmd[0x0f] = cmd_MOVE;
		cmd[0x10] = cmd_DATE_NODATE;
		cmd[0x11] = cmd_DATEV8_1;
		cmd[0x12] = cmd_DATEV8_2;
		cmd[0x13] = cmd_DATEV8_3;

		cmd[0x1F] = cmd_ERROR;

		cmd[0x30] = cmd_XSECT16;
		cmd[0x31] = cmd_XSECT16;

		cmd[0x32] = cmd_XSECT32;
		cmd[0x33] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[i] = cmd_LINE;

		}

		for ( i = 0x80; i < 0x100; i++ ) {

			cmd[i] = cmd_LABEL;

		}

		// dispatch table end

		readLabel = readLabelV8;	

		// v8 file wide flags after header
		fileFlags = data[pos++];

	} else {

		// dispatch table for v7 format 

		for ( i = 0x01; i < 0x0f; i++ ) {

			cmd[i] = cmd_TRIM_PLUS;

		}

		cmd[0x0f] = cmd_MOVE;

		for ( i = 0x10; i < 0x20; i++ ) {

			cmd[i] = cmd_TRIM;

		}

		cmd[0x00] = cmd_STOP;
		cmd[0x20] = cmd_DATE_V7;
		cmd[0x21] = cmd_DATE2_V7;
		cmd[0x24] = cmd_DATE_NODATE;
		cmd[0x22] = cmd_ERROR;

		cmd[0x30] = cmd_XSECT16;
		cmd[0x31] = cmd_XSECT16;

		cmd[0x32] = cmd_XSECT32;
		cmd[0x33] = cmd_XSECT32;

		for ( i = 0x40; i < 0x80; i++ ) {

			cmd[i] = cmd_LABEL;

		}

		for ( i = 0x80; i < 0xc0; i++ ) {

			cmd[i] = cmd_LINE;

		}
		// dispatch table end

		readLabel = readLabelV7;

	}

	if ( version === 6 ) {
	
		cmd[0x20] = cmd_DATE_V4;
		cmd[0x21] = cmd_DATE2_V4;

	}

	// common record iterator
	// loop though data, handling record types as required.

	while ( pos < dataLength ) {

		if (!cmd[data[pos]]( data[pos++] )) break;

	}

	if ( xSects.length > 1 ) {

		xGroups.push( xSects );

	}

	groups.push( legs );

	return;

	function readLabelV7 () {
		// find length of label and read label = v3 - v7 .3d format

		var len = 0;
		var l;

		switch ( data[pos] ) {

			case 0xfe:

				l = new DataView( source, pos );

				len = l.getUint16( 0, true ) + data[pos];
				pos += 2;

				break;

			case 0xff:

				l = new DataView( source, pos );

				len = l.getUint32( 0, true );
				pos +=4;

				break;

			default:

				len = data[pos++];
		}

		if ( len === 0 ) return false; // no label

		var db = [];

		for ( var i = 0; i < len; i++ ) {
	
			db.push( data[pos++] );

		}

		label = label + String.fromCharCode.apply( null, db  );

		return true;

	}

	function readLabelV8 ( flags ) {

		if ( flags & 0x20 )  return false; // no label change

		var b = data[pos++];
		var add = 0;
		var del = 0;

		if (b !== 0 ) {

			// handle 4b= bit del/add codes
			del = b >> 4;   // left most 4 bits
			add = b & 0x0f; // right most 4 bits

		} else {

			// handle 8 bit and 32 bit del/add codes
			b = data[pos++];

			if ( b !== 0xff ) {

				del = b;

			} else {

				var l = new DataView( source, pos );

				del = l.getUint32( 0, true );
				pos +=4;

			}

			b = data[pos++];

			if ( b !== 0xff ) {

				add = b;

			} else {

				var l = new DataView( source, pos );

				add = l.getUint32( 0, true );
				pos +=4;

			}
		}

		if ( add === 0 && del === 0 ) return;

		if (del) label = label.slice( 0, -del );

		if (add) {

			var db = [];

			for ( var i = 0; i < add; i++ ) {

				db.push( data[pos++] );

			}

			label = label + String.fromCharCode.apply( null, db );

		}

		return true;

	}

	function cmd_STOP ( c ) {

		if (label) label = "";

		return true;

	}

	function cmd_TRIM_PLUS ( c ) { // v7 and previous

		label = label.slice( 0, -16 );

		if (label.charAt( label.length - 1 ) == ".") label = label.slice( 0, -1 ); // strip trailing "."

		var parts = label.split( "." );

		parts.splice( -(c) );
		label = parts.join( "." );

		if (label) label = label + ".";

		return true;

	}

	function cmd_TRIM ( c ) {  // v7 and previous

		var trim = c - 15;

		label = label.slice(0, -trim);

		return true;

	}

	function cmd_DATE_V4 ( c ) {

		pos += 4;

		return true;

	}

	function cmd_DATE_V7 ( c ) {

		pos += 2;

		return true;

	}

	function cmd_DATE2_V4 ( c ) {

		pos += 8;

		return true;

	}

	function cmd_DATE2_V7 ( c ) {

		pos += 3;

		return true;

	}

	function cmd_STYLE ( c ) {

		style = c;

		return true;

	}

	function cmd_DATEV8_1 ( c ) {

		pos += 2;

		return true;

	}

	function cmd_DATEV8_2 ( c ) {

		console.log("v8d2");
		pos += 3;

		return false;

	}

	function cmd_DATEV8_3 ( c ) {

		console.log("v8d3");
		pos += 4;

		return false;
	}

	function cmd_DATE_NODATE ( c ) {

		return true;

	}

	function cmd_LINE ( c ) {

		var flags = c & 0x3f;

		if ( readLabel( flags ) ) {

			// we have a new section name, add it to the survey tree
			sectionId = surveyTree.addByPath( label.split( "." ) );

		}

		var coords = readCoordinates( flags );

		if ( flags & 0x01 ) {

			legs.push( { coords: coords, type: CV.SURFACE, survey: sectionId } );

		} else if ( flags & 0x04 ) {

			legs.push( { coords: coords, type: CV.SPLAY, survey: sectionId } );

		} else {

			legs.push( { coords: coords, type: CV.NORMAL, survey: sectionId } );

		}

		lastPosition = coords;

		return true;

	}

	function cmd_MOVE ( c ) {

		// new set of line segments
		if ( legs.length > 1 ) {

			groups.push( legs );

		}

		legs = [];

		// heuristic to detect line ends. lastPosition was presumably set in a line sequence therefore is at the end 
		// of a line, Add the current label, presumably specified in the last LINE, to a Set of lineEnds.

		lineEnds.add( [ lastPosition.x, lastPosition.y, lastPosition.z ].toString() );

		var coords = readCoordinates( 0x00 );

		legs.push( { coords: coords } );

		lastPosition = coords;

		return true;

	}

	function cmd_ERROR ( c ) {
		//var l = new DataView(source, pos);

		//console.log("legs   : ", l.getInt32(0, true));
		//console.log("length : ", l.getInt32(4, true));
		//console.log("E      : ", l.getInt32(8, true));
		//console.log("H      : ", l.getInt32(12, true));
		//console.log("V      : ", l.getInt32(16, true));
		pos += 20;

		return true;

	}

	function cmd_LABEL ( c ) {

		var flags = c & 0x7f;

		readLabel( 0 );

		var coords = readCoordinates( flags );

		if ( c & 0x04 ) {

			var station = label.split( "." );

			// get survey path by removing last component of station name
			station.pop();

			var surveyId = surveyTree.getIdByPath( station );

			entrances.push( { position: coords, label: label, survey: surveyId } );

		}

		stations.set( label, coords );

		return true;

	}

	function cmd_XSECT16 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		var lrud = {
			l: l.getInt16( 0, true ) / 100,
			r: l.getInt16( 2, true ) / 100,
			u: l.getInt16( 4, true ) / 100,
			d: l.getInt16( 6, true ) / 100
		};

		pos += 8;

		return commonXSECT( flags, lrud );


	}

	function cmd_XSECT32 ( c ) {

		var flags = c & 0x01;

		readLabel( flags );

		var l = new DataView( source, pos );

		var lrud = {
			l: l.getInt32( 0, true ) / 100,
			r: l.getInt32( 0, true ) / 100,
			u: l.getInt32( 0, true ) / 100,
			d: l.getInt32( 0, true ) / 100
		};

		pos += 16;

		return commonXSECT( flags, lrud );

	}

	function commonXSECT( flags, lrud ) {

		var position = stations.get( label );

		if (!position) return;

		var station = label.split( "." );

		// get survey path by removing last component of station name
		station.pop();

		var surveyId = surveyTree.getIdByPath( station );

		// FIXME to get a approach vector for the first XSECT in a run so we can add it to the display
		xSects.push( { start: lastPosition, end: position, lrud: lrud, survey: surveyId } );

		lastPosition = position;

		// some XSECTS are not flagged as last in passage
		// heuristic - the last line position before a move is an implied line end.
		// cmd_MOVE saves these in the set lineEnds.
		// this fixes up surveys that display incorrectly withg 'fly-back' artefacts in Aven and Loch.

		if (flags || lineEnds.has( [position.x, position.y, position.z].toString() )) {

			if ( xSects.length > 1 ) xGroups.push( xSects );

			lastPosition = { x: 0, y: 0, z: 0 };
			xSects = [];

		}

		return true;

	}

	function readCoordinates ( flags ) {

		var l = new DataView( source, pos );
		var coords = {};

		coords.x = l.getInt32( 0, true ) / 100;
		coords.y = l.getInt32( 4, true ) / 100;
		coords.z = l.getInt32( 8, true ) / 100;
		pos += 12;

		return coords;

	}

}

CV.Svx3dHandler.prototype.getLineSegments = function () {

	var lineSegments = [];
	var groups       = this.groups;

	for ( var i = 0, l = groups.length; i < l; i++ ) {

		var g = groups[i];

		for ( var v = 0, vMax = g.length - 1; v < vMax; v++ ) {

			// create vertex pairs for each line segment.
			// all vertices except first and last are duplicated.
			var from = g[v];
			var to   = g[v+1];

			lineSegments.push( { from: from.coords, to: to.coords, type: to.type, survey: to.survey } );

		}
	}

	return lineSegments;

}

CV.Svx3dHandler.prototype.getSurveyTree = function () {

	return this.surveyTree;

}

CV.Svx3dHandler.prototype.getScraps = function () {

	return [];

}

CV.Svx3dHandler.prototype.getCrossSections = function () {

	return this.xGroups;

}

CV.Svx3dHandler.prototype.getEntrances = function () {

	return this.entrances;

}

CV.Svx3dHandler.prototype.getTerrainDimensions = function () {

	return { lines: 0, samples: 0 };

}

CV.Svx3dHandler.prototype.getTerrainBitmap = function () {

	return false;

}

CV.Svx3dHandler.prototype.getName = function () {

	return this.fileName;

}

// EOF
"use strict";

var CV = CV || {};

CV.Shaders = (function() {

// export public interface

return {
	testVertexShader:        "\n#include <common>\nuniform float spread;\nuniform float rIn;\nvoid main() {\n	vec3 nPosition = position;\n	nPosition.x += rand( nPosition.xy * rIn ) * color.r * spread;\n	nPosition.y += rand( nPosition.xx * rIn ) * color.r * spread;\n	nPosition.z -= abs( rand( nPosition.yx * rIn ) ) * color.r * spread;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( nPosition, 1.0 );\n	gl_PointSize = 2.0;\n}\n",
	testFragmentShader:      "\nvoid main() {\n	gl_FragColor = vec4( 0.0, 0.1, 1.0, 1.0 );\n}\n",
	heightVertexShader:      "\nuniform sampler2D cmap;\nuniform float minZ;\nuniform float scaleZ;\n#ifdef SURFACE\nuniform vec3 uLight;\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\nvarying vec3 vColor;\n#endif\nvarying float zMap;\nvoid main() {\n#ifdef SURFACE\n	vNormal = normalMatrix * normal;\n	lNormal = uLight;\n#else\n	vColor = color;\n#endif\n	zMap = ( position.z - minZ ) * scaleZ;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
	heightFragmentShader:    "\nuniform sampler2D cmap;\nvarying float zMap;\n#ifdef SURFACE\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\nvarying vec3 vColor;\n#endif\nvoid main() {\n#ifdef SURFACE\n	float nDot = dot( normalize( vNormal ), normalize( lNormal ) );\n	float light;\n	light = 0.5 * ( nDot + 1.0 );\n	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * light;\n#else\n	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );\n#endif\n}\n",
	cursorVertexShader:      "\n#ifdef SURFACE\nuniform vec3 uLight;\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\n	\nvarying vec3 vColor;\n#endif\nvarying float height;\nvoid main() {\n#ifdef SURFACE\n	vNormal = normalMatrix * normal;\n	lNormal = uLight;\n#else\n	vColor = color;\n#endif\n	height = position.z;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
	cursorFragmentShader:    "\nuniform float cursor;\nuniform float cursorWidth;\nuniform vec3 baseColor;\nuniform vec3 cursorColor;\nvarying float height;\n#ifdef SURFACE\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\nvarying vec3 vColor;\n#endif\nvoid main() {\n#ifdef SURFACE\n	float nDot = dot( normalize( vNormal ), normalize( lNormal ) );\n	float light;\n	light = 0.5 * ( nDot + 1.0 );\n#else\n	float light = 1.0;\n#endif\n	float delta = abs( height - cursor );\n	float ss = smoothstep( 0.0, cursorWidth, cursorWidth - delta );\n#ifdef SURFACE\n	if ( delta < cursorWidth * 0.05 ) {\n		gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * light;\n	} else {\n		gl_FragColor = vec4( mix( baseColor, cursorColor, ss ) * light, 1.0 );\n	}\n#else\n	if ( delta < cursorWidth * 0.05 ) {\n		gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * light * vec4( vColor, 1.0 );\n	} else {\n		gl_FragColor = vec4( mix( baseColor, cursorColor, ss ) * light, 1.0 ) * vec4( vColor, 1.0 );\n	}\n#endif\n}\n",
	depthMapVertexShader:    "\nuniform float minZ;\nuniform float scaleZ;\nvarying float vHeight;\nvoid main() {\n	vHeight = ( position.z - minZ ) * scaleZ;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
	depthMapFragmentShader:  "\nvarying float vHeight;\nvoid main() {\n	gl_FragColor = vec4(vHeight, vHeight, vHeight, 1.0);\n}\n",
	depthVertexShader:       "\nuniform float minX;\nuniform float minY;\nuniform float minZ;\nuniform float scaleX;\nuniform float scaleY;\nuniform float scaleZ;\nuniform sampler2D depthMap;\n#ifdef SURFACE\nuniform vec3 uLight;\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\nvarying vec3 vColor;\n#endif\nvarying float vHeight;\nvoid main() {\n#ifdef SURFACE\n	vNormal = normalMatrix * normal;\n	lNormal = uLight;\n#else\n	vColor = color;\n#endif\n	vec2 terrainCoords = vec2( ( position.x - minX ) * scaleX, ( position.y - minY ) * scaleY );\n	vec4 terrainHeight = texture2D( depthMap, terrainCoords );\n	vHeight =  terrainHeight.g  - ( position.z - minZ ) * scaleZ;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
	depthFragmentShader:     "\nuniform sampler2D cmap;\nvarying float vHeight;\n#ifdef SURFACE\nvarying vec3 vNormal;\nvarying vec3 lNormal;\n#else\nvarying vec3 vColor;\n#endif\nvoid main() {\n#ifdef SURFACE\n	float nDot = dot( normalize( vNormal ), normalize( lNormal ) );\n	float light;\n	light = 0.5 * ( nDot + 1.0 );\n	gl_FragColor = texture2D( cmap, vec2( vHeight, 1.0 ) ) * light;\n#else\n	gl_FragColor = texture2D( cmap, vec2( vHeight, 1.0 ) ) * vec4( vColor, 1.0 );\n#endif\n}\n",
	pwVertexShader:          "\nuniform vec3 uLight;\nvarying vec3 vNormal;\nvarying vec3 lNormal;\nvarying vec2 vUv;\nvoid main() {\n	vNormal = normalMatrix * normal;\n	lNormal = uLight;\n	vUv = uv;	\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
	pwFragmentShader:        "\nprecision highp float;\nuniform sampler2D cmap;\nuniform float zoom;\nuniform vec2 offset;\nvarying vec3 vNormal;\nvarying vec3 lNormal;\nvarying vec2 vUv;\nvoid main() {\n	float square;\n	float x = 0.0;\n	float y = 0.0;\n	float xt;\n	float yt;\n	float light;\n	vec2 c = ( vUv - vec2( 0.5, 0.5 ) ) * 4.0 / zoom - offset;\n	for ( float i = 0.0; i < 1.0; i += 0.001 ) {\n		xt = x * x - y * y + c.x;\n		yt = 2.0 * x * y + c.y;\n		x = xt;\n		y = yt;\n		square = x * x + y * y;\n		light = dot( normalize( vNormal ), normalize( lNormal ) );\n		gl_FragColor = texture2D( cmap, vec2( i, 1.0 ) ) * light;\n		if ( square >= 4.0 ) break;\n	}\n}\n"

};

} () );// end of Shader Module

// EOF
 "use strict";

var Cave = Cave || {};

CV.Terrain = function () {

	THREE.Group.call( this );

	this.type   = "CV.Terrain";
	this.tile   = null;
	this.overlay;

	return this;

}

CV.Terrain.prototype = Object.create( THREE.Group.prototype );

CV.Terrain.prototype.constructor = CV.Terrain;

CV.Terrain.prototype.isTiled = function () {

	return false;

}

CV.Terrain.prototype.isLoaded = function () {

	return true;

}

CV.Terrain.prototype.addTile = function ( plane, terrainData, bitmap ) {

	this.overlay = bitmap;

	var tile = new CV.Tile().create( plane, terrainData );

	this.add( tile.mesh )
	this.tile = tile;

	return this;

}

CV.Terrain.prototype.getOverlays = function () {

	if ( this.overlay ) {

		return ["built in"];

	} else {

		return [];

	}

}

CV.Terrain.prototype.getOverlay = function () {

	return "built in";

}

CV.Terrain.prototype.setOverlay = function ( overlay ) {

	var loader  = new THREE.TextureLoader();
	var	texture = loader.load( this.overlay );

	this.setMaterial( new THREE.MeshLambertMaterial(

		{
			map: texture,
			transparent: true,
			opacity: 0.75
		}

	) );

}

CV.Terrain.prototype.setMaterial = function ( material ) {

	this.tile.setMaterial( material );

}

// EOF
 "use strict";

var Cave = Cave || {};

CV.Tile = function ( x, y, resolution, tileSet, clip ) {

	this.x = x;
	this.y = y;

	this.resolution = resolution;
	this.tileSet    = tileSet;
	this.clip       = clip;

	this.canZoom       = true;
	this.evicted       = false;
	this.evictionCount = 1;
	this.parent        = null;
	this.id            = null;
	this.parentId      = null;

	this.boundingBox      = null;
	this.worldBoundingBox = null;

}

CV.Tile.liveTiles = 0;
CV.Tile.overlayImages = new Map();

CV.Tile.prototype.constructor = CV.Tile;

CV.Tile.prototype.create = function ( geometry, terrainData ) {

	var vertices = geometry.vertices;
	var faces    = geometry.faces;
	var colors   = geometry.colors;

	var l1 = terrainData.length;
	var l2 = vertices.length;
	var scale = 1;
	var i;

	var l = Math.min( l1, l2 ); // FIXME

	if ( this.tileSet !== undefined ) scale = this.tileSet.SCALE;

	for ( i = 0; i < l; i++ ) {

		vertices[ i ].setZ( terrainData[ i ] / scale );

	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	var colourCache = CV.ColourCache.terrain;
	var colourRange = colourCache.length - 1;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		var face = faces[ i ];

		// compute vertex colour per vertex normal

		for ( var j = 0; j < 3; j++ ) {

			var dotProduct = face.vertexNormals[j].dot( CV.upAxis );
			var colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

			face.vertexColors[ j ] = colourCache[ colourIndex ];

		}

	}

	// reduce memory consumption by transferring to buffer object
	var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );

	bufferGeometry.computeBoundingBox();

	this.mesh = new THREE.Mesh( bufferGeometry );
	this.mesh.layers.set ( CV.FEATURE_TERRAIN );

	return this;

}

CV.Tile.prototype.createFromBufferGeometryJSON = function ( json, boundingBox ) {

	var loader = new THREE.BufferGeometryLoader();

	var bufferGeometry = loader.parse( json, boundingBox );

	// use precalculated bounding box rather than recalculating it here.

	var bb = new THREE.Box3(

		new THREE.Vector3( boundingBox.min.x, boundingBox.min.y, boundingBox.min.z ), 
		new THREE.Vector3( boundingBox.max.x, boundingBox.max.y, boundingBox.max.z )

	);

	bufferGeometry.boundingBox = bb;

	this.mesh = new THREE.Mesh( bufferGeometry );
	this.mesh.layers.set ( CV.FEATURE_TERRAIN );

}

CV.Tile.prototype.getWorldBoundingBox = function () {

	var boundingBox;

	if ( this.worldBoundingBox === null ) {

		this.mesh.updateMatrixWorld();

		boundingBox = this.getBoundingBox().clone();
		boundingBox.applyMatrix4( this.mesh.matrixWorld );

		this.worldBoundingBox = boundingBox;

	}

	return this.worldBoundingBox;

}

CV.Tile.prototype.getBoundingBox = function () {

	var boundingBox;

	if ( this.boundingBox === null ) {

		boundingBox = this.mesh.geometry.boundingBox.clone();

		var adj = this.resolution; // adjust to cope with  overlaps

		boundingBox.min.x += adj;
		boundingBox.min.y += adj;
		boundingBox.max.x -= adj;
		boundingBox.max.y -= adj;

		this.boundingBox = boundingBox;

	}

	return this.boundingBox;
}

CV.Tile.prototype.attach = function ( parent ) {

	this.evicted = false;
	this.parent = parent;

	parent.add( this.mesh );

	++CV.Tile.liveTiles;

}

CV.Tile.prototype.remove = function ( evicted ) {

	if ( evicted ) {

		this.evicted = true;
		this.evictionCount++;

	}

	if (this.mesh) {

		if (!this.boundingBox) {

			console.log( "FIXUP :", this.x, this.y );
			this.getWorldBoundingBox();

		}

		this.parent.remove( this.mesh );
		this.mesh = null;

		--CV.Tile.liveTiles;

	}

}

CV.Tile.prototype.setMaterial = function ( material ) {

	if ( this.mesh ) this.mesh.material = material;

}

CV.Tile.prototype.setOverlay = function ( overlay ) {

	if (!this.mesh) return;

	var self = this;
	var tileSet = this.tileSet;
	var resolution = this.resolution;
	var texture;
	var clip = this.clip;

	var ratio = tileSet.OVERLAY_RESOLUTION / resolution;
	var repeat = 1 / ratio;

	var x = Math.floor( this.x / ratio );
	var y = Math.floor( this.y / ratio );

	var xOffset = ( this.x % ratio ) / ratio;
	var yOffset = ( ratio - 1 - this.y % ratio ) / ratio;

	var tileWidth = tileSet.TILESIZE - 1; // in grid units

	xOffset = xOffset + ( repeat * clip.left/tileWidth );
	yOffset = yOffset + ( repeat * clip.bottom/tileWidth );

	var xRepeat = repeat * ( ( tileWidth - clip.left - clip.right ) / tileWidth );
	var yRepeat = repeat * ( ( tileWidth - clip.top  - clip.bottom ) / tileWidth );

	var imageFile = tileSet.OVERLAYDIR + overlay + "/" + tileSet.PREFIX + tileSet.OVERLAY_RESOLUTION + "MX-" + CV.padDigits(y, 3) + "-" + CV.padDigits(x, 3) + ".jpg";

	if ( CV.Tile.overlayImages.has( imageFile ) ) {

		_imageLoaded( CV.Tile.overlayImages.get( imageFile ) );

	} else {

		var loader = new THREE.ImageLoader();

		loader.load( imageFile, _imageLoaded );
				
	}

	return;

	function _imageLoaded ( image ) {

		var material = new THREE.MeshLambertMaterial( { transparent: true, opacity: 0.75} );

		CV.Tile.overlayImages.set( imageFile, image );

		texture = new THREE.Texture();

		texture.image = image;

		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		texture.offset = new THREE.Vector2( xOffset, yOffset );
		texture.repeat = new THREE.Vector2( xRepeat, yRepeat );

		texture.needsUpdate = true;

		material.map = texture;
		material.needsUpdate = true;

		self.mesh.material = material;

		// add images to cache
		CV.Tile.overlayImages.set( imageFile, image );

	}

}

CV.Tile.prototype.getParent = function () {

	return this.parent;

}

CV.Tile.prototype.projectedArea = function ( camera ) {

	var boundingBox = this.getWorldBoundingBox();

	var v1 = boundingBox.min.clone();
	var v3 = boundingBox.max.clone();

	v1.z = 0;
	v3.z = 0;

	var v2 = new THREE.Vector3( v3.x, v1.y, 0 );
	var v4 = new THREE.Vector3( v1.x, v3.y, 0 ) ;

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure

	v1.project( camera ).clampScalar( -1, 1 );
	v2.project( camera ).clampScalar( -1, 1 );
	v3.project( camera ).clampScalar( -1, 1 );
	v4.project( camera ).clampScalar( -1, 1 );

	var t1 = new THREE.Triangle( v1, v3, v4 );
	var t2 = new THREE.Triangle( v1, v2, v3 );

	return t1.area() + t2.area();

}

// EOF
 "use strict";

var Cave = Cave || {};

CV.TiledTerrain = function ( limits3, onLoaded ) {
	
	THREE.Group.call( this );

	this.name = "CV.TiledTerrain";

	this.limits = new THREE.Box2(

		new THREE.Vector2( limits3.min.x, limits3.min.y ),
		new THREE.Vector2( limits3.max.x, limits3.max.y )

	);

	this.tileSet       = CV.TileSet;
	this.tileTree      = new CV.Tree();

	this.onLoaded      = onLoaded;
	this.tilesLoading  = 0;
	this.loadedTiles   = [];
	this.errors        = 0;
	this.terrainLoaded = false;
	this.replaceTile   = null;
	this.activeOverlay = null;
	this.initialResolution;
	this.currentLimits;

	if ( CV.Hud !== undefined ) {

		this.progressDial = CV.Hud.getProgressDial();

	}

}

CV.TiledTerrain.prototype = Object.create( THREE.Group.prototype );

CV.TiledTerrain.prototype.constructor = CV.TiledTerrain;

CV.TiledTerrain.prototype.isTiled = function () {

	return true;

}

CV.TiledTerrain.prototype.isLoaded = function () {

	return this.terrainLoaded;

}

CV.TiledTerrain.prototype.hasCoverage = function () {

	var limits  = this.limits;
	var tileSet = this.tileSet;

	return ( (limits.min.x >= tileSet.W && limits.min.x <= tileSet.E) || 
	         (limits.max.x >= tileSet.W && limits.max.x <= tileSet.E) ) &&
		   ( (limits.min.y >= tileSet.S && limits.min.y <= tileSet.N) ||
		     (limits.max.y >= tileSet.S && limits.max.y <= tileSet.N));

}

CV.TiledTerrain.prototype.getCoverage = function ( limits, resolution ) {

	var tileSet  = this.tileSet;
	var coverage = { resolution: resolution };

	var N = tileSet.N + resolution / 2;
	var W = tileSet.W - resolution / 2;

	var tileWidth = ( tileSet.TILESIZE - 2 ) * resolution; 

	coverage.min_x = Math.max( Math.floor( ( limits.min.x - W ) / tileWidth ), 0 );
	coverage.max_x = Math.floor( ( limits.max.x - W ) / tileWidth ) + 1;
 
	coverage.max_y = Math.floor( ( N - limits.min.y ) / tileWidth ) + 1;
	coverage.min_y = Math.max( Math.floor( ( N - limits.max.y ) / tileWidth ), 0 );

	coverage.count = ( coverage.max_x - coverage.min_x ) * ( coverage.max_y - coverage.min_y );

	return coverage;

}

CV.TiledTerrain.prototype.pickCoverage = function ( limits, maxResolution ) {

	var tileSet = this.tileSet;
	var resolution = maxResolution || tileSet.RESOLUTION_MIN;
	var coverage;

	resolution = resolution / 2;

	do {

		resolution *= 2;
		coverage = this.getCoverage( limits, resolution );

	} while ( coverage.count > 4 && resolution < tileSet.RESOLUTION_MAX );

	return coverage;

}

CV.TiledTerrain.prototype.loadTile = function ( x, y, resolutionIn, oldTileIn ) {

	var self       = this;
	var resolution = resolutionIn;
	var oldTile    = oldTileIn;

	++this.tilesLoading;

	var limits    = this.limits;
	var tileSet   = this.tileSet;
	var divisions = tileSet.TILESIZE - 1;
	var tileWidth = divisions * resolution;
	var clip = { top: 0, bottom: 0, left: 0, right: 0 };

	var N = tileSet.N + resolution / 2;
	var W = tileSet.W - resolution / 2;

	var tileWidthAdj = tileWidth - resolution;

	var bottomLeft = new THREE.Vector2( W + x * tileWidthAdj,             N - y * tileWidthAdj - tileWidth );
	var topRight   = new THREE.Vector2( W + x * tileWidthAdj + tileWidth, N - y * tileWidthAdj );

	var tileLimits = new THREE.Box2( bottomLeft, topRight );

	// trim excess off sides of tile where overlapping with region

	if ( tileLimits.max.y > limits.max.y ) clip.top = Math.floor( ( tileLimits.max.y - limits.max.y ) / resolution );

	if ( tileLimits.min.y < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileLimits.min.y ) / resolution );

	if ( tileLimits.min.x < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileLimits.min.x ) / resolution );

	if ( tileLimits.max.x > limits.max.x ) clip.right = Math.floor( ( tileLimits.max.x - limits.max.x ) / resolution );

	var tileSpec = {

		tileSet: tileSet,
		resolution: resolution, 
		tileX: x, 
		tileY: y,
		clip: clip

	}

	// start web worker and create new geometry in it.

	var tileLoader = new Worker( "CaveView/js/workers/tileWorker.js" );

	tileLoader.onmessage = _mapLoaded;

	tileLoader.postMessage( tileSpec );

	return;

	function _mapLoaded ( event ) {

		var tileData = event.data;

		if ( tileData.status !== "ok" ) ++self.errors;

		if (self.errors) {

			// error out early if we or other tiles have failed to load.

			self.endLoad();
			return;

		}

		var attributes = tileData.json.data.attributes;

		// large arrays in source were translated to ArrayBuffers to allow transferable objects to 
		// be used, to decrease execution time for this hander.

		// retype and move arrays back to useable format
		// note: the standard JSON bufferGeometry format uses Array but accepts TypedArray
		// Float32 is the target type so functionality is equivalent

		for ( var attributeName in attributes ) {

			var attribute = attributes[ attributeName ];

			if ( attribute.arrayBuffer !== undefined ) {

				attribute.array = new Float32Array( attribute.arrayBuffer );
				attribute.arrayBuffer = null;

			}

		}

		var tile;

		if (!oldTile) {

			tile = new CV.Tile( x, y, resolution, self.tileSet, clip );

		} else {

			tile = oldTile;

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		tile.createFromBufferGeometryJSON( tileData.json, tileData.boundingBox );

		if (self.activeOverlay) {

			tile.setOverlay( self.activeOverlay );

		}

		if ( self.progressDial ) self.progressDial.add( self.progressInc );

		self.endLoad( tile );

	}

}

CV.TiledTerrain.prototype.endLoad = function ( tile ) {

	if ( tile !== undefined ) this.loadedTiles.push( tile );

	if ( --this.tilesLoading === 0 ) {

		var loadedTiles = this.loadedTiles;
		var replaceTile = this.replaceTile;

		if ( this.errors === 0 ) {

			// display loaded tiles and add to tileTree

			var tileTree = this.tileTree;
			var parentId;

			if (replaceTile) {

				parentId = replaceTile.id;

			} else if ( tile.parentId === null ) {

				parentId = tileTree.getRootId();

			}

			for ( var i = 0, l = loadedTiles.length; i < l; i++ ) {

				tile = loadedTiles[ i ];

				tile.attach( this );

				if (!tile.id) {

					// only add new tiles to tree, ignore resurrected tiles
					tile.id = tileTree.addNode( tile, parentId );
					tile.parentId = parentId;

				}

			}

			if ( replaceTile ) replaceTile.remove( false );

			this.terrainLoaded = true;

		} else {

			// mark this tile so we don't continually try to reload
			// console.log( "marking as tiles missing" );
			if ( this.resolution === this.initialResolution ) {

				console.log("oops");
				this.tileArea(  this.currentLimits, null, resolution * 2 );

			}

			if ( replaceTile ) replaceTile.canZoom = false;

		}

		this.errors = 0;
		this.replaceTile = null;
		this.loadedTiles = [];

		this.onLoaded();
		this.progressDial.end();

	}

}

CV.TiledTerrain.prototype.resurrectTile = function ( tile ) {

	if (tile.mesh) {

		console.log( "resurrecting the undead!" );
		return;

	}

	// reload tile (use exiting tile object to preserve canZoom).
	this.loadTile( tile.x, tile.y, tile.resolution, tile );

}

CV.TiledTerrain.prototype.tileArea = function ( limits, tile, maxResolution ) {

	var coverage   = this.pickCoverage( limits, maxResolution );
	var resolution = coverage.resolution;

	this.replaceTile   = tile;
	this.currentLimits = limits;

	if ( this.initialResolution === undefined ) {

		this.initialResolution = resolution;

	}

	for ( var x = coverage.min_x; x < coverage.max_x; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y; y++ ) {

			this.loadTile( x, y, resolution );

		}

	}

	if ( this.tilesLoading > 0 && this.progressDial !== undefined ) {
 
		this.progressDial.start( "Loading "  + this.tilesLoading + " terrain tiles" );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	return;

}

CV.TiledTerrain.prototype.getOverlays = function () {

	return this.tileSet.OVERLAYS;

}

CV.TiledTerrain.prototype.setOverlay = function ( overlay ) {

	var self = this;
	var tileTree = this.tileTree;

	if ( this.tilesLoading > 0 ) return;

	this.activeOverlay = overlay;

	_setTileOverlays( tileTree.getRootId() );

	return;

	function _setTileOverlays ( id ) {

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[ i ];
			tile = node.name;

			tile.setOverlay( overlay );

			_setTileOverlays( node.id );

		}

	}

}

CV.TiledTerrain.prototype.getOverlay = function () {

	if (this.activeOverlay) {

		return this.activeOverlay;

	} else {

		return "OS"; // FIXME

	}

}

CV.TiledTerrain.prototype.setMaterial = function ( material ) {

	var self = this;
	var tileTree = this.tileTree;

	if ( this.tilesLoading > 0 ) return;

	this.activeOverlay = null;

	_setTileMaterial( tileTree.getRootId() );

	return;

	function _setTileMaterial ( id ) {

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[ i ];
			tile = node.name;

			tile.setMaterial( material );

			_setTileMaterial( node.id );

		}

	}

}

CV.TiledTerrain.prototype.zoomCheck = function ( camera ) {

	var maxResolution     = this.tileSet.RESOLUTION_MIN;
	var initialResolution = this.initialResolution;
	var tileTree          = this.tileTree;
	var self              = this;

	var frustum  = new THREE.Frustum();

	var candidateTiles      = [];
	var candidateEvictTiles = [];
	var resurrectTiles      = [];

	var total, tile, i;

	if ( this.tilesLoading > 0 ) return;

	camera.updateMatrix(); // make sure camera's local matrix is updated
	camera.updateMatrixWorld(); // make sure camera's world matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	_searchTileTree( tileTree.getRootId() );

	var evictCount     = candidateEvictTiles.length;
	var resurrectCount = resurrectTiles.length;
	var candidateCount = candidateTiles.length;

	var EVICT_PRESSURE = 5;

	if ( evictCount !== 0 ) {

		candidateEvictTiles.sort( _sortByPressure );

		for ( i = 0; i < evictCount; i++ ) {

			var tile = candidateEvictTiles[i];

			// heuristics for evicting tiles

			var pressure = CV.Tile.liveTiles / EVICT_PRESSURE;
			var tilePressure = tile.evictionCount * tile.resolution / initialResolution;

//			console.log( "ir", initialResolution, "p: ", pressure, " tp: ", tilePressure );

			if ( pressure > tilePressure ) tile.remove( true );

		}

	}

	if ( resurrectCount !== 0 ) {

		if ( this.progressDial ) this.progressDial.start( "Resurrecting tiles" );

		for ( i = 0; i < resurrectCount; i++ ) {

			this.resurrectTile( resurrectTiles[ i ] );

		}

		this.progressInc = 100 / ( 2 * resurrectCount );

	} else if ( candidateCount !== 0 ) {

		total = candidateTiles.reduce( function ( a, b ) { return { area: a.area + b.area }; } );

		for ( i = 0; i < candidateCount; i++ ) {

			if ( candidateTiles[ i ].area/total.area > 0.7 ) {

				tile = candidateTiles[ i ].tile;

				if ( tile.canZoom && tile.resolution > maxResolution ) {

					this.tileArea( tile.getBoundingBox(), tile );

				}

			}

		}

	}

	return;

	function _sortByPressure( tileA, tileB ) {

		return tileA.evictionCount * tileA.resolution - tileB.evictionCount * tileB.resolution;

	}

	function _searchTileTree ( id ) {

		var nodes = tileTree.getChildData( id );
		var node;
		var tile;

		for ( var i = 0, l = nodes.length; i < l; i++ ) {

			node = nodes[i];
			tile = node.name;

			if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

				if ( node.noChildren === 0 ) {

					if (!tile.mesh && tile.evicted ) {

						resurrectTiles.push( tile );

					} else {

						// this tile is live, consider subdividing
						candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

					}

				} else {

					// resurrect existing tiles if possible

					if (!tile.mesh && tile.evicted ) {

						_flushTiles( node.id );
						resurrectTiles.push( tile );

					} else {

						// do a full search for new tiles to add
						_searchTileTree( node.id );
					}

				}

			} else {

				_searchTileTree( node.id );

				candidateEvictTiles.push( tile );

			}

		}

	}

	function _flushTiles ( id ) {

		tileTree.removeNodes( function ( x ) { x.name.remove(); }, tileTree.findById( id ) );

	}

}

// EOF
 "use strict";

var Cave = Cave || {};

CV.TileSet = {

	N: 390000,
	S: 340000,
	E: 430000,
	W: 400000,

	TILESIZE: 256,
	BASEDIR: "/terrain/SK/heightmaps/",
	OVERLAYDIR: "/terrain/SK/overlays/",
	OVERLAYS: [ "OS", "BGS" ],
	OVERLAY_RESOLUTION: 32,
	PREFIX: "SK",
	RESOLUTION_MIN: 2,
	RESOLUTION_MAX: 32,
	SCALE: 64

}

// EOF
"use strict";

var CV = CV || {};

CV.Page = function ( frame, id ) {

	var tab  = document.createElement( "div" );
	var page = document.createElement( "div" );

	page.classList.add( "page" );

	tab.id = id;
	tab.classList.add( "tab" );
	tab.addEventListener( "click", this.tabHandleClick );
	tab.style.top = ( CV.Page.position++ * 40 ) + "px";

	frame.appendChild( tab );
	frame.appendChild( page );

	CV.Page.pages.push( { tab: tab, page: page } );

	this.page = page;
	this.slide = undefined;

}

CV.Page.pages     = [];
CV.Page.position  = 0;
CV.Page.inHandler = false;
CV.Page.controls  = [];

CV.Page.reset = function () {

	CV.Page.pages     = [];
	CV.Page.position  = 0;
	CV.Page.inHandler = false;
	CV.Page.controls  = [];

}

CV.Page.handleChange = function ( event ) {

	var obj = event.target;
	var property = event.name;

	if ( !CV.Page.inHandle ) {

		if ( CV.Page.controls[ property ] ) {

			var ctrl = CV.Page.controls[ property] ;

			switch ( ctrl.type ) {

			case "checkbox":

				ctrl.checked = obj[ property ];

				break;

			case "select-one":

				ctrl.value = obj[ property ];

				break;

			}

		}

	}

}

CV.Page.prototype.constructor = CV.Page;

CV.Page.prototype.tabHandleClick = function ( event ) {

	var tab = event.target;
	var pages = CV.Page.pages;

	tab.classList.add( "toptab" );
	tab.parentElement.classList.add( "onscreen" );

	for ( var i = 0, l = pages.length; i < l; i++ ) {

		var otherTab  = pages[ i ].tab;
		var otherPage = pages[ i ].page;

		if ( otherTab === tab ) {

			otherPage.style.display = "block";

		} else {

			otherTab.classList.remove( "toptab" );
			otherPage.style.display = "none";

		}

	}

}

CV.Page.prototype.appendChild = function ( domElement ) {

	this.page.appendChild( domElement );

}

CV.Page.prototype.addHeader = function ( text ) {

	var div = document.createElement( "div" );

	div.textContent = text;
	this.page.appendChild( div );

}

CV.Page.prototype.addSelect = function ( title, obj, trgObj, property ) {

	var label  = document.createElement( "label" );
	var select = document.createElement( "select" );
	var opt;
	var self = this;

	if ( obj instanceof Array ) {

		for ( var i = 0, l = obj.length; i < l; i++ ) {

			opt = document.createElement( "option" );

			opt.value = i;
			opt.text  = obj[ i ];

			if ( opt.text === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( "change", function ( event ) { CV.Page.inHandler = true; trgObj[property] = obj[event.target.value]; CV.Page.inHandler = false; } );

	} else {

		for ( var p in obj ) {

			opt = document.createElement( "option" );

			opt.text  = p;
			opt.value = obj[ p ];

			if ( opt.value === trgObj[ property ] ) opt.selected = true;

			select.add( opt, null );

		}

		select.addEventListener( "change", function (event) { CV.Page.inHandler = true; trgObj[property] = event.target.value; CV.Page.inHandler = false; } );

	}

	label.textContent = title;

	CV.Page.controls[ property ] = select;

	this.page.appendChild( label );
	this.page.appendChild( select );

}

CV.Page.prototype.addCheckbox = function ( title, obj, property ) {

	var label  = document.createElement( "label" );
	var cb     = document.createElement( "input" );

	label.textContent = title;

	cb.type    = "checkbox";
	cb.checked = obj[ property ];

	cb.addEventListener( "change", _checkboxChanged );

	CV.Page.controls[ property ] = cb;

	label.appendChild( cb );

	this.page.appendChild( label );

	return;

	function _checkboxChanged ( event ) {

		CV.Page.inHandler = true;

		obj[ property ] = event.target.checked; 

		CV.Page.inHandler = false;

	}

}

CV.Page.prototype.addSlide = function ( domElement, depth, handleClick ) {

	var slide = document.createElement( "div" );

	slide.classList.add( "slide" );
	slide.style.zIndex = 200 - depth;

	slide.addEventListener( "click", handleClick );
	slide.appendChild( domElement );

	this.page.appendChild( slide );

	this.slide = slide;
	this.slideDepth = depth;

	return slide;

}

CV.Page.prototype.replaceSlide = function ( domElement, depth, handleClick ) {

	var newSlide = document.createElement( "div" );
	var oldSlide = this.slide;
	var page = this.page;
	var redraw;

	newSlide.classList.add( "slide" );
	newSlide.style.zIndex = 200 - depth;
	newSlide.addEventListener( "click", handleClick );

	if (depth < this.slideDepth) {

		newSlide.classList.add( "slide-out" );

	}

	newSlide.appendChild( domElement );

	page.appendChild( newSlide );

	if ( depth > this.slideDepth ) {

		oldSlide.addEventListener( "transitionend", afterSlideOut );
		oldSlide.classList.add( "slide-out" );

		redraw = oldSlide.clientHeight;

	} else {

		newSlide.addEventListener( "transitionend", afterSlideIn );

		redraw = newSlide.clientHeight;

		newSlide.classList.remove( "slide-out" );

	}

	this.slide = newSlide;
	this.slideDepth = depth;

	return;	

	function afterSlideOut () {

		oldSlide.removeEventListener( "transitionend", afterSlideOut );
		page.removeChild(oldSlide);

	}

	function afterSlideIn () {

		page.removeChild(oldSlide);
		newSlide.removeEventListener( "transitionend", afterSlideIn );

	}

}

// EOF
"use strict";

var CV = CV || {};

CV.ProgressBar = function ( container ) {

	var offset = ( container.clientWidth - 300 ) / 2;

	var statusText  = document.createElement( "div" );

	statusText.id  = "status-text";
	statusText.style.width = "300px";
	statusText.style.left  = offset + "px";

	var progressBar = document.createElement( "progress" );

	progressBar.id = "progress-bar";

	progressBar.style.width = "300px";
	progressBar.style.left  = offset + "px";

	progressBar.setAttribute( "max", "100" );

	this.container   = container;
	this.progressBar = progressBar;
	this.statusText  = statusText;

}

CV.ProgressBar.prototype.constructor = CV.ProgressBar;

CV.ProgressBar.prototype.Start = function ( text ) {

	var statusText  = this.statusText;
	var progressBar = this.progressBar;

	statusText.textContent = text;
	progressBar.value = 0;

	this.container.appendChild( statusText );
	this.container.appendChild( progressBar );

}

CV.ProgressBar.prototype.Update = function ( pcent ) {

	this.progressBar.value = pcent;

}

CV.ProgressBar.prototype.Add = function ( pcent ) {

	this.progressBar.value += pcent;

}

CV.ProgressBar.prototype.End = function () {

	var container = this.container;

	container.removeChild( this.statusText );
	container.removeChild( this.progressBar );

}

// EOF

CV.BoundingBox = function ( box, colour ) {

	var geometry = new CV.BoundingBoxGeometry( box.size() );
	var material = new THREE.LineBasicMaterial( { color: colour, vertexColors: THREE.NoColors } );

	THREE.LineSegments.call( this, geometry, material );

	this.type = "CV.BoundingBox";

	this.position.copy( box.center() );

	return this;

}

CV.BoundingBox.prototype = Object.create( THREE.LineSegments.prototype );

CV.BoundingBox.prototype.constructor = CV.BoundingBox;


// EOF


CV.BoundingBoxGeometry = function ( box ) {

	THREE.Geometry.call( this );

	this.type = "CV.BoundingBoxGeometry";

	var x = box.x / 2;
	var y = box.y / 2;
	var z = box.z / 2;

	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	
	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );

	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, z ) );
	this.vertices.push( new THREE.Vector3(  x, -y, z ) );
	
	this.vertices.push( new THREE.Vector3(  x, -y,  z ) );
	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );

	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );
	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );

	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );
	this.vertices.push( new THREE.Vector3(  x,  y,  z ) );

	this.vertices.push( new THREE.Vector3( -x, -y, -z ) );
	this.vertices.push( new THREE.Vector3( -x, -y,  z ) );

	this.vertices.push( new THREE.Vector3( -x,  y, -z ) );
	this.vertices.push( new THREE.Vector3( -x,  y,  z ) );

	this.vertices.push( new THREE.Vector3(  x,  y, -z ) );
	this.vertices.push( new THREE.Vector3(  x,  y,  z ) );

	this.vertices.push( new THREE.Vector3(  x, -y, -z ) );
	this.vertices.push( new THREE.Vector3(  x, -y,  z ) );

};

CV.BoundingBoxGeometry.prototype = Object.create( THREE.Geometry.prototype );

CV.BoundingBoxGeometry.prototype.constructor = CV.BoundingBoxGeometry;

// EOF

CV.EntrancePointer = function ( width, height, faceColour1, faceColour2 ) {

	THREE.Geometry.call( this );

	this.type = "CV.Pointer";

	this.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	this.vertices.push( new THREE.Vector3( -width, 0, height ) );
	this.vertices.push( new THREE.Vector3( width, 0, height ) );
	this.vertices.push( new THREE.Vector3( 0, -width, height ) );
	this.vertices.push( new THREE.Vector3( 0,  width, height ) );

	this.faces.push( new THREE.Face3( 0, 1, 2, new THREE.Vector3( 0, 0, 1 ), faceColour1, 0 ) );
	this.faces.push( new THREE.Face3( 0, 3, 4, new THREE.Vector3( 1, 0, 0 ), faceColour2, 0 ) );

};

CV.EntrancePointer.prototype = Object.create( THREE.Geometry.prototype );

CV.EntrancePointer.prototype.constructor = CV.EntrancePointer;

// EOF

CV.Label = function ( text ) {

	var canvas = document.createElement( "canvas" );

	if ( !canvas ) alert( "OOPS" );

	var ctx = canvas.getContext( "2d" );

	if ( !ctx ) alert( "OOPS" );

	var fontSize = 44;
	var textHeight = 64;

	ctx.font = "normal " + fontSize + "px helvetica,sans-serif"

	var textWidth = ctx.measureText( text ).width;
	var actualFontSize = 0.4;

	// make sure width is power of 2
	var realTextWidth = textWidth;
	textWidth = Math.pow( 2, Math.ceil( Math.log( textWidth ) / Math.LN2 ) );

	canvas.width  = textWidth;
	canvas.height = textHeight;

	ctx.fillStyle = "rgba( 0, 0, 0, 0 )";
	ctx.fillRect( 0, 0, canvas.width, canvas.height );

	ctx.fillStyle = "rgba( 0, 0, 0, 0.6 )";
	ctx.fillRect( ( canvas.width - realTextWidth ) / 2 - 10, 0, realTextWidth + 20, canvas.height );

	ctx.textAlign = "center";
	ctx.font = "normal " + fontSize + "px helvetica,sans-serif"; // repeated because canvas sizing resets canvas properties
	ctx.fillStyle = "#ffffff";
	ctx.fillText( text, textWidth/2, textHeight - 18 );

	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true;

	THREE.Sprite.call( this, new THREE.SpriteMaterial( { map: texture, fog: true } ) );

	this.type = "CV.Label";
	this.scale.set( ( textWidth * actualFontSize) / 0.8, actualFontSize * textHeight, 10 );

};

CV.Label.prototype = Object.create( THREE.Sprite.prototype );

CV.Label.prototype.constructor = CV.Label;

// EOF

CV.Marker = ( function () {

	if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    	return function Marker () {};
	}

	var labelOffset = 30;
	var red    = new THREE.Color( 0xff0000 );
	var yellow = new THREE.Color( 0xffff00 );

	var pointer = new CV.EntrancePointer( 5, labelOffset - 10, red, yellow );
	var marker  = new THREE.Geometry();
	var loader  = new THREE.TextureLoader();

	var markerTexture  = loader.load( "CaveView/images/marker-yellow.png" );

	var markerMaterial = new THREE.PointsMaterial( { size: 10, map: markerTexture, transparent : true, sizeAttenuation: false } );

	marker.vertices.push( new THREE.Vector3( 0, 0, 10 ) );
	marker.colors.push( new THREE.Color( 0xff00ff ) );

	var pointerBufferGeometry = new THREE.BufferGeometry().fromGeometry( pointer );
	pointerBufferGeometry.computeBoundingBox();

	var pointerMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.DoubleSide } );

	return function Marker ( text ) {

		THREE.LOD.call( this );

		this.type = "CV.Marker";

		var point = new THREE.Points( marker, markerMaterial );

		point.layers.set( CV.FEATURE_ENTRANCES );

		var label = new CV.Label( text );

		label.position.setZ( labelOffset );
		label.layers.set( CV.FEATURE_ENTRANCES );

		var pointer = new THREE.Mesh( pointerBufferGeometry, pointerMaterial );

		pointer.type = "CV.Pointer";

		pointer.layers.set( CV.FEATURE_ENTRANCES );
		pointer.add( label );

		this.name = text;

		this.addLevel( pointer,  0 );
		this.addLevel( point,  100 );

		return this;

	}

} () );

CV.Marker.prototype = Object.create( THREE.LOD.prototype );

CV.Marker.prototype.constructor = CV.Marker;

CV.Marker.prototype.raycast = function ( raycaster, intersects ) {

	var threshold = 10;
	var object = this;

	var ray = raycaster.ray;
	var position = this.getWorldPosition();
	var rayPointDistanceSq = ray.distanceSqToPoint( position );

	if ( rayPointDistanceSq < threshold ) {

		var intersectPoint = ray.closestPointToPoint( position );
		var distance = ray.origin.distanceTo( intersectPoint );

		if ( distance < raycaster.near || distance > raycaster.far ) return;

		intersects.push( {

			distance: distance,
			distanceToRay: Math.sqrt( rayPointDistanceSq ),
			point: intersectPoint.clone(),
			index: 0,
			face: null,
			object: object

		} );

	}

};

// EOF


CV.RectangleGeometry = function ( box, z ) {

	THREE.Geometry.call( this );

	this.type = "CV.RectangleGeometry";

	var min = box.min;
	var max = box.max;

	this.vertices.push( new THREE.Vector3( min.x, min.y, z ) );
	this.vertices.push( new THREE.Vector3( min.x, max.y, z ) );
	this.vertices.push( new THREE.Vector3( max.x, max.y, z ) );
	this.vertices.push( new THREE.Vector3( max.x, min.y, z ) );
	this.vertices.push( new THREE.Vector3( min.x, min.y, z ) );

};

CV.RectangleGeometry.prototype = Object.create( THREE.Geometry.prototype );

CV.RectangleGeometry.prototype.constructor = CV.RectangleGeometry;

// EOF
"use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.SHADING_HEIGHT      = 1;
CV.SHADING_LENGTH      = 2;
CV.SHADING_INCLINATION = 3;
CV.SHADING_CURSOR      = 4;
CV.SHADING_SINGLE      = 5;
CV.SHADING_SURVEY      = 6;
CV.SHADING_OVERLAY     = 7;
CV.SHADING_SHADED      = 8;
CV.SHADING_DEPTH       = 9;
CV.SHADING_PW          = 10;

CV.FEATURE_BOX           = 1;
CV.FEATURE_SELECTION_BOX = 2;
CV.FEATURE_ENTRANCES     = 3;
CV.FEATURE_TERRAIN       = 4;
CV.FACE_WALLS            = 5;
CV.FACE_SCRAPS           = 6;

CV.LEG_CAVE              = 7;
CV.LEG_SPLAY             = 8;
CV.LEG_SURFACE           = 9;

CV.upAxis = new THREE.Vector3( 0, 0, 1 );

CV.Survey = function ( cave ) {

	if ( !cave ) {

		alert( "failed loading cave information" );
		return;

	}

	THREE.Object3D.call( this );

	this.surveyTree = cave.getSurveyTree();
	this.selectedSectionIds = new Set();
	this.selectedSection = 0;
	this.selectedBox = null;

	// objects targetted by raycasters and objects with variable LOD

	this.mouseTargets = [];
	this.lodTargets = [];

	this.name = cave.getName();

	var self = this;

	_loadSegments( cave.getLineSegments() );
	_loadScraps( cave.getScraps() );
	_loadCrossSections( cave.getCrossSections() );
	_loadTerrain( cave );

	this.limits = this.getBounds();

	_loadEntrances( cave.getEntrances() );

	return;

	function _loadScraps ( scrapList ) {

		var geometry     = new THREE.Geometry();
		var vertexOffset = 0;
		var facesOffset  = 0;
		var faceRuns     = [];

		var l = scrapList.length;

		if ( l === 0 ) return null;

		for ( var i = 0; i < l; i++ ) {

			_loadScrap(  scrapList[i] );

		}

		geometry.computeFaceNormals();
		geometry.computeBoundingBox();

		geometry.name = "CV.Survey:faces:scraps:g";

		var mesh = new THREE.Mesh( geometry );

		mesh.name = "CV.Survey:faces:scraps";
		mesh.layers.set( CV.FACE_SCRAPS );
		mesh.userData = faceRuns;

		self.add( mesh );
		self.layers.enable( CV.FACE_SCRAPS );

		return;

		function _loadScrap ( scrap ) {

			var i, l;

			for ( i = 0, l = scrap.vertices.length; i < l; i++ ) {

				var vertex = scrap.vertices[ i ];

				geometry.vertices.push( new THREE.Vector3( vertex.x, vertex.y, vertex.z ) );

			}

			for ( i = 0, l = scrap.faces.length; i < l; i++ ) {

				var face = scrap.faces[ i ];

				geometry.faces.push( new THREE.Face3( face[0] + vertexOffset, face[1] + vertexOffset, face[2] + vertexOffset ) );

			}

			var end = facesOffset + scrap.faces.length;

			faceRuns.push( { start: facesOffset , end: end, survey: scrap.survey } );
			facesOffset = end;

			vertexOffset += scrap.vertices.length;

		}

	}

	function _loadCrossSections ( crossSectionGroups ) {

		var geometry = new THREE.Geometry();
		var faces    = geometry.faces;
		var vertices = geometry.vertices;

		var v = 0; // vertex counter
		var l = crossSectionGroups.length;

		// survey to face index mapping 
		var currentSurvey;
		var faceRuns = [];
		var faceSet  = 0;
		var lastEnd  = 0;
		var l1, r1, u1, d1, l2, r2, u2, d2;

		var run = null;

		if ( l === 0 ) return;

		for ( var i = 0; i < l; i++ ) {

			var crossSectionGroup = crossSectionGroups[ i ];
			var m = crossSectionGroup.length;

			if ( m < 2 ) continue;

			// enter first station vertices - FIXME use fudged approach vector for this (points wrong way).
			var lrud = _getLRUD( crossSectionGroup[ 0 ] );

			vertices.push( lrud.l );
			vertices.push( lrud.r );
			vertices.push( lrud.u );
			vertices.push( lrud.d );

			for ( var j = 0; j < m; j++ ) {

				var survey = crossSectionGroup[ j ].survey;
				var lrud = _getLRUD( crossSectionGroup[ j ] );

				if ( survey !== currentSurvey ) {

					currentSurvey = survey;

					if ( run !== null ) {

						// close section with two triangles to form cap.
						faces.push( new THREE.Face3( u2, r2, d2 ) );
						faces.push( new THREE.Face3( u2, d2, l2 ) );

						var lastEnd = lastEnd + faceSet * 8 + 4;

						run.end = lastEnd;
						faceRuns.push( run );

						run = null;
						faceSet = 0;

					}

				}

				faceSet++;

				// next station vertices
				vertices.push( lrud.l );
				vertices.push( lrud.r );
				vertices.push( lrud.u );
				vertices.push( lrud.d );

				// triangles to form passage box
				var l1 = v++;
				var r1 = v++;
				var u1 = v++;
				var d1 = v++;

				var l2 = v++;
				var r2 = v++;
				var u2 = v++;
				var d2 = v++;

				// all face vertices specified in CCW winding order to define front side.

				// top faces
				faces.push( new THREE.Face3( u1, r1, r2 ) );
				faces.push( new THREE.Face3( u1, r2, u2 ) );
				faces.push( new THREE.Face3( u1, u2, l2 ) );
				faces.push( new THREE.Face3( u1, l2, l1 ) );

				// bottom faces
				faces.push( new THREE.Face3( d1, r2, r1 ) );
				faces.push( new THREE.Face3( d1, d2, r2 ) );
				faces.push( new THREE.Face3( d1, l2, d2 ) );
				faces.push( new THREE.Face3( d1, l1, l2 ) );

				v = v - 4; // rewind to allow current vertices to be start of next box section.

				if ( run === null ) {

					// handle first section of run

					//  start tube with two triangles to form cap
					faces.push( new THREE.Face3( u1, r1, d1 ) );
					faces.push( new THREE.Face3( u1, d1, l1 ) );
	
					run = { start: lastEnd, survey: survey };

				}

			}

			currentSurvey = null;
			v = v + 4; // advance because we are starting a new set of independant x-sections.

		}

		if ( run !== null ) {

			// close tube with two triangles
			faces.push( new THREE.Face3( u2, r2, d2 ) );
			faces.push( new THREE.Face3( u2, d2, l2 ) );

			run.end = lastEnd + faceSet * 8 + 4;
			faceRuns.push( run );

		}

		l = faces.length;
		
		if ( l === 0 ) return;

		for ( i = 0; i < l; i++ ) {

			faces[ i ].color =  new THREE.Color( 0x0000ff );

		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		geometry.computeBoundingBox();

		geometry.name = "CV.Survey:faces:walls:g";

		var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );

		mesh.userData = faceRuns;
		mesh.name = "CV.Survey:faces:walls";
		mesh.renderOrder = 100;
		mesh.layers.set( CV.FACE_WALLS );

		self.add( mesh );
		self.layers.enable( CV.FACE_WALLS );

		return;

		function _getLRUD ( crossSection ) {

			var station  = crossSection.end;
			var lrud     = crossSection.lrud;
			var cross    = _getCrossProduct( crossSection );
			var stationV = new THREE.Vector3( station.x, station.y, station.z );

			var L = cross.clone().setLength(  lrud.l ).add( stationV );
			var R = cross.clone().setLength( -lrud.r ).add( stationV ); 

			var U = new THREE.Vector3( station.x, station.y, station.z + lrud.u );
			var D = new THREE.Vector3( station.x, station.y, station.z - lrud.d );

			return { l: L, r: R, u: U, d: D };

		}

		// derive vector in LR direction perpendicular to approach leg and up axis
		function _getCrossProduct ( crossSection ) {

			var s1 = crossSection.start;
			var s2 = crossSection.end;

			return new THREE.Vector3( s1.x - s2.x, s1.y - s2.y, s1.z - s2.z ).cross( CV.upAxis );

		}

	}

	function _loadEntrances ( entranceList ) {

		var l = entranceList.length;

		if ( l === 0 ) return null;

		var entrances = new THREE.Group();

		entrances.name = "CV.Survey:entrances";
		entrances.layers.set( CV.FEATURE_ENTRANCES );

		self.add( entrances );
		self.layers.enable( CV.FEATURE_ENTRANCES );

		for ( var i = 0; i < l; i++ ) { 

			var entrance = entranceList[ i ];
			var position = entrance.position;
			var marker   = new CV.Marker( entrance.label );

			entrances.add( marker );

			marker.position.copy( position );
			marker.userData = entrance.survey;

			self.mouseTargets.push( marker );
			self.lodTargets.push( marker );

		}

		return;

	}

	function _loadSegments ( srcSegments ) {

		var legGeometries = [];
		var legStats      = [];
		var legRuns       = [];

		legGeometries[ CV.NORMAL  ] = new THREE.Geometry();
		legGeometries[ CV.SURFACE ] = new THREE.Geometry();
		legGeometries[ CV.SPLAY   ] = new THREE.Geometry();

		legRuns[ CV.NORMAL  ] = [];
		legRuns[ CV.SURFACE ] = [];
		legRuns[ CV.SPLAY   ] = [];

		var geometry;

		var currentType;
		var currentSurvey;

		var run;

		var l = srcSegments.length;

		if ( l === 0 ) return null;

		for ( var i = 0; i < l; i++ ) {

			var leg    = srcSegments[ i ];

			var type   = leg.type;
			var survey = leg.survey;

			var vertex1 = new THREE.Vector3( leg.from.x, leg.from.y, leg.from.z );
			var vertex2 = new THREE.Vector3( leg.to.x,   leg.to.y,   leg.to.z );

			geometry = legGeometries[ type ];

			if ( geometry === undefined ) {

				console.log("unknown segment type: ", type );
				break;

			}

			if ( survey !== currentSurvey || type !== currentType ) {

				// complete last run data

				if ( run !== undefined ) {

					run.end = legGeometries[ currentType].vertices.length / 2;

					legRuns[ currentType ].push( run );

				}

				// start new run

				run = {};

				run.survey = survey;
				run.start  = geometry.vertices.length / 2;

				currentSurvey = survey;
				currentType   = type;

			}

			geometry.vertices.push( vertex1 );
			geometry.vertices.push( vertex2 );

			geometry.colors.push( CV.ColourCache.white );
			geometry.colors.push( CV.ColourCache.white );

		}

		// add vertices run for last survey section encountered

		if ( run.end === undefined ) {

			run.end = legGeometries[ type ].vertices.length / 2;
			legRuns[ type ].push( run );

		} 

		_addModelSegments( CV.NORMAL  , "CV.Survey:legs:cave:cave",       CV.LEG_CAVE );
		_addModelSegments( CV.SURFACE , "CV.Survey:legs:surface:surface", CV.LEG_SURFACE );
		_addModelSegments( CV.SPLAY   , "CV.Survey:legs:cave:splay",      CV.LEG_SPLAY );

		self.stats = legStats;

		return;

		function _addModelSegments ( tag, name, layerTag ) {

			var geometry = legGeometries[ tag ];

			if ( geometry.vertices.length === 0 ) return;

			geometry.computeBoundingBox();
			geometry.name = name + ":g";


			var mesh = new THREE.LineSegments( geometry );

			mesh.name = name;
			mesh.userData = legRuns[ tag ];

			mesh.layers.set( layerTag );

			self.add( mesh );
			self.layers.enable( layerTag );

			legStats[ tag ] = self.getLegStats( mesh );

		}

	}

	function _loadTerrain ( cave ) {

		var dim = cave.getTerrainDimensions();

		if ( dim.lines === 0 ) {

			self.terrain = null;
			return;

		}

		var width  = ( dim.samples - 1 ) * dim.xDelta;
		var height = ( dim.lines   - 1 ) * dim.yDelta;

		var plane = new THREE.PlaneGeometry( width, height, dim.samples - 1, dim.lines - 1 );
 
		plane.translate( dim.xOrigin + width / 2, dim.yOrigin + height / 2, 0 );

		self.terrain =  new CV.Terrain().addTile( plane, cave.getTerrainData(), cave.getTerrainBitmap() );

		return;

	}

}

CV.Survey.prototype = Object.create( THREE.Object3D.prototype );

CV.Survey.prototype.constructor = CV.Survey;

CV.Survey.prototype.getTerrain = function () {

	return this.terrain;

}

CV.Survey.prototype.getSurveyTree = function () {

	return this.surveyTree;

}

CV.Survey.prototype.getSelectedBox = function () {

	return this.selectedBox;

}

CV.Survey.prototype.getStats = function () {

	return this.stats[ CV.NORMAL ];

}

CV.Survey.prototype.clearSectionSelection = function () {

	this.selectedSection = 0;
	this.selectedSectionIds.clear();

	if ( this.selectedBox !== null ) {

		this.remove( this.selectedBox );
		this.selectedBox = null;

	}

}

CV.Survey.prototype.selectSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var surveyTree = this.surveyTree;

	selectedSectionIds.clear();

	if ( id ) surveyTree.getSubtreeIds( id, selectedSectionIds );

	this.selectedSection = id;

}

CV.Survey.prototype.getLegStats = function ( mesh ) {

	if ( !mesh ) return;

	var stats = { maxLegLength: -Infinity, minLegLength: Infinity, legCount: 0, legLength: 0 };
	var vertices = mesh.geometry.vertices;

	var vertex1, vertex2, legLength;

	var l = vertices.length;

	for ( var i = 0; i < l; i += 2 ) {

		vertex1 = vertices[ i ];
		vertex2 = vertices[ i + 1 ];

		var legLength = Math.abs( vertex1.distanceTo( vertex2 ) );

		stats.legLength = stats.legLength + legLength;

		stats.maxLegLength = Math.max( stats.maxLegLength, legLength );
		stats.minLegLength = Math.min( stats.minLegLength, legLength );

	}

	stats.legLengthRange = stats.maxLegLength - stats.minLegLength;
	stats.legCount = l / 2;

	return stats;

}

CV.Survey.prototype.cutSection = function ( id ) {

	var selectedSectionIds = this.selectedSectionIds;
	var self = this;

	if ( selectedSectionIds.size === 0 ) return;

	// iterate through objects replace geometries and remove bounding boxes;

	this.reverseTraverse( _cutObject );

	this.selectedBox = null;

	// update stats

	this.stats[ CV.NORMAL  ] = this.getLegStats( this.getObjectByName( "CV.Survey:legs:cave:cave" ) );
	this.stats[ CV.SURFACE ] = this.getLegStats( this.getObjectByName( "CV.Survey:legs:cave:surface" ) );
	this.stats[ CV.SPLAY   ] = this.getLegStats( this.getObjectByName( "CV.Survey:legs:surface:surface" ) );

	this.limits = this.getBounds();

	// FIXME - prune selected tree. - new tree op needed?

	this.surveyTree.makeTop( id );

	this.selectSection( 0 );

	return;

	function _cutObject( obj ) {

		var parent;

		switch ( obj.type ) {

		case "CV.Marker":

			if ( selectedSectionIds.has( obj.userData ) ) {

				self.mouseTargets.push( obj );
				self.lodTargets.push( obj );

			} else {

				obj.reverseTraverse( _remove );

			}

			break;

		case "LineSegments":

			_cutLineGeometry( obj );

			break;

		case "Mesh":

			_cutMeshGeometry( obj );

			break;

		case "CV.BoundingBox":

			obj.reverseTraverse( _remove );

			break;

		}

	}

	function _remove ( obj ) {

		var parent;

		parent = obj.parent;
		parent.remove( obj );

	}

	function _cutLineGeometry ( mesh ) {

		var vertexRuns = mesh.userData;

		if ( ! vertexRuns ) return;

		var geometry   = mesh.geometry;

		var vertices = geometry.vertices;
		var colors   = geometry.colors;

		var runsSelected = 0;
		var selectedSectionIds = self.selectedSectionIds;

		var newGeometry   = new THREE.Geometry();

		var newVertices   = newGeometry.vertices;
		var newColors     = newGeometry.colors;
		var newVertexRuns = [];

		var k;
		var vp = 0;

		for ( var run = 0, l = vertexRuns.length; run < l; run++ ) {

			var vertexRun = vertexRuns[ run ];
			var survey    = vertexRun.survey;
			var start     = vertexRun.start;
			var end       = vertexRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				for ( var v = start; v < end; v++ ) {

					k = v * 2;

					newVertices.push( vertices[ k ] );
					newVertices.push( vertices[ k + 1 ] );

					newColors.push( colors[ k ] );
					newColors.push( colors[ k + 1 ] );

				}

				// adjust vertex run for new vertices and color arrays

				vertexRun.start = vp;

				vp += end - start;

				vertexRun.end = vp;

				newVertexRuns.push( vertexRun );

			}

		}

		if ( newGeometry.vertices.length === 0 ) {

				// this type of leg has no instances in selected section.

				self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

				mesh.parent.remove( mesh );

				return;

		}

		newGeometry.computeBoundingBox();

		mesh.geometry = newGeometry;
		mesh.userData = newVertexRuns;

	}

	function _cutMeshGeometry ( mesh ) {

		var faceRuns = mesh.userData;

		if ( mesh.name === "" ) return;

		var geometry           = mesh.geometry;

		var faces              = geometry.faces;
		var vertices           = geometry.vertices;

		var	selectedSectionIds = self.selectedSectionIds;

		var newGeometry = new THREE.Geometry();

		var newFaces    = newGeometry.faces;
		var newVertices = newGeometry.vertices;

		var newFaceRuns = [];

		var fp = 0;

		var vMap = new Map();
		var face;

		var nextVertex  = 0, vertexIndex;

		for ( var run = 0, l = faceRuns.length; run < l; run++ ) {

			var faceRun = faceRuns[ run ];
			var survey  = faceRun.survey;
			var start   = faceRun.start;
			var end     = faceRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				for ( var f = start; f < end; f++ ) {

					face = faces[ f ];

					// remap face vertices into new vertex array
					face.a = _remapVertex( face.a );
					face.b = _remapVertex( face.b );
					face.c = _remapVertex( face.c );

					newFaces.push( face );

				}

				faceRun.start = fp;

				fp += end - start;

				faceRun.end   = fp;

				newFaceRuns.push( faceRun );

			}

		}

		if ( newGeometry.vertices.length === 0 ) {

				// this type of leg has no instances in selected section.

				self.layers.mask &= ~ mesh.layers.mask; // remove this from survey layer mask

				mesh.parent.remove( mesh );

				return;

		}

		newGeometry.computeFaceNormals();
		newGeometry.computeVertexNormals();
		newGeometry.computeBoundingBox();

		mesh.geometry = newGeometry;
		mesh.userData = newFaceRuns;

		function _remapVertex( vi ) {

			// see if we have already remapped this vertex index (vi)

			vertexIndex = vMap.get( vi );

			if ( vertexIndex === undefined ) {

				vertexIndex = nextVertex++;

				// insert new index in map
				vMap.set( vi, vertexIndex );

				newVertices.push( vertices[ vi ] );

			}

			return vertexIndex;

		} 

	}

}

CV.Survey.prototype.getBounds = function ()  {

	var box = new THREE.Box3();

	var min = box.min;
	var max = box.max;

	this.traverse( _addObjectBounds );

	return box;

	function _addObjectBounds ( obj ) {

		if ( obj.type === "CV.Pointer" ) return; // skip sprites which have abnormal bounding boxes

		var geometry = obj.geometry;

		if ( geometry && geometry.boundingBox ) {

			min.min( geometry.boundingBox.min );
			max.max( geometry.boundingBox.max );

		}

	}

}

CV.Survey.prototype.setFaceShading = function ( mode, material ) {

	this.setFacesSelected( this.getObjectByName( "CV.Survey:faces:walls" ), material, mode );
	this.setFacesSelected( this.getObjectByName( "CV.Survey:faces:scraps" ), material, mode );

}

CV.Survey.prototype.setFacesSelected = function ( mesh, selected, mode ) {

	if (!mesh) return;

	var faceRuns = mesh.userData;
	var faces    = mesh.geometry.faces;
	var	selectedSectionIds = this.selectedSectionIds;
	var surveyColours;
	var unselected = new THREE.MeshLambertMaterial( { side: THREE.FrontSide, color: 0x444444, vertexColors: THREE.FaceColors } );

	if ( mode === CV.SHADING_SURVEY ) {

		surveyColours = this.getSurveyColours();

	}

	mesh.material = new THREE.MultiMaterial( [ selected, unselected ] );

	var count = 0; // check final face count is select to detect faults in constructed mesh.userData

	if (selectedSectionIds.size && faceRuns) {

		for ( var run = 0, l = faceRuns.length; run < l; run++ ) {

			var faceRun = faceRuns[run];
			var survey  = faceRun.survey;
			var start   = faceRun.start;
			var end     = faceRun.end;

			count = count + end - start;
	
			if ( selectedSectionIds.has( survey ) ) {

				for ( var f = start; f < end; f++ ) {

					faces[ f ].materialIndex = 0;

					if ( mode === CV.SHADING_SURVEY ) {

						faces[ f ].color.copy( surveyColours[ survey ] );

					}

				}

			} else {

				for ( var f = start; f < end; f++ ) {

					faces[ f ].materialIndex = 1;

				}

			}

		}

		if ( faces.length != count ) console.log("error: faces.length", faces.length, "count : ", count ); // TMP ASSERT

	} else {

		for ( var f = 0, end = faces.length; f < end; f++ ) {

			faces[ f ].materialIndex = 0;

		}

	}

	mesh.geometry.groupsNeedUpdate = true;

	if ( mode === CV.SHADING_SURVEY ) mesh.geometry.colorsNeedUpdate = true;

}

CV.Survey.prototype.hasFeature = function ( layerTag ) {

	return !((this.layers.mask & 1 << layerTag) === 0);

}

CV.Survey.prototype.setLegShading = function ( legType, legShadingMode, material ) {

	var mesh;

	switch ( legType ) {

	case CV.LEG_CAVE:

		mesh = this.getObjectByName( "CV.Survey:legs:cave:cave" );

		break;

	case CV.LEG_SPLAY:

		mesh = this.getObjectByName(  "CV.Survey:legs:cave:splay" );

		break;

	case CV.LEG_SURFACE:

		mesh = this.getObjectByName( "CV.Survey:legs:surface:surface" );

		break;

	default:

		console.log( "invalid leg type" );
		return;

	}

	if ( mesh === undefined ) return;

	switch ( legShadingMode ) {

	case CV.SHADING_HEIGHT:

		this.setLegColourByHeight( mesh );

		break;

	case CV.SHADING_LENGTH:

		this.setLegColourByLength( mesh );

		break;

	case CV.SHADING_INCLINATION:

		this.setLegColourByInclination( mesh, CV.upAxis );

		break;

	case CV.SHADING_CURSOR:

		this.setLegColourByCursor( mesh );

		break;

	case CV.SHADING_SINGLE:

		this.setLegColourByColour( mesh, CV.ColourCache.red );

		break;

	case CV.SHADING_SURVEY:

		this.setLegColourBySurvey( mesh );

		break;

	case CV.SHADING_OVERLAY:

		break;

	case CV.SHADING_SHADED:

		break;

	case CV.SHADING_DEPTH:

		this.setLegColourByMaterial( mesh, material ); 

		break;

	default:

		console.log( "invalid leg shading mode" );
		return false;

	}

	return true;

}

CV.Survey.prototype.getSurveyColour = function ( surveyId ) {

	var surveyColours = CV.ColourCache.survey;

	return surveyColours[surveyId % surveyColours.length];

}

CV.Survey.prototype.getSurveyColours = function () { // FIXME - cache save recalc for faces and lines,

	var survey;
	var surveyColours = [];
	var selectedSection    = this.selectedSection;
	var selectedSectionIds = this.selectedSectionIds;
	var surveyTree = this.surveyTree;

	var colour;

	if ( selectedSectionIds.size > 0 && selectedSection !== 0 ) {

		survey = selectedSection;

	} else {

		survey = surveyTree.getRootId();
		surveyTree.getSubtreeIds( survey, selectedSectionIds );

	}

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var children = surveyTree.getChildData( survey );

	colour = this.getSurveyColour( survey );
	_setSurveyColour( survey );

	for ( var i = 0, l = children.length; i < l; i++ ) {

		var childId    = children[ i ].id;
		var childIdSet = new Set();

		surveyTree.getSubtreeIds( childId, childIdSet );

		colour = this.getSurveyColour( childId );

		childIdSet.forEach( _setSurveyColour );

	}

	return surveyColours;

	function _setSurveyColour ( value ) {

		surveyColours[value] = colour;

	}

}

CV.Survey.prototype.setEntrancesSelected = function () {

	var entrances = this.getObjectByName( "CV.Survey:entrances" );

	if (!entrances) return;

	var children = entrances.children;
	var selectedSectionIds = this.selectedSectionIds;
	var boundingBox = null;

	if ( selectedSectionIds.size > 0 ) {

		boundingBox = new THREE.Box3();

		for ( var i = 0, l = children.length; i < l; i++ ) {

			var entrance = children[ i ];

			if ( selectedSectionIds.has( entrance.userData ) ) {

				entrance.visible = true;
				boundingBox.expandByPoint( entrance.position );		

			} else {

				entrance.visible = false;

			}

		}

	} else {

		for ( var i = 0, l = children.length; i < l; i++ ) {

			var entrance = children[ i ];

			entrance.visible = true;

		}

	}

	return boundingBox;

}

CV.Survey.prototype.setLegColourByMaterial = function ( mesh, material ) {

	mesh.material = material;
	mesh.material.needsUpdate = true;

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = CV.ColourCache.white;
		geometry.colors[ v2 ] = CV.ColourCache.white;

	}

}

CV.Survey.prototype.setLegColourByHeight = function ( mesh ) {

	this.setLegColourByMaterial( mesh, CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) );

}

CV.Survey.prototype.setLegColourByCursor = function ( mesh ) {

	this.setLegColourByMaterial( mesh, CV.Materials.getCursorMaterial( CV.MATERIAL_LINE, 5.0 ) );

}

CV.Survey.prototype.setLegColourByColour = function ( mesh, colour ) {

	mesh.material = CV.Materials.getLineMaterial();

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

CV.Survey.prototype.setLegColourByLength = function ( mesh ) {

	var colours = CV.ColourCache.gradient;
	var colourRange = colours.length - 1;
	var stats = this.getStats();

	mesh.material = CV.Materials.getLineMaterial();

	this.setLegSelected( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		var relLength = ( Math.abs( vertex1.distanceTo( vertex2 ) ) - stats.minLegLength ) / stats.legLengthRange;
		var colour = colours[ Math.floor( ( 1 - relLength ) * colourRange ) ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

CV.Survey.prototype.setLegColourBySurvey = function ( mesh ) {

	var surveyColours = this.getSurveyColours();

	mesh.material = CV.Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2, survey ) {

		var colour = surveyColours[ survey ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

CV.Survey.prototype.setLegColourByInclination = function ( mesh, pNormal ) {

	var colours = CV.ColourCache.inclination;
	var colourRange = colours.length - 1;

	// pNormal = normal of reference plane in model space 

	mesh.material = CV.Materials.getLineMaterial();

	this.setLegSelected ( mesh, _colourSegment );

	function _colourSegment ( geometry, v1, v2 ) {

		var vertex1 = geometry.vertices[ v1 ];
		var vertex2 = geometry.vertices[ v2 ];

		var legNormal  = new THREE.Vector3().subVectors( vertex1, vertex2 ).normalize();
		var dotProduct = legNormal.dot( pNormal );

		var hueIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );
		var colour   = colours[ hueIndex ];

		geometry.colors[ v1 ] = colour;
		geometry.colors[ v2 ] = colour;

	}

}

CV.Survey.prototype.setLegSelected = function ( mesh, colourSegment ) {

	// pNormal = normal of reference plane in model space 
	var geometry   = mesh.geometry;
	var vertexRuns = mesh.userData;

	var vertices = geometry.vertices;
	var colors   = geometry.colors;

	var box = new THREE.Box3();

	var min = box.min;
	var max = box.max;

	var runsSelected = 0;

	var k;

	var selectedSectionIds= this.selectedSectionIds;

	if (selectedSectionIds.size && vertexRuns) {

		for ( var run = 0, l = vertexRuns.length; run < l; run++ ) {

			var vertexRun = vertexRuns[ run ];
			var survey    = vertexRun.survey;
			var start     = vertexRun.start;
			var end       = vertexRun.end;

			if ( selectedSectionIds.has( survey ) ) {

				runsSelected++;

				for ( var v = start; v < end; v++ ) {

					k = v * 2;

					var v1 = vertices[ k ];
					var v2 = vertices[ k + 1 ];

					colourSegment( geometry, k, k + 1, survey );

					min.min( v1 );
					min.min( v2 );
					max.max( v1 );
					max.max( v2 );

				}

			} else {

				for ( var v = start; v < end; v++ ) {

					k = v*2;

					var v1 = vertices[ k ];
					var v2 = vertices[ k + 1 ];

					colors[ k ]     = CV.ColourCache.grey;
					colors[ k + 1 ] = CV.ColourCache.grey;

				}

			}

		}

		if ( this.selectedSection > 0 && runsSelected > 0 ) {

			this.selectedBox = new CV.BoundingBox( box, 0x0000ff );

			this.selectedBox.layers.set( CV.FEATURE_SELECTED_BOX );

			this.add( this.selectedBox );

		}

	} else {

		for ( var v = 0, l = geometry.vertices.length / 2; v < l; v++ ) {

			var k  = v * 2;

			colourSegment( geometry, k, k + 1 );

		}

	}

	geometry.colorsNeedUpdate = true; 

}

// EOF
"use strict";

var CV = CV || {};

CV.Hud = ( function () {

// THREE objects

var camera;
var scene;

var hScale = 0;

var attitudeGroup;

var linearScale = null;
var angleScale  = null ;
var scaleBar    = null;

var compass;
var ahi;
var progressDial;

// DOM objects

var container;

// viewer state

var viewState;
var isVisible = true;

function init ( containerIn ) {

	container = containerIn;
	viewState = CV.Viewer.getState;

	var hHeight = container.clientHeight / 2;
	var hWidth  = container.clientWidth / 2;

	// create GL scene and camera for overlay
	camera = new THREE.OrthographicCamera( -hWidth, hWidth, hHeight, -hHeight, 1, 1000 );
	camera.position.z = 600;

	scene = new THREE.Scene();

	// group to simplyfy resize handling 
	attitudeGroup = new THREE.Group();
	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	scene.add( attitudeGroup );

	var aLight = new THREE.AmbientLight( 0x888888 );
	var dLight = new THREE.DirectionalLight( 0xFFFFFF );

	dLight.position.set( -1, 1, 1 );

	scene.add( aLight );
	scene.add( dLight );

	compass      = new CV.Compass( container );
	ahi          = new CV.AHI( container );
	progressDial = new CV.ProgressDial();

	attitudeGroup.add( compass );
	attitudeGroup.add( ahi );
	attitudeGroup.add( progressDial );

	window.addEventListener( "resize", resize );

	viewState.addEventListener( "newCave", caveChanged );
	viewState.addEventListener( "change", viewChanged );

}

function setVisibility ( visible ) {

	compass.setVisibility( visible );
	ahi.setVisibility( visible );

	if ( linearScale ) linearScale.setVisibility( visible );
	if ( angleScale ) angleScale.setVisibility( visible );
	if ( scaleBar ) scaleBar.setVisibility( visible );

	isVisible = visible;

	// reset correct disposition of keys etc.
	if ( visible ) viewChanged ( { type: "change", name: "shadingMode" } );

}

function getVisibility() {

	return isVisible;

}

function getProgressDial() {

	return progressDial;

}

function setScale( scale ) {

	hScale = scale;

}

function resize () {

	var hWidth  = container.clientWidth / 2;
	var hHeight = container.clientHeight / 2;

	// adjust cameras to new aspect ratio etc.
	camera.left   = -hWidth;
	camera.right  =  hWidth;
	camera.top    =  hHeight;
	camera.bottom = -hHeight;

	camera.updateProjectionMatrix();

	attitudeGroup.position.set( hWidth, -hHeight, 0 );

	// remove and add a new scale, simpler than rescaling

	if ( linearScale ) {

		scene.remove( linearScale );

		linearScale = new CV.LinearScale( container, viewState );

		scene.add( linearScale );

	}

	if ( angleScale ) {

		scene.remove( angleScale );

		angleScale = new CV.AngleScale( container );

		scene.add( angleScale );

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );

		scaleBar = new CV.ScaleBar( container, hScale, ( CV.HudObject.stdWidth + CV.HudObject.stdMargin ) * 4 );

		scene.add( scaleBar );

	}

	setVisibility ( isVisible ); // set correct visibility of elements

}

function render ( renderer, vCamera, scale ) {

	// update UI components
	compass.set( vCamera );
	ahi.set( vCamera );

	updateScaleBar( scale );

	// render on screen
	renderer.clearDepth();
	renderer.render( scene, camera );

}

function caveChanged ( event ) {

	if ( linearScale ) {

		scene.remove( linearScale );

	}

	linearScale = new CV.LinearScale( container, viewState );

	scene.add( linearScale );

	if ( angleScale ) {

		scene.remove( angleScale );
		angleScale = null;

	}

	if ( scaleBar ) {

		scene.remove( scaleBar );
		scaleBar = null;

	}

	viewChanged ( { type: "change", name: "shadingMode" } );

}

function viewChanged ( event ) {

	if ( event.name !== "shadingMode" ) return;

	switch ( viewState.shadingMode ) {

	case CV.SHADING_HEIGHT:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.minHeight, viewState.maxHeight, "Height above Datum" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_DEPTH:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) linearScale.setRange( viewState.maxHeight - viewState.minHeight, 0, "Depth below surface" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_CURSOR:

		if ( angleScale ) angleScale.setVisibility( false );

		if ( linearScale ) {

			linearScale.setMaterial( CV.Materials.getCursorMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );

			cursorChanged();

			viewState.addEventListener( "cursorChange",  cursorChanged );

		}

		break;

	case CV.SHADING_LENGTH:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setRange( viewState.minLegLength, viewState.maxLegLength, "Leg length" ).setMaterial( CV.Materials.getHeightMaterial( CV.MATERIAL_LINE ) ).setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	case CV.SHADING_INCLINATION:

		linearScale.setVisibility( false );

		if ( ! angleScale ) {

			angleScale = new CV.AngleScale( container );

			scene.add( angleScale );

		}

		angleScale.setVisibility( true );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;


	case CV.SHADING_CURSOR:

	case CV.SHADING_SINGLE:

	case CV.SHADING_SURVEY:

		if ( angleScale ) angleScale.setVisibility( false );

		linearScale.setVisibility( false );
		viewState.removeEventListener( "cursorChange",  cursorChanged );

		break;

	}

}

function cursorChanged ( event ) {

	var cursorHeight = Math.max( Math.min( viewState.cursorHeight, viewState.maxHeight ), viewState.minHeight );
	linearScale.setRange( viewState.minHeight, viewState.maxHeight, "Cursor:" + Math.round( cursorHeight ) );

}

function updateScaleBar ( scale ) {

	if ( scale === 0 ) {

		if ( scaleBar ) scaleBar.setVisibility( false );

	} else {

		if ( scaleBar === null ) {

			scaleBar = new CV.ScaleBar( container, hScale, ( CV.HudObject.stdWidth + CV.HudObject.stdMargin ) * 4 );
			scene.add( scaleBar );

		}

		scaleBar.setScale( scale ).setVisibility( true );

	}

}

return {
	init:               init,
	render:             render,
	setVisibility:		setVisibility,
	getVisibility:		getVisibility,
	getProgressDial:    getProgressDial,
	setScale:           setScale
};

} () ); // end of Hud Module

// EOF
"use strict";

var CV = CV || {};

CV.UI = ( function() {

var cave;
var caveLoader;

var caveIndex = Infinity;
var caveList = [];
var guiState = {};
var viewState;
var surveyTree;

var isCaveLoaded = false;

var container;
var frame;

var heightCursorGui;
var file;
var progressBar;

var legShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"by leg length":      CV.SHADING_LENGTH,
	"by leg inclination": CV.SHADING_INCLINATION,
	"height cursor":      CV.SHADING_CURSOR,
	"fixed":              CV.SHADING_SINGLE,
	"survey":             CV.SHADING_SURVEY
}

var surfaceShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"by leg inclination": CV.SHADING_INCLINATION,
	"height cursor":      CV.SHADING_CURSOR,
	"fixed":              CV.SHADING_SINGLE
}

var terrainShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"height cursor":      CV.SHADING_CURSOR,
	"Relief shading":     CV.SHADING_SHADED
}

var cameraViews = {
	"Plan":        CV.VIEW_PLAN,
	"N Elevation": CV.VIEW_ELEVATION_N,
	"S Elevation": CV.VIEW_ELEVATION_S,
	"E Elevation": CV.VIEW_ELEVATION_E,
	"W Elevation": CV.VIEW_ELEVATION_W
}

var cameraModes = {
	"Orthographic": CV.CAMERA_ORTHOGRAPHIC,
	"Perspective":  CV.CAMERA_PERSPECTIVE
}

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if (!container) {

		alert( "No container DOM object [" + domID + "] available" );
		return;

	}

	progressBar = new CV.ProgressBar( container );

	CV.Viewer.init( domID );

	caveLoader = new CV.Loader( caveLoaded, progress );

	// event handlers
	document.addEventListener( "keydown", function ( event ) { keyDown( event ); } );

	container.addEventListener( "drop", handleDrop );
	container.addEventListener( "dragover", handleDragover );

	Object.defineProperty( guiState, "file", {
		get: function ()  { return file; },
		set: function ( value ) { loadCave( value ); file = value; },
	} );

	viewState = CV.Viewer.getState;

	viewState.addEventListener( "change",  CV.Page.handleChange );
	viewState.addEventListener( "newCave", viewComplete );

	CV.Hud.init( container );

}

function closeFrame ( event ) {

	event.target.parentElement.classList.remove( "onscreen" );

}

function initSelectionPage () {

	var titleBar  = document.createElement( "div" )
	var rootId    = surveyTree.getRootId();
	var track     = [];
	var lastSelected  = false;
	var page;

	if ( !isCaveLoaded ) return;

	page = new CV.Page( frame, "icon_explore" );

	page.addHeader( "Selection" );

	titleBar.id = "ui-path";
	titleBar.addEventListener( "click", _handleSelectSurveyBack );

	page.appendChild( titleBar );

	page.addSlide( _displayPanel( rootId ), track.length, _handleSelectSurvey );

	var redraw = container.clientHeight;

	return;

	function _displayPanel ( id ) {

		var topNode  = surveyTree.getNodeData( id );
		var children = surveyTree.getChildData( id );
		var ul;
		var tmp;
		var i;
		var l;
		var surveyColours      = CV.Colours.surveyColoursCSS;
		var surveyColoursRange = surveyColours.length;
		var span;

		track.push( { name: topNode.name, id: id } );

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp );

		l = track.length;
		var footprint = track[ l - 1 ];

		titleBar.textContent = footprint.name;;

		if ( l > 1) {

			span = document.createElement( "span" );
			span.textContent = " \u25C4";

			titleBar.appendChild( span );

		}

		ul = document.createElement( "ul" );

		children.sort( _sortSurveys );

		l = children.length;

		for ( i = 0; i < l; i++ ) {

			var child = children[ i ];
			var li    = document.createElement( "li" );
			var txt   = document.createTextNode( child.name );

			li.id = "sv" + child.id;
			
			var key = document.createElement( "span" );

			key.style.color = surveyColours[ child.id % surveyColoursRange ];
			key.textContent = "\u2588 ";

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.noChildren ) {

				var descend = document.createElement( "div" );

				descend.classList.add( "descend-tree" );
				descend.id = "ssv" + child.id;
				descend.textContent = "\u25bA";

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		return ul;

		function _sortSurveys ( s1, s2 ) {

			return s1.name.localeCompare( s2.name );

		}

	}

	function _handleSelectSurveyBack ( event ) {

		if ( track.length === 1 ) return;

		track.pop();

		var id = track.pop().id;

		page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

	}

	function _handleSelectSurvey ( event ) {

		var target = event.target;
		var id = target.id.split( "v" )[ 1 ];

		event.stopPropagation();

		switch ( target.nodeName ) {

		case "LI":

			if (viewState.section !== Number( id ) ) {

				viewState.section = id;

				target.classList.add( "selected" );

				if ( lastSelected && lastSelected !== target ) {

					lastSelected.classList.remove( "selected" );

				}

				lastSelected = target;

			} else {

				viewState.section = 0;
				target.classList.remove( "selected" );

			}

			break;

		case "DIV":

			// FIXME - detect entries with no children.....

			if ( id ) {

				page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

			}

			break;

		}

	}

}

function initHelpPage () {

	var help = new CV.Page( frame, "icon_help" );
	var dl;

	help.addHeader( "Help - key commands" );

	help.addHeader( "Shading" );

	dl = document.createElement( "dl" );

	_addKey( "1", "depth" );
	_addKey( "2", "leg angle" );
	_addKey( "3", "leg length" );
	_addKey( "4", "depth cursor " );
	_addKey( "5", "single colour" );
	_addKey( "6", "survey section" );

	_addKey( "[", "move depth cursor up" );
	_addKey( "]", "move depth cursor down" );

	//addKey("n", "next cave");

	help.appendChild( dl );

	help.addHeader( "View" );

	dl = document.createElement( "dl" );

	_addKey( "O", "orthogonal view" );
	_addKey( "P", "perspective view" );
	_addKey( "R", "reset to plan view" );
	_addKey( ".", "center view on last feature selected" );

	help.appendChild( dl );

	help.addHeader( "Visibility" );

	dl = document.createElement( "dl" );

	_addKey( "C", "scraps on/off [lox only]" );
	_addKey( "L", "labels on/off" );
	_addKey( "Q", "splay legs on/off" );
	_addKey( "S", "surface legs on/off" );
	_addKey( "T", "terrain on/off" );
	_addKey( "W", "LRUD walls on/off" );

	help.appendChild( dl );

	help.addHeader( "Selection" );

	dl = document.createElement( "dl" );

	_addKey( "V", "Remove all except selected section" );

	help.appendChild( dl );

	function _addKey( key, description ) {

		var dt = document.createElement( "dt" );
		var dd = document.createElement( "dd" );

		dt.textContent = key;
		dd.textContent = description;

		dl.appendChild( dt );
		dl.appendChild( dd );

	}

}

function initInfoPage() {

	var page = new CV.Page( frame, "icon_info" );

	page.addHeader( "Information" );
	
	var p = document.createElement( "p" );

	p.textContent = "CV.Viewer - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.";
	page.appendChild( p );

	p = document.createElement( "p" );

	p.textContent = "Requires a browser supporting WebGL (IE 11+ and most other recent browsers), no plugins required. Created using the THREE.js 3D library and chroma,js colour handling library.";
	page.appendChild( p );

}

function initSettingsPage () {

	var legShadingModesActive     = Object.assign( {}, legShadingModes );
	var terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

	if ( viewState.hasTerrain ) legShadingModesActive.depth = CV.SHADING_DEPTH;

	var page = new CV.Page( frame, "icon_settings" );

	page.addHeader( "Survey" );

	page.addSelect( "File", caveList, guiState, "file" );

	page.addHeader( "View" );

	page.addSelect( "Camera Type", cameraModes, viewState, "cameraType" );
	page.addSelect( "View",        cameraViews, viewState, "view" );

	page.addHeader( "Shading" );

	page.addSelect( "Underground Legs", legShadingModesActive, viewState, "shadingMode" );

	if ( viewState.hasSurfaceLegs ) {

		page.addSelect( "Surface Legs", surfaceShadingModes, viewState, "surfaceShading" );

	}


	if ( viewState.hasTerrain ) {

		var overlays = viewState.terrainOverlays;

		if ( overlays.length > 0 ) terrainShadingModesActive[ "map overlay" ] = CV.SHADING_OVERLAY;

		page.addSelect( "Terrain", terrainShadingModesActive, viewState, "terrainShading" );

		if ( overlays.length > 1 ) page.addSelect( "Overlay", overlays, viewState, "terrainOverlay" );

	}

	page.addHeader( "Visibility" );

	if ( viewState.hasEntrances )    page.addCheckbox( "Entrances",     viewState, "entrances" );
	if ( viewState.hasScraps )       page.addCheckbox( "Scraps",        viewState, "scraps" );
	if ( viewState.hasSplays )       page.addCheckbox( "Splay Legs",    viewState, "splays" );
	if ( viewState.hasSurfaceLegs )  page.addCheckbox( "Surface Legs",  viewState, "surfaceLegs" );
	if ( viewState.hasTerrain )      page.addCheckbox( "Terrain",       viewState, "terrain" );
	if ( viewState.hasWalls )        page.addCheckbox( "Walls (LRUD)",  viewState, "walls" );
	if ( viewState.hasHUD )          page.addCheckbox( "Indicators",    viewState, "HUD" );

	page.addCheckbox( "Bounding Box", viewState, "box" );

}

function initUI () {

	CV.Page.reset();

	// create UI side panel and reveal tabs
	frame = document.createElement( "div" );

	frame.id = "frame";

	// close button

	var close = document.createElement( "div" );

	close.id = "close";

	close.addEventListener( "click", closeFrame );

	frame.appendChild( close );

	initSettingsPage();
	initSelectionPage();
	initInfoPage();
	initHelpPage();

	frame.style.display = "block";
	container.appendChild( frame );

}

function handleDragover ( event ) {

	event.preventDefault();
	event.dataTransfer.dropEffect = "copy";

}

function handleDrop ( event ) {

	var dt = event.dataTransfer;

	event.preventDefault();

	for ( var i = 0; i < dt.files.length; i++ ) {

		var file = dt.files[ i ];

		if ( i === 0 ) {

			loadCaveLocalFile( file );

		} else {

			// FIXME load other drag and drop into local file list or ignore??
		}

	}

}

function resetGUI () {

	if ( isCaveLoaded ) {

		isCaveLoaded = false;
		frame.addEventListener( "transitionend", afterReset );
		frame.classList.remove( "onscreen" );

		surveyTree  = null;

	}

}

function afterReset () {

	frame.removeEventListener( "transitionend", afterReset );

	if ( !isCaveLoaded ) {

		if ( frame !== undefined ) container.removeChild( frame );

	}

}

function loadCaveList ( list ) {

	caveList = list;
	nextCave();

}

function nextCave () {

	//cycle through caves in list provided
	if ( caveList.length === 0 ) return false;

	if ( ++caveIndex >= caveList.length ) caveIndex = 0;

	guiState.file = caveList[ caveIndex ];

}

function loadCave ( file ) {

	resetGUI();
	CV.Viewer.clearView();

	progressBar.Start( "Loading file " + file + " ..." );

	caveLoader.loadURL( "/surveys/" + file );

}

function loadCaveLocalFile ( file ) {

	resetGUI();
	CV.Viewer.clearView();

	progressBar.Start( "Loading file " + file.name + " ..." );

	caveLoader.loadFile( file );

}

function progress ( pcent ) {

	progressBar.Update( pcent );

}

function caveLoaded ( inCave ) { 

	cave = inCave;

	// slight delay to allow repaint to display 100%.
	setTimeout( _delayedTasks1, 100 );

	function _delayedTasks1 () {

		progressBar.End();
		progressBar.Start( "Rendering..." );

		setTimeout( _delayedTasks2, 100 );

	}

	function _delayedTasks2 () {

		CV.Viewer.loadCave( cave );
		progressBar.End();

		// viewComplete executed as "newCave"" event handler
	}

}

function viewComplete () {

	// display shading mode and initialize

	viewState.shadingMode = CV.SHADING_HEIGHT;

	surveyTree = CV.Viewer.getSurveyTree();
	isCaveLoaded = true;

	// drop reference to cave to free heap space
	cave = null;

	initUI();

}

function shadingModeChanged () {

	var stats = CV.Viewer.getStats();

}

function keyDown ( event ) {

	if ( !isCaveLoaded ) return;

	switch ( event.keyCode ) {

	case 49: // change colouring scheme to depth - '1'

		viewState.shadingMode = CV.SHADING_HEIGHT;

		break;

	case 50: // change colouring scheme to angle - '2'

		viewState.shadingMode = CV.SHADING_INCLINATION;

		break;

	case 51: // change colouring scheme to length - '3'

		viewState.shadingMode = CV.SHADING_LENGTH;

		break;

	case 52: // change colouring scheme to height cursor - '4'

		viewState.shadingMode = CV.SHADING_CURSOR;

		break;

	case 53: // change colouring scheme to white - '5'

		viewState.shadingMode = CV.SHADING_SINGLE;

		break;

	case 54: // change colouring scheme to per survey section - '6'

		viewState.shadingMode = CV.SHADING_SURVEY;

		break;

	case 55: // change colouring scheme to per survey section - 'y'

		viewState.shadingMode = CV.SHADING_DEPTH;

		break;

	case 67: // toggle scraps visibility - 'c'

		if ( viewState.hasScraps ) viewState.scraps = !viewState.scraps;

		break;

	case 76: //toggle entrance labels - 'l'

		if ( viewState.hasEntrances ) viewState.entrances = !viewState.entrances;

		break;

	case 78: // load next cave in list - 'n'

		nextCave();

		break;

	case 79: //switch view to orthoganal - 'o'

		viewState.cameraType = CV.CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		viewState.cameraType = CV.CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( viewState.hasSplays ) viewState.splays = !viewState.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		viewState.view = CV.VIEW_PLAN;

		break;

	case 83: // switch view to perspective -'s'

		if ( viewState.hasSurfaceLegs ) viewState.surfaceLegs = !viewState.surfaceLegs;

		break;

	case 84: // switch terrain on/off 't'

		if ( viewState.hasTerrain ) viewState.terrain = !viewState.terrain;

		break;

	case 85: // switch terrain on/off 'u'

		if ( viewState.hasTerrain ) viewState.terrainShading = CV.SHADING_PW;

		break;

	case 86: // cut selected survey section 'v'  

		resetGUI();
		viewState.cut = true;

		break;

	case 87: // switch walls on/off 'w'

		if ( viewState.hasWalls ) viewState.walls = !viewState.walls;

		break;

	case 88: // switch walls on/off 'x'

		viewState.test = 8;

		break;

	case 107: // increase cursor depth - '+' (keypad)
	case 219: // '[' key 

		viewState.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)
	case 221: // ']' key

		viewState.cursorHeight--;

		break;

	case 190: // look ast last POI - '.'

		viewState.setPOI = true; // actual value here is ignored.

		break;
	}

}

// export public interface

return {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};

} () );// end of UI Module

// EOF
 "use strict";

var CV = CV || {};

CV.MATERIAL_LINE       = 1;
CV.MATERIAL_SURFACE    = 2;

CV.CAMERA_ORTHOGRAPHIC = 1;
CV.CAMERA_PERSPECTIVE  = 2;

CV.VIEW_PLAN           = 1;
CV.VIEW_ELEVATION_N    = 2;
CV.VIEW_ELEVATION_S    = 3;
CV.VIEW_ELEVATION_E    = 4;
CV.VIEW_ELEVATION_W    = 5;

CV.lightPosition = new THREE.Vector3( -1, -1, 0.5 );  

CV.Viewer = ( function () {

var caveIsLoaded = false;

var container;

// THREE.js objects

var renderer;
var scene;
var model;
var oCamera;
var pCamera;
var camera;

var mouse = new THREE.Vector2();

var raycaster;
var terrain = null;
var directionalLight;
var region;
var survey;
var limits;
var stats  = {};
var scaleMatrix;

var viewState = {};
var cursorHeight;

var shadingMode        = CV.SHADING_HEIGHT;
var surfaceShadingMode = CV.SHADING_SINGLE;
var terrainShadingMode = CV.SHADING_SHADED;

var depthMaterialLine;
var depthMaterialFace;

var cameraMode;
var viewMode;
var selectedSection = 0;

// Point of interest tracking

var activePOIPosition;

var targetPOI = null;

var controls;

var lastActivityTime = 0;

function __dyeTrace() {

	return;

	var start = new THREE.Vector3();
	var end   = new THREE.Vector3( 100, 100, 100 );
	var progress;
	var max = 100;

	var geometry = new THREE.Geometry();

	for ( var i = 0; i < max; i++ ) {

		progress = i / max;

		geometry.vertices.push ( new THREE.Vector3().lerpVectors( start, end, progress ) );
		geometry.colors.push( new THREE.Color( Math.sin( Math.PI * progress ), 255, 0 ) );

	}

	scene.add ( new THREE.Points( geometry, new CV.TestMaterial( 25 ) ) );

}

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if (!container) alert( "No container DOM object [" + domID + "] available" );

	var width  = container.clientWidth;
	var height = container.clientHeight;

	renderer = new THREE.WebGLRenderer( { antialias: true } ) ;

	renderer.setSize( width, height );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( 0x000000 );
	renderer.autoClear = false;

	oCamera = new THREE.OrthographicCamera( -width / 2, width / 2, height / 2, -height / 2, -10000, 10000 );

	oCamera.rotateOnAxis( CV.upAxis, Math.PI / 2 );
	oCamera.up = CV.upAxis;

	initCameraLayers( oCamera );

	pCamera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );

	pCamera.up = CV.upAxis;

	initCameraLayers( pCamera );

	camera = pCamera;

	raycaster = new THREE.Raycaster();

	renderer.clear();

	container.appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement);

	controls.enableDamping = true;

	// event handler
	window.addEventListener( "resize", resize );

	Object.assign( viewState, THREE.EventDispatcher.prototype );

	Object.defineProperty( viewState, "terrain", {
		writeable: true,
		get: function () { return testCameraLayer( CV.FEATURE_TERRAIN ); },
		set: function ( x ) { loadTerrain( x ); setCameraLayer( CV.FEATURE_TERRAIN, x ); this.dispatchEvent( { type: "change", name: "terrain" } ); }
	} );

	Object.defineProperty( viewState, "terrainShading", {
		writeable: true,
		get: function () { return terrainShadingMode; },
		set: function ( x ) { _viewStateSetter( setTerrainShadingMode, "terrainShading", x ); }
	} );

	Object.defineProperty( viewState, "hasTerrain", {
		get: function () { return !!terrain; }
	} );

	Object.defineProperty( viewState, "terrainOverlays", {
		get: function () { return terrain && terrain.getOverlays(); }
	} );

	Object.defineProperty( viewState, "terrainOverlay", {
		writeable: true,
		get: function () { return terrain.getOverlay(); },
		set: function ( x ) { _viewStateSetter( setTerrainOverlay, "terrainOverlay", x ); }
	} );

	Object.defineProperty( viewState, "shadingMode", {
		writeable: true,
		get: function () { return shadingMode; },
		set: function ( x ) { _viewStateSetter( setShadingMode, "shadingMode", x ); }
	} );
	
	Object.defineProperty( viewState, "surfaceShading", {
		writeable: true,
		get: function () { return surfaceShadingMode; },
		set: function ( x ) { _viewStateSetter( setSurfaceShadingMode, "surfaceShading", x ); }
	} );

	Object.defineProperty( viewState, "cameraType", {
		writeable: true,
		get: function () { return cameraMode; },
		set: function ( x ) { _viewStateSetter( setCameraMode, "cameraType", x ); }
	} );

	Object.defineProperty( viewState, "view", {
		writeable: true,
		get: function () { return viewMode; },
		set: function ( x ) { _viewStateSetter( setViewMode, "view", x ); }
	} );

	Object.defineProperty( viewState, "cursorHeight", {
		writeable: true,
		get: function () { return cursorHeight; },
		set: function ( x ) { cursorHeight = x; this.dispatchEvent( { type: "cursorChange", name: "cursorHeight" } ); }
	} );

	Object.defineProperty( viewState, "maxHeight", {
		get: function () { return limits.max.z; },
	} );

	Object.defineProperty( viewState, "minHeight", {
		get: function () { return limits.min.z; },
	} );

	Object.defineProperty( viewState, "maxLegLength", {
		get: function () { return stats.maxLegLength; },
	} );

	Object.defineProperty( viewState, "minLegLength", {
		get: function () { return stats.minLegLength; },
	} );

	Object.defineProperty( viewState, "section", {
		writeable: true,
		get: function () { return selectedSection; },
		set: function ( x ) { _viewStateSetter( selectSection, "section", x ); }
	} );

	Object.defineProperty( viewState, "setPOI", {
		writeable: true,
		get: function () { return targetPOI.name; },
		set: function ( x ) { _viewStateSetter( setCameraPOI, "setPOI", x ); }
	} );

	if ( CV.Hud === undefined ) {

		Object.defineProperty( viewState, "hasHUD", {
			value: false,
		} );

	} else {

		Object.defineProperty( viewState, "hasHUD", {
			value: true,
		} );

		Object.defineProperty( viewState, "HUD", {
			writeable: true,
			get: function () { return CV.Hud.getVisibility(); },
			set: function ( x ) { CV.Hud.setVisibility( x ); }
		} );

	}

	_enableLayer( CV.FEATURE_BOX,       "box" );
	_enableLayer( CV.FEATURE_ENTRANCES, "entrances" );
	_enableLayer( CV.FACE_SCRAPS,       "scraps" );
	_enableLayer( CV.FACE_WALLS,        "walls" );
	_enableLayer( CV.LEG_SPLAY,         "splays" );
	_enableLayer( CV.LEG_SURFACE,       "surfaceLegs" );
	
	_hasLayer( CV.FEATURE_ENTRANCES, "hasEntrances" );
	_hasLayer( CV.FACE_SCRAPS,       "hasScraps" );
	_hasLayer( CV.FACE_WALLS,        "hasWalls" );
	_hasLayer( CV.LEG_SPLAY,         "hasSplays" );
	_hasLayer( CV.LEG_SURFACE,       "hasSurfaceLegs" );

	Object.defineProperty( viewState, "cut", {
		writeable: true,
		get: function () { return true; },
		set: function ( x ) { cutSection( x ) }

	} );

	Object.defineProperty( viewState, "test", {
		writeable: true,
		get: function () { return true; },
		set: function ( x ) { loadRegistry( x ) }

	} );

	CV.Materials.initCache( viewState );

	return;

	function _enableLayer( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			writeable: true,
			get: function () { return testCameraLayer( layerTag ); },
			set: function ( x ) { setCameraLayer( layerTag, x ); this.dispatchEvent( { type: "change", name: name } ); }
		} );

	}
	
	function _hasLayer( layerTag, name ) {

		Object.defineProperty( viewState, name, {
			get: function () { return survey.hasFeature( layerTag ); }
		} );

	}

	function _viewStateSetter( modeFunction, name, newMode ) {

		modeFunction( Number( newMode ) );
		viewState.dispatchEvent( { type: "change", name: name } );

	}

}

function loadRegistry( x ) {

	var registry = new CV.Registry( _registryLoaded );
	
	registry.loadURL( "http://thedca.org.uk/dca-cr/registry/googleEarth/", "Registry_kml.php" );

	function _registryLoaded () {

		console.log( "registry loaded" );

	}

}

function renderDepthTexture () {

	if ( terrain == null || !terrain.isLoaded() ) return;

	var dim = 512;

	// set camera frustrum to cover region/survey area

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var range = limits.size();

	var scaleX = width / range.x;
	var scaleY = height / range.y;

	if ( scaleX < scaleY ) {

		height = height * scaleX / scaleY;

	} else if ( scaleY < scaleX ) {

		width = width * scaleY / scaleX;

	}

	// render the terrain to a new canvas square canvas and extract image data

	var rtCamera = new THREE.OrthographicCamera( -width / 2, width / 2,  height / 2, -height / 2, -10000, 10000 );

	rtCamera.layers.enable( CV.FEATURE_TERRAIN ); // just render the terrain

	scene.overrideMaterial = CV.Materials.getDepthMapMaterial();

	var renderTarget = new THREE.WebGLRenderTarget( dim, dim, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );

	renderTarget.texture.generateMipmaps = false;

	depthMaterialLine = CV.Materials.getDepthMaterial( CV.MATERIAL_LINE,    limits, renderTarget.texture );
	depthMaterialFace = CV.Materials.getDepthMaterial( CV.MATERIAL_SURFACE, limits, renderTarget.texture );

	renderer.setSize( dim, dim );
	renderer.setPixelRatio( 1 );

	renderer.clear();
	renderer.render( scene, rtCamera, renderTarget, true );

	renderer.setRenderTarget();	// revert to screen canvas

	renderer.setSize( container.clientWidth, container.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	scene.overrideMaterial = null;
	
}

function setCameraMode ( mode ) {

	// FIXME - copy direction and scale between cameras

	switch ( mode ) {

	case CV.CAMERA_PERSPECTIVE:

		camera = pCamera;

		break;

	case CV.CAMERA_ORTHOGRAPHIC:

		camera = oCamera;

		break;

	default:

		console.log( "unknown camera mode", mode );
		return;

	}

	controls.object = camera;
	cameraMode = mode;

}

function initCameraLayers ( camera ) {

	camera.layers.set( 0 );

	camera.layers.enable( CV.LEG_CAVE );
	camera.layers.enable( CV.FEATURE_ENTRANCES );
	camera.layers.enable( CV.FEATURE_BOX );

}

function setCameraLayer ( layerTag, enable ) {

	if ( enable ) {

		oCamera.layers.enable( layerTag );
		pCamera.layers.enable( layerTag );

	} else {

		oCamera.layers.disable( layerTag );
		pCamera.layers.disable( layerTag );

	}

}

function testCameraLayer ( layerTag ) {

	return !( ( oCamera.layers.mask & 1 << layerTag ) === 0 );

}

function setViewMode ( mode ) {

	switch ( mode ) {

	case CV.VIEW_PLAN:

		// reset camera to start position
		pCamera.position.set( 0, 0, 600 );
		oCamera.position.set( 0, 0, 600 );

		break;

	case CV.VIEW_ELEVATION_N:

		pCamera.position.set( 0, 600, 0 );
		oCamera.position.set( 0, 600, 0 );

		break;

	case CV.VIEW_ELEVATION_S:

		pCamera.position.set( 0, -600, 0 );
		oCamera.position.set( 0, -600, 0 );

		break;

	case CV.VIEW_ELEVATION_E:

		pCamera.position.set( 600, 0, 0 );
		oCamera.position.set( 600, 0, 0 );

		break;

	case CV.VIEW_ELEVATION_W:

		pCamera.position.set( -600, 0, 0 );
		oCamera.position.set( -600, 0, 0 );

		break;

	default:

		console.log( "invalid view mode specified: ", mode );
		return;

	}

	pCamera.lookAt( 0, 0, 0 );
	pCamera.updateProjectionMatrix();

	oCamera.zoom = 1;
	oCamera.lookAt( 0, 0, 0 );
	oCamera.updateProjectionMatrix();

	controls.target = new THREE.Vector3();

	viewMode = mode;

}

function setTerrainShadingMode ( mode ) {

	var material;

	switch ( mode ) {

	case CV.SHADING_HEIGHT:

		material = CV.Materials.getHeightMaterial( CV.MATERIAL_SURFACE );

		break;

	case CV.SHADING_OVERLAY:

		if (terrain.getOverlays()) terrain.setOverlay( terrain.getOverlay() );

		break;

	case CV.SHADING_CURSOR:

		 material = CV.Materials.getCursorMaterial( CV.MATERIAL_SURFACE, 5.0 );

		 break;

	case CV.SHADING_SHADED:

		material = new THREE.MeshLambertMaterial( {
			color:        0xffffff,
			vertexColors: THREE.VertexColors,
			side:         THREE.FrontSide,
			transparent:  true,
			opacity:      0.55 }
		);

		break;

	case CV.SHADING_PW:

		material = new CV.PWMaterial();

		break;

	default:

		console.log( "unknown mode", mode );
		return;

	}

	if ( material !== undefined ) terrain.setMaterial( material );

	terrainShadingMode = mode;

}

function setShadingMode ( mode ) {

	var material;
	var legMaterial;

	switch ( mode ) {

	case CV.SHADING_HEIGHT:

		material = CV.Materials.getHeightMaterial( CV.MATERIAL_SURFACE );

		break;

	case CV.SHADING_CURSOR:

		material = CV.Materials.getCursorMaterial( CV.MATERIAL_SURFACE, 5.0 );

		break;

	case CV.SHADING_SINGLE:

		material = new THREE.MeshLambertMaterial( { color: 0xff0000, vertexColors: THREE.NoColors } );

		break;

	case CV.SHADING_SURVEY:

		material = new THREE.MeshLambertMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

		break;

	case CV.SHADING_DEPTH:

		if ( depthMaterialLine === null ) {

			mode = shadingMode;

		} else {

			legMaterial = depthMaterialLine;
			material    = depthMaterialFace;

		}

		break;

	}

	if ( survey.setLegShading( CV.LEG_CAVE, mode, legMaterial ) ) {

		if ( material ) {

			survey.setFaceShading( mode, material );

			setCameraLayer( CV.FACE_WALLS, true );
			setCameraLayer( CV.FACE_SCRAPS, true );

		} else {

			setCameraLayer( CV.FACE_WALLS, false );
			setCameraLayer( CV.FACE_SCRAPS, false );

		}

		//survey.setEntrancesSelected();
		shadingMode = mode;

	}

}

function setSurfaceShadingMode ( mode ) {

	if ( survey.setLegShading( CV.LEG_SURFACE, mode ) ) surfaceShadingMode = mode;

}

function setTerrainOverlay ( overlay ) {

	if ( terrainShadingMode === CV.SHADING_OVERLAY ) terrain.setOverlay( overlay );

}

function cutSection() {

	if ( selectedSection === 0 ) return;

	survey.cutSection( selectedSection );

	// grab a reference to prevent survey being destroyed
	var cutSurvey = survey;

	// reset view
	clearView()

	loadSurvey( cutSurvey );

}

function selectSection ( id ) {

	survey.clearSectionSelection();
	survey.selectSection( id );

	var entranceBox = survey.setEntrancesSelected();

	setShadingMode( shadingMode );

	var box = survey.getSelectedBox();

	if ( id === 0 ) return;

	if ( box ) {

		box.geometry.computeBoundingBox();

		targetPOI = {

			tAnimate: 0,
			object:      box,
			position:    box.getWorldPosition(),
			boundingBox: box.geometry.boundingBox

		};

	} else {

		targetPOI = {

			tAnimate: 0,
			object:      null,
			position:    entranceBox.center().applyMatrix4( scaleMatrix ),
			boundingBox: entranceBox
		};

	}

	selectedSection = id;

}

function resize () {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	//  adjust the renderer to the new canvas size
	renderer.setSize( width, height );

	if ( oCamera === undefined ) return;

	// adjust cameras to new aspect ratio etc.
	oCamera.left   = -width / 2;
	oCamera.right  =  width / 2;
	oCamera.top    =  height / 2;
	oCamera.bottom = -height / 2;

	oCamera.updateProjectionMatrix();

	pCamera.aspect = width / height;

	pCamera.updateProjectionMatrix();

}

function clearView () {

	// clear the current cave model, and clear the screen
	caveIsLoaded = false;

	renderer.clear();
	CV.Hud.setVisibility( false );

	controls.enabled = false;

	survey          = null;
	terrain         = null;
	selectedSection = 0;
	scene           = new THREE.Scene();
	region          = new THREE.Group();
	targetPOI       = null;

	depthMaterialLine = null;
	depthMaterialFace = null;

	shadingMode = CV.SHADING_HEIGHT;

	// remove event listeners

	unloadTerrainListeners();
	container.removeEventListener( "click", entranceClick);

	scene.add( pCamera );
	scene.add( oCamera );

	initCameraLayers( pCamera );
	initCameraLayers( oCamera );

	viewState.cameraType = CV.CAMERA_PERSPECTIVE;
	viewState.view       = CV.VIEW_PLAN;

	render();

}

function loadCave ( cave ) {

	if (!cave) {

		alert( "failed loading cave information" );
		return;

	}

	loadSurvey( new CV.Survey( cave ) );

}

function loadSurvey( newSurvey ) {

	survey = newSurvey;

	stats = survey.getStats();

	setScale();

	terrain = survey.getTerrain();

	scene.up = CV.upAxis;
	scene.add( scaleObject( region ) );

	region.add( survey );

	var box = new CV.BoundingBox( survey.limits, 0xffffff );

	box.layers.set( CV.FEATURE_BOX );

	survey.add( box );

	// light the model for Lambert Shaded surface

	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.copy( CV.lightPosition );

	scene.add( directionalLight );

	scene.add( new THREE.AmbientLight( 0x303030 ) );

	caveIsLoaded = true;

	selectSection( 0 );

	// set if we have independant terrain maps

	if ( terrain === null ) {

		terrain = new CV.TiledTerrain( survey.limits, _tilesLoaded );

		if ( !terrain.hasCoverage() ) {

			terrain = null;

		} else {

			terrain.tileArea( survey.limits );
			region.add( terrain );

		}

	} else {

		region.add( terrain );
		setTerrainShadingMode( terrainShadingMode );
		renderDepthTexture();

	}

	scene.matrixAutoUpdate = false;

	container.addEventListener( "click", entranceClick, false );

	// signal any listeners that we have a new cave
	viewState.dispatchEvent( { type: "newCave", name: "newCave" } );

	controls.object = camera;
	controls.enabled = true;

	CV.Hud.setVisibility( true );
	
	__dyeTrace(); // FIXME test function

	animate();

	function _tilesLoaded () {

		setTerrainShadingMode( terrainShadingMode );
		loadTerrainListeners();

		if ( !depthMaterialLine ) renderDepthTexture();

	}

}

function loadTerrain ( mode ) {

	if ( terrain.isLoaded() ) {

		if ( mode ) {

			 loadTerrainListeners();

		} else {

			 unloadTerrainListeners();

		}

	}

}

function loadTerrainListeners () {

	clockStart();

	controls.addEventListener( "end", clockStart );

}

function unloadTerrainListeners () {

	if ( !controls ) return;

	controls.removeEventListener( "end", clockStart );

	clockStop();

}

function clockStart ( event ) {

	lastActivityTime = performance.now();

}

function clockStop ( event ) {

	lastActivityTime = 0;

}

function entranceClick ( event ) {

	mouse.x =   ( event.clientX / container.clientWidth  ) * 2 - 1;
	mouse.y = - ( event.clientY / container.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( survey.mouseTargets, false );

	if ( intersects.length > 0 ) {

		var entrance = intersects[ 0 ].object;
		var position = entrance.getWorldPosition();
		
		targetPOI = {

			tAnimate:    80,
			object:      entrance,
			position:    position,
			cameraPosition: position.clone().add( new THREE.Vector3( 0, 0, 5 ) ),
			boundingBox: new THREE.Box3().expandByPoint( entrance.position ),
			quaternion:  new THREE.Quaternion()

		};

		activePOIPosition = controls.target;
	
		console.log(entrance.type, entrance.name );

	}

}

function render () {

	if ( !caveIsLoaded ) return;

	var r = camera.getWorldRotation();

	directionalLight.position.copy( CV.lightPosition.clone().applyAxisAngle( CV.upAxis, r.z ) );

	renderer.clear();
	renderer.render( scene, camera );

	var scale = 0;

	if ( camera instanceof THREE.OrthographicCamera ) scale = camera.zoom;

	CV.Hud.render( renderer, camera, scale );

	// update LOD Scene Objects

	var lods = survey.lodTargets;
	var l    = lods.length;

	if ( l > 0 ) {

		for ( var i = 0; i < l; i++ ) {

			lods[ i ].update( camera );

		}

	}

	if ( targetPOI !== null && targetPOI.tAnimate > 0 ) {

		// handle move to new Point of Interest (POI)
		_moveToPOI();

	} else {

		if ( terrain && terrain.isTiled() && viewState.terrain ) {

			if ( lastActivityTime && performance.now() - lastActivityTime > 500 ) {

				clockStop();
				terrain.zoomCheck( camera );

			}

		}

		controls.update();

	}

	return;

	function _moveToPOI () {

		targetPOI.tAnimate--;

		var t =  1 - targetPOI.tAnimate / ( targetPOI.tAnimate + 1 );

		activePOIPosition.lerp( targetPOI.position, t );

		camera.position.lerp( targetPOI.cameraPosition, t );
		camera.lookAt( activePOIPosition );
		camera.quaternion.slerp( targetPOI.quaternion, t );

		camera.updateProjectionMatrix();

		if ( targetPOI.tAnimate === 0 ) {

			controls.target = targetPOI.position;
			controls.enabled = true;

			// restart the clock to trigger refresh of terrain
			clockStart();
			targetPOI = null;

		}

	}

}

function setCameraPOI ( x ) {

	var boundingBox;
	var elevation;

	if ( targetPOI === null ) return;

	targetPOI.tAnimate = 80;

	var size = targetPOI.boundingBox.size().multiplyScalar( scaleMatrix.elements[ 0 ] ) ;

	if ( camera instanceof THREE.PerspectiveCamera ) {

		var tan = Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.getEffectiveFOV() );

		var e1 = 1.5 * tan * size.y / 2 + size.z;
		var e2 = tan * camera.aspect * size.x / 2 + size.z;

		elevation = Math.max( e1, e2 );
		
		if ( elevation === 0 ) elevation = 100;

	} else {

		elevation = 200; // FIXME

	}

	activePOIPosition = controls.target;

	targetPOI.cameraPosition   = targetPOI.position.clone();
	targetPOI.cameraPosition.z = targetPOI.cameraPosition.z + elevation;

	targetPOI.quaternion = new THREE.Quaternion();

	// disable orbit controls until move to selected POI is conplete

	controls.enabled = false;

}

function animate () {

	requestAnimationFrame( animate );
	render();

}

function setScale () {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	limits = survey.limits;

	var range  = limits.size();
	var center = limits.center();

	// initialize cursor height to be mid range of heights
	cursorHeight = center.z;

	// scale and translate model coordiniates into THREE.js world view
	var scale = Math.min( width / range.x, height / range.y );

	scaleMatrix = new THREE.Matrix4().makeScale( scale, scale, scale );

	scaleMatrix.multiply( new THREE.Matrix4().makeTranslation( -center.x, -center.y, -center.z ) );
	
	CV.Hud.setScale( scale );

}

function scaleObject( obj ) {

	obj.applyMatrix( scaleMatrix );

	return obj;

}

function getStats () {

	return stats;

}

function getSurveyTree () {

	return survey.getSurveyTree();

}

// export public interface

return {
	init:          init,
	clearView:     clearView,
	loadCave:      loadCave,
	getStats:      getStats,
	getSurveyTree: getSurveyTree,
	getState:      viewState
};

} () );// end of Viewer Module


// EOF