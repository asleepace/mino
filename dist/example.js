// Generated from Example.mino
class Example extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Compiled styles will go here */
            </style>
            <div>
                <!-- Compiled template will go here -->
                <p>Generated Example component</p>
            </div>
        `;
    }
}

customElements.define('example', Example);
export default Example;
