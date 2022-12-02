const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5500;
require('dotenv').config();
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c8rri4v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access jwt' });
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const productsCollection = client.db('sellPhone').collection('products');
        const usersCollection = client.db('sellPhone').collection('users');
        const ordersCollection = client.db('sellPhone').collection('orders');
        const paymentsCollection = client.db('sellPhone').collection('payments')

        const verifyAdmin = async (req, res, next) => {
            // console.log('inside verifyAdmin: ', req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access koresi' });
            }
            next();
        }

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

        app.post('/products', async (req, res) => {
            const user = req.body;
            const result = await productsCollection.insertOne(user);
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });


        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            // console.log('token = ', req.headers.authorization);

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await ordersCollection.findOne(query);
            res.send(booking);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log(order);
            const result = await ordersCollection.insertOne(order);
            res.send(result,)
        });

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10hr' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: 'Empty Token' })
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const users = await usersCollection.findOne(query);
            res.send(users);
        })

        //update user
        app.patch('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: 'true'
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
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


// https://resale-market-server-nayem-mursalin.vercel.app/
// https://sell-phone-eb036.web.app/
