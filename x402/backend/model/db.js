const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    try{
  await mongoose.connect('mongodb+srv://himanshujadhav341_db_user:dfmAw9eQutnFsULQ@cluster0.ahv0oqx.mongodb.net/?appName=Cluster0');
  console.log("connected")
    }
    catch(err){
        console.log(err);
    }

}


