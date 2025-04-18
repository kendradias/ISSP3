const express = require('express');
const bodyParser = require('body-parser');
const router = require('./src/routes/webhookRoutes');


require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true}));


app.use("/", router);

app.listen(PORT, ()=>{
    console.log(`server is running on port http://localhost:${PORT}`);
})