
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { Cfg } from '../core/lib';

import { ShaderMaterial } from '../Three';
import { MaterialFog } from './MaterialFog';

function CursorMaterial ( type, survey ) {

	const limits = survey.modelLimits;

	ShaderMaterial.call( this, {
		vertexShader: Shaders.cursorVertexShader,
		fragmentShader: Shaders.cursorFragmentShader,
		type: 'CV.CursorMaterial',
		uniforms: Object.assign( {
			uLight:      { value: survey.lightDirection },
			cursor:      { value: 0 },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: Cfg.themeColor( 'shading.cursorBase' ) },
			cursorColor: { value: Cfg.themeColor( 'shading.cursor' ) },
		}, MaterialFog.uniforms ),
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	this.halfRange = ( limits.max.z - limits.min.z ) / 2;

	return this;

}

CursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

CursorMaterial.prototype.setCursor = function ( value ) {

	const newValue = Math.max( Math.min( value, this.halfRange ), -this.halfRange );

	this.uniforms.cursor.value = newValue;

	return newValue; // return value clamped to material range

};

CursorMaterial.prototype.getCursor = function () {

	return this.uniforms.cursor.value;

};

export { CursorMaterial };

// EOF