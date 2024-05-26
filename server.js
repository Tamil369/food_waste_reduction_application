const express = require('express');
const mysql = require('mysql');
// const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path'); // Import the 'path' module


const app = express();
const port = 3000;




const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12706859',
  password: 'sElwkdMRic',
  database: 'sql12706859',
  port: 3306
});



db.connect((err) => {
  if (err) 
    {
        console.log("Error in connecting a database......")
        throw err;
    }
  console.log('Connected to database');
    
});

// db.query('SELECT * FROM Profile', (err, results) => {
//     if (err) {
//       console.error('Database query error:', err);
//       return;
//     }
//     console.log('Query results:', results);
//     // Process results here
//   });
  
//let query = 'SELECT * FROM Profile ';
    //   db.query(query, (error, results) => {
    //     if (error) {
    //         console.log('Error executing query:', error);
    //         return res.status(500).json({ error: 'Database query failed' });
    //     }
    //     console.log(results);
    // });



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check session for /choose-food route
//app.use('/choose-food', checkSession);


// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signout route (POST method)
app.post('/signout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log("session is destoryed");
        return res.status(500).send('Failed to sign out.');
      }
      res.send('Successfully signed out.');
    });
});
  

app.post('/check-absent', (req, res) => {
    if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    try{
    const meal = req.body.meal;
    let query;

    switch (meal) {
        case 'lunch':
            query = 'SELECT name, phone, year, dept FROM Profile WHERE lunch = 0';
            break;
        case 'dinner':
            query = 'SELECT name, phone, year, dept FROM Profile WHERE dinner = 0';
            break;
        case 'both':
            query = 'SELECT name, phone, year, dept FROM Profile WHERE lunch = 0 AND dinner = 0';
            break;
        default:
            return res.status(400).json({ error: 'Invalid meal type' });
    }

    // Assuming you have a database connection object named db
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
    }catch(error)
    {

    }
});


// Sign-up endpoint
app.post('/signup', (req, res) => {
    try {
        const { email, name, regNo, year, department, password, phone } = req.body;
        const checkQuery = 'SELECT * FROM Profile WHERE user_id = ?';

        db.query(checkQuery, [email], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                console.log("Email is already used");
                return res.status(200).json({ message: 'Email is already used', redirect: '/login.html' });
            }

            const insertQuery = 'INSERT INTO Profile (user_id, name, reg_no, year, dept, password, phone, admin) VALUES (?, ?, ?, ?, ?, ?, ?, 0)';
            db.query(insertQuery, [email, name, regNo, year, department, password, phone], (err, results) => {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.status(500).send('Server error');
                }
                console.log('User is added');
                return res.status(200).json({ message: 'User is added', redirect: '/login.html' });
            });
        });
    } catch (error) {
        console.error('Error in signup route:', error);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Endpoint to get profile data
app.post('/profile', (req, res) => {
    if (!req.session.user || !req.session.user.username) {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
    }

    const id = req.session.user.username;

    // Query to fetch profile data
    const query = `SELECT * FROM Profile WHERE user_id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        if (results.length > 0) {
            const profileData = results[0];
            res.json(profileData);
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    });
});



// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT admin FROM Profile WHERE user_id = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Server error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            console.log('Invalid username or password');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const admin = results[0].admin;
        req.session.user = { username, admin };
        console.log("user_id is added to session successfully");
        console.log(req.session.user.username);

        if (admin === 1) {
            res.json({ redirect: '/admine-main.html' });
        } else {
            res.json({ redirect: '/choosing-food.html' });
        }
    });
});


// Choose food endpoint
app.post('/choose-food', (req, res) => {
    try{
    if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }

    const email = req.session.user.username;
    console.log("email is retrived from session");
    const { lunch, dinner } = req.body;

    const updateQuery = 'UPDATE Profile SET lunch = ?, dinner = ? WHERE user_id = ?';
    db.query(updateQuery, [lunch, dinner, email], (err, results) => {
        if (err) {
            console.error('Error updating food preferences:', err);
            return res.status(500).send('Server error');
        }
        console.log('user is upadated successfully to ',email);
        res.json({ message: 'Food preferences updated' });
    });
    }catch (error) {
        console.error('Error in choose-food route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Make admin endpoint
app.post('/make-admin', (req, res) => {
    try{
        if (!req.session.user.username) {
                return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
                // Redirect to login page if not logged in
            }
            const email = req.body.email;

            // Check if the user exists
            const checkUserQuery = 'SELECT * FROM Profile WHERE user_id = ?';
            db.query(checkUserQuery, [email], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Server error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // User exists, make the user an admin
                const makeAdminQuery = 'UPDATE Profile SET admin = 1 WHERE user_id = ?';
                db.query(makeAdminQuery, [email], (err, updateResults) => {
                    if (err) {
                        return res.status(500).json({ message: 'Server error' });
                    }
                    res.json({ message: 'User has been made an admin successfully' });
                });
            });
    }catch (error) {
            console.error('Error in choose-food route:', error);
            res.status(500).send('Internal Server Error');
        }
    
});


// Admin-main page endpoint
app.get('/admin-main-data', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    const query = 'SELECT SUM(lunch) as totalLunch, SUM(dinner) as totalDinner, COUNT(*) as totalRows FROM Profile';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Server error');
        }

        res.json(results[0]);
    });
    }catch (error) {
            console.error('Error in choose-food route:', error);
            res.status(500).send('Internal Server Error');
        }
    
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
