import mongoose from "mongoose"



export const connectDb = () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "AbhiEcom"
    }).then((c) => {
        console.log(`Database is connected ${c.connection.host}`);
    }).catch((err) => {
        console.log(err);
    })
}