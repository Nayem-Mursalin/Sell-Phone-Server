const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5500;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c8rri4v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const productsCollection = client.db('sellPhone').collection('products');
        const usersCollection = client.db('sellPhone').collection('users');

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

    }
    finally {

    }
} run().catch(error => console.error(error));


app.get('/', async (req, res) => {
    res.send('My Server is Running ')
})

app.listen(port, () => {
    console.log(`My Server running on Server : ${port}`)
})


//https://resale-market-server-mu.vercel.app