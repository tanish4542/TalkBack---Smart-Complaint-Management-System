// scripts/migrate_to_normalized.js
const db = require('../models/db');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function addColumnIfMissing(tableName, columnName, columnSpec) {
  try {
    await queryAsync(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnSpec}`);
    console.log(`[Migration] Added column \`${columnName}\` to \`${tableName}\``);
  } catch (err) {
    if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME' || String(err.message).includes('Duplicate column name')) {
      // Column already exists
    } else {
      console.error(`[Migration] Error adding column \`${columnName}\` to \`${tableName}\`:`, err.message);
    }
  }
}

async function runMigration() {
  console.log('[Migration] Starting database normalization & schema setup...');

  try {
    // 1. Create departments table & seed
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`departments\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const defaultDepartments = ['Academics', 'Administration', 'Hostel', 'Transportation', 'Sanitation', 'Food'];
    for (const dept of defaultDepartments) {
      await queryAsync(`INSERT IGNORE INTO \`departments\` (\`name\`) VALUES (?)`, [dept]);
    }

    const deptRows = await queryAsync(`SELECT id, name FROM \`departments\``);
    const deptMap = {};
    deptRows.forEach(row => {
      deptMap[row.name.toLowerCase()] = row.id;
    });

    // 2. Ensure reset_token columns exist in users
    await addColumnIfMissing('users', 'reset_token_hash', 'VARCHAR(64) DEFAULT NULL');
    await addColumnIfMissing('users', 'reset_token_expires', 'TIMESTAMP DEFAULT NULL');

    // 3. Create or alter normalized complaints table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`complaints\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT DEFAULT NULL,
        \`department_id\` INT NOT NULL,
        \`description\` TEXT NOT NULL,
        \`is_anonymous\` TINYINT(1) DEFAULT '0',
        \`anonymous_token_hash\` VARCHAR(64) DEFAULT NULL,
        \`status\` VARCHAR(50) DEFAULT 'pending',
        \`response\` TEXT DEFAULT NULL,
        \`resolved_by\` VARCHAR(100) DEFAULT NULL,
        \`version\` INT NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist if table previously existed
    await addColumnIfMissing('complaints', 'user_id', 'INT DEFAULT NULL');
    await addColumnIfMissing('complaints', 'department_id', 'INT NOT NULL DEFAULT 1');
    await addColumnIfMissing('complaints', 'description', 'TEXT');
    await addColumnIfMissing('complaints', 'is_anonymous', "TINYINT(1) DEFAULT '0'");
    await addColumnIfMissing('complaints', 'anonymous_token_hash', 'VARCHAR(64) DEFAULT NULL');
    await addColumnIfMissing('complaints', 'status', "VARCHAR(50) DEFAULT 'pending'");
    await addColumnIfMissing('complaints', 'response', 'TEXT DEFAULT NULL');
    await addColumnIfMissing('complaints', 'resolved_by', 'VARCHAR(100) DEFAULT NULL');
    await addColumnIfMissing('complaints', 'version', 'INT NOT NULL DEFAULT 0');
    await addColumnIfMissing('complaints', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // Add indexes to complaints
    const addIndexIfMissing = async (indexName, sql) => {
      try {
        await queryAsync(sql);
      } catch (e) { /* ignore if index exists */ }
    };

    await addIndexIfMissing('idx_user_id', `CREATE INDEX idx_user_id ON complaints(user_id)`);
    await addIndexIfMissing('idx_department_id', `CREATE INDEX idx_department_id ON complaints(department_id)`);
    await addIndexIfMissing('idx_status', `CREATE INDEX idx_status ON complaints(status)`);
    await addIndexIfMissing('idx_created_at', `CREATE INDEX idx_created_at ON complaints(created_at)`);
    await addIndexIfMissing('idx_anonymous_token_hash', `CREATE INDEX idx_anonymous_token_hash ON complaints(anonymous_token_hash)`);

    // 4. Create status history table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`complaint_status_history\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`complaint_id\` INT NOT NULL,
        \`old_status\` VARCHAR(50) DEFAULT NULL,
        \`new_status\` VARCHAR(50) NOT NULL,
        \`changed_by\` VARCHAR(100) DEFAULT NULL,
        \`changed_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        \`remarks\` TEXT DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_history_complaint\` (\`complaint_id\`),
        KEY \`idx_history_changed_at\` (\`changed_at\`),
        CONSTRAINT \`fk_history_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create department detail tables
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`academic_complaint_details\` (
        \`complaint_id\` INT NOT NULL,
        \`course\` VARCHAR(100) DEFAULT NULL,
        \`complaint_type\` VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (\`complaint_id\`),
        CONSTRAINT \`fk_academic_details\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`hostel_complaint_details\` (
        \`complaint_id\` INT NOT NULL,
        \`block\` VARCHAR(10) DEFAULT NULL,
        \`room_number\` VARCHAR(10) DEFAULT NULL,
        PRIMARY KEY (\`complaint_id\`),
        CONSTRAINT \`fk_hostel_details\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`transport_complaint_details\` (
        \`complaint_id\` INT NOT NULL,
        \`vehicle_number\` VARCHAR(100) DEFAULT NULL,
        \`issue_type\` VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (\`complaint_id\`),
        CONSTRAINT \`fk_transport_details\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`sanitation_complaint_details\` (
        \`complaint_id\` INT NOT NULL,
        \`location\` VARCHAR(255) DEFAULT NULL,
        \`issue_type\` VARCHAR(255) DEFAULT NULL,
        \`urgency\` ENUM('low','medium','high') DEFAULT 'medium',
        PRIMARY KEY (\`complaint_id\`),
        CONSTRAINT \`fk_sanitation_details\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS \`food_complaint_details\` (
        \`complaint_id\` INT NOT NULL,
        \`campus\` VARCHAR(100) DEFAULT NULL,
        \`issue_type\` VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (\`complaint_id\`),
        CONSTRAINT \`fk_food_details\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const countExisting = await queryAsync(`SELECT COUNT(*) as count FROM \`complaints\``);
    if (countExisting[0].count === 0) {
      console.log('[Migration] Transferring data from legacy domain tables...');

      const migrateTable = async (tableName, deptName, descCol, dateCol, detailsHandler) => {
        try {
          const rows = await queryAsync(`SELECT * FROM \`${tableName}\``);
          const deptId = deptMap[deptName.toLowerCase()];
          for (const row of rows) {
            const isAnon = Boolean(row.is_anonymous ?? row.isAnonymous ?? 0);
            const description = row[descCol] || row.description || row.text || '';
            const userId = isAnon ? null : (row.user_id ?? null);
            const status = row.status || 'pending';
            const response = row.response || row.resolvedBy || null;
            const resolvedBy = row.resolved_by || row.resolvedBy || null;
            const version = row.version || 0;
            const createdAt = row[dateCol] || row.submitted_at || row.submittedAt || row.created_at || row.date || new Date();

            const res = await queryAsync(`
              INSERT INTO complaints (user_id, department_id, description, is_anonymous, status, response, resolved_by, version, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, deptId, description, isAnon ? 1 : 0, status, response, resolvedBy, version, createdAt]);

            const complaintId = res.insertId;
            if (detailsHandler) {
              await detailsHandler(complaintId, row);
            }
            await queryAsync(`
              INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_at, remarks)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [complaintId, null, status, resolvedBy || 'System', createdAt, 'Migrated record']);
          }
          console.log(`[Migration] Migrated ${rows.length} rows from ${tableName}`);
        } catch (e) {
          console.log(`[Migration] Note for ${tableName}:`, e.message);
        }
      };

      await migrateTable('academic_complaints', 'academics', 'description', 'submitted_at', async (cid, row) => {
        await queryAsync(`INSERT INTO academic_complaint_details (complaint_id, course, complaint_type) VALUES (?, ?, ?)`, [cid, row.course || null, row.complaint_type || null]);
      });

      await migrateTable('administration_complaints', 'administration', 'text', 'submitted_at', null);

      await migrateTable('hostel_complaints', 'hostel', 'text', 'submittedAt', async (cid, row) => {
        await queryAsync(`INSERT INTO hostel_complaint_details (complaint_id, block, room_number) VALUES (?, ?, ?)`, [cid, row.block || null, row.roomNumber || null]);
      });

      await migrateTable('transport_complaints', 'transportation', 'text', 'created_at', async (cid, row) => {
        await queryAsync(`INSERT INTO transport_complaint_details (complaint_id, vehicle_number, issue_type) VALUES (?, ?, ?)`, [cid, row.vehicleNumber || null, row.type || null]);
      });

      await migrateTable('sanitation_complaints', 'sanitation', 'text', 'date', async (cid, row) => {
        await queryAsync(`INSERT INTO sanitation_complaint_details (complaint_id, location, issue_type, urgency) VALUES (?, ?, ?, ?)`, [cid, row.location || null, row.issueType || null, row.urgency || 'medium']);
      });

      await migrateTable('food_complaints', 'food', 'text', 'submitted_at', async (cid, row) => {
        await queryAsync(`INSERT INTO food_complaint_details (complaint_id, campus, issue_type) VALUES (?, ?, ?)`, [cid, row.campus || null, row.issueType || null]);
      });

      console.log('[Migration] Data migration complete!');
    } else {
      console.log('[Migration] Normalized complaints table already populated.');
    }

    console.log('[Migration] Schema migration completed successfully!');
  } catch (error) {
    console.error('[Migration] Failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runMigration;
