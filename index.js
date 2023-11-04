const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//aita middleware er jonne
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.80mhkmu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    



//     const database = client.db("usersDB");
//     const userCollection = database.collection("users");

// app.get('/users', async(req, res) => {
//     const cursor = userCollection.find();
//     const result = await cursor.toArray();
//     res.send(result);
// })


//     app.post('/users', async(req, res) =>{
//         const user = req.body;
//         console.log('new user', user);
//         const result = await userCollection.insertOne(user);
//         res.send(result);
// });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


const productCollection = client.db("productsDB").collection("product");

    
    app.get('/product', async(req, res) =>{
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

app.get('/product/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await productCollection.findOne(query);
  res.send(result);
})



    app.post('/product', async(req, res) =>{
      const newProduct = req.body;
      console.log(newProduct);
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    })

app.put('/product/:id', async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const options = { upsert: true};

  const updatedProduct = req.body;
  const product = {
      $set: {
        name: updatedProduct.name, 
        brand: updatedProduct.brand, 
        price: updatedProduct.price,
        rating: updatedProduct.rating, 
        option: updatedProduct.option,
        description: updatedProduct.description, 
        image: updatedProduct.image
      }
  }
    const result = await productCollection.updateOne(filter, product, options)
    res.send(result);
})


app.get('/', (req, res) =>{
    res.send('SIMPLE CRUD IS RUNNING')
})

app.listen(port, () => {
    console.log(`SIMPLE CRUD iS running on port, ${port}`)
})