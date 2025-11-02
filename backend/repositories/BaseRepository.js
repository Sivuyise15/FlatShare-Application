{/*
  * BaseRepository.js
  * This is a base class for all repository classes, providing common database operations.
  */
}

class BaseRepository {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required');
    }
    this.db = db;
  }

  handleError(operation, error) {
    console.error(`Repository ${operation} error:`, error);
    throw new Error(`Database ${operation} failed: ${error.message}`);
  }
}

module.exports = BaseRepository;