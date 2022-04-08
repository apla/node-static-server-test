// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false });

// Declare a route
fastify.get('/users/:id', async (req, res) => {
    return `User: ${req.params.id}`;
});

fastify.listen(3000, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
});