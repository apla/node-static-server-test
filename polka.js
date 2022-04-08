const polka = require('polka');

const app = polka();

app.get('/users/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
});

app.listen(3000, () => {

});