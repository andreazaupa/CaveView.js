
import { FEATURE_TERRAIN, upAxis } from '../core/constants.js';
import { padDigits } from '../core/lib.js';
import { ColourCache } from '../core/ColourCache.js';

import {
	Vector2, Vector3, Triangle, Box3,
	BufferGeometry,
	BufferGeometryLoader, ImageLoader,
	Texture,
	MeshBasicMaterial, MeshLambertMaterial,
	RepeatWrapping,
	Mesh
} from '../../../../three.js/src/Three.js';

function TileMesh ( x, y, resolution, tileSet, clip ) {

	this.x = x;
	this.y = y;

	this.resolution = resolution;
	this.tileSet    = tileSet;
	this.clip       = clip;

	this.canZoom       = true;
	this.evicted       = false;
	this.evictionCount = 1;

	Mesh.call( this );

	this.type = "TileMesh";

	return this;

}

TileMesh.prototype = Object.create( Mesh.prototype );

TileMesh.prototype.constructor = TileMesh;

TileMesh.liveTiles = 0;
TileMesh.overlayImages = new Map();


TileMesh.prototype.create = function ( geometry, terrainData ) {

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

	var colourCache = ColourCache.terrain;
	var colourRange = colourCache.length - 1;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		var face = faces[ i ];

		// compute vertex colour per vertex normal

		for ( var j = 0; j < 3; j++ ) {

			var dotProduct = face.vertexNormals[j].dot( upAxis );
			var colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

			face.vertexColors[ j ] = colourCache[ colourIndex ];

		}

	}

	// reduce memory consumption by transferring to buffer object
	var bufferGeometry = new BufferGeometry().fromGeometry( geometry );

	bufferGeometry.computeBoundingBox();
//	bufferGeometry.setDiscardBuffers(); // FIXME test with discard buffers enabled

	this.geometry = bufferGeometry;
	this.layers.set ( FEATURE_TERRAIN );

	return this;

}

TileMesh.prototype.createFromBufferGeometryJSON = function ( json, boundingBox ) {

	var loader = new BufferGeometryLoader();

	var bufferGeometry = loader.parse( json, boundingBox );

	// use precalculated bounding box rather than recalculating it here.

	bufferGeometry.boundingBox = new Box3(

		new Vector3( boundingBox.min.x, boundingBox.min.y, boundingBox.min.z ), 
		new Vector3( boundingBox.max.x, boundingBox.max.y, boundingBox.max.z )

	);

	bufferGeometry.setDiscardBuffers(); // Non standard feature.

	this.geometry = bufferGeometry;
	this.layers.set ( FEATURE_TERRAIN );

}


TileMesh.prototype.getWorldBoundingBox = function () {

	var boundingBox;

	if ( this.worldBoundingBox === null ) {

		this.updateMatrixWorld();

		boundingBox = this.getBoundingBox().clone();
		boundingBox.applyMatrix4( this.matrixWorld );

		this.worldBoundingBox = boundingBox;

	}

	return this.worldBoundingBox;

}

TileMesh.prototype.getBoundingBox = function () {

	var boundingBox;

	if ( this.boundingBox === null ) {

		boundingBox = this.geometry.boundingBox.clone();

		var adj = this.resolution; // adjust to cope with overlaps

		boundingBox.min.x += adj;
		boundingBox.min.y += adj;
		boundingBox.max.x -= adj;
		boundingBox.max.y -= adj;

		this.boundingBox = boundingBox;

	}

	return this.boundingBox;

}

/*

Tile.prototype.remove = function ( evicted ) {

	if ( evicted ) this.evictionCount++;

	this.evicted = evicted;

	if ( this.mesh ) {

		if ( !this.boundingBox ) {

			console.log( "FIXUP :", this.x, this.y );
			this.getWorldBoundingBox();

		}

		this.parent.remove( this.mesh );

		this.mesh.geometry.dispose();

		this.mesh = null;

		--Tile.liveTiles;

	}

}
*/
TileMesh.prototype.dispose = function () {

	this.geometry.dispose();

}

TileMesh.prototype.setMaterial = function ( material ) {

	this.material = material;

}

TileMesh.prototype.setOpacity = function ( opacity ) {

	var material = this.material;

	material.opacity = opacity;
	material.needsUpdate = true;

}

TileMesh.prototype.setOverlay = function ( overlay, opacity, imageLoadedCallback ) {

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

	xOffset = xOffset + ( repeat * clip.left / tileWidth );
	yOffset = yOffset + ( repeat * clip.bottom / tileWidth );

	var xRepeat = repeat * ( ( tileWidth - clip.left - clip.right ) / tileWidth );
	var yRepeat = repeat * ( ( tileWidth - clip.top  - clip.bottom ) / tileWidth );

	var imageFile = tileSet.OVERLAYDIR + overlay + "/" + tileSet.PREFIX + tileSet.OVERLAY_RESOLUTION + "MX-" + padDigits( y, 3 ) + "-" + padDigits( x, 3 ) + ".jpg";

	if ( TileMesh.overlayImages.has( imageFile ) ) {

		_imageLoaded( TileMesh.overlayImages.get( imageFile ) );

	} else {

		var loader = new ImageLoader();

		loader.load( imageFile, _imageLoaded );

	}

	return;

	function _imageLoaded ( image ) {

		var material = new MeshLambertMaterial( { transparent: true, opacity: opacity } );

		TileMesh.overlayImages.set( imageFile, image );

		texture = new Texture();

		texture.image = image;

		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;

		texture.offset = new Vector2( xOffset, yOffset );
		texture.repeat = new Vector2( xRepeat, yRepeat );

		texture.needsUpdate = true;

		material.map = texture;
		material.needsUpdate = true;

		self.material = material;

		// add images to cache
		TileMesh.overlayImages.set( imageFile, image );

		imageLoadedCallback();

	}

}

TileMesh.prototype.getParent = function () {

	return this.parent;

}
/*
TileMesh.prototype.projectedArea = function ( camera ) {

	var boundingBox = this.getWorldBoundingBox();

	var v1 = boundingBox.min.clone();
	var v3 = boundingBox.max.clone();

	v1.z = 0;
	v3.z = 0;

	var v2 = new Vector3( v3.x, v1.y, 0 );
	var v4 = new Vector3( v1.x, v3.y, 0 ) ;

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure

	v1.project( camera ).clampScalar( -1, 1 );
	v2.project( camera ).clampScalar( -1, 1 );
	v3.project( camera ).clampScalar( -1, 1 );
	v4.project( camera ).clampScalar( -1, 1 );

	var t1 = new Triangle( v1, v3, v4 );
	var t2 = new Triangle( v1, v2, v3 );

	return t1.area() + t2.area();

}
*/

export { TileMesh };

// EOF