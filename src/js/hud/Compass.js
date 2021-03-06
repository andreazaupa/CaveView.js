
import { HudObject } from './HudObject';
import { Cfg } from '../core/lib';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	Vector3, Math as _Math, Face3,
	Geometry, RingBufferGeometry,
	MeshBasicMaterial, MeshPhongMaterial, MeshLambertMaterial,
	VertexColors,
	Mesh, Group, Euler
} from '../Three';

const __direction = new Vector3();
const __negativeZAxis = new Vector3( 0, 0, -1 );
const __e = new Euler();

function Compass () {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	Group.call( this );

	this.name = 'CV.Compass';

	const cg1 = HudObject.getCommonRing();

	const c1 = new Mesh( cg1, new MeshPhongMaterial( { color: Cfg.themeValue( 'hud.bezel' ), specular: 0x888888 } ) );

	const cg2 = new RingBufferGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
	cg2.translate( 0, 0, 5 );

	HudObject.dropBuffers( cg2 );

	const c2 = new Mesh( cg2, new MeshBasicMaterial( { color: Cfg.themeValue( 'hud.compass.top1' ) } ) );

	const r1 = _makeRose( stdWidth * 0.9, 0.141, Cfg.themeColor( 'hud.compass.bottom1' ), Cfg.themeColor( 'hud.compass.bottom2' ) );
	const r2 = _makeRose( stdWidth * 0.9, 0.141, Cfg.themeColor( 'hud.compass.top1' ), Cfg.themeColor( 'hud.compass.top2' ) );

	r1.rotateZ( Math.PI / 4 );
	r1.merge( r2 );

	const rMesh = new Mesh( r1, new MeshLambertMaterial( { vertexColors: VertexColors, flatShading: true } ) );

	const rotaryGroup = new Group();

	rotaryGroup.addStatic( c1 );
	rotaryGroup.addStatic( c2 );
	rotaryGroup.addStatic( rMesh );

	this.add( rotaryGroup );
	this.rotaryGroup = rotaryGroup;

	const offset = stdWidth + stdMargin;

	this.translateX( -offset );
	this.translateY(  offset );

	this.lastRotation = 0;

	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '000\u00B0', material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( stdWidth + 5 );

	this.addStatic( label );

	this.label = label;

	return this;

	// make 'petal' for compass rose
	function _makePetal ( radius, scale, color1, color2 ) {

		const innerR = radius * scale;
		const g = new Geometry();

		g.vertices.push( new Vector3( 0, radius, 0 ) );
		g.vertices.push( new Vector3( innerR, innerR, 0 ) );
		g.vertices.push( new Vector3( 0, 0, 14 * scale ) );
		g.vertices.push( new Vector3( -innerR, innerR, 0 ) );

		var f1 = new Face3( 0, 2, 1, new Vector3( 0, 0, 1 ), color1, 0 );
		var f2 = new Face3( 0, 3, 2, new Vector3( 0, 0, 1 ), color2, 0 );

		g.faces.push( f1 );
		g.faces.push( f2 );

		return g;

	}

	function _makeRose ( radius, scale, color1, color2 ) {

		const p1 = _makePetal( radius, scale, color1, color2 );
		const p2 = p1.clone();
		const p3 = p1.clone();
		const p4 = p1.clone();

		p2.rotateZ( Math.PI / 2 );
		p3.rotateZ( Math.PI );
		p4.rotateZ( Math.PI / 2 * 3 );

		p1.merge( p2 );
		p1.merge( p3 );
		p1.merge( p4 );

		p1.computeFaceNormals();

		return p1;

	}

}

Compass.prototype = Object.create( Group.prototype );

Compass.prototype.set = function ( vCamera ) {

	var a;

	vCamera.getWorldDirection( __direction );

	if ( Math.abs( __direction.z ) < 0.999 ) {

		a = Math.atan2( - __direction.x, __direction.y );

	} else {

		__e.setFromQuaternion( vCamera.quaternion );
		a = __e.z;

	}

	if ( a === this.lastRotation ) return;

	if ( a < 0 ) a = Math.PI * 2 + a;

	var degrees = Math.round( _Math.radToDeg( a ) );

	if ( degrees === 360 ) degrees = 0;

	const res = degrees.toString().padStart( 3, '0' ) + '\u00B0'; // unicode degree symbol

	this.label.replaceString( res );

	this.rotaryGroup.rotateOnAxis( __negativeZAxis, a - this.lastRotation );

	this.lastRotation = a;

};

export { Compass };

// EOF