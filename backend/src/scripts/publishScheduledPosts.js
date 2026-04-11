/**
 * Publish Scheduled Posts Script
 * Per AGENTS.md Part 6.9
 * Runs every 15 minutes via GitHub Actions
 * Sends push notifications for due posts
 */
require('dotenv').config();
const db = require('../db/connection');

async function publishScheduledPosts() {
  console.log('Checking for scheduled posts...');
  console.log('Time:', new Date().toISOString());

  try {
    // Find posts scheduled in the last 15 minutes that haven't been sent
    const now = new Date();
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);

    const duePosts = await db.query(
      `SELECT sp.*, u.email, u.name
       FROM scheduled_posts sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.status = 'scheduled'
       AND sp.scheduled_for <= $1
       AND sp.scheduled_for >= $2
       ORDER BY sp.scheduled_for ASC`,
      [now, fifteenMinutesAgo]
    );

    console.log(`Found ${duePosts.length} posts to publish`);

    for (const post of duePosts) {
      try {
        // In a real implementation, this would:
        // 1. Send push notification to user's browser
        // 2. Or send email notification
        // 3. Or trigger webhook

        console.log(`Publishing post ${post.id} for user ${post.user_id}`);
        console.log(`Platform: ${post.platform}, Scheduled: ${post.scheduled_for}`);

        // Mark as notified (but keep as scheduled until user confirms posted)
        // In a full implementation, we'd have a separate notification log table

        // For now, just log that it was due
        console.log(`Content preview: ${post.content.substring(0, 100)}...`);

      } catch (err) {
        console.error(`Error publishing post ${post.id}:`, err);
      }
    }

    console.log('Publish check completed');

  } catch (err) {
    console.error('Error in publish script:', err);
  }
}

// Run if called directly
if (require.main === module) {
  publishScheduledPosts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { publishScheduledPosts };
