const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
dotenv.config()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gsdz7i1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" })
  }
  const token = authorization.split(" ")[1]
  jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: true, message: "unauthorize access" })
    }
    req.decoded = decoded
    next()
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const servicesCollection = client.db("car-doctor").collection("services");
    const bookingsCollection = client.db("car-doctor").collection("bookings");

    app.post("/jwt", (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '7d' })
      res.send({ token })
    })

    app.get('/services', async (req, res) => {
      const services = await servicesCollection.find().toArray();
      res.send(services)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { title: 1, img: 1, price: 1 }
      }
      const service = await servicesCollection.findOne(query, options);
      res.send(service)
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingsCollection.deleteOne(query);
      res.send(result)
    })

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const updateDoc = req.body
      const filter = { _id: new ObjectId(id) }
      const doc = {
        $set: {
          status: updateDoc.status
        }
      }
      const result = await bookingsCollection.updateOne(filter, doc);
      res.send(result)
    })

    app.get('/bookings', verifyJWT, async (req, res) => {

      let query = {}
      if (req?.decoded?.email) {
        query = { email: req.decoded.email }
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/bookings', async (req, res) => {
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('server is running')
})
app.listen(port, () => {
  console.log("server is running on port:- " + port)
})

