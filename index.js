const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()
const port = process.env.PORT || 5000 ;
const cors = require('cors')

//firebase admin inetialization 
var admin = require("firebase-admin");
var serviceAccount = require("./management-app-21-firebase-adminsdk-ai3ju-fd6ffc5afa.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middle wire 
app.use(cors());
app.use(express.json())

// Mongo DB =====================================
// user: management-app
// pass: RRzWvfxIW6K5T097

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ez4m.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const serviceInit = require('./management-app-21-firebase-adminsdk-ai3ju-fd6ffc5afa.json')

async function verifyIdToken( req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split(' ')[1]
    try{
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.docodedEmail = decodedUser.email;
      console.log( 'decoded email 37', req.docodedEmail)
    }
    catch{
      // console.log( 'from verify id token catch');
    }
  }
  next()
}

async function run (){
  try{
    await client.connect();
    const database = client.db("managementApp");
    const customers = database.collection("customers");
    const usres = database.collection("users");

    //adding customers ==================================
    app.post("/usatomers", async (req, res) =>{
        const newCustomer = req.body;
        const result = await customers.insertOne(newCustomer);
        console.log( result )
        res.json(result);
    });

    //add user loged with gmail (upsert) ========================
    app.put("/users", async (req, res) =>{
      const newUser = req.body;
      const filter = { email: newUser.email } // 1, find a document by filtering with email to update
      const options = { upsert: true }; // 2, if no documents match the filter
      const updateDoc = { $set: newUser }; // 3,  create a document that is to update (update full user)
      const result = await usres.updateOne(filter, updateDoc, options);
      res.json( result );
    });

    app.get( '/users/:email', verifyIdToken, async( req, res) => {
      const email = req.params.email;
      console.log( 'decpded email', req.docodedEmail, 'params email', email)
      if( req.docodedEmail === email ){
        const quary = { email: email }
        const result = await usres.findOne(quary)
        res.json( result );
      }
      else{
        res.status(401).json({message: 'user not authorize'})
      }      
    });


    //add user loged with gmail (upsert) ========================
    // app.put("/users/admin", async (req, res) =>{
    //   const newUser = req.body;
    //   const filter = { email: newUser.email } // 1, find a document by filtering with email to update
    //   const options = { upsert: true }; // 2, if no documents match the filter
    //   const updateDoc = { $set: newUser }; // 3,  create a document that is to update (update a property of user)
    //   const result = await usres.updateOne(filter, updateDoc, options); 
    //   res.json( result );
    // });

    // add register user =======================================
    app.post("/users", async (req, res) =>{
      const newUser = req.body;
      const result = await usres.insertOne(newUser);
      res.json(result);
    })


  }
  finally{
    // await client.close();
  }
}
run().catch(console.dir);

// Mongo DB =======================================
app.get("/", (req, res) => {
    res.send("server srarted")
})
app.listen(port, () => {
    console.log("server running on: ", port)
})