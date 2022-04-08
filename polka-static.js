const polka = require('polka');

const serve = require('serve-static')('.');
const app = polka();

app.use(serve);

app.get('/users/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
});

app.listen(3000, () => {

});