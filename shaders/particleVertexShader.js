const particleVertexShader = `
uniform float time;
  uniform float wobble;
  attribute float size;
  varying vec3 vColor;
  varying float dist;

  float hermite(float t)
  {
    return t * t * (3.0 - 2.0 * t);
  }

  float rand(float x){
      return fract(sin(x * 12.9898) * 43758.5453);
  }

  float noise(float x, float frequency)
  {
    float v = x * frequency;
    float ix1 = floor(v);
    float ix2 = floor(v + 1.0);
    float fx = hermite(fract(v));
    return mix(rand(ix1), rand(ix2), fx);
  }

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * ( 300.0 / -mvPosition.z );

    mvPosition.x += (noise(time, float(gl_VertexID)) - 0.5 ) * wobble;
    mvPosition.y += (noise(time + .1, float(gl_VertexID)) - 0.5 ) * wobble;
    mvPosition.z += (noise(time - .1, float(gl_VertexID)) - 0.5 ) * wobble;

    dist = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }`;
export default particleVertexShader;
