import db from '../config/database.js'

const createProjectJob = async ({platformId, projectId, since, until}) => {
    const sql = `
        INSERT INTO crawler_jobs (
            platform_id,
            mode,
            project_id,
            since,
            until,
            status
        )
            VALUES (?, 'project', ?, ?, ?, 'pending')
    `

    const [result] = await db.execute(sql, [
        platformId,
        projectId,
        since,
        until
    ])

    return result.insertId
}


const findById = async (id) => {

  const sql = 
    `
      SELECT
        cj.id,
        cj.mode,
        cj.project_id,
        cj.since,
        cj.until,
        cj.status,
        cj.tmux_session,
        cj.log_path,
        cj.created_at,

        cp.name AS platform,
        cp.display_name AS platform_name

      FROM crawler_jobs cj

      INNER JOIN crawler_platforms cp
        ON cp.id = cj.platform_id

      WHERE cj.id = ?

      LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}


const updateStarting = async (id, tmuxSession, logPath, command) => {
  const sql = `
    UPDATE crawler_jobs
    SET 
      status = 'starting',
      tmux_session = ?,
      log_path = ?,
      command = ?,
      started_at = NOW()
    WHERE id = ?
  `

  const result = await db.execute(sql, [
    tmuxSession,
    logPath,
    command,
    id
  ])

  return result
}


const updateRunning = async (id) => {
  const sql = `
    UPDATE crawler_jobs
    SET 
      status = 'running'
    WHERE id = ?
  `

  const result = await db.execute(sql, [id])

  return result
}


const updateFinished = async (id, status, errorMessage = null) => {
  
  const sql = `
    UPDATE crawler_jobs
    SET 
      status = ?,
      error_message = ?,
      finished_at = NOW()
    WHERE ID = ?
  `

  const result = await db.execute(sql, [status, errorMessage, id])

  return result
}


const findAll = async (status = null, limit = 50, offset = 0) => {
  let sql = `
    SELECT 
      cj.id,
      cj.mode,
      cj.project_id,
      cj.group_id,
      cj.since,
      cj.until,
      cj.status,
      cj.tmux_session,
      cj.log_path,
      cj.error_message,
      cj.started_at,
      cj.finished_at,
      cj.created_at,

      cp.name AS platform,
      cp.display_name AS platform_name
    
    FROM crawler_jobs cj

    INNER JOIN crawler_platforms cp
      ON cp.id = cj.platform_id
  `
  const params = []

  if(status){
    sql += `
      WHERE status = ?
    `

    params.push(status)
  }

  const parsedLimit = Number(limit)
  const parsedOffset = Number(offset)

  const LIMIT =
      Number.isInteger(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 50)
          : 50

  const OFFSET =
      Number.isInteger(parsedOffset) && parsedOffset >= 0
          ? parsedOffset
          : 0

  sql += `
    ORDER BY cj.created_at DESC
    LIMIT ${LIMIT} OFFSET ${OFFSET}
  `

  const [rows] = await db.execute(sql, params)

  return rows
}


export default {
    createProjectJob,
    findById,
    updateStarting,
    updateRunning,
    updateFinished,
    findAll,
}