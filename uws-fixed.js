const uWS = require('uWebSockets.js');
const { serveDir } = require('uwebsocket-serve');

const port = 3000;

const app = uWS.App();

app.get('/users/:id', async (res, req) => {
    res.end(`User: ${req.getParameter(0)}`);
});

const serveStatic = serveDir('.');

app.get('/*', serveStatic);

app.listen(port, (token) => {
    if (!token) {
        console.error('Failed to listen to port ' + port);
        process.exit(1)
    }
});
