
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';

import { Vector3, Color, ShaderMaterial } from '../../../../three.js/src/Three';

function CursorMaterial ( type, limits ) {

	ShaderMaterial.call( this );

	this.min = limits.min.z;
	this.max = limits.max.z;

	this.defines = {};

	if ( type === MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}

	this.uniforms = {
		uLight:         { value: new Vector3( -1, -1, 2 ) },
		cursor:         { value: ( limits.max.z + limits.min.z ) / 2 },
		cursorWidth:    { value: 5.0 },
		baseColor:      { value: new Color( 0x888888 ) },
		cursorColor:    { value: new Color( 0x00ff00 ) },
		surfaceOpacity: { value: 0.5 }
	};

	this.vertexShader   = Shaders.cursorVertexShader;
	this.fragmentShader = Shaders.cursorFragmentShader;

	this.transparent = true;
	this.type = 'CV.CursorMaterial';

	this.addEventListener( 'update', _update );

	return this;

	function _update() {

		this.uniforms.surfaceOpacity.value = this.opacity;

	}

}

CursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

CursorMaterial.prototype.constructor = CursorMaterial;

CursorMaterial.prototype.setCursor = function ( value ) {

	var newValue = Math.max( Math.min( value, this.max ), this.min );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

}

CursorMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

}

export { CursorMaterial };

// EOF