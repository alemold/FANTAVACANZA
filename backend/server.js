const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

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
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
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
      const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, completed_challenges, created_at FROM users WHERE id = ?';
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
            const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, completed_challenges, created_at FROM users WHERE id = ?';
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
  
  // Updated query to include a count of groups the user belongs to
  const query = `
    SELECT u.id, u.username, u.email, u.auth_provider, u.avatar_url, u.total_points, u.completed_challenges, u.created_at,
    (SELECT COUNT(*) FROM group_users   WHERE user_id = u.id) as group_count
    FROM users u
    WHERE u.id = ?
  `;
  
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
      const userQuery = 'SELECT id, username, email, auth_provider, avatar_url, total_points, completed_challenges, created_at FROM users WHERE id = ?';
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

// Challenge Routes

// Get all challenge categories with their challenges
app.get('/api/challenges/categories', (req, res) => {
  // Query to get all challenge categories
  const categoriesQuery = 'SELECT * FROM challenge_categories ORDER BY name';
  
  db.query(categoriesQuery, (err, categories) => {
    if (err) {
      console.error('Error fetching challenge categories:', err);
      return res.status(500).json({ error: 'Errore durante il recupero delle categorie di sfide' });
    }
    
    // Query to get all challenges with proper fields
    const challengesQuery = `
      SELECT 
        id, 
        category_id, 
        description, 
        points, 
        status, 
        is_active,
        ripetibile
      FROM challenges 
      WHERE is_active = 1
    `;
    
    db.query(challengesQuery, (err, challenges) => {
      if (err) {
        console.error('Error fetching challenges:', err);
        return res.status(500).json({ error: 'Errore durante il recupero delle sfide' });
      }
      
      // Group challenges by category
      const categoriesWithChallenges = categories.map(category => {
        const categoryChallenges = challenges.filter(challenge => 
          challenge.category_id === category.id
        );
        
        return {
          ...category,
          challenges: categoryChallenges
        };
      });
      
      res.json({ categories: categoriesWithChallenges });
    });
  });
});

// Group Routes

// Create a new group
app.post('/api/groups', (req, res) => {
  const { name, user_id } = req.body;
  
  if (!name || !user_id) {
    return res.status(400).json({ error: 'Nome del gruppo e ID utente sono richiesti' });
  }
  
  // Generate a unique group_id (6-digit alphanumeric)
  const generateGroupId = () => {
    // Generate a 6-character alphanumeric string
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
  let group_id = generateGroupId();
  
  // Check if the generated group_id already exists
  const checkGroupIdQuery = 'SELECT id FROM game_groups WHERE group_id = ?';
  db.query(checkGroupIdQuery, [group_id], (err, results) => {
    if (err) {
      console.error('Error checking group_id:', err);
      return res.status(500).json({ error: 'Errore durante la verifica dell\'ID del gruppo' });
    }
    
    // If group_id already exists, generate a new one
    if (results.length > 0) {
      group_id = generateGroupId();
    }
    
    // Insert the new group into the database with the generated group_id
    const insertGroupQuery = 'INSERT INTO game_groups (name, created_by, group_id) VALUES (?, ?, ?)';
    db.query(insertGroupQuery, [name, user_id, group_id], (err, result) => {
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
          SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(gm.points), 0) as points
          FROM game_groups g
          LEFT JOIN group_users gm ON g.id = gm.group_id
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
});

// Get all groups for a user
app.get('/api/groups/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT g.*, 
           COUNT(gm2.user_id) as participants, 
           COALESCE(SUM(gm2.points), 0) as points,
           (SELECT points FROM group_users WHERE group_id = g.id AND user_id = ?) as user_points
    FROM game_groups g
    JOIN group_users gm1 ON g.id = gm1.group_id AND gm1.user_id = ?
    LEFT JOIN group_users gm2 ON g.id = gm2.group_id
    LEFT JOIN users u ON gm2.user_id = u.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `;
  
  db.query(query, [userId, userId], (err, groups) => {
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
  
  // Try to parse as integer for numeric ID
  const numericId = parseInt(groupId, 10);
  const isNumericId = !isNaN(numericId) && numericId.toString() === groupId;
  
  let groupQuery;
  let queryParam;
  
  if (isNumericId) {
    // Use numeric ID query
    groupQuery = `
      SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(gm.points), 0) as points
      FROM game_groups g
      LEFT JOIN group_users gm ON g.id = gm.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `;
    queryParam = numericId;
  } else {
    // Use alphanumeric group_id query
    groupQuery = `
      SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(gm.points), 0) as points
      FROM game_groups g
      LEFT JOIN group_users gm ON g.id = gm.group_id
      WHERE g.group_id = ?
      GROUP BY g.id
    `;
    queryParam = groupId;
  }
  
  db.query(groupQuery, [queryParam], (err, groups) => {
    if (err) {
      console.error('Error fetching group:', err);
      return res.status(500).json({ error: 'Errore durante il recupero del gruppo' });
    }
    
    if (groups.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }
    
    // Get group members
    const membersQuery = `
      SELECT u.id, u.username, u.avatar_url, gm.points, gm.role
      FROM group_users gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.points DESC
    `;
    
    db.query(membersQuery, [groups[0].id], (err, members) => {
      if (err) {
        console.error('Error fetching group members:', err);
        return res.status(500).json({ error: 'Errore durante il recupero dei membri del gruppo' });
      }
      
      // Get group challenges as activities
      const activitiesQuery = `
        SELECT c.id, c.description as name, c.points, c.status, c.description
        FROM challenges c
        JOIN group_challenges gc ON c.id = gc.challenge_id
        WHERE gc.group_id = ?
        ORDER BY gc.id DESC
      `;
      
      db.query(activitiesQuery, [groups[0].id], (err, activities) => {
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
        
        // If no activities found, use an empty array
        if (formattedActivities.length === 0) {
          console.log('No activities found for group, using empty array');
        }
        
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

// Get participants for a specific group
app.get('/api/groups/:groupId/participants', (req, res) => {
  const groupId = req.params.groupId;
  
  const query = `
    SELECT u.id as user_id, u.username, u.avatar_url, gu.points, gu.role
    FROM group_users gu
    JOIN users u ON gu.user_id = u.id
    WHERE gu.group_id = ?
    ORDER BY gu.points DESC
  `;
  
  db.query(query, [groupId], (err, participants) => {
    if (err) {
      console.error('Error fetching group participants:', err);
      return res.status(500).json({ error: 'Errore durante il recupero dei partecipanti del gruppo' });
    }
    
    res.json({ participants });
  });
});

// Get challenges for a specific group
app.get('/api/groups/:groupId/challenges', (req, res) => {
  const groupId = req.params.groupId;
  
  const query = `
    SELECT c.id, c.description, c.points, c.status, c.is_active, c.category_id, cc.name as category_name
    FROM challenges c
    JOIN group_challenges gc ON c.id = gc.challenge_id
    JOIN challenge_categories cc ON c.category_id = cc.id
    WHERE gc.group_id = ? AND gc.is_active = 1
    ORDER BY cc.name, c.description
  `;
  
  db.query(query, [groupId], (err, challenges) => {
    if (err) {
      console.error('Error fetching group challenges:', err);
      return res.status(500).json({ error: 'Errore durante il recupero delle sfide del gruppo' });
    }
    
    res.json({ challenges });
  });
});

app.post('/api/groups/:groupId/join', (req, res) => {
  const groupId = req.params.groupId;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'ID utente richiesto' });
  }
  
  db.query('SELECT * FROM game_groups WHERE id = ?', [groupId], (err, groups) => {
    if (err) {
      console.error('Error checking group:', err);
      return res.status(500).json({ error: 'Errore durante la verifica del gruppo' });
    }
    
    if (groups.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }
    
    db.query('SELECT * FROM group_users WHERE group_id = ? AND user_id = ?', [groupId, user_id], (err, members) => {
      if (err) {
        console.error('Error checking membership:', err);
        return res.status(500).json({ error: 'Errore durante la verifica dell\'appartenenza al gruppo' });
      }
      
      if (members.length > 0) {
        return res.status(409).json({ error: 'L\'utente è già membro di questo gruppo' });
      }
      
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

// Save selected challenges for a group
app.post('/api/groups/:groupId/challenges', (req, res) => {
  const groupId = req.params.groupId;
  const { challenge_ids } = req.body;
  
  if (!challenge_ids || !Array.isArray(challenge_ids) || challenge_ids.length === 0) {
    return res.status(400).json({ error: 'Devi selezionare almeno una sfida' });
  }
  
  // First, delete any existing group challenges
  const deleteQuery = 'DELETE FROM group_challenges WHERE group_id = ?';
  db.query(deleteQuery, [groupId], (err) => {
    if (err) {
      console.error('Error deleting existing group challenges:', err);
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento delle sfide del gruppo' });
    }
    
    // Prepare values for bulk insert
    const values = challenge_ids.map(challengeId => [groupId, challengeId]);
    
    // Insert new group challenges
    const insertQuery = 'INSERT INTO group_challenges (group_id, challenge_id) VALUES ?';
    db.query(insertQuery, [values], (err) => {
      if (err) {
        console.error('Error inserting group challenges:', err);
        return res.status(500).json({ error: 'Errore durante il salvataggio delle sfide del gruppo' });
      }
      
      res.json({ success: true, message: 'Sfide del gruppo salvate con successo' });
    });
  });
});

// Generate an invitation code for a group
app.post('/api/groups/:groupId/invite', (req, res) => {
  const groupId = req.params.groupId;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'ID utente richiesto' });
  }
  
  // Check if the user is a member of the group
  db.query('SELECT * FROM group_users WHERE group_id = ? AND user_id = ?', [groupId, user_id], (err, members) => {
    if (err) {
      console.error('Error checking membership:', err);
      return res.status(500).json({ error: 'Errore durante la verifica dell\'appartenenza al gruppo' });
    }
    
    if (members.length === 0) {
      return res.status(403).json({ error: 'Non sei membro di questo gruppo' });
    }
    
    // Generate a unique invitation code
    const inviteCode = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Invitation valid for 7 days
    
    // Check if there's an existing invitation for this group
    db.query('SELECT * FROM group_invitations WHERE group_id = ? AND created_by = ?', [groupId, user_id], (err, invitations) => {
      if (err) {
        console.error('Error checking existing invitations:', err);
        return res.status(500).json({ error: 'Errore durante la verifica degli inviti esistenti' });
      }
      
      // If there's an existing invitation, update it
      if (invitations.length > 0) {
        db.query('UPDATE group_invitations SET invite_code = ?, expires_at = ? WHERE group_id = ? AND created_by = ?', 
          [inviteCode, expiryDate, groupId, user_id], (err) => {
            if (err) {
              console.error('Error updating invitation:', err);
              return res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'invito' });
            }
            
            res.json({ 
              invite_code: inviteCode, 
              expires_at: expiryDate,
              invite_link: `https://fantavacanza.com/join?code=${inviteCode}`,
              message: 'Codice di invito generato con successo' 
            });
        });
      } else {
        // Otherwise, create a new invitation
        db.query('INSERT INTO group_invitations (group_id, invite_code, created_by, expires_at) VALUES (?, ?, ?, ?)', 
          [groupId, inviteCode, user_id, expiryDate], (err) => {
            if (err) {
              console.error('Error creating invitation:', err);
              return res.status(500).json({ error: 'Errore durante la creazione dell\'invito' });
            }
            
            res.json({ 
              invite_code: inviteCode, 
              expires_at: expiryDate,
              invite_link: `https://fantavacanza.com/join?code=${inviteCode}`,
              message: 'Codice di invito generato con successo' 
            });
        });
      }
    });
  });
});

// Join a group using an invitation code
app.post('/api/groups/join-by-invite', (req, res) => {
  const { user_id, invite_code } = req.body;
  
  if (!user_id || !invite_code) {
    return res.status(400).json({ error: 'ID utente e codice di invito richiesti' });
  }
  
  // Find the invitation by code
  db.query('SELECT * FROM group_invitations WHERE invite_code = ? AND expires_at > NOW()', [invite_code], (err, invitations) => {
    if (err) {
      console.error('Error finding invitation:', err);
      return res.status(500).json({ error: 'Errore durante la ricerca dell\'invito' });
    }
    
    if (invitations.length === 0) {
      return res.status(404).json({ error: 'Invito non valido o scaduto' });
    }
    
    const invitation = invitations[0];
    const groupId = invitation.group_id;
    
    // Check if the user is already a member of the group
    db.query('SELECT * FROM group_users WHERE group_id = ? AND user_id = ?', [groupId, user_id], (err, members) => {
      if (err) {
        console.error('Error checking membership:', err);
        return res.status(500).json({ error: 'Errore durante la verifica dell\'appartenenza al gruppo' });
      }
      
      if (members.length > 0) {
        return res.status(409).json({ error: 'Sei già membro di questo gruppo' });
      }
      
      // Add the user to the group
      const insertQuery = 'INSERT INTO group_users (group_id, user_id, role) VALUES (?, ?, "member")';
      db.query(insertQuery, [groupId, user_id], (err, result) => {
        if (err) {
          console.error('Error adding member to group:', err);
          return res.status(500).json({ error: 'Errore durante l\'aggiunta del membro al gruppo' });
        }
        
        // Get the group details
        db.query('SELECT * FROM game_groups WHERE id = ?', [groupId], (err, groups) => {
          if (err) {
            console.error('Error fetching group:', err);
            return res.status(500).json({ error: 'Errore durante il recupero del gruppo' });
          }
          
          res.json({ 
            group: groups[0], 
            message: 'Ti sei unito al gruppo con successo' 
          });
        });
      });
    });
  });
});

// Join a group using a group_id
app.post('/api/groups/join', handleJoinGroup);
app.post('/groups/join', handleJoinGroup);

// Funzione di gestione della richiesta di join
function handleJoinGroup(req, res) {
  const { user_id, group_id } = req.body;
  
  console.log('Tentativo di join con group_id:', group_id);
  console.log('Dati ricevuti:', req.body);
  
  if (!user_id || !group_id) {
    return res.status(400).json({ error: 'ID utente e ID gruppo richiesti' });
  }
  
  // Find the group by group_id (alphanumeric code)
  db.query('SELECT * FROM game_groups WHERE group_id = ?', [group_id], (err, groups) => {
    if (err) {
      console.error('Error checking group:', err);
      return res.status(500).json({ error: 'Errore durante la verifica del gruppo' });
    }
    
    console.log('Risultati ricerca gruppo per group_id:', groups.length);
    
    if (groups.length === 0) {
      // Se non trovo per group_id, provo con id numerico
      const numericId = parseInt(group_id, 10);
      if (isNaN(numericId)) {
        return res.status(404).json({ error: 'Gruppo non trovato. Verifica l\'ID e riprova.' });
      }
      
      db.query('SELECT * FROM game_groups WHERE id = ?', [numericId], (err, groupsById) => {
        if (err) {
          console.error('Error checking group by id:', err);
          return res.status(500).json({ error: 'Errore durante la verifica del gruppo' });
        }
        
        console.log('Risultati ricerca gruppo per id numerico:', groupsById.length);
        
        if (groupsById.length === 0) {
          return res.status(404).json({ error: 'Gruppo non trovato. Verifica l\'ID e riprova.' });
        }
        
        // Continue with the found group
        const foundGroup = groupsById[0];
        continueWithGroup(foundGroup, user_id, res);
      });
    } else {
      // Continue with the found group
      const foundGroup = groups[0];
      continueWithGroup(foundGroup, user_id, res);
    }
  });
  
  // Helper function to continue processing after finding the group
  function continueWithGroup(group, userId, response) {
    const groupId = group.id;
    
    // Check if user is already a member
    db.query('SELECT * FROM group_users WHERE group_id = ? AND user_id = ?', [groupId, userId], (err, members) => {
      if (err) {
        console.error('Error checking membership:', err);
        return response.status(500).json({ error: 'Errore durante la verifica dell\'appartenenza al gruppo' });
      }
      
      if (members.length > 0) {
        return response.status(409).json({ error: 'Sei già membro di questo gruppo' });
      }
      
      // Add user to the group
      const insertQuery = 'INSERT INTO group_users (group_id, user_id, role) VALUES (?, ?, "member")';
      db.query(insertQuery, [groupId, userId], (err, result) => {
        if (err) {
          console.error('Error adding member to group:', err);
          return response.status(500).json({ error: 'Errore durante l\'aggiunta del membro al gruppo' });
        }
        
        // Get updated group data with accurate participant count
        const updateQuery = `
          SELECT g.*, COUNT(gm.user_id) as participants, COALESCE(SUM(gm.points), 0) as points
          FROM game_groups g
          LEFT JOIN group_users gm ON g.id = gm.group_id
          LEFT JOIN users u ON gm.user_id = u.id
          WHERE g.id = ?
          GROUP BY g.id
        `;
        
        db.query(updateQuery, [groupId], (err, updatedGroups) => {
          if (err) {
            console.error('Error fetching updated group:', err);
            // Still return success even if we couldn't get the updated count
            return response.json({ 
              group: group, 
              message: 'Ti sei unito al gruppo con successo' 
            });
          }
          
          response.json({ 
            group: updatedGroups[0] || group, 
            message: 'Ti sei unito al gruppo con successo' 
          });
        });
      });
    });
  }
}

// Challenge Completion Routes
const challengeCompletionRoutes = require('./challenge_completion_routes');

// Add database middleware to the challenge completion routes
app.use('/api/challenge-completions', (req, res, next) => {
  req.db = db;
  next();
}, challengeCompletionRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});