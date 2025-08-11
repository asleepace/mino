// Generated from demo.jsxm





const pageTitle = "JSXM"

export const styleSheet = `:root {
        display: flex;
        background-color: red;
    }
    * {
        border-sizing: box;
        padding: 0;
        margin: 0;
    }
    html, 
    body {
        width: 100%;
        min-height: 100vh;
    }
    main {
        margin: 0 auto;
        max-width: 768px;
    }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1; }`;

export const documentHead = `<head>
        <meta charset="UTF-8">
        <title>${page_title}</title>
        <style>${style_sheet}</style>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Brief description of your page">
        <meta name="keywords" content="keyword1, keyword2, keyword3">
        <meta name="author" content="Your Name">
    </head>`;

export const documentBody = (children) => `<main class="flex flex-col flex-1">
        ${children}
    </main>`;

const template = @html(children) (
    <html>
        <head>{documentHead}</head>
        <body>{children}</body>
    </html>
)

export { template }