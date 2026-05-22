import Database from 'better-sqlite3';

try {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE test (id INT);');
  console.log("better-sqlite3 works!");
} catch (e) {
  console.log("FAIL", e);
}
