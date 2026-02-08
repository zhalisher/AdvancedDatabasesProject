require('dotenv').config()

const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

let userCollection
let movieCollection
let tvCollection
let likeCollection

async function connectDB() {
    await client.connect()
    const db = client.db('CinemaLibrary')

    userCollection = db.collection('users')
    movieCollection = db.collection('movies')
    tvCollection = db.collection('tv-series')
    likeCollection = db.collection('liked')
    

    await likeCollection.createIndex(
        { userId: 1, itemId: 1 },
        { unique: true }
    )
    console.log('DB connected')
}


function getUsersCollection(){
    return userCollection
}
function getMoviesCollection(){ 
    return movieCollection 
}
function getTvCollection(){ 
    return tvCollection 
}
function getLikedCollection(){
    return likeCollection
}
module.exports = {
    connectDB,
    getUsersCollection,
    getMoviesCollection,
    getTvCollection,
    getLikedCollection
}