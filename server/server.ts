import 'dotenv/config'
import app from './app.js'
import { prisma } from './lib/prisma.js'

const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

const server = app.listen(port, () => {
  console.log(`Kestone API listening on port ${port}`)
})

async function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down.`)
  server.close(async (error) => {
    if (error) {
      console.error('HTTP server shutdown failed.', error)
      process.exitCode = 1
    }

    await prisma.$disconnect()
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
