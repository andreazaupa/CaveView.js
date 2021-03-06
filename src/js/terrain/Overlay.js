
import {
	TextureLoader,
	MeshLambertMaterial,
	Box2, Vector2
} from '../Three';

import { Cfg } from '../core/lib';
import proj4 from 'proj4';

const missingMaterial = new MeshLambertMaterial( { transparent: true, opacity: 0.5, color: 0xff8888 } );

function Overlay ( overlayProvider, container ) {

	this.provider = overlayProvider;
	this.container = container;
	this.active = false;
	this.hasCoverage = false;
	this.crsSupported = overlayProvider.crsSupported === undefined ? [ 'EPSG:3857', 'EPSG:4326', 'ORIGINAL' ] : overlayProvider.crsSupported;

	const attribution = overlayProvider.getAttribution();

	if ( attribution ) {

		attribution.classList.add( 'overlay-branding' );
		this.attribution = attribution;

	}

	this.materialCache = {};
	this.missing = new Set();

	const coverage = overlayProvider.coverage;

	if ( coverage !== undefined ) {

		this.coverage = new Box2(
			new Vector2( coverage.minX, coverage.minY ),
			new Vector2( coverage.maxX, coverage.maxY )
		);

	}

}

Overlay.prototype.checkCoverage = function ( limits, displayCRS, surveyCRS ) {

	const coverage = this.coverage;

	if ( this.crsSupported.indexOf( displayCRS ) === -1 ) return false;

	// transform survey limits to wgs84 for comparison with overlay limits

	const transform = proj4( ( displayCRS === 'ORIGINAL' ? surveyCRS : displayCRS ), 'WGS84' );
	const wgs84Limits = new Box2();

	wgs84Limits.expandByPoint( transform.forward( { x: limits.min.x, y: limits.min.y } ) );
	wgs84Limits.expandByPoint( transform.forward( { x: limits.min.x, y: limits.max.y } ) );
	wgs84Limits.expandByPoint( transform.forward( { x: limits.max.x, y: limits.min.y } ) );
	wgs84Limits.expandByPoint( transform.forward( { x: limits.max.x, y: limits.max.y } ) );

	this.provider.crs = displayCRS;
	this.hasCoverage = ( coverage === undefined ) ? true : coverage.intersectsBox( wgs84Limits );

	return this.hasCoverage;

};

Overlay.prototype.showAttribution = function () {

	const attribution = this.attribution;

	if ( attribution !== undefined ) this.container.appendChild( attribution );

};

Overlay.prototype.hideAttribution = function () {

	const attribution = this.attribution;
	const parent = attribution.parentNode;

	if ( parent !== null ) parent.removeChild( attribution );

};

Overlay.prototype.getTile = function ( x, y, z, opacity, overlayLoaded ) {

	const self = this;
	const key = x + ':' + y + ':' + z;

	const material = this.materialCache[ key ];
	const overlayMaxZoom = this.provider.overlayMaxZoom;

	var repeat = 1;
	var xOffset = 0;
	var yOffset = 0;

	if ( material !== undefined ) {

		overlayLoaded( this.active ? material : null );

		return;

	}

	const zoomDelta = z - overlayMaxZoom;

	if ( zoomDelta > 0 ) {

		const scale = Math.pow( 2, zoomDelta );

		repeat = 1 / scale;

		// get image for lower zoom
		const newX = Math.floor( x * repeat );
		const newY = Math.floor( y * repeat );

		xOffset = ( x - newX * scale ) / scale;
		yOffset = 1 - ( y - newY * scale ) / scale;
		yOffset -= repeat;

		x = newX;
		y = newY;
		z = overlayMaxZoom;

		//console.log( 'max zoom exceeded', repeat, x, y, z, xOffset, yOffset );

	}

	const url = this.provider.getUrl( x, y, z );

	if ( url === null || this.missing.has( url ) ) {

		overlayLoaded( missingMaterial );

		return;

	}

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded, undefined, _textureMissing );

	return;

	function _textureLoaded( texture ) {

		if ( ! self.active ) {

			texture.dispose();

			overlayLoaded( null );
			return;

		}

		const material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		texture.anisotropy = Cfg.value( 'anisotropy', 4 );

		texture.repeat.setScalar( repeat );

		texture.offset.set( xOffset, yOffset );

		material.map = texture;
		material.needsUpdate = true;

		self.materialCache[ key ] = material;

		overlayLoaded( material );

	}

	function _textureMissing( /* texture */ ) {

		self.missing.add( url );

		overlayLoaded( self.active ? missingMaterial : null );

	}

};

Overlay.prototype.setActive = function () {

	this.showAttribution();
	this.active = true;

};

Overlay.prototype.setInactive = function () {

	// flush cache

	const materialCache = this.materialCache;

	for ( var name in materialCache ) {

		let material = materialCache[ name ];

		material.map.dispose();
		material.dispose();

	}

	this.materialCache = {};

	this.hideAttribution();
	this.active = false;

};

Overlay.prototype.constructor = Overlay;

export { Overlay };
