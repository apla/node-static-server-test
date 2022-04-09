/* Simple demonstration of some router features */

const uWS = require('uWebSockets.js');
const port = 3000;

const app = uWS.App();

app.get('/users/:id', async (res, req) => {
    res.end(`User: ${req.getParameter(0)}`);
});

app.listen(port, (token) => {
    if (!token) {
        console.error('Failed to listen to port ' + port);
        process.exit(1)
    }
});
