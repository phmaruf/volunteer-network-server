const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdtun.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()

var serviceAccount = require("./configs/volunteer-network-mrf-firebase-adminsdk-cwvsq-08ae65211d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

app.use(bodyParser.json());
app.use(cors());

const port = 5000;

app.get('/', (req, res) =>{
  res.send('It is working')
})

const client = new MongoClient(uri, { useNewUrlParser: true,  useUnifiedTopology: true });
client.connect(err => {
  const tasks = client.db("volunteerNetwork").collection("tasks");

  app.post('/addTask', (req, res) => {
    const newTask = req.body;
    tasks.insertOne(newTask)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
    console.log(newTask);
  })

  app.get('/tasks', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      
      admin.auth().verifyIdToken(idToken)
      .then(function(decodedToken) {
        const tokenEmail = decodedToken.email;
        const queryEmail = req.query.email;
        if(tokenEmail == queryEmail){
          tasks.find({email: queryEmail})
          .toArray((err, documents) => {
            res.status(200).send(documents);
          })
        }
        else{
          res.status(401).send('unauthorized access')
        }
      }).catch(function(error) {
        res.status(401).send('unauthorized access')
      });
    }
    else{
      res.status(401).send('unauthorized access')
    }
      
  
  }) 
});


app.listen(process.env.PORT || port);