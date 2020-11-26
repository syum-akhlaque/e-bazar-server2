const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('productPic'));
app.use(fileUpload());

const port = 5000;
require('dotenv').config();
const dbName =  process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const uri = `mongodb+srv://${username}:${password}@cluster0.plwup.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db(dbName).collection("products");
  const ordersCollection = client.db(dbName).collection("orders");
  const promoCodesCollection = client.db(dbName).collection("promoCodes");
  

  app.post('/addProducts', (req, res) => { //-----------------to add new product----------------------------
    const file = req.files.file;
    const name = req.body.name;
    const price = req.body.price;
    const discount = req.body.discount;
    const shippingCharge = req.body.shippingCharge;
    const color = req.body.color;
    const size = req.body.size;
    const activeStatus = req.body.activeStatus;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    productCollection.insertOne({ name, price, discount, shippingCharge, color, size, activeStatus,image  })
        .then(result => {
            res.send(result.insertedCount > 0);
        })
  })

  
 app.get('/allProducts', (req, res)=>{    //-----------to get all all product for shop page----------------------------
  productCollection.find()
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })
  
  app.get('/allOrders', (req, res)=>{    //-----------to get all order, shown in dashboard order----------------------------
    ordersCollection.find()
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })

  app.get('/orderByStatus', (req, res)=>{    //-----------to get order list by status ----------------------------
    const status = req.query.status;
    console.log(status)
    ordersCollection.find({status: {$regex: status }})
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })

  app.patch('/updateStatus', (req,res)=>{    //----------- update order stsatus------------------------------
    ordersCollection.updateOne(
      {_id: ObjectId(req.body.id)}, //filter
      { 
        $set: { status: req.body.status } //update
      }
    )
    .then(result => {   //option   
      res.send(result.modifiedCount> 0)
    })
  })

  app.patch('/updatePromoCodes', (req,res)=>{    //----------- update Promo codes------------------------------
    promoCodesCollection.updateOne(
      {_id: ObjectId(req.body.id)}, //filter
      { 
        $set: { activeStatus: req.body.activeStatus, endDate: req.body.endDate, useTime: req.body.useTime} //update 
      }
    )
    .then(result => {   //option   
      res.send(result.modifiedCount> 0)
    })
  })

  app.post('/addNewOrder', (req, res)=>{ //add new order
    const order = req.body;
    ordersCollection.insertOne(order)
    .then(result =>{
        res.send(result.insertedCount)
    })
})

app.post('/addPromoCodes', (req, res)=>{ //add new order
  const promoCodes = req.body;
  promoCodesCollection.insertOne(promoCodes)
  .then(result =>{
      res.send(result.insertedCount)
  })
})

app.get('/getPromocodes', (req, res)=>{    //-----------to get all promocode list, applied in car page on order summary----------------------------
  promoCodesCollection.find()
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })

});

app.listen(process.env.PORT || port) 
