const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5500;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.send('My Server is Running ')
})

app.listen(port, () => {
    console.log(`My Server running on Server : ${port}`)
})