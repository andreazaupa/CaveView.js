
import { Shaders } from '../shaders/Shaders';
import { MATERIAL_LINE } from '../core/constants';
import { ColourCache } from '../core/ColourCache';

import { ShaderMaterial, Vector3 } from '../Three';
import { MaterialFog } from './MaterialFog';
import { Cfg } from '../core/lib';

function DepthMaterial ( type, survey ) {

	const surveyLimits = survey.modelLimits;
	const terrain = survey.terrain;
	const limits = terrain.boundingBox;
	const range = limits.getSize( new Vector3() );
	const gradient = Cfg.value( 'saturatedGradient', false ) ? 'gradientHi' : 'gradientLow';

	ShaderMaterial.call( this, {
		vertexShader: Shaders.depthVertexShader,
		fragmentShader: Shaders.depthFragmentShader,
		type: 'CV.DepthMaterial',
		uniforms: Object.assign( {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight:     { value: survey.lightDirection },
			modelMin:   { value: limits.min },
			scaleX:     { value: 1 / range.x },
			scaleY:     { value: 1 / range.y },
			rangeZ:     { value: range.z },
			depthScale: { value: 1 / ( surveyLimits.max.z - surveyLimits.min.z ) },
			cmap:       { value: ColourCache.getTexture( gradient ) },
			depthMap:   { value: terrain.depthTexture },
			datumShift: { value: 0.0 },
		}, MaterialFog.uniforms ),
		defines: {
			USE_COLOR: true,
			SURFACE: ( type !== MATERIAL_LINE )
		}
	} );

	return this;

}

DepthMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthMaterial.prototype.setDatumShift = function ( shift ) {

	this.uniforms.datumShift.value = shift;

};

export { DepthMaterial };

// EOF