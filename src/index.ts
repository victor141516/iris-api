import { ExecException, exec } from 'child_process'
import cors from 'cors'
import express, { Request } from 'express'
import { getVoiceChunks } from 'iris-tts'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const apiRouter = express.Router()
let resetConnection = null as (() => Promise<{ error: ExecException | null; stderr: string; stdout: string }>) | null
if (process.env.RESET_CONNECTION_CMD) {
  resetConnection = async () => {
    return new Promise((res, rej) => {
      exec(process.env.RESET_CONNECTION_CMD!, (error, stdout, stderr) => {
        if (error) rej({ error, stdout, stderr })
        else res({ error: error ?? null, stdout, stderr })
      })
    })
  }
}

apiRouter.all(
  '/tts',
  async (
    req: Request<
      void,
      { ok: false; error: string },
      { text?: string; voice?: string },
      { text?: string; voice?: string }
    >,
    res,
  ) => {
    let { text, voice } = req.query
    if (req.method === 'POST') {
      text = req.body.text
      voice = req.body.voice
    }
    if (!text) {
      return res.status(400).json({ ok: false, error: 'Missing text parameter' })
    }

    const id = Math.random()
    const voiceIterator = getVoiceChunks(
      text,
      (voice ?? 'es-ES-AlvaroNeural') as Parameters<typeof getVoiceChunks>[1],
      {
        throttling(ms) {
          if (ms > 5000) {
            resetConnection?.()
          }
          console.info(`[${id}] Throttling (${ms}ms)`)
        },
        progress(progress, eta) {
          const secondsRemaining = eta / 1000
          console.info(
            `[${id}] Progress: ${(progress * 100).toFixed(4)}%${
              Number.isNaN(secondsRemaining)
                ? ''
                : ` (ETA ${
                    secondsRemaining / 60 > 1
                      ? `${(secondsRemaining / 60).toFixed(1)} minutes`
                      : `${secondsRemaining.toFixed(1)} seconds`
                  })`
            }`,
          )
        },
      },
    )
    res.status(200).contentType('audio/mpeg3').setHeader('Content-Disposition', 'inline')
    for await (const chunk of voiceIterator) {
      res.write(chunk)
    }
    res.end()
  },
)

app.use('/api', apiRouter)

app.listen(Number.parseInt(process.env.PORT ?? '3000'), () => {
  console.log('Ready!')
})
