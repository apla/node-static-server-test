const express = require('express');

const app = express();

app.use(express.static('.'));

app.get('/users/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
});

app.listen(3000, () => {
    
});