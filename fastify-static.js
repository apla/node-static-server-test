// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false });
const path = require('path');

fastify.register(require('fastify-static'), {
    root: path.resolve('.'),
});

// Declare a route
fastify.get('/users/:id', async (req, res) => {
    return `User: ${req.params.id}`;
});

fastify.listen(3000, (err, address) => {
    if (err) {

        console.error(err);
        process.exit(1)
    }
});

