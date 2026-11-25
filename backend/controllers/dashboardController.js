const { query } = require('../config/db');

/**
 * Get library dashboard statistics
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Books statistics (Total distinct titles, total physical copies, available copies)
    const booksStatResult = await query(`
      SELECT 
        COUNT(*) AS total_titles,
        COALESCE(SUM(total_copies), 0) AS total_copies,
        COALESCE(SUM(available_copies), 0) AS available_copies
      FROM books
    `);

    // 2. Members statistics
    const membersStatResult = await query(`
      SELECT COUNT(*) AS total_members FROM members
    `);

    // 3. Issues statistics (Currently active issues and overdue issues)
    const issuesStatResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'issued' THEN 1 END) AS issued_books,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) AS returned_books,
        COUNT(CASE WHEN status = 'issued' AND due_date < CURRENT_DATE THEN 1 END) AS overdue_books
      FROM book_issues
    `);

    // 4. Five most recent activity logs for dashboard quick view
    const recentActivitiesResult = await query(`
      SELECT 
        bi.id,
        m.full_name AS member_name,
        b.book_name,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.status
      FROM book_issues bi
      INNER JOIN members m ON bi.member_id = m.id
      INNER JOIN books b ON bi.book_id = b.id
      ORDER BY bi.id DESC
      LIMIT 5
    `);

    const booksStat = booksStatResult.rows[0];
    const membersStat = membersStatResult.rows[0];
    const issuesStat = issuesStatResult.rows[0];

    return res.status(200).json({
      success: true,
      stats: {
        totalBooks: parseInt(booksStat.total_titles, 10),
        totalCopies: parseInt(booksStat.total_copies, 10),
        totalMembers: parseInt(membersStat.total_members, 10),
        availableBooks: parseInt(booksStat.available_copies, 10),
        issuedBooks: parseInt(issuesStat.issued_books, 10),
        overdueBooks: parseInt(issuesStat.overdue_books, 10),
        returnedBooks: parseInt(issuesStat.returned_books, 10),
      },
      recentActivities: recentActivitiesResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
