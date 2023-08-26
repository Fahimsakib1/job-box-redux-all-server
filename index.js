const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//set up middle wares
app.use(express.json());
app.use(cors({ origin: true }));

//require dotenv
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.c2bp6su.mongodb.net/?retryWrites=true&w=majority`;
console.log("Mongo set up For Job Box Using Redux: ", uri);





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
        const usersCollection = client.db('Moon_Tech_Redux_Thunk').collection('JobBoxUsers');
        const jobsCollection = client.db('Moon_Tech_Redux_Thunk').collection('JobBoxJobs');


        app.post("/user", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            if (result?.email) {
                return res.send({ status: true, data: result });
            }
            res.send({ status: false });
        });

        app.patch("/apply", async (req, res) => {
            const userId = req.body.userId; //sign up korar por userId
            const jobId = req.body.jobId; //job er Id
            const email = req.body.email; //sign up korar por user email
            const address = req.body.address;
            const city = req.body.city;
            const country = req.body.country;
            const firstName = req.body.firstName;
            const lastName = req.body.lastName;
            const gender = req.body.gender;
            const jobAppliedTime = req.body.jobAppliedTime;
            const ISOSPostedDateWhenJobApply = req.body.ISOSPostedDateWhenJob

            const applyStatus = req.body.applyStatus;

            const filter = { _id: new ObjectId(jobId) };
            const updateDoc = {
                $push: {
                    applicantDetails: {
                        id: new ObjectId(userId),
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        address: address,
                        city: city,
                        country: country,
                        gender: gender,
                        jobAppliedTime: jobAppliedTime,
                        ISOSPostedDateWhenJobApply: ISOSPostedDateWhenJobApply
                    }
                },
                $set: { applyStatus: applyStatus }
            };
            const result = await jobsCollection.updateOne(filter, updateDoc);
            if (result.acknowledged) {
                return res.send({ status: true, data: result });
            }
            res.send({ status: false });
        });

        app.patch("/query", async (req, res) => {
            const userId = req.body.userId;
            const jobId = req.body.jobId;
            const email = req.body.email;
            const question = req.body.question;

            const filter = { _id: new ObjectId(jobId) };

            const updateDoc = {
                $push: {
                    queries: {
                        id: new ObjectId(userId),
                        email: email,
                        question: question,
                        reply: [],
                    },
                },
            };
            const result = await jobsCollection.updateOne(filter, updateDoc);
            if (result?.acknowledged) {
                return res.send({ status: true, data: result });
            }
            res.send({ status: false });
        });

        app.patch("/reply", async (req, res) => {
            const userId = req.body.userId;
            const reply = req.body.reply;
            console.log(reply);
            console.log(userId);

            const filter = { "queries.id": new ObjectId(userId) };

            const updateDoc = {
                $push: {
                    "queries.$[user].reply": reply,
                },
            };
            const arrayFilter = {
                arrayFilters: [{ "user.id": new ObjectId(userId) }],
            };
            const result = await jobsCollection.updateOne(
                filter,
                updateDoc,
                arrayFilter
            );
            if (result.acknowledged) {
                return res.send({ status: true, data: result });
            }
            res.send({ status: false });
        });

        

        app.get("/applied-jobs/:email", async (req, res) => {
            const email = req.params.email;
            const query = { applicantDetails: { $elemMatch: { email: email } } };
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            console.log("Result:", result);
            res.send({ status: true, data: result });
        });


        //get the applied jobs data by email and soft the data by date
        app.get("/filter/appliedJobs//:email", async (req, res) => {
            const email = req.params.email;
            const query = { applicantDetails: { $elemMatch: { email: email } } };
            const cursor = jobsCollection.find(query).sort({ ISOSPostedDate: 1 });
            const result = await cursor.toArray();
            console.log("Result:", result);
            res.send({ status: true, data: result });
        });


        //get the applied jobs data by email and soft the data by date
        app.get("/noFilter/appliedJobs//:email", async (req, res) => {
            const email = req.params.email;
            const query = { applicantDetails: { $elemMatch: { email: email } } };
            const cursor = jobsCollection.find(query).sort({ ISOSPostedDate: -1 });
            const result = await cursor.toArray();
            console.log("Result:", result);
            res.send({ status: true, data: result });
        });

        app.get("/jobs", async (req, res) => {
            const cursor = jobsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/job/:id", async (req, res) => {
            const id = req.params.id;
            const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.post("/job", async (req, res) => {
            const job = req.body;
            const result = await jobsCollection.insertOne(job);
            res.send({ status: true, data: result });
        });

        //toggle the job status between open and close
        app.patch("/toggleJobStatus", async (req, res) => {
            const jobId = req.body.jobId; //job er Id
            const jobStatus = req.body.jobStatus;
            console.log("JobId:", jobId);
            console.log("Job Status:", jobStatus);

            const filter = { _id: new ObjectId(jobId) };

            const updateDoc = {
                $set: { jobStatus: !jobStatus }
            };
            const result = await jobsCollection.updateOne(filter, updateDoc);
            if (result.acknowledged) {
                return res.send({ status: true, data: result });
            }
            res.send({ status: false });
        });


    }
    finally {

    }
}

run().catch(error => console.log(error))

app.get("/", (req, res) => {
    res.send("Job Box Redux All Server!");
});

app.listen(port, () => {
    console.log(`Job Box Redux All Server Running on port ${port}`);
});