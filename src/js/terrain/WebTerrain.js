import { Materials } from '../materials/Materials';
import { CommonTerrain } from './CommonTerrain';
import { Tile } from './Tile';
import { WorkerPool } from '../core/WorkerPool';
import { Cfg } from '../core/lib';

import {
	Vector2, Frustum, Box2, Matrix4, FileLoader
} from '../Three';

const halfMapExtent = 6378137 * Math.PI; // from EPSG:3875 definition

var tileSets;

function WebTerrain ( survey, onLoaded ) {

	CommonTerrain.call( this );

	this.name = 'WebTerrain';
	this.type = 'CV.WebTerrain';
	this.attribution = [];
	this.log = false;

	const limits = survey.limits;

	this.limits = new Box2(
		new Vector2( limits.min.x, limits.min.y ),
		new Vector2( limits.max.x, limits.max.y )
	);

	this.offsets = survey.offsets;

	this.onLoaded        = onLoaded;
	this.childrenLoading = 0;
	this.childErrors     = 0;
	this.isLoaded        = false;
	this.material        = null;
	this.initialZoom     = null;
	this.currentZoom     = null;
	this.currentLimits   = null;
	this.dying = false;
	this.tilesLoading = 0;
	this.overlaysLoading = 0;
	this.debug = true;

	this.material = Materials.getCursorMaterial();

	this.workerPool = new WorkerPool( 'webTileWorker.js' );

}

WebTerrain.prototype = Object.create( CommonTerrain.prototype );

WebTerrain.prototype.isTiled = true;

WebTerrain.prototype.load = function ( onNoCoverage ) {

	// return indicates if sync coverage checking in progress

	const self = this;

	if ( tileSets === undefined ) {

		// async operation

		new FileLoader().setResponseType( 'text' ).load( Cfg.value( 'terrainDirectory', '' ) + '/' + 'tileSets.json', _tileSetLoaded, function () {}, _tileSetMissing );

		return false;

	} else if ( tileSets === null ) {

		return true;

	} else {

		return _checkTileSets();

	}

	function _checkTileSets( ) {

		if ( self.hasCoverage() ) {

			self.tileArea( self.limits );
			return false;

		}

		return true;

	}

	// async callbacks

	function _tileSetLoaded( text ) {

		tileSets = JSON.parse( text );

		_checkTileSets();

	}

	function _tileSetMissing( ) {

		tileSets = null;
		onNoCoverage(); // call handler

	}

};

WebTerrain.prototype.hasCoverage = function () {

	const limits = this.limits;

	if ( tileSets === undefined ) return false;

	// iterate through available tileSets and pick the first match
	const baseDirectory = Cfg.value( 'terrainDirectory', '' );

	for ( var i = 0, l = tileSets.length; i < l; i++ ) {

		const tileSet = tileSets[ i ];
		const coverage = this.getCoverage( limits, tileSet.minZoom );

		if ( ( coverage.min_x >= tileSet.minX && coverage.max_x <= tileSet.maxX )
				&& (
					( coverage.min_y >= tileSet.minY && coverage.max_y <= tileSet.maxY ) ) ) {

			tileSet.directory = baseDirectory + tileSet.subdirectory;

			this.tileSet = tileSet;
			this.log = tileSet.log === undefined ? false : tileSet.log;
			this.attributions = tileSet.attributions;

			return true;

		}

	}

	return false;

};

WebTerrain.prototype.getCoverage = function ( limits, zoom ) {

	const coverage = { zoom: zoom };

	const N =  halfMapExtent;
	const W = -halfMapExtent;

	const tileCount = Math.pow( 2, zoom - 1 ) / halfMapExtent; // tile count per metre

	coverage.min_x = Math.floor( ( limits.min.x - W ) * tileCount );
	coverage.max_x = Math.floor( ( limits.max.x - W ) * tileCount );

	coverage.max_y = Math.floor( ( N - limits.min.y ) * tileCount );
	coverage.min_y = Math.floor( ( N - limits.max.y ) * tileCount );

	coverage.count = ( coverage.max_x - coverage.min_x + 1 ) * ( coverage.max_y - coverage.min_y + 1 );

	return coverage;

};

WebTerrain.prototype.pickCoverage = function ( limits ) {

	const tileSet = this.tileSet;

	var zoom = tileSet.maxZoom + 1;
	var coverage;

	do {

		--zoom;
		coverage = this.getCoverage( limits, zoom );

	} while ( coverage.count > 4 && zoom > tileSet.minZoom );

	return coverage;

};

WebTerrain.prototype.loadTile = function ( x, y, z, existingTile, parentTile ) {

	const self = this;

	// account for limits of DTM resolution

	const tileSet = this.tileSet;
	const scale = ( z > tileSet.dtmMaxZoom ) ? Math.pow( 2, tileSet.dtmMaxZoom - z ) : 1;
	const limits = this.limits;

	// don't zoom in with no overlay - no improvement of terrain rendering in this case

	if ( scale !== 1 && this.activeOverlay === null && this.currentZoom !== null ) return;

	if ( this.log ) console.log( 'load: [ ', z +'/' + x + '/' + y, ']' );

	const tileWidth = halfMapExtent / Math.pow( 2, z - 1 );
	const clip      = { top: 0, bottom: 0, left: 0, right: 0 };

	const tileMinX = tileWidth * x - halfMapExtent;
	const tileMaxX = tileMinX + tileWidth;

	const tileMaxY = halfMapExtent - tileWidth * y;
	const tileMinY = tileMaxY - tileWidth;

	const divisions = ( tileSet.divisions ) * scale ;
	const resolution = tileWidth / divisions;

	++this.tilesLoading;

	// trim excess off sides of tile where overlapping with region

	if ( tileMaxY > limits.max.y ) clip.top = Math.floor( ( tileMaxY - limits.max.y ) / resolution );

	if ( tileMinY < limits.min.y ) clip.bottom = Math.floor( ( limits.min.y - tileMinY ) / resolution );

	if ( tileMinX < limits.min.x ) clip.left = Math.floor( ( limits.min.x - tileMinX ) / resolution );

	if ( tileMaxX > limits.max.x ) clip.right = Math.floor( ( tileMaxX - limits.max.x ) / resolution );

	// get Tile instance.

	const tile = existingTile ? existingTile : new Tile( x, y, z, self.tileSet, clip );
	const parent = parentTile ? parentTile : this;

	tile.setPending( parent ); // tile load/reload pending

	// get a web worker from the pool and create new geometry in it

	this.workerPool.runWorker(
		{
			tileSet: tileSet,
			divisions: divisions,
			resolution: resolution,
			x: x,
			y: y,
			z: z,
			clip: clip,
			offsets: this.offsets
		},
		_mapLoaded
	);

	return;

	function _mapLoaded ( event ) {

		const tileData = event.data;
		const worker = event.currentTarget;

		// return worker to pool

		self.workerPool.putWorker( worker );

		--self.tilesLoading;

		// the survey/region in the viewer may have changed while the height maps are being loaded.
		// bail out in this case to avoid errors

		if ( self.dying ) {

			self.dispatchEvent( { type: 'progress', name: 'end' } );
			return;

		}

		// error out early if we or other tiles have failed to load.

		if ( tileData.status !== 'ok' || tile.parent.childErrors !== 0 ) {

			tile.setFailed();

			self.dispatchEvent( { type: 'progress', name: 'end' } );

			// signal error to caller
			if ( self.tilesLoading === 0 ) self.onLoaded( self.childErrors );

			return;

		}


		self.dispatchEvent( { type: 'progress', name: 'add', value: self.progressInc } );

		tile.createFromBufferAttributes( tileData.index, tileData.attributes, tileData.boundingBox, self.material );

		self.dispatchEvent( { type: 'progress', name: 'add', value: self.progressInc } );

		if ( tile.setLoaded( self.activeOverlay, self.opacity, self.onLoaded ) ) {

			self.dispatchEvent( { type: 'progress', name: 'end' } );

		}

		self.isLoaded = true;

	}

};

WebTerrain.prototype.resurrectTile = function ( tile ) {

	if ( tile.isMesh ) {

		console.warn( 'resurrecting the undead!' );
		return;

	}

	// reload tile (use exiting tile object to preserve canZoom).
	this.loadTile( tile.x, tile.y, tile.zoom, tile );

};

WebTerrain.prototype.tileArea = function ( limits, tile ) {

	const coverage = this.pickCoverage( limits );
	const zoom = coverage.zoom;

	if ( tile && tile.zoom === zoom ) {

		console.error( 'ERROR - looping on tile replacement' );
		return;

	}

	this.currentLimits = limits;

	if ( this.initialZoom === null ) {

		this.initialZoom = zoom;

	}

	for ( var x = coverage.min_x; x < coverage.max_x + 1; x++ ) {

		for ( var y = coverage.min_y; y < coverage.max_y + 1; y++ ) {

			this.loadTile( x, y, zoom, null, tile );

		}

	}

	if ( this.tilesLoading > 0 ) {

		this.dispatchEvent( { type: 'progress', name: 'start' } );
		this.progressInc = 100 / ( this.tilesLoading * 2 );

	}

	this.currentZoom = zoom;

	return;

};

WebTerrain.prototype.setOverlay = function ( overlay, overlayLoadedCallback ) {

	if ( this.tilesLoading > 0 ) return;

	const self = this;
	const currentOverlay = this.activeOverlay;

	if ( currentOverlay !== null ) {

		if ( currentOverlay === overlay ) {

			return;

		} else {

			currentOverlay.flushCache();
			currentOverlay.hideAttribution();
			currentOverlay.active = false;

		}

	}

	overlay.showAttribution();
	overlay.active = true;

	this.activeOverlay = overlay;

	this.traverse( _setTileOverlays );

	return;

	function _setTileOverlays ( obj ) {

		if ( ! obj.isTile ) return;

		obj.setOverlay( overlay, self.opacity, _overlayLoaded );

		self.overlaysLoading++;

	}

	function _overlayLoaded ( tile ) {

		tile.setOpacity( self.opacity );

		if ( --self.overlaysLoading === 0 ) overlayLoadedCallback();

	}

};

WebTerrain.prototype.removed = function () {

	const self = this;

	this.dying = true;

	if ( this.tilesLoading > 0 ) return;

	this.traverse( _disposeTileMesh );

	this.commonRemoved();

	return;

	function _disposeTileMesh ( obj ) {

		if ( obj !== self ) obj.removed( obj );

	}

};

WebTerrain.prototype.setMaterial = function ( material ) {

	if ( this.tilesLoading > 0 ) return;

	this.traverse( _setTileMeshMaterial );

	this.activeOverlay = null;

	// use for commmon material access for opacity

	material.opacity = this.opacity;
	material.needsUpdate = true;
	material.fog = false;

	this.material = material;

	return;

	function _setTileMeshMaterial ( obj ) {

		if ( ! obj.isTile ) return;

		obj.setMaterial( material );

	}

};

WebTerrain.prototype.setOpacity = function ( opacity ) {

	this.opacity = opacity;

	if ( this.activeOverlay === null ) {

		if ( this.material ) {

			this.material.opacity = opacity;
			this.material.needsUpdate = true;

		}

	} else {

		// each tile has its own material, therefore need setting separately
		this.traverse( _setTileOpacity );

	}

	return;

	function _setTileOpacity ( obj ) {

		if ( obj.isTile ) obj.setOpacity( opacity );

	}

};

WebTerrain.prototype.zoomCheck = function ( camera ) {

	const maxZoom     = this.tileSet.maxZoom;
	const initialZoom = this.initialZoom;
	const self = this;

	const frustum = new Frustum();

	const candidateTiles      = [];
	const candidateEvictTiles = [];
	const resurrectTiles      = [];

	var retry = false;
	var total, tile, i;

	if ( this.tilesLoading > 0 ) return true;

	camera.updateMatrix(); // make sure camera's local matrix is updated
	camera.updateMatrixWorld(); // make sure camera's world matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	frustum.setFromMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

	// scan scene graph of terrain

	this.traverse( _scanTiles );

	const resurrectCount = resurrectTiles.length;
	const candidateCount = candidateTiles.length;

	_evictTiles();

	if ( resurrectCount !== 0 ) {

		this.dispatchEvent( { type: 'progress', name: 'start' } );

		for ( i = 0; i < resurrectCount; i++ ) {

			this.resurrectTile( resurrectTiles[ i ] );
			retry = true;

		}

		this.progressInc = 100 / ( 2 * resurrectCount );

	} else if ( candidateCount !== 0 ) {

		total = candidateTiles.reduce( function ( a, b ) { return { area: a.area + b.area }; } );

		for ( i = 0; i < candidateCount; i++ ) {

			if ( candidateTiles[ i ].area / total.area > 0.3 ) { // FIXME - weight by tile resolution to balance view across all visible areas first.

				tile = candidateTiles[ i ].tile;

				if ( tile.zoom < maxZoom ) {

					const bb = tile.getBoundingBox().clone();

					bb.min.add( this.offsets );
					bb.max.add( this.offsets );

					this.tileArea( bb, tile );
					retry = true;

				}

			}

		}

	}

	return retry;

	function _scanTiles( tile ) {

		if ( tile === self || ! tile.isTile ) return;

		if ( frustum.intersectsBox( tile.getWorldBoundingBox() ) ) {

			// this tile intersects the screen

			if ( tile.children.length === 0 ) {

				if ( ! tile.isMesh ) {

					// this tile is not loaded, but has been previously
					resurrectTiles.push( tile );

				} else {

					// this tile is loaded, maybe increase resolution?
					if ( tile.canZoom ) candidateTiles.push( { tile: tile, area: tile.projectedArea( camera ) } );

				}

			} else {

				if ( ! tile.isMesh && tile.evicted && ! this.parent.resurrectionPending ) {

					tile.resurrectionPending = true;
					resurrectTiles.push( tile );

				}

				if ( tile.parent.ResurrectionPending && this.isMesh ) {

					// remove tile - will be replaced with parent
					console.warn( ' should not get here' );

				}

			}

		} else {

			// off screen tile
			if ( tile.isMesh ) candidateEvictTiles.push( tile );

		}

	}

	function _evictTiles() {

		const EVICT_PRESSURE = 5;
		const evictCount = candidateEvictTiles.length;

		var i;

		if ( evictCount !== 0 ) {

			candidateEvictTiles.sort( _sortByPressure );

			for ( i = 0; i < evictCount; i++ ) {

				const tile = candidateEvictTiles[ i ];

				// heuristics for evicting tiles - needs refinement

				const pressure = Tile.liveTiles / EVICT_PRESSURE;
				const tilePressure = tile.evictionCount * Math.pow( 2, initialZoom - tile.zoom );

				//console.log( 'ir', initialZoom, 'p: ', pressure, ' tp: ', tilePressure, ( pressure > tilePressure ? '*** EVICTING ***' : 'KEEP' ) );

				if ( pressure > tilePressure ) tile.evict();

			}

		}

		function _sortByPressure( tileA, tileB ) {

			return tileA.evictionCount / tileA.zoom - tileB.evictionCount / tileB.zoom;

		}

	}

};

export { WebTerrain };

// EOF