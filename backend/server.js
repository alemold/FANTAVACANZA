const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001; // Changed default port to 3001 to avoid conflicts

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Solo i file immagine sono consentiti!'), false);
    }
    cb(null, true);
  }
});

// Database connection
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'fanta-pag'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes

// Register a new user
app.post('/api/register', async (req, res) => {
  const { username, email, password, auth_provider = 'email', provider_id = null, avatar_url = null } = req.body;

  try {
    // For email auth, hash the password
    let password_hash = null;
    if (auth_provider === 'email' && password) {
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    }

    const query = 'INSERT INTO users (username, email, password_hash, auth_provider, provider_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [username, email, password_hash, auth_provider, provider_id, avatar_url], (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Error registering user' });
      }

      // Return user data without password
      const userId = result.insertId;
      const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, created_at FROM users WHERE id = ?';
      db.query(userQuery, [userId], (err, users) => {
        if (err) {
          console.error('Error fetching user data:', err);
          return res.status(500).json({ error: 'Error fetching user data' });
        }
        res.status(201).json({ user: users[0], message: 'User registered successfully' });
      });
    });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { email, password, auth_provider = 'email', provider_id = null } = req.body;

  try {
    // Handle different authentication methods
    if (auth_provider === 'email') {
      // Email/password login
      const query = 'SELECT * FROM users WHERE email = ? AND auth_provider = "email"';
      db.query(query, [email], async (err, users) => {
        if (err) {
          console.error('Error during login:', err);
          return res.status(500).json({ error: 'Error during login' });
        }

        if (users.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user data without password
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: 'Login successful' });
      });
    } else {
      // Social login (Google, Apple)
      // First check if user exists with this email regardless of auth provider
      const emailQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(emailQuery, [email], (err, users) => {
        if (err) {
          console.error('Error during social login:', err);
          return res.status(500).json({ error: 'Error during social login' });
        }

        if (users.length === 0) {
          // User doesn't exist yet, create a new account
          console.log('Creating new user account for social login:', email);
          const { username, avatar_url } = req.body;
          
          if (!username) {
            return res.status(400).json({ error: 'Username is required for new social accounts' });
          }
          
          const insertQuery = 'INSERT INTO users (username, email, auth_provider, provider_id, avatar_url) VALUES (?, ?, ?, ?, ?)';
          db.query(insertQuery, [username, email, auth_provider, provider_id, avatar_url], (err, result) => {
            if (err) {
              console.error('Error creating user from social login:', err);
              if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email already exists with a different account' });
              }
              return res.status(500).json({ error: 'Error creating user from social login' });
            }
            
            // Return the newly created user
            const userId = result.insertId;
            const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, created_at FROM users WHERE id = ?';
            db.query(userQuery, [userId], (err, newUsers) => {
              if (err) {
                console.error('Error fetching new user data:', err);
                return res.status(500).json({ error: 'Error fetching new user data' });
              }
              res.status(201).json({ user: newUsers[0], message: 'New account created with social login' });
            });
          });
        } else {
          // User exists with this email
          const user = users[0];
          
          // If user already has this auth provider, just log them in
          if (user.auth_provider === auth_provider) {
            // Update provider_id if it's different or missing
            if (provider_id && (user.provider_id !== provider_id)) {
              db.query('UPDATE users SET provider_id = ? WHERE id = ?', [provider_id, user.id]);
            }
            
            const { password_hash, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword, message: 'Login successful' });
          } else {
            // User exists but with a different auth provider
            // For security, we'll update their auth method to the current one
            db.query('UPDATE users SET auth_provider = ?, provider_id = ? WHERE id = ?', 
              [auth_provider, provider_id, user.id], (err, result) => {
                if (err) {
                  console.error('Error updating user auth method:', err);
                  return res.status(500).json({ error: 'Error updating authentication method' });
                }
                
                // Return the updated user
                const { password_hash, ...userWithoutPassword } = user;
                userWithoutPassword.auth_provider = auth_provider;
                userWithoutPassword.provider_id = provider_id;
                res.json({ user: userWithoutPassword, message: 'Login successful, authentication method updated' });
              });
          }
        }
      });

    }
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  const query = 'SELECT id, username, email, auth_provider, avatar_url, total_points, created_at FROM users WHERE id = ?';
  db.query(query, [userId], (err, users) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Error fetching user profile' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  });
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, email, password, avatar_url } = req.body;
  
  try {
    // Start building the query and parameters
    let query = 'UPDATE users SET ';
    const queryParams = [];
    const updateFields = [];
    
    if (username) {
      updateFields.push('username = ?');
      queryParams.push(username);
    }
    
    if (email) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updateFields.push('password_hash = ?');
      queryParams.push(password_hash);
    }
    
    if (avatar_url) {
      updateFields.push('avatar_url = ?');
      queryParams.push(avatar_url);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    query += updateFields.join(', ');
    query += ' WHERE id = ?';
    queryParams.push(userId);
    
    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Error updating user profile' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return updated user data
      const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, created_at FROM users WHERE id = ?';
      db.query(userQuery, [userId], (err, users) => {
        if (err) {
          console.error('Error fetching updated user data:', err);
          return res.status(500).json({ error: 'Error fetching updated user data' });
        }
        res.json({ user: users[0], message: 'User profile updated successfully' });
      });
    });
  } catch (error) {
    console.error('Server error during profile update:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// Upload profile image
app.post('/api/users/:id/upload-avatar', upload.single('avatar'), (req, res) => {
  const userId = req.params.id;
  
  if (!req.file) {
    return res.status(400).json({ error: 'Nessun file caricato' });
  }
  
  // Create the URL for the uploaded file
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
  
  // Update the user's avatar_url in the database
  const query = 'UPDATE users SET avatar_url = ? WHERE id = ?';
  db.query(query, [avatarUrl, userId], (err, result) => {
    if (err) {
      console.error('Error updating avatar URL:', err);
      return res.status(500).json({ error: 'Error updating avatar URL' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the avatar URL
    res.json({ avatar_url: avatarUrl, message: 'Avatar uploaded successfully' });
  });
});

// Group Routes

// Create a new group
app.post('/api/groups', (req, res) => {
  const { name, user_id } = req.body;
  
  if (!name || !user_id) {
    return res.status(400).json({ error: 'Nome del gruppo e ID utente sono richiesti' });
  }
  
  // Insert the new group into the database
  const insertGroupQuery = 'INSERT INTO groups (name, created_by) VALUES (?, ?)';
  db.query(insertGroupQuery, [name, user_id], (err, result) => {
    if (err) {
      console.error('Error creating group:', err);
      return res.status(500).json({ error: 'Errore durante la creazione del gruppo' });
    }
    
    const groupId = result.insertId;
    
    // Add the creator as a member of the group
    const insertMemberQuery = 'INSERT INTO group_users (group_id, user_id, role) VALUES (?, ?, "admin")';
    db.query(insertMemberQuery, [groupId, user_id], (err, memberResult) => {
      if (err) {
        console.error('Error adding member to group:', err);
        return res.status(500).json({ error: 'Errore durante l\'aggiunta del membro al gruppo' });
      }
      
      // Return the newly created group
      const getGroupQuery = `
        SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(u.total_points), 0) as points
        FROM groups g
        LEFT JOIN group_users gm ON g.id = gm.group_id
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE g.id = ?
        GROUP BY g.id
      `;
      
      db.query(getGroupQuery, [groupId], (err, groups) => {
        if (err) {
          console.error('Error fetching created group:', err);
          return res.status(500).json({ error: 'Errore durante il recupero del gruppo creato' });
        }
        
        res.status(201).json({ 
          group: groups[0], 
          message: 'Gruppo creato con successo' 
        });
      });
    });
  });
});

// Get all groups for a user
app.get('/api/groups/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT g.*, COUNT(gm2.user_id) as participants, COALESCE(SUM(u.total_points), 0) as points
    FROM groups g
    JOIN group_users gm1 ON g.id = gm1.group_id AND gm1.user_id = ?
    LEFT JOIN group_users gm2 ON g.id = gm2.group_id
    LEFT JOIN users u ON gm2.user_id = u.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `;
  
  db.query(query, [userId], (err, groups) => {
    if (err) {
      console.error('Error fetching user groups:', err);
      return res.status(500).json({ error: 'Errore durante il recupero dei gruppi dell\'utente' });
    }
    
    // Format the created_at date for each group
    const formattedGroups = groups.map(group => {
      const date = new Date(group.created_at);
      return {
        ...group,
        created_at: date.toLocaleDateString('it-IT')
      };
    });
    
    res.json({ groups: formattedGroups });
  });
});

// Get a specific group by ID
app.get('/api/groups/:groupId', (req, res) => {
  const groupId = req.params.groupId;
  
  const groupQuery = `
    SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(u.total_points), 0) as points
    FROM groups g
    LEFT JOIN group_users gm ON g.id = gm.group_id
    LEFT JOIN users u ON gm.user_id = u.id
    WHERE g.id = ?
    GROUP BY g.id
  `;
  
  db.query(groupQuery, [groupId], (err, groups) => {
    if (err) {
      console.error('Error fetching group:', err);
      return res.status(500).json({ error: 'Errore durante il recupero del gruppo' });
    }
    
    if (groups.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }
    
    // Get group members
    const membersQuery = `
      SELECT u.id, u.username, u.avatar_url, u.total_points as points, gm.role
      FROM group_users gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY u.total_points DESC
    `;
    
    db.query(membersQuery, [groupId], (err, members) => {
      if (err) {
        console.error('Error fetching group members:', err);
        return res.status(500).json({ error: 'Errore durante il recupero dei membri del gruppo' });
      }
      
      // Get group activities
      const activitiesQuery = `
        SELECT a.id, a.name, a.points, a.description, a.created_at as date
        FROM activities a
        WHERE a.group_id = ?
        ORDER BY a.created_at DESC
      `;
      
      db.query(activitiesQuery, [groupId], (err, activities) => {
        if (err) {
          console.error('Error fetching group activities:', err);
          return res.status(500).json({ error: 'Errore durante il recupero delle attività del gruppo' });
        }
        
        // Format dates for activities
        const formattedActivities = activities.map(activity => {
          const date = new Date(activity.date);
          return {
            ...activity,
            date: date.toLocaleDateString('it-IT')
          };
        });
        
        // Return the group with members and activities
        res.json({
          group: {
            ...groups[0],
            participants: members,
            activities: formattedActivities
          }
        });
      });
    });
  });
});

// Join a group
app.post('/api/groups/:groupId/join', (req, res) => {
  const groupId = req.params.groupId;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'ID utente richiesto' });
  }
  
  // Check if the group exists
  db.query('SELECT * FROM groups WHERE id = ?', [groupId], (err, groups) => {
    if (err) {
      console.error('Error checking group:', err);
      return res.status(500).json({ error: 'Errore durante la verifica del gruppo' });
    }
    
    if (groups.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }
    
    // Check if the user is already a member
    db.query('SELECT * FROM group_users WHERE group_id = ? AND user_id = ?', [groupId, user_id], (err, members) => {
      if (err) {
        console.error('Error checking membership:', err);
        return res.status(500).json({ error: 'Errore durante la verifica dell\'appartenenza al gruppo' });
      }
      
      if (members.length > 0) {
        return res.status(409).json({ error: 'L\'utente è già membro di questo gruppo' });
      }
      
      // Add the user as a member
      const insertQuery = 'INSERT INTO group_users (group_id, user_id, role) VALUES (?, ?, "member")';
      db.query(insertQuery, [groupId, user_id], (err, result) => {
        if (err) {
          console.error('Error adding member to group:', err);
          return res.status(500).json({ error: 'Errore durante l\'aggiunta del membro al gruppo' });
        }
        
        res.json({ message: 'Utente aggiunto al gruppo con successo' });
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});