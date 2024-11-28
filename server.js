const express = require('express');
const mysql = require('mysql');
// const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path'); // Import the 'path' module
const nodemailer = require('nodemailer');

const app = express();
const port = 3011;

const cron = require('node-cron');
const { console } = require('inspector');

// Schedule a task to run every day at 2am
cron.schedule('37 17 * * *', () => {
  console.log('hello everyone');
});

cron.schedule('*/3 * * * *', () => {
    console.log('Cron job running, but printing nothing.');
    // You can perform tasks here, if needed
});

console.log('Cron job is set up to upload data every day at 11:58 .');




// const db = mysql.createConnection({
//   host: 'sql12.freesqldatabase.com',
//   user: 'sql12706859',
//   password: 'sElwkdMRic',
//   database: 'sql12706859',
//   port: 3306
// });



// db.connect((err) => {
//   if (err) 
//     {
//         console.log("Error in connecting a database......")
//         throw err;
//     }
//   console.log('Connected to database');
    
// });


let db;

function handleDisconnect() {
//   db = mysql.createConnection({
//     host: 'sql12.freesqldatabase.com',
//     user: 'sql12706859',
//     password: 'sElwkdMRic',
//     database: 'sql12706859',
//     port: 3306
//   });

  db = mysql.createPool({
    connectionLimit: 1000,
    host: 'sql12.freesqldatabase.com',
    user: 'sql12706859',
    password: 'sElwkdMRic',
    database: 'sql12706859',
    port: 3306
  });
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to database');
    connection.release();
  });

//   db.connect((err) => {
//     if (err) {
//       console.log('Error connecting to database:', err);
//       setTimeout(handleDisconnect, 2000); // retry after 2 seconds
//     } else {
//       console.log('Connected to database');
//     }
//   });

//   db.on('error', (err) => {
//     console.log('Database error', err);
//     if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
//       handleDisconnect();
//     } else {
//       throw err;
//     }
//   });
}

handleDisconnect();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: 'gcedpihelpdesk@gcedpi.edu.in', // Replace with your email
      pass: 'yvuz gako esug eyjl', // Replace with your email password or app-specific password
    },
  });





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
  

// Forgot Password Route
app.post('/forgot', (req, res) => {
    const { email } = req.body;
  
    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
  
    // Query database for the email
    db.query('SELECT * FROM Profile WHERE user_id = ?', [email], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'An error occurred, please try again later' });
      }
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
  
      const user = rows[0];
      const { password } = user;
  
      // Generate a reset token (optional)
      
      const resetLink = `https://food-waste-reduction-application.onrender.com/reset.html`;
  
      // Configure email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'gcedpihelpdesk@gcedpi.edu.in',
          pass: 'tgcp myhe heuu thxq' // Make sure to replace with actual password
        }
      });
  
      // Send password recovery email
      const mailOptions = {
        from: 'gcedpihelpdesk@gcedpi.edu.in',
        to: email,
        subject: 'Password Recovery',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden; }
              .email-header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }
              .email-body { padding: 20px; color: #333333; line-height: 1.6; }
              .email-footer { text-align: center; font-size: 12px; color: #666666; padding: 10px; border-top: 1px solid #dddddd; background-color: #f4f4f4; }
              .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-size: 16px; }
              .btn:hover { background-color: #0056b3; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="email-header">Password Recovery Assistance</div>
              <div class="email-body">
                <p>Dear User,</p>
                <p>We received a request to recover your account password. Below is your current password:</p>
                <p style="font-size: 18px; font-weight: bold; color: #007bff;">${password}</p>
                <p>For your security, we recommend changing your password after logging in.</p>
                <p>If you wish to reset your password, click the button below:</p>
                <a href="${resetLink}" class="btn">Reset Your Password</a>
                <p>If you did not request this, please ignore this email or contact support for assistance.</p>
                <p>Thank you,<br>The GCEDPI Helpdesk Team</p>
              </div>
              <div class="email-footer">
                &copy; ${new Date().getFullYear()} GCEDPI. All Rights Reserved.<br>
                <a href="mailto:gcedpihelpdesk@gcedpi.edu.in" style="color: #007bff; text-decoration: none;">Contact Support</a>
              </div>
            </div>
          </body>
          </html>
        `
      };
  
      // Send email with callback
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email. Please try again later' });
        }
  
        // Successfully sent email
        res.json({ message: 'Password and reset link sent to your email' });
      });
    });
  });
  

  app.post('/reset', (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
  
    // Check if the email exists in the database
    db.query('SELECT * FROM Profile WHERE user_id = ?', [email], (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'An error occurred, please try again later' });
      }
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
  
      const user = rows[0];
  
      // Compare the current password directly
      if (user.password !== currentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
  
      // Update the password in the database
      db.query('UPDATE Profile SET password = ? WHERE user_id = ?', [newPassword, email], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'An error occurred, please try again later' });
        }
  
        res.json({ message: 'Password successfully updated!' });
      });
    });
  });
  
  

app.post('/check-absent', (req, res) => {
    if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    try
    {
        const meal = req.body.meal;
        let query;
    
        switch (meal) {
            case 'breakfast':
                query = `
                    SELECT name, phone, year, gender, dept, bfreason AS reason
                    FROM Profile
                    WHERE abf = 0
                `;
                break;
            case 'lunch':
                query = `
                    SELECT name, phone, year, gender, dept, lreason AS reason
                    FROM Profile
                    WHERE al = 0
                `;
                break;
            case 'dinner':
                query = `
                    SELECT name, phone, year, gender, dept, dreason AS reason
                    FROM Profile
                    WHERE ad = 0
                `;
                break;
            case 'breakfast_and_lunch':
                query = `
                    SELECT name, phone, year, gender, dept, 
                        CONCAT(bfreason, ', ', lreason) AS reason
                    FROM Profile
                    WHERE abf = 0 AND al = 0
                `;
                break;
            case 'breakfast_and_dinner':
                query = `
                    SELECT name, phone, year, gender, dept, 
                        CONCAT(bfreason, ', ', dreason) AS reason
                    FROM Profile
                    WHERE abf = 0 AND ad = 0
                `;
                break;
            case 'lunch_and_dinner':
                query = `
                    SELECT name, phone, year, gender, dept, 
                        CONCAT(lreason, ', ', dreason) AS reason
                    FROM Profile
                    WHERE al = 0 AND ad = 0
                `;
                break;
            case 'all':
                query = `
                    SELECT name, phone, year, gender, dept, 
                        CONCAT(bfreason, ', ', lreason, ', ', dreason) AS reason
                    FROM Profile
                    WHERE abf = 0 AND al = 0 AND ad = 0
                `;
                break;
            default:
                return res.status(400).json({ error: 'Invalid meal type' });
        }
        
    
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing query:', error);
                return res.status(500).json({ error: 'Database query failed' });
            }
            res.json(results);
        });
    }
    catch(error)
    {

    }
});
app.post('/Tcheck-absent', (req, res) => {
    if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    try
    {
        const meal = req.body.meal;
        let query;
    
        switch (meal) {
            case 'breakfast':
                query = `
                    SELECT name, phone, year, dept, Tbfreason AS reason
                    FROM Profile
                    WHERE Tbf = 0
                `;
                break;
            case 'lunch':
                query = `
                    SELECT name, phone, year, dept, Tlreason AS reason
                    FROM Profile
                    WHERE Tlunch = 0
                `;
                break;
            case 'dinner':
                query = `
                    SELECT name, phone, year, dept, Tdreason AS reason
                    FROM Profile
                    WHERE Tdinner = 0
                `;
                break;
            case 'breakfast_and_lunch':
                query = `
                    SELECT name, phone, year, dept, 
                        CONCAT(Tbfreason, ', ', Tlreason) AS reason
                    FROM Profile
                    WHERE Tbf = 0 AND Tlunch = 0
                `;
                break;
            case 'breakfast_and_dinner':
                query = `
                    SELECT name, phone, year, dept, 
                        CONCAT(Tbfreason, ', ', Tdreason) AS reason
                    FROM Profile
                    WHERE Tbf = 0 AND Tdinner = 0
                `;
                break;
            case 'lunch_and_dinner':
                query = `
                    SELECT name, phone, year, dept, 
                        CONCAT(Tlreason, ', ', Tdreason) AS reason
                    FROM Profile
                    WHERE Tlunch = 0 AND Tdinner = 0
                `;
                break;
            case 'all':
                query = `
                    SELECT name, phone, year, dept, 
                        CONCAT(Tbfreason, ', ', Tlreason, ', ', Tdreason) AS reason
                    FROM Profile
                    WHERE Tbf = 0 AND Tlunch = 0 AND Tdinner = 0
                `;
                break;
            default:
                return res.status(400).json({ error: 'Invalid meal type' });
        }
        
    
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing query:', error);
                return res.status(500).json({ error: 'Database query failed' });
            }
            res.json(results);
        });
    }
    catch(error)
    {

    }
});


// Sign-up endpoint
app.post('/signup', (req, res) => {
    try {
        const { email, name, regNo, year, department, password, phone , gen } = req.body;
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

            const insertQuery = 'INSERT INTO Profile (user_id, name, reg_no, year, dept, password, phone, admin, gender) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)';
            db.query(insertQuery, [email, name, regNo, year, department, password, phone, gen], (err, results) => {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.status(500).send('Server error');
                }
                console.log('User is added');
                

                const insertLogbookQuery = `
                    INSERT INTO logbook (userid, password, phone_number) 
                    VALUES (?, ?, ?)
                `;
                
                db.query(insertLogbookQuery, [email, password, phone], (err, results) => {
                    if (err) {
                        console.error('Database insert error in logbook:', err);
                        return res.status(500).send('Server error');
                    }

                    return res.status(200).json({ message: 'User is added', redirect: '/login.html' });
                });

                
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
    try {
      // Modified: Added session check
      if (!req.session.user || !req.session.user.username) {
        return res.status(404).json({ redirect: '/login', message: 'Please log in first' });
      }
  
      // Modified: Email retrieval from session
      const email = req.session.user.username;
      console.log("Email is retrieved from session");
      
      const { bf, lunch, dinner, bfreason, lreason, dreason } = req.body;
  
      // Database update query
      const updateQuery = `UPDATE Profile SET bf = ?, lunch = ?, dinner = ?, bfreason = ?, lreason = ?, dreason = ? WHERE user_id = ?`;
      db.query(updateQuery, [bf, lunch, dinner, bfreason, lreason, dreason, email], (err, results) => {
        if (err) {
          console.error('Error updating food preferences:', err);
          return res.status(500).send('Server error');
        }
        console.log('User is updated successfully:', email);
        res.json({ message: 'Food preferences updated' });
      });
    } catch (error) {
      // Modified: General error handling
      console.error('Error in choose-food route:', error);
      res.status(500).send('Internal Server Error');
    }
});
app.post('/Tchoose-food', (req, res) => {
    try {
      // Modified: Added session check
      if (!req.session.user || !req.session.user.username) {
        return res.status(404).json({ redirect: '/login', message: 'Please log in first' });
      }
  
      // Modified: Email retrieval from session
      const email = req.session.user.username;
      console.log("Email is retrieved from session");
      
      const { bf, lunch, dinner, bfreason, lreason, dreason } = req.body;
  
      // Database update query
      const updateQuery = `UPDATE Profile SET Tbf = ?, Tlunch = ?, Tdinner = ?, Tbfreason = ?, Tlreason = ?, Tdreason = ? WHERE user_id = ?`;
      db.query(updateQuery, [bf, lunch, dinner, bfreason, lreason, dreason, email], (err, results) => {
        if (err) {
          console.error('Error updating food preferences:', err);
          return res.status(500).send('Server error');
        }
        console.log('User is updated successfully:', email);
        res.json({ message: 'Food preferences updated' });
      });
    } catch (error) {
      // Modified: General error handling
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

// Food Data
app.get('/fooddata', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    const query = 'SELECT * FROM FoodData ORDER BY id DESC LIMIT 1;';

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
// Endpoint to handle form data submission
app.post('/writedata', (req, res) => {
    
    const { databf, datalunch, datadinner, date } = req.body;

    // SQL query to insert data into FoodData table
    const query = `
        INSERT INTO FoodData (bf, lunch, dinner,date)
        VALUES (?, ?, ?,?)
    `;

    // Execute SQL query
    db.query(query, [databf, datalunch, datadinner,date], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Failed to save data.' });
        }

        // Send a success response
        res.status(200).json({ message: 'Data saved successfully!' });
    });
});

// Admin-main page endpoint
app.get('/admin-main-data', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    const query = 'SELECT SUM(bf) as totalbf, SUM(lunch) as totalLunch, SUM(dinner) as totalDinner, COUNT(*) as totalRows FROM Profile';

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
//Tomorrow Admin-main page endpoint
app.get('/Tadmin-main-data', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    const query = 'SELECT SUM(Tbf) as totalbf, SUM(Tlunch) as totalLunch, SUM(Tdinner) as totalDinner, COUNT(*) as totalRows FROM Profile';

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

// for initial update
app.get('/setvalue', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    let email = req.session.user.username;
    const query = 'SELECT * FROM Profile WHERE user_id = ?';

    db.query(query, [email], (err, results) => {
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
// for initial update
app.get('/Tsetvalue', (req, res) => {
    try{
        if (!req.session.user.username) {
        return res.status(404).json({redirect: '/login', message: 'Please log in first'}); 
        // Redirect to login page if not logged in
    }
    let email = req.session.user.username;
    const query = 'SELECT * FROM Profile WHERE user_id = ?';

    db.query(query, [email], (err, results) => {
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








function upload() {
    return new Promise((resolve, reject) => {
        let d = new Date();
        let day = ('0' + d.getDate()).slice(-2); // Get the day, add leading zero if needed
        let month = ('0' + (d.getMonth() + 1)).slice(-2); // Get the month, add leading zero if needed (months are 0-indexed)
        let year = d.getFullYear(); // Get the full year

        let formattedDateString = `${day}-${month}-${year}`;
        let formattedDate = String(formattedDateString);

        const queryTemplate = `
            INSERT INTO MealValues (user_id, lunch, dinner, date)
            VALUES (?, ?, ?, ?);
        `;

        db.query('SELECT user_id, lunch, dinner FROM Profile', (error, results) => {
            if (error) {
                console.error('Error selecting data from Profile:', error.stack);
                return reject(error);
            }

            if (results.length === 0) {
                console.log('No data found in Profile table.');
                return resolve();
            }

            let completed = 0;
            results.forEach(row => {
                const { user_id, lunch, dinner } = row;

                db.query(queryTemplate, [user_id, lunch, dinner, formattedDate], (err, res) => {
                    if (err) {
                        console.error('Error inserting row:', err.stack);
                        return reject(err);
                    }

                    completed++;
                    if (completed === results.length) {
                        console.log(`Data is Uploaded for ${formattedDate}`);
                        resolve();
                    }
                });
            });
        });
    });
}


// Endpoint to handle data upload
app.post('/upload-data', (req, res) => {
    const { date } = req.body;
    console.log(`Received request to upload data for ${date}`);

    const query = 'DELETE FROM MealValues WHERE date = ?';

    db.query(query, [date], (err, result) => {
        if (err) {
            console.error('Error truncating MealValues:', err);
            return res.status(500).json({ message: 'Error truncating MealValues' });
        }
        console.log(`Truncated MealValues for date ${date}`);

        upload()
            .then(() => {
                console.log('Data uploaded successfully.');
                res.status(200).json({ message: `Data for ${date} uploaded successfully` });
            })
            .catch(error => {
                console.error('Error uploading data:', error);
                res.status(500).json({ message: 'Error uploading data' });
            });
    });
});



// Route to check password
app.post('/checkpassword', (req, res) => {
    const { email } = req.body;

    // Query to check if user_id exists in Profile table
    const query = 'SELECT password FROM Profile WHERE user_id = ?';
    db.query(query, [email], (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Database error' });
        } else if (results.length === 0) {
            res.status(404).json({ message: 'User not found' });
        } else {
            const password = results[0].password;
            res.status(200).json({ message: `Password for ${email} is ${password}` });
        }
    });
});



function formaldate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based in JS
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}
// checking for upload
app.get('/checkdate', (req, res) => {
    const currentDate = formaldate();

    // Query the latest date from FoodData table
    db.query('SELECT date FROM FoodData ORDER BY id DESC LIMIT 1', (err, results) => {
        if (err) throw err;

        const lastRecordDate = results.length > 0 ? results[0].date : null;
        
        if (lastRecordDate === currentDate) {
            // If dates are the same, send update_date
            db.query('SELECT updated_at FROM History ORDER BY id DESC LIMIT 1', (err, results) => {
                if (err) throw err;
                const updateDate = results[0]?.updated_at;
                console.log('Last updated_at value:', updateDate || 'No records found');
                res.json({ message: `Last upload on ${updateDate}` });
            });
            
            
            
        } 
        else 
        {
            // If dates are different, perform insert and update operations
            db.query('SELECT * FROM FoodData ORDER BY id DESC LIMIT 1', (err, foodData) => {
                if (err) throw err;

                if (foodData.length > 0) {
                    // Extract data for the new entry
                    const { lunch, dinner, bf } = foodData[0];
                    const newData = {
                        lunch,
                        dinner,
                        bf,
                        date: currentDate
                    };

                    // Insert new data with current date
                    db.query('INSERT INTO FoodData (lunch, dinner, bf, date) VALUES (?, ?, ?, ?)', 
                        [newData.lunch, newData.dinner, newData.bf, newData.date], (err) => {
                        if (err) throw err;

                        // Retrieve user_id, lunch, dinner, and bf from the Profile table
                        db.query('SELECT user_id, lunch, dinner, bf FROM Profile', (err, profileData) => {
                            if (err) throw err;

                            if (profileData.length > 0) {
                                // Loop through each profile entry
                                // profileData.forEach(profile => {
                                //     const historyData = {
                                //         user_id: profile.user_id,
                                //         lunch: profile.lunch,
                                //         dinner: profile.dinner,
                                //         bf: profile.bf,
                                //         date: currentDate
                                //     };

                                //     // Insert into History table
                                //     db.query('INSERT INTO History (userid, lunch, dinner, bf, date) VALUES (?, ?, ?, ?, ?)', [historyData.user_id, historyData.lunch, historyData.dinner, historyData.bf, historyData.date], (err) => {
                                //         if (err) throw err;
                                //     });
                                    
                                // }); 
                                // console.log("****************history table data is stored*******************");

                                const query = `
                                    INSERT INTO History (al, ad, abf, userid, lunch, dinner, bf, date)
                                    SELECT al, ad, abf, user_id, lunch, dinner, bf, ? FROM Profile;
                                `;

                                db.query(query, [currentDate], (err, results) => {
                                    if (err) throw err;
                                    console.log('History table data is stored');
                                });

                            }
                            else {
                                res.json({ message: 'No profile data found' });
                            }

                        });



                        // Update Profile table
                        const updateQuery = `
                        UPDATE Profile 
                        SET bf = Tbf, lunch = Tlunch, dinner = Tdinner,
                            bfreason = Tbfreason, lreason = Tlreason, dreason = Tdreason,
                            Tbf = DEFAULT, Tlunch = DEFAULT, Tdinner = DEFAULT,
                            Tbfreason = DEFAULT, Tlreason = DEFAULT, Tdreason = DEFAULT,
                            al = DEFAULT, abf = DEFAULT, ad = DEFAULT
                        `;

                        db.query(updateQuery, (err) => {
                            if (err) throw err;
                            res.json({ message: 'You are the first user' });
                        });
                        console.log("****************Profile table data is updated*******************");

                    });
                } else {
                    res.json({ message: 'No data found in FoodData table' });
                }
            });
        }
    });


});


app.post('/getProfilescan', (req, res) => {
    try {
        // Check if the user is logged in
        // console.log("inside a scnner")
        if (!req.session.user ||!req.session.user.username) {
            return res.status(404).json({ redirect: '/login', message: 'Please log in first' });
        }

        const { id } = req.body; // Get id from the request body

        // SQL query to get profile data
        const sql = 'SELECT name, bf, lunch, dinner, bfreason, lreason, dreason FROM Profile WHERE id = ?';

        // Execute the query
        db.query(sql, [id], (err, result) => {
            if (err) {
                // Return an error if there was a problem with the query
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.length === 0) {
                // Return an error if the profile was not found
                return res.status(404).json({ error: 'Profile not found' });
            }
            // Send back the profile data as JSON
            res.json(result[0]);
        });

    } catch (error) {
        // Handle any unexpected errors
        console.error("Error in fetching profile:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to mark attendance
app.post('/markAttendance', (req, res) => {
    // console.log("This is request body",req.body);
    const { id, breakfast, lunch, dinner } = req.body;

    // Ensure the user is logged in (if applicable)
    if (!req.session.user || !req.session.user.username) {
        return res.status(404).json({ redirect: '/login.html', message: 'Please log in first' });
    }

    

    console.log(breakfast, lunch, dinner);

    let sql = 'UPDATE Profile SET ';
    const updates = [];
    
    console.log("*******SCANNER********");

    // // Add corresponding updates based on checked values
    // if (breakfast==1) {
    //     updates.push('abf = 1');
    //     sql+=' abf = 1';
    // } 
    // if (lunch==1) {
    //     updates.push('al = 1');
    //     sql+=' al = 1';
    // } 
    // if (dinner==1) {
    //     updates.push('ad = 1');
    //     sql+=' ad = 1';
    // }

    // if (breakfast===0 && lunch===0 && dinner===0) {
    //     sql += ' abf = 0, al = 0, ad = 0 ' ;
    // }
    

    // sql += ' WHERE id = ?';
    

    // 8 possibilities for breakfast, lunch, and dinner
    if (breakfast === 1 && lunch === 1 && dinner === 1) {
        sql += 'abf = 1, al = 1, ad = 1';
    } else if (breakfast === 1 && lunch === 1 && dinner === 0) {
        sql += 'abf = 1, al = 1';
    } else if (breakfast === 1 && lunch === 0 && dinner === 1) {
        sql += 'abf = 1, ad = 1';
    } else if (breakfast === 1 && lunch === 0 && dinner === 0) {
        sql += 'abf = 1';
    } else if (breakfast === 0 && lunch === 1 && dinner === 1) {
        sql += ' al = 1, ad = 1';
    } else if (breakfast === 0 && lunch === 1 && dinner === 0) {
        sql += ' al = 1';
    } else if (breakfast === 0 && lunch === 0 && dinner === 1) {
        sql += ' ad = 1';
    } else {
        // All unchecked: breakfast === 0 && lunch === 0 && dinner === 0
        sql += 'abf = 0, al = 0, ad = 0';
    }

    sql += ' WHERE id = ?';

    

    try {
        // Execute the query
        db.query(sql, [ id], (err, result) => {
            if (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(200).json({ success: true, message: 'Profile updated successfully. ' });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error occurred' });
    }
});



function checkingDBstatus()
{
    // let query = `
    //     INSERT INTO History (userid, lunch, dinner, bf, date)
    //     VALUES (?, ?, ?, ?, ?);
    // `;

    // // Assuming you're using a MySQL library like `mysql2` or `mysqljs/mysql`
    // let values = ['sample@c', 1, 0.5, 1, '02-09-2024']; 

    // // Example using mysql2
    // db.query(query, values, (error, results) => {
    //     if (error) {
    //         console.error('Error executing query:', error);
    //         return;
    //     }
    //     console.log('Record inserted in history table:', results);
    // });


    // let query = 'INSERT INTO FoodData (lunch, dinner, bf, date) VALUES (?, ?, ?, ?)';

    // // Define the values to insert
    //  values = [1, 0.5, 1, '01-09-2024']; // Date in YYYY-MM-DD format

    // // Execute the query
    // db.query(query, values, (error, results) => {
    //     if (error) {
    //         console.error('Error executing query:', error);
    //         return;
    //     }
    //     console.log('FOOD data record is inserted:', results);
    // });


    
    
}




app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


