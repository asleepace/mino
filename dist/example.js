// Generated from example.mino
// Test Mino compile

// declare html fragments as variables!
export const view = `<div class="greet">Welcome to mino!</div>`;

// declare css styles as variables!
export const greetingStyle = `.greet { color: blue; }`;

// dynamically interpolate values!

export const test1 = `<p>${id}</p>`;

export const greeting = (message) => `<style>${greetingStyle()}</style>
  <p class="greet">${message}</p>`;

const exampleGreeting = greeting("Hello, world!")

export const pageStyles = `main {
    width: 100%;
    min-height: 100vh;
  }`;

export const styleshet = `${pageStyles()}
  ${greetingStyles()}`;

export const container = `<style>${styleshet()}</style>
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

