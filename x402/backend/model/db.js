const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    try{
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://himanshujadhav341_db_user:dfmAw9eQutnFsULQ@cluster0.ahv0oqx.mongodb.net/?appName=Cluster0';
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected")
    }
    catch(err){
        console.log("MongoDB connection error:", err);
    }

}


