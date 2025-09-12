import { Pool } from 'pg'

export const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'fitapp',
  password: 'your_db_password',
  port: 5432,
})