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
        const messagesCollection = client.db('Moon_Tech_Redux_Thunk').collection('JobBoxMessages');


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
            const ISOSPostedDateWhenJobApply = req.body.ISOSPostedDateWhenJobApply;
            const appliedJob = req.body.appliedJob;
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
                        appliedJob: appliedJob,
                        ISOSPostedDateWhenJobApply: ISOSPostedDateWhenJobApply
                    }
                },
                $set: { applyStatus: applyStatus, texts: [] }
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
                        id: new ObjectId(userId), //user er id
                        jobId: jobId, // job er id
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
            const jobId = req.body.jobId;
            const employerEmail = req.body.employerEmail;
            const question = req.body.question;
            console.log("Question: ", question);


            // console.log(reply);
            // console.log(userId); 
            // console.log(jobId); 

            // const filter = { "queries.id": new ObjectId(userId) };

            // const updateDoc = {
            //     $push: {
            //         "queries.$[user].reply": reply,
            //     },
            // };

            // const arrayFilter = {
            //     arrayFilters: [{ "user.id": new ObjectId(userId) }],
            // };












            //this is working perfectly. Employer can add reply to the specific questions and the replies are not added to all the questions
            const filter = { "queries.jobId": jobId, "queries.question": question };
            console.log("Filter Data", filter);

            const updateDoc = {
                $push: {
                    "queries.$.reply": reply
                }
            };
            const options = { upsert: true }



            const result = await jobsCollection.updateOne(
                filter,
                updateDoc,
                options
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
            // console.log("JobId:", jobId);
            // console.log("Job Status:", jobStatus);

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















        /////////////////////////////////////////////////////////
        //get the applied jobs data by email and filter the data by date
        app.get("/filter/:filterValue/:email", async (req, res) => {
            const filterValue = req.params.filterValue;
            const email = req.params.email;

            const data = {
                filterValue,
                email
            }
            console.log("Filter Data:", data);

            const query = { applicantDetails: { $elemMatch: { email: email } } };

            if (filterValue === 'filterByDate') {
                const cursor = jobsCollection.find(query).sort({ ISOSPostedDate: - 1 });
                const result = await cursor.toArray();
                res.send({ status: true, data: result });
            }

            if (filterValue === 'filterCancel') {
                const cursor = jobsCollection.find(query).sort({ ISOSPostedDate: 1 });
                const result = await cursor.toArray();
                res.send({ status: true, data: result });
            }
        });



        // ******************** Messaging by both employer and candidate Starts ****************** //
        app.patch("/messageByEmployer", async (req, res) => {

            const candidateFullName = req.body.candidateFullName;
            const candidateEmail = req.body.candidateEmail;
            const appliedJob = req.body.appliedJob;
            const employerFullName = req.body.employerFullName;
            const employerEmail = req.body.employerEmail;
            const candidateID = req.body.candidateID;
            const messageSentTime = req.body.messageSentTime;
            const jobId = req.body.jobId;
            const message = req.body.message;
            const userId = req.body.userId;

            // const employerID = req.body.employerID;  


            console.log("Candidate Full Name:", candidateFullName);
            console.log("Candidate Email:", candidateEmail);
            console.log("Job:", appliedJob);
            console.log("Employer Full Name:", employerFullName);
            console.log("Employer Email:", employerEmail);
            console.log("Candidate ID:", candidateID);
            console.log("Job ID:", jobId);
            console.log("Message:", message);
            console.log("User ID:", userId);


            const filter = { _id: new ObjectId(jobId) };
            const updateDoc = {
                $push: {
                    texts: {
                        userId: new ObjectId(userId), //user er id
                        jobId: jobId, // job er id
                        candidateFullName: candidateFullName,
                        candidateEmail: candidateEmail,
                        candidateID: candidateID,
                        appliedJob: appliedJob,
                        employerFullName: employerFullName,
                        employerEmail: employerEmail,
                        message: message,
                        messageSentTime: messageSentTime,
                        replyMessage: [],
                    },
                },
            };
            const result = await jobsCollection.updateOne(filter, updateDoc);
            if (result?.acknowledged) {
                return res.send(result);
            }
            res.send({ status: false });
        });


        
        
        //get all the messages send by an employee to a particular candidate fetched by candidate email
        // app.get("/employee/messages/:email", async (req, res) => {
        //     const email = req.params.email;
        //     const query = { texts: { $elemMatch: { candidateEmail: email } } };
        //     const cursor = jobsCollection.find(query).project({ texts: 1 });
        //     const result = await cursor.toArray();
        //     res.send(result);
        // });





        //get all the messages send by an employee to a particular candidate fetched by candidate email
        app.get("/employer/messages/:appliedJob/:email", async (req, res) => {
            const email = req.params.email;
            const appliedJob = req.params.appliedJob;
            const query = { texts: { $elemMatch: { candidateEmail: email, appliedJob: appliedJob } } };
            const result = await jobsCollection.find(query).project({ texts: 1 }).toArray();



            const filteredData = result.map(doc => doc.texts.filter(item => item.candidateEmail === email));
            console.log("Only The Main Data: ", filteredData);
            res.send(filteredData[0]);

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