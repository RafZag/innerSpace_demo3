const particleFragmentShader = `
uniform vec3 rimColor;
varying vec3 vColor;
varying float dist;

void main() {
  //vec3 lightColor = vec3(0.6588, 1.0, 0.9137);
  if (distance(gl_PointCoord, vec2(0.5)) > .4) discard;
  float c = (sin(gl_PointCoord.x * 3.141592) + sin(gl_PointCoord.y * 3.141592)) / 2.;
  vec3 s = mix(rimColor, vColor, c);
  //float alpha = -(0.1 * dist - 0.5)*(0.1 * dist - 0.5) + 1.;
  float alpha = 1. * 500. / (dist*dist);
    gl_FragColor = vec4(s, alpha);
}`;
export default particleFragmentShader;
