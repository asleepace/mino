// Generated from example.mino
// Test Mino compile
const someString = "Hello world!"
const view = (someString) => `<div class="greet">${someString}</div>`;

const styles = () => `.greet { color: red; }`;

function greet(name) {
  return view(`${name}`);
}

export { view, styles, greet };

