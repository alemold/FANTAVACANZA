/**
 * Challenge Completion API Routes
 * 
 * This file contains all the API routes for handling challenge completions
 * in the FantaVacanze application.
 */

const express = require('express');
const router = express.Router();

/**
 * @route POST /api/challenge-completions
 * @desc Record a new challenge completion
 * @access Private
 */
router.post('/', async (req, res) => {
  const { group_id, user_id, challenge_id, evidence_url, notes } = req.body;
  
  // Validate required fields
  if (!group_id || !user_id || !challenge_id) {
    return res.status(400).json({ error: 'Group ID, User ID, and Challenge ID are required' });
  }
  
  try {
    // Get the challenge to determine points
    const challengeQuery = 'SELECT points, ripetibile FROM challenges WHERE id = ?';
    req.db.query(challengeQuery, [challenge_id], (err, challenges) => {
      if (err) {
        console.error('Error fetching challenge:', err);
        return res.status(500).json({ error: 'Error fetching challenge details' });
      }
      
      if (challenges.length === 0) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      
      const challenge = challenges[0];
      const points = challenge.points;
      const isRepeatable = challenge.ripetibile === 'y';
      
      // Check if the challenge has already been completed by this user in this group
      const checkQuery = 'SELECT * FROM challenge_completions WHERE group_id = ? AND user_id = ? AND challenge_id = ?';
      req.db.query(checkQuery, [group_id, user_id, challenge_id], (err, completions) => {
        if (err) {
          console.error('Error checking existing completions:', err);
          return res.status(500).json({ error: 'Error checking existing completions' });
        }
        
        // If the challenge is not repeatable and already completed, return an error
        if (!isRepeatable && completions.length > 0) {
          return res.status(409).json({ error: 'This challenge has already been completed and is not repeatable' });
        }
        
        // Start a transaction to ensure data integrity
        req.db.beginTransaction(err => {
          if (err) {
            console.error('Error beginning transaction:', err);
            return res.status(500).json({ error: 'Error beginning transaction' });
          }
          
          // Insert the new completion
          const insertQuery = `
            INSERT INTO challenge_completions 
            (group_id, user_id, challenge_id, evidence_url, points, notes) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          req.db.query(
            insertQuery, 
            [group_id, user_id, challenge_id, evidence_url || null, points, notes || null], 
            (err, result) => {
              if (err) {
                return req.db.rollback(() => {
                  console.error('Error recording challenge completion:', err);
                  res.status(500).json({ error: 'Error recording challenge completion' });
                });
              }
              
              // Update the user's points for this specific group
              const updateGroupPointsQuery = 'UPDATE group_users SET points = points + ? WHERE group_id = ? AND user_id = ?';
              req.db.query(updateGroupPointsQuery, [points, group_id, user_id], (err) => {
                if (err) {
                  return req.db.rollback(() => {
                    console.error('Error updating group points:', err);
                    res.status(500).json({ error: 'Error updating group points' });
                  });
                }
                
                // Update user's total points
                const updatePointsQuery = 'UPDATE users SET total_points = total_points + ? WHERE id = ?';
                req.db.query(updatePointsQuery, [points, user_id], (err, result) => {
                  if (err) {
                    return req.db.rollback(() => {
                      console.error('Error updating user points:', err);
                      res.status(500).json({ error: 'Error updating user points' });
                    });
                  }
                  
                  // Commit the transaction
                  req.db.commit(err => {
                    if (err) {
                      return req.db.rollback(() => {
                        console.error('Error committing transaction:', err);
                        res.status(500).json({ error: 'Error committing transaction' });
                      });
                    }
                    
                    // Get updated user data
                    req.db.query('SELECT total_points FROM users WHERE id = ?', [user_id], (err, users) => {
                      if (err) {
                        console.error('Error fetching updated user data:', err);
                        return res.status(500).json({ 
                          success: true,
                          message: 'Challenge completion recorded successfully, but unable to fetch updated points' 
                        });
                      }
                      
                      res.status(201).json({
                        success: true,
                        message: 'Challenge completion recorded successfully',
                        completion_id: result.insertId,
                        points: points,
                        total_points: users[0].total_points
                      });
                    });
                  });
                });
              });
            }
          );
        });
      });
    });
  } catch (error) {
    console.error('Server error recording challenge completion:', error);
    res.status(500).json({ error: 'Server error recording challenge completion' });
  }
});

/**
 * @route GET /api/challenge-completions/group/:groupId
 * @desc Get all challenge completions for a group
 * @access Private
 */
router.get('/group/:groupId', (req, res) => {
  const groupId = req.params.groupId;
  
  const query = `
    SELECT cc.*, c.description as challenge_description, c.category_id,
           u.username, u.avatar_url, cat.name as category_name
    FROM challenge_completions cc
    JOIN challenges c ON cc.challenge_id = c.id
    JOIN users u ON cc.user_id = u.id
    JOIN challenge_categories cat ON c.category_id = cat.id
    WHERE cc.group_id = ?
    ORDER BY cc.completion_date DESC
  `;
  
  req.db.query(query, [groupId], (err, completions) => {
    if (err) {
      console.error('Error fetching group challenge completions:', err);
      return res.status(500).json({ error: 'Error fetching group challenge completions' });
    }
    
    res.json({ completions });
  });
});

/**
 * @route GET /api/challenge-completions/user/:userId/group/:groupId
 * @desc Get all challenge completions for a specific user in a group
 * @access Private
 */
router.get('/user/:userId/group/:groupId', (req, res) => {
  const { userId, groupId } = req.params;
  
  const query = `
    SELECT cc.*, c.description as challenge_description, c.category_id,
           cat.name as category_name
    FROM challenge_completions cc
    JOIN challenges c ON cc.challenge_id = c.id
    JOIN challenge_categories cat ON c.category_id = cat.id
    WHERE cc.group_id = ? AND cc.user_id = ?
    ORDER BY cc.completion_date DESC
  `;
  
  req.db.query(query, [groupId, userId], (err, completions) => {
    if (err) {
      console.error('Error fetching user challenge completions:', err);
      return res.status(500).json({ error: 'Error fetching user challenge completions' });
    }
    
    res.json({ completions });
  });
});

/**
 * @route DELETE /api/challenge-completions/:completionId
 * @desc Delete a challenge completion
 * @access Private
 */
router.delete('/:completionId', (req, res) => {
  const completionId = req.params.completionId;
  const db = req.db;
  
  // Get completion details to know which challenge was completed
  db.query(
    'SELECT cc.*, c.points FROM challenge_completions cc JOIN challenges c ON cc.challenge_id = c.id WHERE cc.id = ?',
    [completionId],
    (err, completions) => {
      if (err) {
        console.error('Error fetching completion details:', err);
        return res.status(500).json({ error: 'Error fetching completion details' });
      }
      
      if (completions.length === 0) {
        return res.status(404).json({ error: 'Completion not found' });
      }
      
      const completion = completions[0];
      const userId = completion.user_id;
      const points = completion.points;
      
      // Start a transaction
      db.beginTransaction(err => {
        if (err) {
          console.error('Error beginning transaction:', err);
          return res.status(500).json({ error: 'Error beginning transaction' });
        }
        
        // Delete the completion
        db.query('DELETE FROM challenge_completions WHERE id = ?', [completionId], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error deleting completion:', err);
              res.status(500).json({ error: 'Error deleting completion' });
            });
          }
          
          // Update user's total points (subtract the challenge points)
          db.query('UPDATE users SET total_points = total_points - ? WHERE id = ?', [points, userId], (err, result) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error updating user points:', err);
                res.status(500).json({ error: 'Error updating user points' });
              });
            }
            
            // Commit the transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.status(500).json({ error: 'Error committing transaction' });
                });
              }
              
              res.json({ success: true, message: 'Completion deleted successfully' });
            });
          });
        });
      });
    }
  );
});

module.exports = router;