const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//aita middleware er jonne
app.use(cors({
  origin: ['http://localhost:5173'], 
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.80mhkmu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares for token
const logger = (req, res, next) => {
  console.log('log info', req.method, req.url);
  next();
}
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
// no token available
if(!token){
  return res.status(401).send({message: 'Unauthorized access'})
}

jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
  if(err){
    return res.status(401).send({message: 'Unauthorized access'})
  }
req.user = decoded;
next();


})
  

}



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

// new database for ass 11 hotel management start////

const roomCollection = client.db('hotelUser').collection('rooms');
const bookingCollection = client.db('hotelUser').collection('bookings');

// auth related api
app.post('/jwt', async(req, res) =>{
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
  res
  .cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })
  .send({success: true})
})

//user log out
app.post('/logout', async(req, res) => {
  const user = req.body;
  console.log('logging out', user);
  res.clearCookie('token', {maxAge: 0}).send({success: true})
})




app.get('/rooms', async(req, res) =>{
  const cursor = roomCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})

app.get('/rooms/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}

  const result = await roomCollection.findOne(query);
  res.send(result);
})


// bookings
app.post('/bookings', async (req, res) => {
  const booking = req.body;
  console.log(booking);
  const result = await bookingCollection.insertOne(booking);
  res.send(result);

});

//  update availablity
app.put('/rooms/:id', async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const options = { upsert: true};

  const updatedProduct = req.body;
  const currentRoom = updatedProduct.currentRoom;
  const product = {
      $set: {
        availability: currentRoom, 
        
      }
  }
    const result = await roomCollection.updateOne(filter, product, options)
    res.send(result);
})

// specific booking by email 
app.get('/bookings', logger, verifyToken, async(req, res) =>{
  console.log(req.query.email);
  console.log('token owner info:', req.user);
  if(req.user.email !== req.query.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  let query = {};
  if(req.query?.email){
    query = {email: req.query.email}
  }
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
})

// update a booking
// app.patch('/bookings/:id', async(req, res) => {
//   const id = req.params.id;
//   const filter = {_id: new ObjectId(id)};
//   const updatedBooking = req.body;
//  console.log(updatedBooking);

// const updateDoc = {
//   $set: {
//     status: updatedBooking.status
//   }
// }

// })

// getting booking data by id for update page
app.get('/bookings/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}

  const result = await bookingCollection.findOne(query);
  res.send(result);
})

// send update information to the data base
app.put('/bookings/:id', async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const options = { upsert: true};

  const updatedBookingInfo = req.body;
  console.log(updatedBookingInfo);
const updated = {
  $set: {
    customerName: updatedBookingInfo.customerName,
    email: updatedBookingInfo.email,
    phone: updatedBookingInfo.phone,
    roomName: updatedBookingInfo.roomName,
    price: updatedBookingInfo.price,
    checkInDate: updatedBookingInfo.checkInDate,
    checkOutDate: updatedBookingInfo.checkOutDate,
    orderStatus: updatedBookingInfo.orderStatus,
  }
}
  const result = await bookingCollection.updateOne(filter, updated, options);
  res.send(result);
})

// add new review

app.post('/rooms/:id', async (req, res) => {
  const { id } = req.params;
  const { username, rating, comment } = req.body;
  const timestamp = new Date();
console.log(req.body);
console.log(id);
  try {
    const filter = {_id: new ObjectId(id)}
    const options = { upsert: true};
    // const filter = { _id: id };
    const update = {
      $push: {
        reviews: {
          name: username,
          comment: comment,
          rating: rating,
          timestamp: timestamp
        }
      }
    };

    const result = await roomCollection.updateOne(filter, update, options);
    res.send(result);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).send("Server error");
  }
});



// delete my bookings room

app.delete('/bookings/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
})



// new database for ass 11 hotel management end////


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
  console.log(updatedProduct);
  console.log(updatedProduct.name);
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