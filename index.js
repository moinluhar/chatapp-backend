require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express();
app.use(cors())
app.use(bodyParser.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    console.log({ name });
    console.log({ email });
    console.log({ password });

    try {
        const checkUser = await pool.query("SELECT * from user_details where email = $1", [email])
        if (checkUser.rows.length > 0) {
            return res.status(200).json({ message: "User already exists" })
        }
        const result = await pool.query(
            'INSERT INTO user_details(fullname, email, password) values($1, $2, $3) RETURNING *',
            [name, email, password]
        );
        console.log(result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log('Error inserting user: ', error);
        res.status(500).json({ error: 'An error occured while inserting user' });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log({ email });
    console.log({ password });
    try {
        const validateUser = await pool.query("SELECT * from user_details where email = $1 and password = $2", [email, password])
        if (validateUser.rows.length > 0) {
            return res.status(200).json({ message: "Login Successful" });
        }
        else {
            return res.status(401).json({ message: "Invalid email/password" });
        }
    }
    catch (error) {
        console.log('Error Log-in User: ', error);
        res.status(500).json({ error: 'An error occured while Log-in' });
    }
});

app.get("/users", async (req, res) => {
    try {
        const getUsers = await pool.query("SELECT id, fullname, email, created_date, last_updated FROM user_details");
        if (getUsers.rows.length == 0) {
            return res.status(200).json({ message: "No records found" })
        }
        else {
            return res.status(200).json(getUsers.rows);
        }
    }
    catch (error) {
        console.log('Error Fetching Users: ', error);
        res.status(500).json({ error: 'An error occured while Fetching Users' });
    }
})

app.get("/users/id/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10)
    try {
        const getUsers = await pool.query("SELECT id, fullname, email, created_date, last_updated FROM user_details where id=$1", [userId]);
        if (getUsers.rows.length == 0) {
            return res.status(200).json({ message: "No records found" })
        }
        else {
            return res.status(200).json(getUsers.rows[0]);
        }
    }
    catch (error) {
        console.log('Error Fetching User by Id: ', error);
        res.status(500).json({ error: 'An error occured while Fetching User by Id' });
    }
})

app.put("/users/id/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10)
    const { fullname, email } = req.body;
    console.log({ fullname });
    console.log({ email });

    try {
        const checkUser = await pool.query("SELECT * from user_details where id = $1", [userId])
        if (checkUser.rows.length == 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const result = await pool.query("UPDATE user_details SET fullname = $1, email = $2, last_updated = NOW() where id=$3 RETURNING *",
            [fullname, email, userId]
        );

        if (result.rows.length > 0) {
            console.log(result.rows[0]);
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.log('Error updating user: ', error);
        res.status(500).json({ error: 'An error occured while updating user' });
    }
})

app.delete("/users/id/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10)

    try {
        const checkUser = await pool.query("SELECT * from user_details where id = $1", [userId])
        if (checkUser.rows.length == 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await pool.query("DELETE FROM chat where user_id=$1", [userId]);
        const result = await pool.query("DELETE FROM user_details where id=$1 RETURNING *", [userId]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
        } else {
            console.log(result.rows[0]);
            res.status(200).json({ message: 'User deleted successfully', deletedUser: result.rows[0] });
        }
    } catch (error) {
        console.log('Error deleting user: ', error);
        res.status(500).json({ error: 'An error occured while deleting user' });
    }
})

app.get("/users/email/:email", async (req, res) => {
    const email = req.params.email
    try {
        const getUsers = await pool.query("SELECT id, fullname, email, created_date, last_updated FROM user_details where email=$1", [email]);
        if (getUsers.rows.length == 0) {
            return res.status(200).json({ message: "No records found" })
        }
        else {
            return res.status(200).json(getUsers.rows[0]);
        }
    }
    catch (error) {
        console.log('Error Fetching User by email: ', error);
        res.status(500).json({ error: 'An error occured while Fetching User by email' });
    }
})

app.post("/documents", async (req, res) => {
    const { user_id, filelabel, filename } = req.body;
    console.log({ user_id });
    console.log({ filelabel });
    console.log({ filename });
    try {
        const result = await pool.query("INSERT INTO documents(user_id, filelabel, filename) VALUES ($1, $2, $3) RETURNING *", [user_id, filelabel, filename]);

        console.log(result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log('Error updating document: ', error);
        res.status(500).json({ error: 'An error occured while updating document' });
    }
})

app.get("/documents", async (req, res) => {
    try {
        const getDocuments = await pool.query("SELECT * FROM documents");
        if (getDocuments.rows.length == 0) {
            return res.status(200).json({ message: "No records found" })
        }
        else {
            return res.status(200).json(getDocuments.rows);
        }
    }
    catch (error) {
        console.log('Error Fetching Documents: ', error);
        res.status(500).json({ error: 'An error occured while Fetching Documents' });
    }
})


app.get("/documents/id/:id", async (req, res) => {
    const documentId = parseInt(req.params.id, 10)

    try {
        const checkDocument = await pool.query("SELECT * from documents where id = $1", [documentId])
        if (checkDocument.rows.length > 0) {
            return res.status(200).json(checkDocument.rows[0])
        }
        else {
            return res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        console.log('Error fetching document: ', error);
        res.status(500).json({ error: 'An error occured while fetching document' });
    }
})

app.delete("/documents/id/:id", async (req, res) => {
    const documentId = parseInt(req.params.id, 10)

    try {
        const checkDocument = await pool.query("SELECT * from documents where id = $1", [documentId])
        if (checkDocument.rows.length == 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const result = await pool.query("DELETE FROM documents where id=$1 RETURNING *", [documentId]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Document not found' });
        } else {
            console.log(result.rows[0]);
            res.status(200).json({ message: 'Document deleted successfully', deletedDocument: result.rows[0] });
        }
    } catch (error) {
        console.log('Error deleting document: ', error);
        res.status(500).json({ error: 'An error occured while deleting document' });
    }
})

app.put("/documents/id/:id", async (req, res) => {
    const documentId = parseInt(req.params.id, 10);
    const { filelabel } = req.body;
    console.log({ filelabel });
    try {
        const checkDocument = await pool.query("SELECT * from documents where id = $1", [documentId])
        if (checkDocument.rows.length == 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const result = await pool.query("UPDATE documents SET filelabel = $1, timestamp = now() where id=$2 RETURNING *", [filelabel, documentId]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Document not found' });
        } else {
            console.log(result.rows[0]);
            res.status(200).json({ message: 'Document updated successfully', updateDocument: result.rows[0] });
        }
    } catch (error) {
        console.log('Error updating document: ', error);
        res.status(500).json({ error: 'An error occured while updating document' });
    }
})


app.post("/chat/sendmessage", async (req, res) => {
    const { user_id, message } = req.body;
    try {
        const checkUser = await pool.query("SELECT * from user_details where id = $1", [user_id])
        if (checkUser.rows.length == 0) {
            return res.status(200).json({ message: "User does not exists" })
        }
        const addMessage = await pool.query("INSERT INTO chat(user_id, message) values($1, $2) RETURNING *",
            [user_id, message]);

        console.log(addMessage.rows[0]);
        res.status(201).json(addMessage.rows[0]);

    } catch (error) {
        console.log('Error adding message: ', error);
        res.status(500).json({ error: 'An error occured while adding message' });
    }
})


app.get("/chat/allmessages", async (req, res) => {

    try {
        const getMessages = await pool.query("SELECT chat.id as chat_id, fullname, user_id, chat.message, email, TO_CHAR(chat.timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp FROM chat inner join user_details on chat.user_id = user_details.id order by chat.timestamp asc limit 200");
        if (getMessages.rows.length == 0) {
            return res.status(200).json({ message: "No chat found" })
        }
        else {
            return res.status(200).json(getMessages.rows);
        }
    }
    catch (error) {
        console.log('Error Fetching Users: ', error);
        res.status(500).json({ error: 'An error occured while Fetching Users' });
    }
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});