// Generated from basic.mino
// Test Mino compile



// declare html fragments as variables!
const view = () => `<div class="greet">Welcome to mino!</div>`;

// declare css styles as variables!
const greetingStyle = () => `.greet { color: blue; }`;

// dynamically interpolate values!
const greeting = (greetingStyle, message) => `<style>${greetingStyle()}</style>
  <p class="greet">${message}</p>`;

const exampleGreeting = greeting("Hello, world!")

const pageStyles = () => `main {
    width: 100%;
    min-height: 100vh;
  }`;

const styleshet = (pageStyles, greetingStyles) => `${pageStyles()}
  ${greetingStyles()}`;

const container = (styleshet, content) => `<style>${styleshet()}</style>
  <main>${content}</main>`;

function render() {
  return container(
    greeting(message)
  )
}

/**
 * @param example 
 */
const myVar = 123;

export { view, styles, greet };

